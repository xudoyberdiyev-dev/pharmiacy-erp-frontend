import { Box, ChevronLeft } from 'lucide-react';
import { IconBtn, cx } from '../design/ui';

// Mobil ekran sarlavhasi (oq, yopishqoq). Chap: logo yoki "orqaga"; o'rta: sarlavha/izoh; o'ng: amallar.
export default function MobileHeader({ title, subtitle, logo = false, onBack, right, mono = false, className = '' }) {
  return (
    <header className={cx('sticky top-0 z-30 border-b border-slate-100 bg-white', className)}>
      <div className="flex items-center gap-3 px-4 py-3">
        {logo && (
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 text-white shadow-md shadow-teal-200/70" aria-hidden="true">
            <Box size={20} strokeWidth={2.2} />
          </span>
        )}
        {onBack && <IconBtn label="Orqaga" icon={ChevronLeft} tone="plain" size={44} onClick={onBack} className="-ml-2" />}
        <div className="min-w-0 flex-1">
          <h1 className={cx('truncate text-[22px] font-bold leading-tight text-slate-900', onBack && 'text-[20px]')} style={mono ? { fontFamily: "'JetBrains Mono', ui-monospace, monospace" } : undefined}>
            {title}
          </h1>
          {subtitle && <p className="mt-0.5 text-[13px] leading-snug text-slate-600">{subtitle}</p>}
        </div>
        {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
      </div>
    </header>
  );
}
