// Read a File as a data URL (for in-browser preview)
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Failed to read file'));
    r.readAsDataURL(file);
  });
}

export function downloadBlob(blob: Blob, filename: string): Promise<string> {
  return new Promise((resolve) => {
    // Force octet-stream binary type so Android DownloadManager MUST save the file
    const forceDownloadBlob = new Blob([blob], { type: 'application/octet-stream' });
    const blobUrl = URL.createObjectURL(forceDownloadBlob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    
    document.body.appendChild(link);
    
    // Direct synchronous trigger within user tap gesture
    link.click();
    
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
      resolve('downloaded');
    }, 4000);
  });
}

export async function shareOrDownload(blob: Blob, filename: string): Promise<string> {
  return downloadBlob(blob, filename);
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 11);
                     }
                     
