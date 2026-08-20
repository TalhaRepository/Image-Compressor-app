import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

// Read a File as a data URL (for in-browser image processing).
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Failed to read file'));
    r.readAsDataURL(file);
  });
}

export async function downloadBlob(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });

  // 1. Android Native Share
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: filename,
      });
      return;
    } catch (err) {
      console.log('Share cancelled', err);
    }
  }

  // 2. Web Fallback
  const reader = new FileReader();
  reader.onloadend = () => {
    const a = document.createElement('a');
    a.href = reader.result as string;
    a.download = filename;
    a.click();
  };
  reader.readAsDataURL(blob);
}

    

export function uid(): string {
  return Math.random().toString(36).slice(2, 11);
}

// Web Share API with file fallback. Returns true if shared, false if downloaded.
export async function shareOrDownload(blob: Blob, filename: string, title = 'Compressed image'): Promise<'shared' | 'downloaded' | 'failed'> {
  try {
    const file = new File([blob], filename, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title });
      return 'shared';
    }
  } catch (e) {
    // user cancelled or share failed — fall through to download
  }
  try {
    downloadBlob(blob, filename);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}
