import { ShieldCheck } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-30 bg-charcoal-card border-b-2 border-gold-400 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2.5">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-gold-300 to-gold-500 flex items-center justify-center shadow-metallic-sm ring-1 ring-gold-400/50">
          <ShieldCheck className="w-5 h-5 text-charcoal" strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] sm:text-sm font-bold text-white leading-tight truncate">
            <span className="mr-1">🔒</span>100% Private — Images Never Leave Your Device
          </p>
          <p className="hidden sm:block text-[11px] text-bronze-300 leading-tight">
            All compression runs locally in your browser
          </p>
        </div>
      </div>
    </header>
  );
}
