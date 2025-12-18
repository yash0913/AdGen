import path from 'path';
import { TTLCache } from '../utils/cache';
import { TrendProfileModel, TrendProfile } from '../models/TrendProfile.model';
import { analyzeIndustry } from './analyzer';

const DAY_MS = 24 * 60 * 60 * 1000;
const cache = new TTLCache<string, TrendProfile>(DAY_MS);

export async function getTrendProfile(industry: string, datasetsDir = path.resolve(__dirname, './datasets')) {
  const key = industry.toLowerCase();
  const cached = cache.get(key);
  if (cached) {
    console.log(`[Trend][KB] Cache hit for industry: ${industry}`);
    return cached;
  }
  console.log(`[Trend][KB] Cache miss for industry: ${industry}. Checking DB...`);
  const fromDb = await TrendProfileModel.findOne({ industry }).exec();
  if (fromDb) {
    cache.set(key, fromDb);
    console.log(`[Trend][KB] Loaded from DB: ${industry}`);
    return fromDb;
  }
  console.log(`[Trend][KB] DB miss. Running analysis for: ${industry}`);
  const summary = await analyzeIndustry(industry, datasetsDir);
  if (!summary) return null;
  const saved = await TrendProfileModel.findOneAndUpdate({ industry }, summary, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  }).exec();
  cache.set(key, saved);
  return saved;
}
