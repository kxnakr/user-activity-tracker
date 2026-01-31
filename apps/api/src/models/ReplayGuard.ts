import { Schema, model } from 'mongoose'

const replayGuardSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false },
)

replayGuardSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 })
replayGuardSchema.index({ userId: 1, action: 1, createdAt: -1 })

export const ReplayGuard = model('ReplayGuard', replayGuardSchema)
