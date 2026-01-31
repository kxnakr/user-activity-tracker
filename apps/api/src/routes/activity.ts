import { Router } from 'express'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { auth } from '@/middleware/auth'
import { ActivityLog } from '@/models/ActivityLog'
import { getRedis } from '@/redis'

const router = Router()

const allowedActions = ['login', 'logout', 'view', 'click', 'custom'] as const
const actionSchema = z.enum(allowedActions)

const RATE_LIMIT_WINDOW_MS = 10_000
const RATE_LIMIT_MAX = 5
const REPLAY_WINDOW_MS = 3_000

const RATE_LIMIT_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]

redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local count = redis.call('ZCARD', key)
if count >= limit then
  return {0, count}
end
redis.call('ZADD', key, now, member)
redis.call('PEXPIRE', key, window)
return {1, count + 1}
`

const activitySchema = z.object({
  action: actionSchema,
  meta: z.unknown().optional(),
})

const replaySchema = z.object({
  action: actionSchema,
  clientTime: z.string().min(1, 'clientTime is required'),
})

const formatZodIssues = (issues: z.ZodIssue[]) =>
  issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))

router.use(auth)

router.post('/', async (req, res, next) => {
  try {
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const parsed = activitySchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid request',
        issues: formatZodIssues(parsed.error.issues),
      })
    }

    const { action, meta } = parsed.data
    const forwarded = req.headers['x-forwarded-for']
    const ipAddress = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown'

    const serverTime = new Date()
    const redis = getRedis()
    const rateKey = `rate:${userId}`
    const member = `${serverTime.getTime()}-${randomUUID()}`

    const [allowedValue, countValue] = (await redis.eval(
      RATE_LIMIT_SCRIPT,
      1,
      rateKey,
      String(serverTime.getTime()),
      String(RATE_LIMIT_WINDOW_MS),
      String(RATE_LIMIT_MAX),
      member,
    )) as [number | string, number | string]

    const allowed = Number(allowedValue) === 1
    const actionsInLast10Sec = Number(countValue) || 0

    if (!allowed) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit: max 5 actions per 10 seconds',
        serverTime: serverTime.toISOString(),
        actionsInLast10Sec,
      })
    }

    await ActivityLog.create({
      userId,
      action,
      meta,
      ipAddress,
      createdAt: serverTime,
    })

    return res.json({
      success: true,
      serverTime: serverTime.toISOString(),
      actionsInLast10Sec: actionsInLast10Sec + 1,
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/stats', async (_req, res, next) => {
  try {
    const now = new Date()
    const since10m = new Date(now.getTime() - 10 * 60_000)

    const [totals] = await ActivityLog.aggregate([
      { $group: { _id: null, totalActions: { $sum: 1 } } },
    ])

    const [mostCommon] = await ActivityLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ])

    const actionsPerMinute = await ActivityLog.aggregate([
      { $match: { createdAt: { $gte: since10m } } },
      {
        $group: {
          _id: {
            minute: { $dateTrunc: { date: '$createdAt', unit: 'minute' } },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.minute': 1 } },
    ])

    const [mostActiveUser] = await ActivityLog.aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          userId: '$_id',
          count: 1,
          userName: '$user.name',
          userEmail: '$user.email',
        },
      },
    ])

    return res.json({
      serverTime: now.toISOString(),
      totalActions: totals?.totalActions ?? 0,
      mostCommonAction: mostCommon?._id ?? null,
      mostCommonActionCount: mostCommon?.count ?? 0,
      actionsPerMinuteLast10Min: actionsPerMinute.map((entry) => ({
        minute: entry._id.minute,
        count: entry.count,
      })),
      mostActiveUser: mostActiveUser?.userId ?? null,
      mostActiveUserName: mostActiveUser?.userName ?? null,
      mostActiveUserEmail: mostActiveUser?.userEmail ?? null,
      mostActiveUserCount: mostActiveUser?.count ?? 0,
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/suspicious', async (_req, res, next) => {
  try {
    const now = new Date()
    const since1m = new Date(now.getTime() - 60_000)
    const since5m = new Date(now.getTime() - 5 * 60_000)

    const highFreq = await ActivityLog.aggregate([
      { $match: { createdAt: { $gte: since1m } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $match: { count: { $gte: 20 } } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          userId: '$_id',
          userName: '$user.name',
          reason: { $literal: 'High frequency' },
          count: 1,
          _id: 0,
        },
      },
    ])

    const multiIp = await ActivityLog.aggregate([
      { $match: { createdAt: { $gte: since5m } } },
      { $group: { _id: '$userId', ips: { $addToSet: '$ipAddress' } } },
      { $addFields: { count: { $size: '$ips' } } },
      { $match: { count: { $gt: 2 } } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          userId: '$_id',
          userName: '$user.name',
          reason: { $literal: 'Multiple IPs' },
          count: 1,
          _id: 0,
        },
      },
    ])

    const merged = new Map<string, { userId: string; reason: string; count: number }>()
    for (const item of [...highFreq, ...multiIp]) {
      const key = `${item.userId}:${item.reason}`
      merged.set(key, item)
    }

    return res.json([...merged.values()])
  } catch (error) {
    return next(error)
  }
})

router.post('/replay-check', async (req, res, next) => {
  try {
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({ allowed: false, message: 'Unauthorized' })
    }

    const serverTime = new Date()

    const parsed = replaySchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        allowed: false,
        message: 'Invalid request',
        serverTime: serverTime.toISOString(),
        issues: formatZodIssues(parsed.error.issues),
      })
    }

    const { action, clientTime } = parsed.data
    const client = new Date(clientTime ?? '')

    if (Number.isNaN(client.getTime())) {
      return res.status(400).json({
        allowed: false,
        message: 'Invalid clientTime',
        serverTime: serverTime.toISOString(),
      })
    }

    const diffMs = Math.abs(serverTime.getTime() - client.getTime())
    if (diffMs > 30_000) {
      return res.status(400).json({
        allowed: false,
        message: 'Client/server time drift > 30s',
        serverTime: serverTime.toISOString(),
        driftMs: diffMs,
      })
    }

    const redis = getRedis()
    const replayKey = `replay:${userId}:${action}`
    const replayResult = await redis.set(
      replayKey,
      serverTime.getTime().toString(),
      'PX',
      REPLAY_WINDOW_MS,
      'NX',
    )

    if (!replayResult) {
      return res.status(409).json({
        allowed: false,
        message: 'Replay detected: same action within 3 seconds',
        serverTime: serverTime.toISOString(),
      })
    }

    return res.json({ allowed: true, serverTime: serverTime.toISOString() })
  } catch (error) {
    return next(error)
  }
})

export default router
