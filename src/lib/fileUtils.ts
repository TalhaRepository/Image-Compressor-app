// Read a File as a data URL (for in-browser preview)
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Failed to read file'));
    r.readAsDataURL(file);
  });
}

export async function downloadBlob(blob: Blob, filename: string): Promise<string> {
  return shareOrDownload(blob, filename);
}

export async function shareOrDownload(blob: Blob, filename: string): Promise<string> {
  return new Promise((resolve) => {
    const blobUrl = URL.createObjectURL(blob);

    const existingModal = document.getElementById('image-download-overlay');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'image-download-overlay';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.95); z-index: 99999; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;';

    const closeBtnHeader = document.createElement('div');
    closeBtnHeader.style.cssText = 'position: absolute; top: 20px; right: 20px; color: #fff; font-size: 32px; font-weight: bold; cursor: pointer; padding: 10px; z-index: 100000;';
    closeBtnHeader.innerHTML = '&times;';

    const img = document.createElement('img');
    img.src = blobUrl;
    img.style.cssText = 'max-width: 90%; max-height: 45vh; border-radius: 8px; border: 2px solid #334155; object-fit: contain; -webkit-touch-callout: default !important; -webkit-user-select: auto !important; user-select: auto !important;';

    const saveBtn = document.createElement('button');
    saveBtn.innerText = '📥 Save Image To Phone';
    saveBtn.style.cssText = 'margin-top: 20px; padding: 14px 28px; background: #22c55e; color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 16px; text-align: center; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4); width: 80%; max-width: 280px; cursor: pointer;';

    const note = document.createElement('p');
    note.innerText = 'Button se download na ho toh photo par long-press karke "Save image" karein.';
    note.style.cssText = 'color: #94a3b8; font-size: 12px; margin-top: 12px; text-align: center; width: 90%;';

    const closeBtn = document.createElement('button');
    closeBtn.innerText = 'Close';
    closeBtn.style.cssText = 'margin-top: 15px; padding: 10px 24px; background: #334155; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;';

    modal.appendChild(closeBtnHeader);
    modal.appendChild(img);
    modal.appendChild(saveBtn);
    modal.appendChild(note);
    modal.appendChild(closeBtn);

    document.body.appendChild(modal);

    // Programmatic Download Trigger
    saveBtn.onclick = () => {
      const tempLink = document.createElement('a');
      tempLink.href = blobUrl;
      tempLink.download = filename;
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
    };

    const closeModal = () => {
      modal.remove();
      URL.revokeObjectURL(blobUrl);
      resolve('downloaded');
    };

    closeBtnHeader.onclick = closeModal;
    closeBtn.onclick = closeModal;
  });
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 11);
}
