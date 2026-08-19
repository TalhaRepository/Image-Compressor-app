import { Images, Crop, Zap, Loader2 } from 'lucide-react';

interface ActionButtonsProps {
  hasImages: boolean;
  imageCount: number;
  isSingle: boolean;
  isCompressing: boolean;
  onPick: () => void;
  onCrop: () => void;
  onCompress: () => void;
}

export function ActionButtons({
  hasImages, imageCount, isSingle, isCompressing, onPick, onCrop, onCompress,
}: ActionButtonsProps) {
  return (
    <div className="space-y-3">
      {/* Select images — always visible */}
      <button
        onClick={onPick}
        disabled={isCompressing}
        className="metallic-sheen group relative w-full py-3.5 rounded-2xl bg-bronze-button hover:bg-bronze-button-hover text-bronze-50 font-extrabold text-base shadow-metallic border border-gold-400/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2.5"
      >
        <Images className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2.4} />
        <span>Select Images</span>
        {hasImages && (
          <span className="ml-1 px-2 py-0.5 rounded-full bg-charcoal/40 text-xs font-bold text-white">
            {imageCount}
          </span>
        )}
      </button>

      {/* Crop (single only) */}
      {hasImages && isSingle && (
        <button
          onClick={onCrop}
          disabled={isCompressing}
          className="metallic-sheen w-full py-3 rounded-2xl bg-charcoal-soft hover:brightness-125 text-white font-bold text-sm border border-gold-400/40 disabled:opacity-60 transition-all active:scale-[0.98] flex items-center justify-center gap-2 animate-slide-up"
        >
          <Crop className="w-4 h-4 text-gold-400" strokeWidth={2.4} />
          <span>Crop / Frame Image</span>
        </button>
      )}

      {/* Compress */}
      {hasImages && (
        <button
          onClick={onCompress}
          disabled={isCompressing}
          className="metallic-sheen group w-full py-3.5 rounded-2xl bg-gradient-to-br from-gold-300 to-gold-500 hover:from-gold-400 hover:to-gold-600 text-charcoal font-extrabold text-base shadow-gold-glow border-2 border-gold-400 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 animate-slide-up"
        >
          {isCompressing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.4} />
              <span>Compressing…</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2.4} />
              <span>{imageCount > 1 ? `Compress All (${imageCount} Images)` : 'Compress Image'}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
