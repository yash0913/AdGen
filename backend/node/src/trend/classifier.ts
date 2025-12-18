import { LayoutType } from '../utils/imageAnalysis';
import { filterStopWords, tokenize } from '../utils/textAnalysis';

export type CreativeType = 'product-only' | 'ugc' | 'offer-based' | 'testimonial' | 'brand-story';

const OFFER_WORDS = [
  'sale', 'discount', 'deal', 'offer', 'free', 'save', 'off', '%', 'limited', 'today', 'now', 'coupon', 'code'
];
const TESTIMONIAL_WORDS = [
  'testimonial', 'review', 'reviews', 'rated', 'stars', 'what customers say', 'before', 'after', 'results'
];
const BRAND_STORY_WORDS = [
  'our story', 'founded', 'mission', 'vision', 'behind the scenes', 'journey', 'since', 'heritage', 'values'
];
const UGC_WORDS = [
  'pov', 'my routine', 'i tried', 'unboxing', 'reaction', 'day in the life', 'review', 'duet', 'stitch', 'creator', 'ugc'
];

function containsAny(text: string, phrases: string[]): boolean {
  const t = text.toLowerCase();
  return phrases.some((p) => t.includes(p));
}

export function classifyCreativeType(caption: string, layout: LayoutType, detectedCreativeType?: string | null): CreativeType {
  const cap = (caption || '').toLowerCase();
  const tokens = filterStopWords(tokenize(cap));
  const tokenSet = new Set(tokens);

  if (detectedCreativeType && detectedCreativeType.toLowerCase() === 'ugc') {
    return 'ugc';
  }

  // Offer-based rules
  if (containsAny(cap, OFFER_WORDS) || tokens.some((t) => /\d+%/.test(t))) {
    return 'offer-based';
  }

  // Testimonial rules
  if (containsAny(cap, TESTIMONIAL_WORDS) || (cap.includes('stars') && (cap.includes('5') || cap.includes('4')))) {
    return 'testimonial';
  }

  // Brand story rules
  if (containsAny(cap, BRAND_STORY_WORDS)) {
    return 'brand-story';
  }

  // UGC rules: informal language, first-person, and layout often overlay/text-heavy
  if (
    containsAny(cap, UGC_WORDS) ||
    tokenSet.has('i') ||
    tokenSet.has('my') ||
    tokenSet.has('me') ||
    layout === 'overlay-text' ||
    layout === 'text-heavy'
  ) {
    return 'ugc';
  }

  // Fallback: product-only for image-centric or split-layout without strong textual cues
  if (layout === 'image-centric' || layout === 'split-layout') {
    return 'product-only';
  }

  return 'product-only';
}
