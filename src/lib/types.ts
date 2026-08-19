export interface PickedImage {
  id: string;
  name: string;
  dataUrl: string;
  sizeBytes: number;
  width: number;
  height: number;
}

export interface CompressionResultItem {
  id: string;
  sourceId: string;
  name: string;
  originalUrl: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  resultUrl: string;
  resultBlob: Blob;
  resultSize: number;
  resultWidth: number;
  resultHeight: number;
  qualityUsed: number;
  mode: 'target' | 'manual';
  reductionPct: number;
}
