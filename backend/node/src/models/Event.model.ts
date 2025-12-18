import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IEvent extends Document {
  userId?: Types.ObjectId
  eventType: string
  path?: string
  metadata?: Record<string, any>
  createdAt: Date
}

const EventSchema: Schema<IEvent> = new Schema<IEvent>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  eventType: { type: String, required: true },
  path: { type: String },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
})

export const Event: Model<IEvent> = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema)
