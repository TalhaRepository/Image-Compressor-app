import { Media } from '@capacitor-community/media';

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

// Helper to convert Data URL to Blob safely without fetch()
function dataUrlToBlob(dataUrl: string): Blob {
  try {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1] || arr[0]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch {
    return new Blob([], { type: 'image/jpeg' });
  }
}

// Direct Download Logic
export async function downloadBlob(blob: Blob, filename: string): Promise<string> {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  return 'downloaded';
}

// Smart Share or Direct Download for Mobile Browsers
export async function shareOrDownload(blob: Blob, filename: string): Promise<string> {
  const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });

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
      // User cancelled
    }
  }

  return downloadBlob(blob, filename);
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 11);
}

// Android WebView & Browser Save/Download Handler
export async function downloadImageToDevice(input: string | Blob, fileName: string) {
  let dataUrl = '';
  let blob: Blob;

  // Prepare both DataURL and Blob formats
  if (input instanceof Blob) {
    blob = input;
    dataUrl = await blobToDataUrl(input);
  } else if (typeof input === 'string' && input.startsWith('data:')) {
    dataUrl = input;
    blob = dataUrlToBlob(input);
  } else if (typeof input === 'string') {
    dataUrl = input;
    try {
      const res = await fetch(input);
      blob = await res.blob();
    } catch {
      blob = new Blob([], { type: 'image/jpeg' });
    }
  } else {
    return;
  }

  // 1. Native Plugin direct save to Android Gallery
  try {
    await Media.savePhoto({
      path: dataUrl,
      album: 'Compressed Images'
    });
    alert('Image Gallery mein save ho gayi hai!');
    return;
  } catch (pluginErr) {
    console.warn('Native plugin not available, using Web fallbacks', pluginErr);
  }

  // 2. Android Native Share Sheet Fallback
  try {
    const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
    if (
      typeof navigator !== 'undefined' &&
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: fileName,
      });
      return;
    }
  } catch (err) {
    // User cancelled share
  }

  // 3. Direct Blob Download Fallback
  await downloadBlob(blob, fileName);
}
  
