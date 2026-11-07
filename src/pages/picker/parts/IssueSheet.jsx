import { useEffect, useState } from 'react';
import { Btn, Radio, Sheet, cx } from '../design/ui';
import { ISSUE_TYPES } from '../lib/labels';

// "Muammo bildirish": pozitsiya (yoki umumiy) + tur + izoh → operator/adminga bildirishnoma boradi.
export default function IssueSheet({ open, onClose, items, defaultItemId = '', onSubmit, submitting }) {
  const [itemId, setItemId] = useState('');
  const [type, setType] = useState('NOT_FOUND');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) { setItemId(defaultItemId || ''); setType('NOT_FOUND'); setNote(''); }
  }, [open, defaultItemId]);

  const selected = ISSUE_TYPES.find((t) => t.id === type);
  const needsNote = !!selected?.needsNote;
  const canSubmit = !submitting && (!needsNote || note.trim().length > 0);

  return (
    <Sheet
      open={open} onClose={onClose} labelledBy="pk-issue-title"
      title="Muammo bildirish"
      subtitle="Pozitsiya va muammo turini tanlang — operatorga xabar boradi."
      footer={(
        <div className="grid grid-cols-2 gap-3">
          <Btn variant="secondary" size="lg" onClick={onClose}>Bekor qilish</Btn>
          <Btn variant="primary" size="lg" loading={submitting} disabled={!canSubmit} onClick={() => onSubmit({ itemId: itemId || undefined, type, note: note.trim() || undefined })}>
            Bildirish
          </Btn>
        </div>
      )}
    >
      <div className="space-y-4 pb-2 pt-2">
        <div>
          <label htmlFor="pk-issue-item" className="mb-1.5 block text-[14px] font-semibold text-slate-700">Pozitsiya</label>
          <select
            id="pk-issue-item" value={itemId} onChange={(e) => setItemId(e.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[15px] text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Umumiy muammo (butun buyurtma)</option>
            {items.map((it) => <option key={it.id} value={it.id}>{it.lineNo}. {it.name}</option>)}
          </select>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-[14px] font-semibold text-slate-700">Muammo turi</legend>
          <div className="space-y-2">
            {ISSUE_TYPES.map((t) => {
              const active = t.id === type;
              return (
                <label
                  key={t.id}
                  className={cx(
                    'flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3.5 text-[15.5px] text-slate-900 transition-colors',
                    active ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50',
                  )}
                >
                  <input type="radio" name="pk-issue-type" className="sr-only" checked={active} onChange={() => setType(t.id)} />
                  <Radio checked={active} tone="blue" />
                  {t.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="pk-issue-note" className="mb-1.5 block text-[14px] font-semibold text-slate-700">
            Izoh <span className="font-normal text-slate-500">(«Boshqa sabab»da majburiy)</span>
          </label>
          <textarea
            id="pk-issue-note" rows={2} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)}
            placeholder="Masalan: javonda yo'q, ombordan so'raldi"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>
    </Sheet>
  );
}
