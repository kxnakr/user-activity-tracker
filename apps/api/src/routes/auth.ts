import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { User } from '@/models/User'
import { env } from '@/config'

const router = Router()

const MIN_PASSWORD_LENGTH = 8

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Invalid email format'),
  password: z.string().min(MIN_PASSWORD_LENGTH, 'Password is too short'),
})

const loginSchema = z.object({
  email: z.email('Invalid email format').trim(),
  password: z.string().min(1, 'Password is required'),
})

const formatZodIssues = (issues: z.ZodIssue[]) =>
  issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))

router.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid request',
        issues: formatZodIssues(parsed.error.issues),
      })
    }

    const { name, email, password } = parsed.data

    const normalizedEmail = email.toLowerCase()
    const existing = await User.findOne({ email: normalizedEmail }).lean()
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashed,
    })

    const token = jwt.sign({ userId: user._id.toString() }, env.JWT_SECRET)

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      return res.status(409).json({ message: 'Email already registered' })
    }
    return next(error)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid request',
        issues: formatZodIssues(parsed.error.issues),
      })
    }

    const { email, password } = parsed.data
    const normalizedEmail = email.toLowerCase()
    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign({ userId: user._id.toString() }, env.JWT_SECRET)

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    return next(error)
  }
})

export default router
