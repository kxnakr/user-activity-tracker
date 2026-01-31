import express from 'express'
import cors from 'cors'
import authRouter from '@/routes/auth'
import activityRouter from '@/routes/activity'
import { assertRequiredEnv, env } from '@/config'
import { connectToDatabase, disconnectFromDatabase } from '@/db'
import { disconnectRedis } from '@/redis'

const app = express()

app.set('trust proxy', true)

const corsOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : false

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api/activity', activityRouter)

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ message: 'Internal server error' })
})

const start = async () => {
  try {
    assertRequiredEnv()
    await connectToDatabase(env.MONGO_URI)

    const server = app.listen(env.PORT, () => {
      console.log(`API listening on http://localhost:${env.PORT}`)
    })

    const shutdown = async (signal: string) => {
      console.log(`${signal} received. Shutting down...`)
      server.close(async () => {
        try {
          await disconnectFromDatabase()
          await disconnectRedis()
        } catch (error) {
          console.error('Failed to disconnect from database', error)
        } finally {
          process.exit(0)
        }
      })
    }

    process.on('SIGINT', () => void shutdown('SIGINT'))
    process.on('SIGTERM', () => void shutdown('SIGTERM'))
  } catch (error) {
    console.error('Failed to start server', error)
    process.exit(1)
  }
}

start()
