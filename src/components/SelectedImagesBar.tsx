import { PickedImage } from '@/lib/types';
import { formatBytes } from '@/lib/compress';
import { X, ImageIcon } from 'lucide-react';

interface SelectedImagesBarProps {
  images: PickedImage[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function SelectedImagesBar({ images, onRemove, onClear }: SelectedImagesBarProps) {
  if (images.length === 0) return null;
  return (
    <div className="animate-slide-up rounded-2xl bg-charcoal-card border border-gold-400/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_2px_6px_rgba(0,0,0,0.3)] p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-1.5 text-xs font-bold text-white">
          <ImageIcon className="w-3.5 h-3.5 text-gold-400" />
          {images.length} image{images.length > 1 ? 's' : ''} selected
        </span>
        <button onClick={onClear} className="text-[11px] font-bold text-bronze-300 hover:text-red-400 transition-colors">
          Clear all
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {images.map((img) => (
          <div key={img.id} className="relative flex-shrink-0 group">
            <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gold-400/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] bg-charcoal-deep">
              <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
            </div>
            <button
              onClick={() => onRemove(img.id)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform"
            >
              <X className="w-3 h-3" strokeWidth={3} />
            </button>
            <p className="text-[9px] mt-1 text-center text-bronze-300 font-medium truncate w-16">
              {formatBytes(img.sizeBytes)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
