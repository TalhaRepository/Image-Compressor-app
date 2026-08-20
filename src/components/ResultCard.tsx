import { useEffect, useState } from 'react';
import { CompressionResultItem } from '@/lib/types';
import { formatBytes } from '@/lib/compress';
import { Download, Share2, Eye, TrendingDown, Maximize2 } from 'lucide-react';
import { downloadImageToDevice } from '@/lib/fileUtils';

interface ResultCardProps {
  item: CompressionResultItem;
  onPreview: (item: CompressionResultItem) => void;
}

export function ResultCard({ item, onPreview }: ResultCardProps) {
  const [dataUrl, setDataUrl] = useState<string>('');

  const baseName = item.name.replace(/\.[^.]+$/, '');
  const ext = item.resultBlob.type === 'image/webp' ? 'webp' : 'jpg';
  const downloadFileName = `${baseName}-compressed.${ext}`;
const handleDownload = async (e: React.MouseEvent) => {
  e.stopPropagation();
  await downloadImageToDevice(item.resultUrl || dataUrl, downloadFileName);
};
  
  // Convert blob to Data URL upfront so href is ready before tap
  useEffect(() => {
    let active = true;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (active && typeof reader.result === 'string') {
        setDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(item.resultBlob);
    return () => {
      active = false;
    };
  }, [item.resultBlob]);

  const handleShare = async () => {
    const file = new File([item.resultBlob], downloadFileName, { type: item.resultBlob.type || 'image/jpeg' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: downloadFileName });
      } catch {
        // Share dismissed
      }
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-teal-gradient shadow-card border border-teal-700/40 hover:shadow-[0_12px_32px_rgba(0,77,64,0.4)] transition-all animate-slide-up">
      <div className="absolute inset-0 shimmer-bg pointer-events-none" />

      <div className="relative flex gap-3.5 p-3.5">
        {/* Thumbnail - Tap to Preview */}
        <div 
          onClick={() => onPreview(item)}
          className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-black/30 border border-cyan-accent/30 cursor-pointer"
        >
          <img src={item.resultUrl} alt={item.name} className="w-full h-full object-cover" />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1">
            <span className="text-[9px] font-bold text-cyan-accent uppercase tracking-wide">
              {Math.round(item.qualityUsed * 100)}% Q
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 
              onClick={() => onPreview(item)} 
              className="text-sm font-bold text-white truncate cursor-pointer" 
              title={item.name}
            >
              {item.name}
            </h3>
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={handleShare}
                className="p-1.5 rounded-lg bg-teal-700/60 hover:bg-teal-600 text-cyan-accent transition-colors"
                title="Share / Save"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>

              {/* Pure HTML Anchor Link without parent wrapper or stopPropagation */}
              {dataUrl ? (
                <button
  onClick={handleDownload}
  className="p-1.5 rounded-lg bg-teal-700/60"
  title="Download"
>
  <Download className="w-3.5 h-3.5" />
</button>

              ) : (
                <div className="p-1.5 rounded-lg bg-teal-700/30 text-teal-500">
                  <Download className="w-3.5 h-3.5 animate-pulse" />
                </div>
              )}

              <button
                onClick={() => onPreview(item)}
                className="p-1.5 rounded-lg bg-teal-700/60 hover:bg-teal-600 text-cyan-accent transition-colors"
                title="Preview"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Size Info */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-md bg-teal-900/60 text-[11px] font-bold text-red-300 line-through">
              {formatBytes(item.originalSize)}
            </span>
            <TrendingDown className="w-3 h-3 text-cyan-accent flex-shrink-0" />
            <span className="px-2 py-0.5 rounded-md bg-teal-700/50 text-[11px] font-bold text-cyan-accent">
              {formatBytes(item.resultSize)}
            </span>
            <span className="ml-auto px-2 py-0.5 rounded-md bg-gradient-to-r from-cyan-accent/20 to-teal-400/20 text-[10px] font-extrabold text-cyan-accent border border-cyan-accent/30">
              −{item.reductionPct.toFixed(0)}%
            </span>
          </div>

          {/* Dimensions */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-teal-100/80">
            <span className="font-mono">
              {item.originalWidth}×{item.originalHeight}
            </span>
            <Maximize2 className="w-2.5 h-2.5 text-cyan-accent/60" />
            <span className="font-mono text-cyan-accent">
              {item.resultWidth}×{item.resultHeight}
            </span>
            <span className="ml-auto text-[10px] uppercase tracking-wide text-teal-300/70 font-bold">
              {item.mode === 'target' ? 'Target KB' : 'Manual'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
              }
      
