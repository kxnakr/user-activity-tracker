import { Schema, model } from 'mongoose'

const activityLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    meta: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, required: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false },
)

activityLogSchema.index({ userId: 1, createdAt: -1 })
activityLogSchema.index({ createdAt: -1 })
activityLogSchema.index({ userId: 1, action: 1, createdAt: -1 })

export const ActivityLog = model('ActivityLog', activityLogSchema)
