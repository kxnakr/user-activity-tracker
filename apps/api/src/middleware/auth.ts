import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '@/config'

interface TokenPayload {
  userId: string
}

export function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing Authorization header' })
  }

  const token = header.replace('Bearer ', '').trim()
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload
    req.user = { userId: payload.userId }
    return next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}
