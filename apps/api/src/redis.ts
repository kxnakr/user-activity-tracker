import Redis from 'ioredis'

import { env } from '@/config'

let redis: Redis | null = null

export function getRedis() {
  if (!redis) {
    redis = new Redis(env.REDIS_URL)
  }
  return redis
}

export async function disconnectRedis() {
  if (!redis) return
  await redis.quit()
  redis = null
}
