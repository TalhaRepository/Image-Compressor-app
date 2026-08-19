import { PRESETS } from '@/lib/compress';
import { DimensionPreset } from '@/lib/compress';

interface ControlsProps {
  mode: 'target' | 'manual';
  // target
  targetKB: string;
  onTargetKBChange: (v: string) => void;
  // manual
  quality: number; // 0..100
  onQualityChange: (v: number) => void;
  selectedPreset: string | null;
  onPresetSelect: (id: string | null) => void;
  // shared
  customWidth: string;
  customHeight: string;
  onCustomWidthChange: (v: string) => void;
  onCustomHeightChange: (v: string) => void;
}

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <label className="block text-xs font-bold text-white uppercase tracking-wide mb-1.5">
      {children}
      {hint && <span className="ml-1.5 normal-case font-medium text-bronze-300 opacity-90">{hint}</span>}
    </label>
  );
}

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl bg-charcoal-deep border-2 border-gold-400/50 text-gold-450 text-sm font-bold placeholder:text-bronze-400/50 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30 outline-none transition-all shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]';

export function Controls(props: ControlsProps) {
  return (
    <div className="space-y-5">
      {props.mode === 'target' ? (
        <div className="animate-fade-in space-y-4">
          <div>
            <Label hint="(auto quality + dimensions)">Target KB Limit</Label>
            <div className="relative">
              <input
                type="number"
                min={1}
                value={props.targetKB}
                onChange={(e) => props.onTargetKBChange(e.target.value)}
                className={inputClass + ' pr-12'}
                placeholder="50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-bronze-300 pointer-events-none">KB</span>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {[30, 50, 100, 200, 500].map((kb) => (
                <button
                  key={kb}
                  onClick={() => props.onTargetKBChange(String(kb))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    props.targetKB === String(kb)
                      ? 'bg-bronze-tab-active text-bronze-50 shadow-metallic-pressed'
                      : 'bg-charcoal-soft text-bronze-200 border border-gold-400/30 hover:border-gold-400/60'
                  }`}
                >
                  {kb} KB
                </button>
              ))}
            </div>
          </div>
          <DimensionsInput {...props} />
          <p className="text-[11px] text-bronze-300 leading-relaxed flex items-start gap-1.5">
            <span className="text-gold-400">✦</span>
            <span>Engine auto-adjusts quality & scales dimensions (preserving aspect ratio) to hit your target. Leave dimensions blank for fully automatic sizing.</span>
          </p>
        </div>
      ) : (
        <div className="animate-fade-in space-y-5">
          {/* Quality slider */}
          <div>
            <Label hint={`(${props.quality}%)`}>Quality</Label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={5}
                max={100}
                value={props.quality}
                onChange={(e) => props.onQualityChange(Number(e.target.value))}
                className="flex-1"
                style={{ ['--range-pct' as string]: `${props.quality}%` }}
              />
              <div className="flex-shrink-0 w-14 text-center py-1 rounded-lg bg-charcoal-deep border border-gold-400/40 text-sm font-extrabold text-gold-450 tabular-nums">
                {props.quality}%
              </div>
            </div>
          </div>

          {/* Presets */}
          <div>
            <Label hint="(optional)">Presets</Label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
              {PRESETS.map((p) => (
                <PresetChip
                  key={p.id}
                  preset={p}
                  active={props.selectedPreset === p.id}
                  onClick={() =>
                    props.onPresetSelect(props.selectedPreset === p.id ? null : p.id)
                  }
                />
              ))}
            </div>
          </div>

          <DimensionsInput {...props} />
          <p className="text-[11px] text-bronze-300 leading-relaxed flex items-start gap-1.5">
            <span className="text-gold-400">✦</span>
            <span>Preset or custom dimensions applied first, then compressed at your chosen quality. Preset dims scale to fit while preserving aspect ratio.</span>
          </p>
        </div>
      )}
    </div>
  );
}

function DimensionsInput(props: ControlsProps) {
  return (
    <div>
      <Label hint="(blank = auto, preserve ratio)">Custom Dimensions</Label>
      <div className="flex items-center gap-2.5">
        <div className="flex-1 relative">
          <input
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="Width"
            value={props.customWidth}
            onChange={(e) => props.onCustomWidthChange(e.target.value)}
            className={inputClass + ' pr-8'}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-bronze-300 pointer-events-none">W</span>
        </div>
        <span className="text-bronze-400 font-bold text-lg">×</span>
        <div className="flex-1 relative">
          <input
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="Height"
            value={props.customHeight}
            onChange={(e) => props.onCustomHeightChange(e.target.value)}
            className={inputClass + ' pr-8'}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-bronze-300 pointer-events-none">H</span>
        </div>
      </div>
    </div>
  );
}

function PresetChip({ preset, active, onClick }: { preset: DimensionPreset; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 flex flex-col items-center justify-center gap-0.5 px-3.5 py-2 rounded-xl border-2 transition-all min-w-[84px] ${
        active
          ? 'bg-bronze-tab-active border-gold-400 text-bronze-50 shadow-metallic-pressed scale-[0.98]'
          : 'bg-charcoal-soft border-gold-400/30 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-gold-400/70 hover:scale-[1.02]'
      }`}
    >
      <span className="text-base leading-none">{preset.emoji}</span>
      <span className="text-[11px] font-bold whitespace-nowrap">{preset.short}</span>
    </button>
  );
}
