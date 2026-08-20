// Core image compression engine — fully client-side, Canvas-based.
// No external service calls. Everything runs in the browser.

export type CompressFormat = 'image/jpeg' | 'image/webp';

export interface CompressOptions {
  mode: 'target' | 'manual';
  format: CompressFormat;
  maxBytes?: number; // target mode
  quality?: number; // manual mode 0..1
  targetWidth?: number;
  targetHeight?: number;
  crop?: CropRect;
  preserveAspectRatio?: boolean;
}

export interface CropRect {
  x: number; // fraction 0..1
  y: number; // fraction 0..1
  w: number; // fraction 0..1 of width
  h: number; // fraction 0..1 of height
}

export interface CompressResult {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  qualityUsed: number;
  sourceWidth: number;
  sourceHeight: number;
}

let offscreenCanvas: HTMLCanvasElement | null = null;
function getCanvas(w: number, h: number): HTMLCanvasElement {
  if (!offscreenCanvas) offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = Math.max(1, Math.round(w));
  offscreenCanvas.height = Math.max(1, Math.round(h));
  return offscreenCanvas;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Failed to read blob'));
    r.readAsDataURL(blob);
  });
}

// Compute display dimensions respecting aspect ratio + optional target dims.
function computeDims(
  srcW: number,
  srcH: number,
  targetW?: number,
  targetH?: number,
  preserve = true,
): { w: number; h: number } {
  if (!targetW && !targetH) return { w: srcW, h: srcH };
  if (!preserve) {
    return { w: targetW || srcW, h: targetH || srcH };
  }
  if (targetW && targetH) {
    const scale = Math.min(targetW / srcW, targetH / srcH);
    return { w: Math.round(srcW * scale), h: Math.round(srcH * scale) };
  }
  if (targetW) {
    return { w: targetW, h: Math.round(srcW ? (srcH * targetW) / srcW : targetW) };
  }
  return { w: Math.round(srcH ? (srcW * targetH!) / srcH : targetH!), h: targetH! };
}

function canvasToBlob(canvas: HTMLCanvasElement, format: CompressFormat, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))),
      format,
      Math.max(0.05, Math.min(1, quality)),
    );
  });
}

// Draw source (possibly cropped) to canvas at given size.
function drawToCanvas(
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  outW: number,
  outH: number,
  crop?: CropRect,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2D context');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // White background for JPEG (no alpha)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (crop) {
    const sx = crop.x * img.naturalWidth;
    const sy = crop.y * img.naturalHeight;
    const sw = crop.w * img.naturalWidth;
    const sh = crop.h * img.naturalHeight;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
  } else {
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, outW, outH);
  }
}

// Binary-search quality (and optionally downscale) to hit target bytes.
export async function compressToTarget(
  dataUrl: string,
  opts: Required<Pick<CompressOptions, 'maxBytes' | 'format'>> &
    Pick<CompressOptions, 'targetWidth' | 'targetHeight' | 'crop' | 'preserveAspectRatio'>,
): Promise<CompressResult> {
  const img = await loadImage(dataUrl);
  let srcW = img.naturalWidth;
  let srcH = img.naturalHeight;

  if (opts.crop) {
    srcW = Math.round(opts.crop.w * img.naturalWidth);
    srcH = Math.round(opts.crop.h * img.naturalHeight);
  }

  let { w, h } = computeDims(srcW, srcH, opts.targetWidth, opts.targetHeight, opts.preserveAspectRatio !== false);
  // Cap dimensions to original (don't upscale) for target mode
  const origW = w, origH = h;
  let scale = 1;

  let bestBlob: Blob | null = null;
  let bestQ = 0.8;
  let bestW = w, bestH = h;

  // Try quality-only first at full res
  let lo = 0.05, hi = 1;
  for (let i = 0; i < 8; i++) {
    const q = (lo + hi) / 2;
    const cv = getCanvas(w, h);
    drawToCanvas(img, cv, w, h, opts.crop);
    const blob = await canvasToBlob(cv, opts.format, q);
    if (blob.size <= opts.maxBytes) {
      bestBlob = blob; bestQ = q; bestW = w; bestH = h;
      lo = q; // try higher
    } else {
      hi = q;
    }
  }

  // If still over target, progressively downscale
  if (!bestBlob || bestBlob.size > opts.maxBytes) {
    scale = 1;
    for (let step = 0; step < 12; step++) {
      scale *= 0.8;
      const sw = Math.max(32, Math.round(origW * scale));
      const sh = Math.max(32, Math.round(origH * scale));
      // re-quality search at this scale
      let slo = 0.05, shi = 1;
      let localBest: Blob | null = null;
      let localQ = 0.7;
      for (let i = 0; i < 5; i++) {
        const q = (slo + shi) / 2;
        const cv = getCanvas(sw, sh);
        drawToCanvas(img, cv, sw, sh, opts.crop);
        const blob = await canvasToBlob(cv, opts.format, q);
        if (blob.size <= opts.maxBytes) {
          localBest = blob; localQ = q; slo = q;
        } else {
          shi = q;
        }
      }
      if (localBest) {
        bestBlob = localBest; bestQ = localQ; bestW = sw; bestH = sh;
        break;
      }
      if (sw <= 64 && sh <= 64) break;
    }
  }

  // Fallback: lowest quality at smallest scale tried
  if (!bestBlob) {
    const cv = getCanvas(64, 64);
    drawToCanvas(img, cv, 64, 64, opts.crop);
    bestBlob = await canvasToBlob(cv, opts.format, 0.05);
    bestQ = 0.05; bestW = 64; bestH = 64;
  }

  const url = await blobToDataUrl(bestBlob);
  return {
    blob: bestBlob,
    url,
    width: bestW,
    height: bestH,
    qualityUsed: bestQ,
    sourceWidth: img.naturalWidth,
    sourceHeight: img.naturalHeight,
  };
}

