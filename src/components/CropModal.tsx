import { useEffect, useRef, useState } from 'react';
import { CropRect } from '@/lib/compress';
import { X, Check, RotateCcw, Crop as CropIcon } from 'lucide-react';

interface CropModalProps {
  src: string;
  initialCrop?: CropRect;
  onApply: (crop: CropRect) => void;
  onClose: () => void;
}

const MIN = 0.1; // min fraction size

export function CropModal({ src, initialCrop, onApply, onClose }: CropModalProps) {
  const [crop, setCrop] = useState<CropRect>(initialCrop || { x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
  const [imgDim, setImgDim] = useState({ w: 1, h: 1 });
  const containerRef = useRef<HTMLDivElement>(null);
  type DragKind = 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';
  const dragRef = useRef<{ kind: DragKind; sx: number; sy: number; orig: CropRect } | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImgDim({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [src]);

  // Use displayed container bounds for pointer math
  const getBox = () => containerRef.current?.getBoundingClientRect();

  const clampCrop = (c: CropRect): CropRect => {
    let { x, y, w, h } = c;
    w = Math.max(MIN, Math.min(1 - x, w));
    h = Math.max(MIN, Math.min(1 - y, h));
    x = Math.max(0, Math.min(1 - w, x));
    y = Math.max(0, Math.min(1 - h, y));
    return { x, y, w, h };
  };

  const onPointerDown = (kind: DragKind, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { kind, sx: e.clientX, sy: e.clientY, orig: { ...crop } };
  };
  const onPointerDownTyped = (kind: DragKind) =>
    (e: React.PointerEvent) => onPointerDown(kind, e);

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const box = getBox();
    if (!box) return;
    const dx = (e.clientX - dragRef.current.sx) / box.width;
    const dy = (e.clientY - dragRef.current.sy) / box.height;
    const o = dragRef.current.orig;
    let c: CropRect = { ...o };
    const k = dragRef.current.kind;
    if (k === 'move') {
      c.x = o.x + dx; c.y = o.y + dy;
    } else {
      if (k.includes('n')) { c.y = o.y + dy; c.h = o.h - dy; }
      if (k.includes('s')) { c.h = o.h + dy; }
      if (k.includes('w')) { c.x = o.x + dx; c.w = o.w - dx; }
      if (k.includes('e')) { c.w = o.w + dx; }
    }
    // aspect lock not enforced — free crop
    setCrop(clampCrop(c));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (dragRef.current) {
      try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
    }
    dragRef.current = null;
  };

  // keyboard aspect presets
  const setAspect = (ratio: number | null) => {
    if (!ratio) { setCrop({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 }); return; }
    const box = getBox();
    if (!box) return;
    const containerRatio = box.width / box.height;
    let w: number, h: number;
    if (ratio > containerRatio) { w = 0.9; h = (0.9 * containerRatio) / ratio; }
    else { h = 0.9; w = (0.9 * ratio) / containerRatio; }
    setCrop(clampCrop({ x: (1 - w) / 2, y: (1 - h) / 2, w, h }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fade-in" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-charcoal-card border-2 border-gold-400 shadow-card p-4 sm:p-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-white">
            <CropIcon className="w-5 h-5 text-gold-400" /> Crop / Frame Image
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-charcoal-soft text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image + crop overlay */}
        <div
          ref={containerRef}
          className="relative w-full overflow-hidden rounded-xl bg-black/90 select-none touch-none"
          style={{ aspectRatio: `${imgDim.w} / ${imgDim.h}` }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <img src={src} alt="To crop" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
          {/* darkened outside */}
          <div className="absolute inset-0 bg-black/55 pointer-events-none" style={{ clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${crop.x * 100}% ${crop.y * 100}%, ${crop.x * 100}% ${(crop.y + crop.h) * 100}%, ${(crop.x + crop.w) * 100}% ${(crop.y + crop.h) * 100}%, ${(crop.x + crop.w) * 100}% ${crop.y * 100}%, ${crop.x * 100}% ${crop.y * 100}%)` }} />
          {/* crop box */}
          <div
            className="absolute border-2 border-gold-400 cursor-move shadow-[0_0_0_9999px_rgba(0,0,0,0.0)]"
            style={{ left: `${crop.x * 100}%`, top: `${crop.y * 100}%`, width: `${crop.w * 100}%`, height: `${crop.h * 100}%` }}
            onPointerDown={onPointerDownTyped('move')}
          >
            {/* grid lines */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/3 left-0 right-0 border-t border-white/30" />
              <div className="absolute top-2/3 left-0 right-0 border-t border-white/30" />
              <div className="absolute left-1/3 top-0 bottom-0 border-l border-white/30" />
              <div className="absolute left-2/3 top-0 bottom-0 border-l border-white/30" />
            </div>
            {/* handles */}
            {(['nw','n','ne','e','se','s','sw','w'] as const).map((h) => (
              <Handle key={h} dir={h} onDown={onPointerDownTyped(h)} />
            ))}
          </div>
        </div>

        {/* aspect chips */}
        <div className="flex gap-2 mt-4 flex-wrap">
          <span className="text-[11px] font-bold text-bronze-300 self-center mr-1">Aspect:</span>
          {[
            { l: 'Free', r: null },
            { l: '1:1', r: 1 },
            { l: '4:5', r: 4 / 5 },
            { l: '16:9', r: 16 / 9 },
            { l: '9:16', r: 9 / 16 },
            { l: '4:3', r: 4 / 3 },
          ].map((a) => (
            <button
              key={a.l}
              onClick={() => setAspect(a.r)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-charcoal-soft text-white border border-gold-400/30 hover:border-gold-400/70 shadow-metallic-sm transition-all"
            >
              {a.l}
            </button>
          ))}
        </div>

        {/* actions */}
        <div className="flex gap-2.5 mt-5">
          <button
            onClick={() => setCrop({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 })}
            className="px-4 py-2.5 rounded-xl text-sm font-bold bg-charcoal-soft text-white border border-gold-400/30 hover:brightness-125 shadow-metallic-sm flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-bold bg-charcoal-soft text-white border border-gold-400/30 hover:brightness-125 shadow-metallic-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => onApply(crop)}
            className="metallic-sheen px-5 py-2.5 rounded-xl text-sm font-extrabold bg-gradient-to-br from-gold-300 to-gold-500 text-bronze-900 shadow-gold-glow flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <Check className="w-4 h-4" /> Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}

function Handle({ dir, onDown }: { dir: string; onDown: (e: React.PointerEvent) => void }) {
  const map: Record<string, string> = {
    nw: 'top-0 left-0 cursor-nw-resize',
    ne: 'top-0 right-0 cursor-ne-resize',
    sw: 'bottom-0 left-0 cursor-sw-resize',
    se: 'bottom-0 right-0 cursor-se-resize',
    n: 'top-0 left-1/2 -translate-x-1/2 cursor-n-resize',
    s: 'bottom-0 left-1/2 -translate-x-1/2 cursor-s-resize',
    e: 'top-1/2 right-0 -translate-y-1/2 cursor-e-resize',
    w: 'top-1/2 left-0 -translate-y-1/2 cursor-w-resize',
  };
  const corner = ['nw', 'ne', 'sw', 'se'].includes(dir);
  return (
    <div
      onPointerDown={onDown}
      className={`absolute ${map[dir]} ${corner ? 'w-4 h-4' : 'w-3 h-3'} rounded-full bg-gold-400 border-2 border-white shadow-md hover:scale-125 transition-transform`}
      style={{ touchAction: 'none' }}
    />
  );
}
