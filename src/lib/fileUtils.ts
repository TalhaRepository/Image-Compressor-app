import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Media } from '@capacitor-community/media';
import { Share } from '@capacitor/share';

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

// Direct Download Logic (works in real browsers; used as the final fallback everywhere else)
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

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// Writes the blob into the app's cache directory and returns a file:// URI that
// Capacitor's built-in FileProvider is already configured to expose (the default
// file_paths.xml ships a cache-path entry), so it's safe to hand to Share/Media
// without any extra native config.
async function writeBlobToCache(blob: Blob, filename: string): Promise<string> {
  const dataUrl = await blobToDataUrl(blob);
  const base64Data = dataUrl.split(',')[1] || '';
  const path = `${Date.now()}-${sanitizeFileName(filename)}`;
  const result = await Filesystem.writeFile({
    path,
    data: base64Data,
    directory: Directory.Cache,
  });
  return result.uri;
}

// Saves directly to the device's photo gallery via the native Media plugin.
// NOTE: the plugin exports a class, not static methods — it must be instantiated
// (this was the original bug: `Media.savePhoto(...)` silently threw and was
// swallowed by the catch block, so nothing ever actually saved).
async function saveToGallery(blob: Blob, filename: string): Promise<boolean> {
  try {
    const dataUrl = await blobToDataUrl(blob);
    const media = new Media();
    await media.savePhoto({
      path: dataUrl,
      album: 'Compressed Images',
    });
    void filename;
    return true;
  } catch (err) {
    console.warn('Gallery save unavailable, falling back', err);
    return false;
  }
}

// Native OS share sheet using a real file:// URI. This is required inside a
// Capacitor Android WebView because the Web Share API (navigator.share) is not
// implemented there — only the native @capacitor/share plugin works.
async function shareNativeFile(blob: Blob, filename: string): Promise<boolean> {
  try {
    const uri = await writeBlobToCache(blob, filename);
    await Share.share({
      title: filename,
      url: uri,
      files: [uri],
      dialogTitle: 'Save or share image',
    });
    return true;
  } catch (err) {
    console.warn('Native share unavailable, falling back', err);
    return false;
  }
}

// Smart Share or Direct Download — used for the explicit "Share / Save" actions.
export async function shareOrDownload(blob: Blob, filename: string): Promise<string> {
  // Inside the compiled Android/iOS app: try the gallery, then the native share sheet.
  if (Capacitor.isNativePlatform()) {
    if (await saveToGallery(blob, filename)) return 'saved';
    if (await shareNativeFile(blob, filename)) return 'shared';
    return downloadBlob(blob, filename);
  }

  // Standard mobile/desktop browsers: Web Share API first, then a plain download.
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

// Android WebView & Browser Save/Download Handler — used for the explicit "Download" action.
export async function downloadImageToDevice(input: string | Blob, fileName: string) {
  let blob: Blob;

  if (input instanceof Blob) {
    blob = input;
  } else if (typeof input === 'string' && input.startsWith('data:')) {
    blob = dataUrlToBlob(input);
  } else if (typeof input === 'string') {
    try {
      const res = await fetch(input);
      blob = await res.blob();
    } catch {
      blob = new Blob([], { type: 'image/jpeg' });
    }
  } else {
    return;
  }

  // 1. Native app: save straight to the device gallery.
  if (Capacitor.isNativePlatform()) {
    if (await saveToGallery(blob, fileName)) {
      alert('Image Gallery mein save ho gayi hai!');
      return;
    }

    // 2. Native share sheet fallback (lets the user pick "Save to Files", a gallery app, etc).
    if (await shareNativeFile(blob, fileName)) {
      return;
    }

    // 3. Last resort inside the WebView.
    await downloadBlob(blob, fileName);
    return;
  }

  // Standard mobile/desktop browser fallback (Web Share API, then plain download).
  await shareOrDownload(blob, fileName);
      }
