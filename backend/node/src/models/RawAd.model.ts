import mongoose, { Schema, Document, Model } from 'mongoose';

export interface RawAd extends Document {
  industry: string;
  platform: string;
  imagePath: string;
  caption: string;
  likes: number;
  comments: number;
  shares?: number;
  engagementScore: number;
  creativeType: string;
  colors: string[];
  layout: string;
  createdAt: Date;
}

const RawAdSchema = new Schema<RawAd>({
  industry: { type: String, required: true, index: true },
  platform: { type: String, required: true, index: true },
  imagePath: { type: String, required: true },
  caption: { type: String, required: true },
  likes: { type: Number, required: true, min: 0 },
  comments: { type: Number, required: true, min: 0 },
  shares: { type: Number, default: 0, min: 0 },
  engagementScore: { type: Number, required: true, min: 0 },
  creativeType: { type: String, required: true },
  colors: { type: [String], required: true },
  layout: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
});

RawAdSchema.index({ industry: 1, platform: 1, imagePath: 1, caption: 1 }, { unique: true });

export const RawAdModel: Model<RawAd> = mongoose.models.RawAd || mongoose.model<RawAd>('RawAd', RawAdSchema);
