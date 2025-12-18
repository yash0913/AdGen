import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface TrendProfile extends Document {
  industry: string;
  topColors: string[];
  dominantLayouts: string[];
  creativeTypes: string[];
  topKeywords: string[];
  avgEngagementScore: number;
  sampleAdIds: Types.ObjectId[];
  generatedAt: Date;
}

const TrendProfileSchema = new Schema<TrendProfile>({
  industry: { type: String, required: true, unique: true },
  topColors: { type: [String], required: true },
  dominantLayouts: { type: [String], required: true },
  creativeTypes: { type: [String], required: true },
  topKeywords: { type: [String], required: true },
  avgEngagementScore: { type: Number, required: true, default: 0 },
  sampleAdIds: [{ type: Schema.Types.ObjectId, ref: 'RawAd' }],
  generatedAt: { type: Date, required: true, default: Date.now },
});

export const TrendProfileModel: Model<TrendProfile> =
  mongoose.models.TrendProfile || mongoose.model<TrendProfile>('TrendProfile', TrendProfileSchema);
