const STOP_WORDS = new Set<string>([
  'a','an','the','and','or','but','if','then','else','for','to','of','in','on','with','at','by','from','is','are','was','were','be','been','being','you','your','yours','our','ours','we','us','they','them','their','this','that','these','those','it','its','as','not','no','do','does','did','doing','have','has','had','having','can','could','should','would','will','just','more','most','some','such','only','than','too','very','so','up','out','over','again','new'
]);

export function tokenize(text: string): string[] {
  const lowered = (text || '').toLowerCase();
  const tokens = lowered
    .replace(/[^a-z0-9%\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  return tokens;
}

export function filterStopWords(tokens: string[]): string[] {
  return tokens.filter((t) => !STOP_WORDS.has(t) && t.length > 2);
}

export function extractTopKeywords(texts: string[], topN = 20): string[] {
  const freq = new Map<string, number>();
  for (const text of texts) {
    const tokens = filterStopWords(tokenize(text));
    const unique = new Set(tokens);
    for (const t of unique) {
      freq.set(t, (freq.get(t) || 0) + 1);
    }
  }
  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  return sorted.slice(0, topN).map((e) => e[0]);
}
