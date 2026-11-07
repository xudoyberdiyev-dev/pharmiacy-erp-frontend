import { Clock } from 'lucide-react';
import { useNow } from '../hooks/usePickerData';
import { TIMER_TONES, timerState } from '../lib/timer';
import { fmtClock, fmtCountdown } from '../lib/format';
import { ProgressBar, cx } from '../design/ui';

// "18:42" → ikki qism, ikki nuqta ko'tarilgan
function BigDigits({ text, className = '' }) {
  const [a, b] = text.includes(':') ? [text.slice(0, text.lastIndexOf(':')), text.slice(text.lastIndexOf(':') + 1)] : [text, ''];
  return (
    <span className={cx('pk-nums font-extrabold leading-none tracking-tight', className)}>
      {a}
      {b !== '' && <span className="relative -top-[0.06em] mx-[0.04em]">:</span>}
      {b}
    </span>
  );
}

function ariaLeft(t) {
  const ms = t.kind === 'late' ? t.overMs : t.remainingMs;
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m} daqiqa ${s} soniya ${t.kind === 'late' ? 'kechikdi' : 'qoldi'}`;
}

// variant:
//   card  — katta taymer (Bugun kartasi, desktop panel)
//   strip — ixcham chiziq (mobil chek-list sarlavhasi)
export default function TimerBox({ order, variant = 'card', showMeta = true, className = '' }) {
  const now = useNow();
  const t = timerState(order, now);
  if (t.kind === 'idle') return null;

  const tone = TIMER_TONES[t.kind];
  const digits = fmtCountdown(t.kind === 'late' ? t.overMs : t.remainingMs);
  const suffix = t.kind === 'late' ? 'kechikdi' : 'qoldi';
  const barTone = t.kind === 'late' ? 'red' : t.kind === 'warn' ? 'amber' : 'gradient';

  if (variant === 'strip') {
    return (
      <div role="timer" aria-label={ariaLeft(t)} className={cx('flex items-center gap-2.5 rounded-2xl border px-3.5 py-3', tone.box, className)}>
        <Clock size={22} className={cx('shrink-0', tone.icon)} aria-hidden="true" />
        <BigDigits text={digits} className={cx('shrink-0 text-[26px]', tone.text)} />
        <span className={cx('min-w-0 text-[12.5px] font-semibold leading-tight', tone.text)}>
          {suffix}<span className="hidden min-[390px]:inline"> · {tone.label}</span>
        </span>
        <span className="ml-auto shrink-0 whitespace-nowrap text-[12.5px] font-medium text-slate-700">Muddat {fmtClock(order.pickingDeadline)}</span>
      </div>
    );
  }

  return (
    <div role="timer" aria-label={ariaLeft(t)} className={cx('rounded-2xl border p-4', tone.box, className)}>
      <div className="flex items-center justify-between gap-2">
        <span className={cx('flex items-center gap-1.5 text-[14px] font-semibold', tone.text)}>
          <Clock size={17} aria-hidden="true" /> {tone.label}
        </span>
        <span className="text-[13.5px] font-medium text-slate-700">Muddat {fmtClock(order.pickingDeadline)}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <BigDigits text={digits} className={cx('text-[52px] sm:text-[56px] lg:text-[48px]', tone.text)} />
        <span className={cx('text-[16px] font-bold', tone.text)}>{suffix}</span>
      </div>
      <ProgressBar value={t.ratio} tone={barTone} height={8} className="mt-3 !bg-slate-200/80" label="Berilgan vaqt sarflandi" />
      {showMeta && (
        <div className="mt-2 flex items-center justify-between text-[12px] text-slate-600">
          <span>Qabul qilindi {fmtClock(order.pickingStartedAt)}</span>
          <span>Berilgan vaqt {order.pickingDuration} daq</span>
        </div>
      )}
    </div>
  );
}
