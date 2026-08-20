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
  // 1. Mobile Android App Native Download Logic
  if (Capacitor.isNativePlatform()) {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Documents,
        });

        alert('Image successfully saved to Documents!');
      };
    } catch (err) {
      console.error('Error saving file natively:', err);
      alert('Failed to save file');
    }
    return;
  }

  // 2. Standard Web Browser Fallback
  const reader = new FileReader();
  reader.onloadend = () => {
    const base64data = reader.result as string;
    const a = document.createElement('a');
    a.href = base64data;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
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
