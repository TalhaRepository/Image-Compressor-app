import { Target, SlidersHorizontal } from 'lucide-react';

export type Mode = 'target' | 'manual';

interface ModeSwitcherProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

export function ModeSwitcher({ mode, onChange }: ModeSwitcherProps) {
  return (
    <div className="relative flex p-1 rounded-2xl bg-charcoal-card shadow-metallic-sm border border-gold-400/40">
      <button
        onClick={() => onChange('target')}
        className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-bold transition-all duration-300 ${
          mode === 'target'
            ? 'bg-bronze-tab-active text-bronze-50 shadow-metallic-pressed'
            : 'text-bronze-200 hover:text-white'
        }`}
      >
        <Target className="w-4 h-4" strokeWidth={2.2} />
        <span className="whitespace-nowrap">Target KB <span className="hidden sm:inline opacity-80">Mode (Auto)</span></span>
      </button>
      <button
        onClick={() => onChange('manual')}
        className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-bold transition-all duration-300 ${
          mode === 'manual'
            ? 'bg-bronze-tab-active text-bronze-50 shadow-metallic-pressed'
            : 'text-bronze-200 hover:text-white'
        }`}
      >
        <SlidersHorizontal className="w-4 h-4" strokeWidth={2.2} />
        <span className="whitespace-nowrap">Manual / Preset <span className="hidden sm:inline opacity-80">Mode</span></span>
      </button>
    </div>
  );
}
