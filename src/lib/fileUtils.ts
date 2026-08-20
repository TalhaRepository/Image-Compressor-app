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
  const reader = new FileReader();
  reader.onloadend = () => {
    const base64data = reader.result as string;

    const existingModal = document.getElementById('image-download-overlay');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'image-download-overlay';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0, 0, 0, 0.92); z-index: 99999;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 20px; box-sizing: border-box;
    `;

    modal.innerHTML = `
      <div style="position: absolute; top: 20px; right: 20px; color: #fff; font-size: 28px; cursor: pointer;" id="close-overlay">&times;</div>
      <p style="color: #38bdf8; font-weight: bold; font-size: 15px; margin-bottom: 15px; text-align: center;">
        Image par long-press (daba ke) rakhein aur "Save image" par click karein
      </p>
      <img src="${base64data}" style="max-width: 90%; max-height: 65vh; border-radius: 8px; border: 2px solid #334155; object-fit: contain;" />
      <button id="close-btn" style="margin-top: 20px; padding: 10px 24px; background: #ef4444; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Close</button>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    document.getElementById('close-overlay')?.addEventListener('click', closeModal);
    document.getElementById('close-btn')?.addEventListener('click', closeModal);
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
