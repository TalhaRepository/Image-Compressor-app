// Read a File as a data URL (for in-browser preview)
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Failed to read file'));
    r.readAsDataURL(file);
  });
}

// Convert Blob to Base64 String for mobile browser compatibility
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Direct Download Logic
export async function downloadBlob(blob: Blob, filename: string): Promise<string> {
  const dataUrl = await blobToDataUrl(blob);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return 'downloaded';
}

// Smart Share or Direct Download for Mobile Browsers
export async function shareOrDownload(blob: Blob, filename: string): Promise<string> {
  const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });

  // 1. Native Mobile Share Sheet (Android / Chrome par 100% chalega)
  if (
    typeof navigator !== 'undefined' &&
    navigator.share &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: filename,
      });
      return 'shared';
    } catch {
      // Fallback to download if share is dismissed
    }
  }

  // 2. Fallback to Direct Base64 Download
  return downloadBlob(blob, filename);
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 11);
}