export async function compressManual(
  dataUrl: string,
  opts: Required<Pick<CompressOptions, 'quality' | 'format'>> &
    Pick<CompressOptions, 'targetWidth' | 'targetHeight' | 'crop' | 'preserveAspectRatio'>,
): Promise<CompressResult> {
  const img = await loadImage(dataUrl);
  let srcW = img.naturalWidth;
  let srcH = img.naturalHeight;
  if (opts.crop) {
    srcW = Math.round(opts.crop.w * img.naturalWidth);
    srcH = Math.round(opts.crop.h * img.naturalHeight);
  }
  const { w, h } = computeDims(srcW, srcH, opts.targetWidth, opts.targetHeight, opts.preserveAspectRatio !== false);
  const cv = getCanvas(w, h);
  drawToCanvas(img, cv, w, h, opts.crop);
  const blob = await canvasToBlob(cv, opts.format, opts.quality);
  const url = await blobToDataUrl(blob);
  return {
    blob,
    url,
    width: w,
    height: h,
    qualityUsed: opts.quality,
    sourceWidth: img.naturalWidth,
    sourceHeight: img.naturalHeight,
  };
}

export async function compressImage(dataUrl: string, opts: CompressOptions): Promise<CompressResult> {
  if (opts.mode === 'target') {
    return compressToTarget(dataUrl, {
      maxBytes: opts.maxBytes || 102400,
      format: opts.format,
      targetWidth: opts.targetWidth,
      targetHeight: opts.targetHeight,
      crop: opts.crop,
      preserveAspectRatio: opts.preserveAspectRatio,
    });
  }
  return compressManual(dataUrl, {
    quality: opts.quality || 0.8,
    format: opts.format,
    targetWidth: opts.targetWidth,
    targetHeight: opts.targetHeight,
    crop: opts.crop,
    preserveAspectRatio: opts.preserveAspectRatio,
  });
}

// ---- Presets ----
export interface DimensionPreset {
  id: string;
  label: string;
  short: string;
  targetWidth?: number;
  targetHeight?: number;
  ratio?: number; // w/h — used when no fixed px
  emoji?: string;
}

export const PRESETS: DimensionPreset[] = [
  { id: 'passport', label: 'Passport', short: 'Passport', targetWidth: 600, targetHeight: 750, ratio: 0.8, emoji: '🛂' },
  { id: 'square', label: '1:1 Square', short: '1:1', targetWidth: 1080, targetHeight: 1080, ratio: 1, emoji: '⬛' },
  { id: 'youtube', label: '16:9 YouTube', short: '16:9', targetWidth: 1920, targetHeight: 1080, ratio: 16 / 9, emoji: '▶️' },
  { id: 'story', label: '9:16 Story', short: '9:16', targetWidth: 1080, targetHeight: 1920, ratio: 9 / 16, emoji: '📱' },
  { id: 'post', label: '4:5 Post', short: '4:5', targetWidth: 1080, targetHeight: 1350, ratio: 4 / 5, emoji: '🖼️' },
];

// ---- Helpers ----
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function dataUrlSizeBytes(dataUrl: string): number {
  const idx = dataUrl.indexOf(',');
  if (idx === -1) return 0;
  const base64 = dataUrl.substring(idx + 1);
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

export function naturalSizeOf(dataUrl: string): Promise<{ w: number; h: number }> {
  return loadImage(dataUrl).then((img) => ({ w: img.naturalWidth, h: img.naturalHeight }));
}
