import { useEffect } from 'react';
import { CompressionResultItem } from '@/lib/types';
import { formatBytes } from '@/lib/compress';
import { X, Download, Share2, CheckCircle2 } from 'lucide-react';
import { shareOrDownload } from '@/lib/fileUtils';

interface PreviewModalProps {
  item: CompressionResultItem | null;
  onClose: () => void;
}

export function PreviewModal({ item, onClose }: PreviewModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (item) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, onClose]);

  if (!item) return null;

  const handleSave = async () => {
    const base = item.name.replace(/\.[^.]+$/, '');
    const ext = item.resultBlob.type === 'image/webp' ? 'webp' : 'jpg';
    await shareOrDownload(item.resultBlob, `${base}-compressed.${ext}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fade-in" onClick={onClose}>
      <div
        className="relative w-full max-w-3xl max-h-[92vh] overflow-auto rounded-2xl bg-teal-radial border-2 border-cyan-accent/30 shadow-card animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-teal-900/80 backdrop-blur-md border-b border-cyan-accent/20">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-cyan-accent flex-shrink-0" />
            <h2 className="text-sm font-bold text-white truncate">{item.name}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-teal-700/60 text-cyan-accent">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* image */}
          <div className="rounded-xl overflow-hidden bg-black/40 border border-cyan-accent/20 flex items-center justify-center">
            <img src={item.resultUrl} alt={item.name} className="max-w-full max-h-[55vh] object-contain" />
          </div>

          {/* stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Stat label="Original Size" value={formatBytes(item.originalSize)} accent="text-red-300" />
            <Stat label="Compressed" value={formatBytes(item.resultSize)} accent="text-cyan-accent" />
            <Stat label="Reduction" value={`−${item.reductionPct.toFixed(0)}%`} accent="text-cyan-accent" />
            <Stat label="Quality Used" value={`${Math.round(item.qualityUsed * 100)}%`} accent="text-cyan-accent" />
            <Stat label="Original Dims" value={`${item.originalWidth}×${item.originalHeight}`} />
            <Stat label="New Dims" value={`${item.resultWidth}×${item.resultHeight}`} accent="text-cyan-accent" />
            <Stat label="Mode" value={item.mode === 'target' ? 'Target KB' : 'Manual'} />
            <Stat label="Format" value={item.resultBlob.type === 'image/webp' ? 'WebP' : 'JPEG'} />
          </div>

          {/* before/after comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl overflow-hidden bg-black/30 border border-cyan-accent/15">
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-teal-300/70 bg-teal-900/40">Before</p>
              <img src={item.originalUrl} alt="original" className="w-full h-40 object-contain bg-black/20" />
            </div>
            <div className="rounded-xl overflow-hidden bg-black/30 border border-cyan-accent/15">
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-cyan-accent bg-teal-900/40">After</p>
              <img src={item.resultUrl} alt="compressed" className="w-full h-40 object-contain bg-black/20" />
            </div>
          </div>

          <div className="flex gap-2.5 pt-1">
            <button
              onClick={handleSave}
              className="metallic-sheen flex-1 py-3 rounded-xl font-extrabold text-sm bg-gradient-to-br from-cyan-accent to-teal-400 text-teal-900 shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Share2 className="w-4 h-4" /> Share / Save
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-3 rounded-xl font-bold text-sm bg-teal-700/60 hover:bg-teal-600 text-cyan-accent border border-cyan-accent/30 flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" /> Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent = 'text-white' }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl bg-teal-900/50 border border-cyan-accent/15 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-teal-300/70 mb-0.5">{label}</p>
      <p className={`text-sm font-extrabold font-mono ${accent}`}>{value}</p>
    </div>
  );
}
