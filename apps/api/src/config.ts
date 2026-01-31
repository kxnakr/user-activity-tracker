export const env = {
  PORT: Number(Bun.env.PORT ?? 8000),
  MONGO_URI: Bun.env.MONGO_URI ?? '',
  JWT_SECRET: Bun.env.JWT_SECRET ?? '',
  CORS_ORIGIN: Bun.env.CORS_ORIGIN ?? '',
  REDIS_URL: Bun.env.REDIS_URL ?? 'redis://localhost:6379',
}

export function assertRequiredEnv() {
  const missing: string[] = []
  if (!env.MONGO_URI) missing.push('MONGO_URI')
  if (!env.JWT_SECRET) missing.push('JWT_SECRET')
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`)
  }
}
