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

  export async function downloadBlob(blob: Blob, filename: string): Promise<string> {
  return shareOrDownload(blob, filename);
}

export async function shareOrDownload(blob: Blob, filename: string): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;

      const existingModal = document.getElementById('image-download-overlay');
      if (existingModal) existingModal.remove();

      const modal = document.createElement('div');
      modal.id = 'image-download-overlay';
      modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.95); z-index: 99999; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;';

      const closeBtnHeader = document.createElement('div');
      closeBtnHeader.style.cssText = 'position: absolute; top: 20px; right: 20px; color: #fff; font-size: 28px; cursor: pointer;';
      closeBtnHeader.innerHTML = '&times;';

      const img = document.createElement('img');
      img.src = base64data;
      img.style.cssText = 'max-width: 90%; max-height: 50vh; border-radius: 8px; border: 2px solid #334155; object-fit: contain; -webkit-touch-callout: default !important; -webkit-user-select: auto !important; user-select: auto !important;';

      const saveBtn = document.createElement('a');
      saveBtn.href = base64data;
      saveBtn.download = filename;
      saveBtn.target = '_blank';
      saveBtn.innerText = '📥 Save Image To Phone';
      saveBtn.style.cssText = 'margin-top: 20px; padding: 12px 28px; background: #22c55e; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; text-align: center; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);';

      const note = document.createElement('p');
      note.innerText = 'Button par click karein ya image par long-press karein.';
      note.style.cssText = 'color: #94a3b8; font-size: 12px; margin-top: 10px; text-align: center;';

      const closeBtn = document.createElement('button');
      closeBtn.innerText = 'Close';
      closeBtn.style.cssText = 'margin-top: 15px; padding: 8px 20px; background: #334155; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;';

      modal.appendChild(closeBtnHeader);
      modal.appendChild(img);
      modal.appendChild(saveBtn);
      modal.appendChild(note);
      modal.appendChild(closeBtn);

      document.body.appendChild(modal);

      const closeModal = () => {
        modal.remove();
        resolve('downloaded');
      };

      closeBtnHeader.onclick = closeModal;
      closeBtn.onclick = closeModal;
    };
    reader.readAsDataURL(blob);
  });
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
