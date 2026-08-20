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
  const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });

  // 1. Mobile Phone Native Share Sheet (Save to Gallery / Drive / Files)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: filename,
      });
      return 'shared';
    } catch (e) {
      // User cancelled share
    }
  }

  // 2. Direct Clean Download (Bina kisi popup / modal ke)
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 2000);

  return 'downloaded';
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 11);
}
