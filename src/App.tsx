import { useCallback, useMemo, useRef, useState } from 'react';
import { Header } from '@/components/Header';

// App is permanently dark-themed.
if (typeof document !== 'undefined') document.documentElement.classList.add('dark');
import { ModeSwitcher, Mode } from '@/components/ModeSwitcher';
import { Controls } from '@/components/Controls';
import { ActionButtons } from '@/components/ActionButtons';
import { SelectedImagesBar } from '@/components/SelectedImagesBar';
import { ResultCard } from '@/components/ResultCard';
import { PreviewModal } from '@/components/PreviewModal';
import { CropModal } from '@/components/CropModal';
import { PickedImage, CompressionResultItem } from '@/lib/types';
import { compressImage, dataUrlSizeBytes, naturalSizeOf, PRESETS, CropRect } from '@/lib/compress';
import { fileToDataUrl, uid } from '@/lib/fileUtils';
import { Cpu, Sparkles, Trash2, AlertCircle } from 'lucide-react';

export default function App() {
  const [mode, setMode] = useState<Mode>('target');
  const [targetKB, setTargetKB] = useState('50');
  const [quality, setQuality] = useState(80);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [images, setImages] = useState<PickedImage[]>([]);
  const [results, setResults] = useState<CompressionResultItem[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<CompressionResultItem | null>(null);
  const [cropFor, setCropFor] = useState<PickedImage | null>(null);
  const [cropRect, setCropRect] = useState<CropRect | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSingle = images.length === 1;

  const handlePickClick = () => fileInputRef.current?.click();

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const picked: PickedImage[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const dataUrl = await fileToDataUrl(file);
        const dim = await naturalSizeOf(dataUrl);
        picked.push({
          id: uid(),
          name: file.name,
          dataUrl,
          sizeBytes: dataUrlSizeBytes(dataUrl),
          width: dim.w,
          height: dim.h,
        });
      } catch {
        // skip failures
      }
    }
    if (picked.length === 0) {
      setError('Could not read those images. Please try different files.');
      return;
    }
    // batch: replace. single: replace. Keep crop only for single new pick.
    if (picked.length === 1) {
      setImages(picked);
      setCropRect(undefined);
    } else {
      setImages(picked);
      setCropRect(undefined);
    }
    setResults([]);
  }, []);

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((p) => p.id !== id));
    setCropRect(undefined);
  };
  const clearImages = () => {
    setImages([]);
    setCropRect(undefined);
    setResults([]);
  };

  const handleCropApply = (c: CropRect) => {
    setCropRect(c);
    setCropFor(null);
  };

  // Determine effective dimensions from preset or custom inputs
  const effectiveDims = useMemo(() => {
    const cw = customWidth ? parseInt(customWidth, 10) : undefined;
    const ch = customHeight ? parseInt(customHeight, 10) : undefined;
    if (mode === 'manual' && selectedPreset) {
      const p = PRESETS.find((x) => x.id === selectedPreset);
      if (p && (p.targetWidth || p.targetHeight)) {
        return { width: cw || p.targetWidth, height: ch || p.targetHeight };
      }
    }
    return { width: cw, height: ch };
  }, [customWidth, customHeight, mode, selectedPreset]);

  const handleCompress = async () => {
    if (images.length === 0) return;
    setIsCompressing(true);
    setError(null);
    setResults([]);
    setProgress(0);
    try {
      const out: CompressionResultItem[] = [];
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const result = await compressImage(img.dataUrl, {
          mode,
          format: 'image/jpeg',
          maxBytes: (targetKB ? parseInt(targetKB, 10) : 0) * 1024 || 102400,
          quality: quality / 100,
          targetWidth: effectiveDims.width,
          targetHeight: effectiveDims.height,
          crop: cropRect,
          preserveAspectRatio: true,
        });
        const reductionPct = img.sizeBytes > 0 ? ((img.sizeBytes - result.blob.size) / img.sizeBytes) * 100 : 0;
        out.push({
          id: uid(),
          sourceId: img.id,
          name: img.name,
          originalUrl: img.dataUrl,
          originalSize: img.sizeBytes,
          originalWidth: result.sourceWidth,
          originalHeight: result.sourceHeight,
          resultUrl: result.url,
          resultBlob: result.blob,
          resultSize: result.blob.size,
          resultWidth: result.width,
          resultHeight: result.height,
          qualityUsed: result.qualityUsed,
          mode,
          reductionPct: Math.max(0, reductionPct),
        });
        setProgress(((i + 1) / images.length) * 100);
        // yield to UI
        await new Promise((r) => setTimeout(r, 10));
      }
      setResults(out);
    } catch (e) {
      setError('Compression failed for one or more images. They may be too large — try fewer or smaller images.');
    } finally {
      setIsCompressing(false);
    }
  };

  const clearResults = () => {
    results.forEach((r) => URL.revokeObjectURL(r.resultUrl));
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-charcoal-radial text-white">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-5 pb-24 space-y-4">
        {/* Mode switcher */}
        <ModeSwitcher mode={mode} onChange={(m) => { setMode(m); setSelectedPreset(null); }} />

        {/* Controls card */}
        <section className="rounded-2xl bg-charcoal-card border-2 border-gold-400 shadow-[0_8px_24px_rgba(0,0,0,0.4)] p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-bronze-tab-active flex items-center justify-center shadow-metallic-sm">
              <Sparkles className="w-4 h-4 text-bronze-50" />
            </div>
            <h2 className="text-sm font-extrabold text-white">
              {mode === 'target' ? 'Target File Size' : 'Manual Quality & Presets'}
            </h2>
          </div>
          <Controls
            mode={mode}
            targetKB={targetKB}
            onTargetKBChange={setTargetKB}
            quality={quality}
            onQualityChange={setQuality}
            selectedPreset={selectedPreset}
            onPresetSelect={setSelectedPreset}
            customWidth={customWidth}
            customHeight={customHeight}
            onCustomWidthChange={setCustomWidth}
            onCustomHeightChange={setCustomHeight}
          />
        </section>

        {/* Action buttons */}
        <ActionButtons
          hasImages={images.length > 0}
          imageCount={images.length}
          isSingle={isSingle}
          isCompressing={isCompressing}
          onPick={handlePickClick}
          onCrop={() => images[0] && setCropFor(images[0])}
          onCompress={handleCompress}
        />

        {/* Selected images */}
        <SelectedImagesBar images={images} onRemove={removeImage} onClear={clearImages} />

        {/* Progress */}
        {isCompressing && (
          <div className="animate-fade-in rounded-2xl bg-charcoal-card border border-gold-400/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-gold-400 animate-pulse" />
              <span className="text-sm font-bold text-white">
                Processing locally… {Math.round(progress)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-charcoal-deep overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-gold-300 to-gold-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="animate-fade-in flex items-start gap-2.5 rounded-2xl bg-red-50 dark:bg-red-900/30 border border-red-300/60 dark:border-red-700/40 p-3.5">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <section className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-extrabold text-white">
                <span className="w-2 h-2 rounded-full bg-cyan-accent animate-pulse-soft" />
                Results ({results.length})
              </h2>
              <button
                onClick={clearResults}
                className="flex items-center gap-1 text-[11px] font-bold text-bronze-300 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            </div>
            <div className="space-y-3">
              {results.map((r) => (
                <ResultCard key={r.id} item={r} onPreview={setPreview} />
              ))}
            </div>
          </section>
        )}

        {/* Footer note */}
        {results.length === 0 && images.length === 0 && !isCompressing && (
          <div className="text-center py-8 animate-fade-in">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-charcoal-card border border-gold-400/50 shadow-metallic items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-gold-400" />
            </div>
            <p className="text-sm font-bold text-white">Ready to compress</p>
            <p className="text-xs text-bronze-300 mt-1 max-w-sm mx-auto">
              Pick an image, choose your mode, and tap compress. Everything runs right here in your browser.
            </p>
          </div>
        )}
      </main>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Modals */}
      {cropFor && (
        <CropModal
          src={cropFor.dataUrl}
          initialCrop={cropRect}
          onApply={handleCropApply}
          onClose={() => setCropFor(null)}
        />
      )}
      <PreviewModal item={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
