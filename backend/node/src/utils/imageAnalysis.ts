import fs from 'fs/promises';
import path from 'path';

export type LayoutType = 'text-heavy' | 'image-centric' | 'split-layout' | 'overlay-text';

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function luminance(r: number, g: number, b: number): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; // 0..1
}

async function loadPixels(imagePath: string): Promise<{ data: Uint8Array; width: number; height: number } | null> {
  try {
    const abs = path.isAbsolute(imagePath) ? imagePath : path.resolve(process.cwd(), imagePath);
    await fs.access(abs);
    const sharpMod = await import('sharp');
    const sharp = sharpMod.default;
    const img = sharp(abs).removeAlpha().resize(128, 128, { fit: 'inside', withoutEnlargement: true });
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
    return { data: new Uint8Array(data), width: info.width, height: info.height };
  } catch {
    return null;
  }
}

export async function getDominantColors(imagePath: string, k = 5): Promise<string[]> {
  const pixels = await loadPixels(imagePath);
  if (!pixels) return [];
  const { data, width, height } = pixels;

  // Build samples [r,g,b]
  const samples: number[][] = [];
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    samples.push([r, g, b]);
  }

  // Initialize centers with random samples
  const centers: number[][] = [];
  const used = new Set<number>();
  for (let i = 0; i < k; i++) {
    let idx = Math.floor(Math.random() * samples.length);
    while (used.has(idx)) idx = Math.floor(Math.random() * samples.length);
    used.add(idx);
    centers.push(samples[idx].slice());
  }

  const assignments = new Array(samples.length).fill(0);
  const iters = 10;
  for (let iter = 0; iter < iters; iter++) {
    // Assign
    for (let s = 0; s < samples.length; s++) {
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < centers.length; c++) {
        const dr = samples[s][0] - centers[c][0];
        const dg = samples[s][1] - centers[c][1];
        const db = samples[s][2] - centers[c][2];
        const dist = dr * dr + dg * dg + db * db;
        if (dist < bestDist) {
          bestDist = dist;
          best = c;
        }
      }
      assignments[s] = best;
    }
    // Recompute centers
    const sums = centers.map(() => [0, 0, 0]);
    const counts = centers.map(() => 0);
    for (let s = 0; s < samples.length; s++) {
      const a = assignments[s];
      sums[a][0] += samples[s][0];
      sums[a][1] += samples[s][1];
      sums[a][2] += samples[s][2];
      counts[a]++;
    }
    for (let c = 0; c < centers.length; c++) {
      if (counts[c] > 0) {
        centers[c][0] = sums[c][0] / counts[c];
        centers[c][1] = sums[c][1] / counts[c];
        centers[c][2] = sums[c][2] / counts[c];
      }
    }
  }

  // Sort centers by cluster size
  const counts = centers.map(() => 0);
  for (let a of assignments) counts[a]++;
  const order = centers.map((_, i) => i).sort((a, b) => counts[b] - counts[a]);
  const hexes = order.map((i) => rgbToHex(centers[i][0], centers[i][1], centers[i][2]));
  // Unique & top 5
  const unique: string[] = [];
  for (const h of hexes) {
    if (!unique.includes(h)) unique.push(h);
    if (unique.length >= Math.min(5, k)) break;
  }
  return unique;
}

export async function detectLayout(imagePath: string): Promise<LayoutType> {
  const pixels = await loadPixels(imagePath);
  if (!pixels) return 'image-centric';
  const { data, width, height } = pixels;

  let sumL = 0;
  let sumL2 = 0;
  let edgeCount = 0;
  let whiteCount = 0;

  // mean brightness by halves for split detection
  let leftSum = 0;
  let rightSum = 0;
  let topSum = 0;
  let bottomSum = 0;

  const isEdge = (i: number, j: number): boolean => {
    // simple gradient magnitude via adjacent differences
    const idx = (j * width + i) * 3;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const L = luminance(r, g, b);
    const idxR = i + 1 < width ? (j * width + (i + 1)) * 3 : idx;
    const Lr = luminance(data[idxR], data[idxR + 1], data[idxR + 2]);
    const idxD = j + 1 < height ? ((j + 1) * width + i) * 3 : idx;
    const Ld = luminance(data[idxD], data[idxD + 1], data[idxD + 2]);
    const grad = Math.abs(L - Lr) + Math.abs(L - Ld);
    return grad > 0.25; // threshold
  };

  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const idx = (j * width + i) * 3;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const L = luminance(r, g, b);
      sumL += L;
      sumL2 += L * L;
      if (isEdge(i, j)) edgeCount++;
      if (L > 0.9) whiteCount++;
      if (i < width / 2) leftSum += L; else rightSum += L;
      if (j < height / 2) topSum += L; else bottomSum += L;
    }
  }
  const total = width * height;
  const mean = sumL / total;
  const variance = sumL2 / total - mean * mean;
  const brightnessVariance = Math.max(0, Math.min(1, variance));
  const edgeDensity = edgeCount / total;
  const whitespaceRatio = whiteCount / total;
  const leftRightDiff = Math.abs(leftSum - rightSum) / (total / 2);
  const topBottomDiff = Math.abs(topSum - bottomSum) / (total / 2);

  if (leftRightDiff > 0.12 || topBottomDiff > 0.12) return 'split-layout';
  if (edgeDensity > 0.25 && whitespaceRatio < 0.2) return 'text-heavy';
  if (edgeDensity > 0.12 && edgeDensity <= 0.25 && whitespaceRatio < 0.35) return 'overlay-text';
  if (brightnessVariance < 0.02 && whitespaceRatio > 0.5) return 'overlay-text';
  return 'image-centric';
}
