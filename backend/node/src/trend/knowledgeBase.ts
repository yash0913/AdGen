import path from 'path';
import { TTLCache } from '../utils/cache';
import { TrendProfileModel, TrendProfile } from '../models/TrendProfile.model';
import { analyzeIndustry } from './analyzer';

const DAY_MS = 24 * 60 * 60 * 1000;
const cache = new TTLCache<string, TrendProfile>(DAY_MS);

// Fallback trend profiles for testing when database is empty
const FALLBACK_PROFILES = {
  fitness: {
    industry: 'fitness',
    topColors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
    dominantLayouts: ['hero-product', 'split-screen', 'minimal'],
    creativeTypes: ['product-focus', 'lifestyle', 'before-after'],
    topKeywords: ['workout', 'fitness', 'healthy', 'strong', 'transform', 'results', 'gym', 'nutrition'],
    avgEngagementScore: 85.5,
    sampleAdIds: [],
    generatedAt: new Date()
  },
  fashion: {
    industry: 'fashion',
    topColors: ['#2C3E50', '#E74C3C', '#F39C12', '#8E44AD', '#34495E'],
    dominantLayouts: ['hero-product', 'grid', 'minimal'],
    creativeTypes: ['product-focus', 'lifestyle', 'model-showcase'],
    topKeywords: ['style', 'fashion', 'trendy', 'outfit', 'look', 'collection', 'designer', 'wear'],
    avgEngagementScore: 92.3,
    sampleAdIds: [],
    generatedAt: new Date()
  },
  food: {
    industry: 'food',
    topColors: ['#E67E22', '#F39C12', '#27AE60', '#C0392B', '#F4D03F'],
    dominantLayouts: ['hero-product', 'ingredient-focused', 'lifestyle'],
    creativeTypes: ['product-focus', 'process-showcase', 'lifestyle'],
    topKeywords: ['delicious', 'fresh', 'tasty', 'organic', 'recipe', 'cooking', 'flavor', 'gourmet'],
    avgEngagementScore: 78.9,
    sampleAdIds: [],
    generatedAt: new Date()
  },
  beauty: {
    industry: 'beauty',
    topColors: ['#E91E63', '#9C27B0', '#FF9800', '#CDDC39', '#607D8B'],
    dominantLayouts: ['hero-product', 'before-after', 'minimal'],
    creativeTypes: ['product-focus', 'transformation', 'lifestyle'],
    topKeywords: ['beautiful', 'glow', 'skin', 'makeup', 'skincare', 'natural', 'radiant', 'confidence'],
    avgEngagementScore: 89.7,
    sampleAdIds: [],
    generatedAt: new Date()
  },
  electronics: {
    industry: 'electronics',
    topColors: ['#2196F3', '#607D8B', '#FF5722', '#4CAF50', '#212121'],
    dominantLayouts: ['hero-product', 'feature-focused', 'tech-specs'],
    creativeTypes: ['product-focus', 'feature-demo', 'lifestyle'],
    topKeywords: ['innovation', 'technology', 'smart', 'advanced', 'performance', 'quality', 'modern', 'efficient'],
    avgEngagementScore: 82.1,
    sampleAdIds: [],
    generatedAt: new Date()
  },
  saas: {
    industry: 'saas',
    topColors: ['#3F51B5', '#00BCD4', '#4CAF50', '#FF9800', '#E91E63'],
    dominantLayouts: ['hero-product', 'dashboard-preview', 'benefit-focused'],
    creativeTypes: ['interface-showcase', 'benefit-focused', 'testimonial'],
    topKeywords: ['productivity', 'efficient', 'solution', 'business', 'growth', 'automation', 'streamline', 'optimize'],
    avgEngagementScore: 76.4,
    sampleAdIds: [],
    generatedAt: new Date()
  }
} as const;

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
  if (summary) {
    const saved = await TrendProfileModel.findOneAndUpdate({ industry }, summary, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }).exec();
    cache.set(key, saved);
    return saved;
  }
  
  // Use fallback profile if analysis returns null (no data)
  console.log(`[Trend][KB] No data found for ${industry}. Using fallback profile.`);
  const fallbackKey = key as keyof typeof FALLBACK_PROFILES;
  const fallback = FALLBACK_PROFILES[fallbackKey] || FALLBACK_PROFILES.fitness; // Default to fitness
  cache.set(key, fallback);
  return fallback;
}
