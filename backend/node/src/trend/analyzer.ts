import fs from 'fs/promises';
import path from 'path';
import { RawAdModel, RawAd } from '../models/RawAd.model';
import { TrendProfileModel } from '../models/TrendProfile.model';
import { tokenize, filterStopWords } from '../utils/textAnalysis';

const SOURCE_WEIGHTS = {
  facebook: 0.45,
  instagram: 0.45,
  tiktok: 0.3,
  pinterest: 0.15,
  google_trends: 0.1,
} as const;

function platformToSourceWeight(platform: string): number {
  const p = (platform || '').toLowerCase();
  if (p.includes('facebook')) return SOURCE_WEIGHTS.facebook;
  if (p.includes('instagram')) return SOURCE_WEIGHTS.instagram;
  if (p.includes('tiktok')) return SOURCE_WEIGHTS.tiktok;
  if (p.includes('pinterest')) return SOURCE_WEIGHTS.pinterest;
  return 0.1; // default minor weight
}

function isFacebookOrTiktok(platform: string): boolean {
  const p = (platform || '').toLowerCase();
  return p.includes('facebook') || p.includes('instagram') || p.includes('tiktok');
}

function isFacebookOrPinterest(platform: string): boolean {
  const p = (platform || '').toLowerCase();
  return p.includes('facebook') || p.includes('instagram') || p.includes('pinterest');
}

function topNFromMap(map: Map<string, number>, n: number): string[] {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map((e) => e[0]);
}

async function loadGoogleTrendCaptionsForIndustry(industry: string, datasetsDir: string): Promise<string[]> {
  const results: string[] = [];
  const files = await fs.readdir(datasetsDir).catch(() => [] as string[]);
  for (const f of files) {
    if (!f.toLowerCase().endsWith('.json')) continue;
    const full = path.join(datasetsDir, f);
    const content = await fs.readFile(full, 'utf-8').catch(() => '[]');
    let arr: any[] = [];
    try {
      const parsed = JSON.parse(content);
      arr = Array.isArray(parsed) ? parsed : [];
    } catch {
      continue;
    }
    for (const r of arr) {
      if ((r.source || '').toLowerCase() === 'google_trends' && String(r.industry || '').toLowerCase() === industry.toLowerCase()) {
        if (r.caption) results.push(String(r.caption));
      }
    }
  }
  return results;
}

function addWeightedTokens(freq: Map<string, number>, text: string, weight: number) {
  const tokens = filterStopWords(tokenize(text));
  for (const t of new Set(tokens)) {
    freq.set(t, (freq.get(t) || 0) + weight);
  }
}

export async function analyzeIndustry(industry: string, datasetsDir: string) {
  const docs: RawAd[] = await RawAdModel.find({ industry }).exec();
  if (!docs.length) return null;

  // Rank and select top ads
  const engagementCandidates = docs.filter((d) => isFacebookOrTiktok(d.platform));
  const base = engagementCandidates.length ? engagementCandidates : docs;
  const sorted = base.sort((a, b) => b.engagementScore - a.engagementScore);
  const top = sorted.slice(0, Math.min(20, sorted.length));

  // Aggregations
  const colorFreq = new Map<string, number>();
  const layoutFreq = new Map<string, number>();
  const creativeFreq = new Map<string, number>();
  const keywordFreq = new Map<string, number>();

  for (const ad of top) {
    const w = platformToSourceWeight(ad.platform);

    // Colors & layout: Pinterest + Facebook (include IG)
    if (isFacebookOrPinterest(ad.platform)) {
      for (const c of ad.colors || []) colorFreq.set(c, (colorFreq.get(c) || 0) + w);
      if (ad.layout) layoutFreq.set(ad.layout, (layoutFreq.get(ad.layout) || 0) + w);
    }

    // Creative type: TikTok + Facebook (include IG)
    if (isFacebookOrTiktok(ad.platform)) {
      if (ad.creativeType) creativeFreq.set(ad.creativeType, (creativeFreq.get(ad.creativeType) || 0) + w);
    }

    // Keywords from captions with platform weighting
    if (ad.caption) addWeightedTokens(keywordFreq, ad.caption, w);
  }

  // Google Trends support: add keywords with 0.10 weight
  const googleTexts = await loadGoogleTrendCaptionsForIndustry(industry, datasetsDir);
  for (const t of googleTexts) addWeightedTokens(keywordFreq, t, SOURCE_WEIGHTS.google_trends);

  const topColors = topNFromMap(colorFreq, 5);
  const dominantLayouts = topNFromMap(layoutFreq, 3);
  const creativeTypes = topNFromMap(creativeFreq, 5);
  const topKeywords = topNFromMap(keywordFreq, 20);
  const avgEngagementScore = top.reduce((s, a) => s + a.engagementScore, 0) / top.length;
  const sampleAdIds = top.map((a) => a._id);

  return {
    industry,
    topColors,
    dominantLayouts,
    creativeTypes,
    topKeywords,
    avgEngagementScore,
    sampleAdIds,
    generatedAt: new Date(),
  };
}

export async function analyzeAllIndustries(datasetsDir: string): Promise<string[]> {
  const industries: string[] = await RawAdModel.distinct('industry');
  const updated: string[] = [];
  for (const ind of industries) {
    const summary = await analyzeIndustry(ind, datasetsDir);
    if (!summary) continue;
    await TrendProfileModel.findOneAndUpdate(
      { industry: ind },
      summary,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    updated.push(ind);
  }
  return updated;
}
