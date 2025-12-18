import fs from 'fs/promises';
import path from 'path';
import { RawAdModel } from '../models/RawAd.model';
import { getDominantColors, detectLayout } from '../utils/imageAnalysis';
import { classifyCreativeType } from './classifier';

export type NormalizedAd = {
  source: 'facebook_ads_library' | 'tiktok_creative_center' | 'pinterest_trends' | 'google_trends' | string;
  industry: string;
  platform: string; // e.g., Facebook, Instagram, TikTok, Pinterest
  imagePath: string;
  caption: string;
  likes: number;
  comments: number;
  shares?: number;
  detectedCreativeType?: string | null;
  createdAt?: string | Date;
};

function computeEngagementScore(likes: number, comments: number, shares: number): number {
  return likes * 0.5 + comments * 0.3 + shares * 0.2;
}

function normalizeRecord(raw: any): NormalizedAd | null {
  if (!raw) return null;
  const industry = String(raw.industry || '').trim();
  const platform = String(raw.platform || '').trim();
  const imagePath = String(raw.imagePath || '').trim();
  const caption = String(raw.caption || '').trim();
  const likes = Number(raw.likes ?? 0);
  const comments = Number(raw.comments ?? 0);
  const shares = Number(raw.shares ?? 0);
  const source = String(raw.source || '').trim();

  if (!industry || !platform || !imagePath || !caption) return null;
  // Engagement must be non-negative; skip records without primary metrics unless source is google_trends (non-ad)
  if ((isNaN(likes) || isNaN(comments) || isNaN(shares)) && source !== 'google_trends') return null;

  return {
    source: (source || 'facebook_ads_library') as NormalizedAd['source'],
    industry,
    platform,
    imagePath,
    caption,
    likes: Math.max(0, likes),
    comments: Math.max(0, comments),
    shares: Math.max(0, shares),
    detectedCreativeType: raw.detectedCreativeType ?? null,
    createdAt: raw.createdAt ? new Date(raw.createdAt) : undefined,
  };
}

export async function ingestDatasets(datasetsDir = path.resolve(__dirname, './datasets')): Promise<void> {
  const files = await fs.readdir(datasetsDir).catch(() => [] as string[]);
  const jsonFiles = files.filter((f) => f.toLowerCase().endsWith('.json'));
  let total = 0;
  let inserted = 0;
  let duplicates = 0;
  let skipped = 0;

  for (const file of jsonFiles) {
    const full = path.join(datasetsDir, file);
    const content = await fs.readFile(full, 'utf-8').catch(() => '[]');
    let arr: any[] = [];
    try {
      const parsed = JSON.parse(content);
      arr = Array.isArray(parsed) ? parsed : [];
    } catch {
      console.warn(`Invalid JSON skipped: ${file}`);
      continue;
    }

    for (const record of arr) {
      total++;
      const norm = normalizeRecord(record);
      if (!norm) {
        skipped++;
        continue;
      }
      if (norm.source === 'google_trends') {
        // Skip non-ad support records at ingestion stage
        skipped++;
        continue;
      }

      try {
        const shares = norm.shares ?? 0;
        const engagementScore = computeEngagementScore(norm.likes, norm.comments, shares);
        const colors = await getDominantColors(norm.imagePath, 5);
        const layout = await detectLayout(norm.imagePath);
        const creativeType = classifyCreativeType(norm.caption, layout, norm.detectedCreativeType);

        // Upsert-like behavior using unique compound index
        const existing = await RawAdModel.findOne({
          industry: norm.industry,
          platform: norm.platform,
          imagePath: norm.imagePath,
          caption: norm.caption,
        }).lean();

        if (existing) {
          duplicates++;
          continue;
        }

        await RawAdModel.create({
          industry: norm.industry,
          platform: norm.platform,
          imagePath: norm.imagePath,
          caption: norm.caption,
          likes: norm.likes,
          comments: norm.comments,
          shares,
          engagementScore,
          creativeType,
          colors,
          layout,
          createdAt: norm.createdAt ?? new Date(),
        });
        inserted++;
      } catch (err) {
        console.error('Ingestion error for record:', err);
        skipped++;
      }
    }
  }

  console.log('[Trend][Ingest] Summary:', { files: jsonFiles.length, total, inserted, duplicates, skipped });
}
