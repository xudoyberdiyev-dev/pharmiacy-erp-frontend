import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Truck, Calculator, PackageMinus, Undo2, Info, TriangleAlert, Lock, ArrowRight, PencilLine, Send, X, FileDown,
  User, UserRound,
} from 'lucide-react';
import { documentAPI } from '../../api';
import { getErrorMessage } from '../../lib/errors';
import { C, FONT } from './design/tokens';
import {
  Page, PageHeader, RefreshControl, Card, SearchInput, Badge, TONE, Button, BlankState, ErrorState, SearchEmpty,
  OfflineBanner, Skel, CountChip, notify, RefreshBar, InlineAlert,
} from './design/ui';
import { money, dateTime, time, count } from './lib/format';
import { useOnline, saveBlob } from './lib/hooks';

// ─────────────────────────────────────────────────────────────────────────
// Qaytganlar — 4 toifa bitta sahifada (tab = ?tab=…):
//   driver     — haydovchi yetkaza olmagan (avtomatik Biriktirishga qaytgan)
//   accountant — 1-buxgalter hujjatda xato topib qaytargan (tuzatib qayta yuborish)
//   goods      — qisman qaytarilgan tovarlar (Word hisobot, yana qaytarish)
//   full       — to'liq qaytarilgan (RETURNED) — faqat ko'rish uchun
// ─────────────────────────────────────────────────────────────────────────

const TABS = [
  {
    key: 'driver', label: 'Haydovchidan', icon: Truck, fetch: documentAPI.getReturnedFromDriver,
    placeholder: 'Faktura yoki tashkilot', hint: [Info, C.info.main, 'Bu buyurtmalar avtomatik Biriktirish bo‘limiga qaytgan. Bu yerda — sabab va tarix; qayta haydovchi biriktirish Biriktirish bo‘limida.'],
    grid: 'minmax(130px,160px) minmax(0,1.1fr) minmax(0,1.3fr) 150px 210px',
    heads: ['Faktura · qaytgan vaqt', 'Tashkilot · haydovchi', 'Haydovchi sababi', 'Summa', 'Keyingi qadam'],
    empty: ['Haydovchidan qaytgan buyurtmalar mavjud emas', 'Haydovchi buyurtmani yetkaza olmasa, u shu yerda sababi bilan ko‘rinadi.'],
  },
  {
    key: 'accountant', label: 'Buxgalterdan', icon: Calculator, fetch: documentAPI.getReturnedFromAccountant,
    placeholder: 'Faktura yoki tashkilot', hint: [TriangleAlert, C.warning.main, '1-buxgalter hujjatda xato topib qaytargan. Kerak bo‘lsa summani tuzating va qayta yuboring.'],
    grid: 'minmax(130px,160px) minmax(0,1fr) minmax(0,1.3fr) 180px 290px',
    heads: ['Faktura · qaytarilgan', 'Tashkilot', 'Buxgalter sababi', 'Summa', 'Amallar'],
    empty: ['Buxgalterdan qaytgan buyurtmalar mavjud emas', '1-buxgalter hujjatda xato topib qaytarsa, buyurtma shu yerda ko‘rinadi.'],
  },
  {
    key: 'goods', label: 'Qaytarilgan tovarlar', icon: PackageMinus, fetch: documentAPI.getReturned,
    placeholder: 'Faktura, tashkilot yoki xodim', hint: [Info, C.info.main, 'Buyurtmadan qisman qaytarilgan tovarlar. Hisobotni Word faylida yuklab olish yoki yana tovar qaytarish mumkin.'],
    grid: 'minmax(130px,160px) minmax(0,1fr) minmax(0,1.2fr) 150px 300px',
    heads: ['Faktura', 'Tashkilot · qayd etdi', 'Izoh', 'Summa', 'Amallar'],
    empty: ['Qaytarilgan tovarlar mavjud emas', 'Buyurtmadan qisman tovar qaytarilganda u shu yerda ko‘rinadi.'],
  },
  {
    key: 'full', label: 'To‘liq qaytarilgan', icon: Undo2, fetch: documentAPI.getFullyReturned,
    placeholder: 'Faktura yoki tashkilot', hint: [Lock, C.n600, '«Qaytarilgan» holati — «Bekor qilingan»dan farq qiladi. Xato bo‘lsa, Tarix bo‘limidagi «Tiklash» orqali Biriktirishga qaytarish mumkin.'],
    grid: 'minmax(130px,160px) minmax(0,1fr) minmax(0,1.3fr) 150px 170px',
    heads: ['Faktura · qaytarilgan', 'Tashkilot · kim qaytardi', 'Qaytarish sababi', 'Summa', 'Holat'],
    empty: ['To‘liq qaytarilgan buyurtmalar mavjud emas', 'Safarga tayyor bo‘limida «Butunlay qaytarish» qilingan buyurtmalar shu yerda ko‘rinadi.'],
  },
];
const TAB_KEYS = TABS.map((t) => t.key);

function useTabQuery(tab) {
  return useQuery({
    queryKey: ['document', 'returned', tab.key],
    queryFn: tab.fetch,
    select: (r) => r.data.data || [],
    refetchInterval: 20000,
  });
}

function Who({ icon: Icon, children }) {
  return (
    <span className="dc-ellipsis" style={{ display: 'flex', alignItems: 'center', gap: 4, font: `400 12px/16px ${FONT}`, color: C.n600 }}>
      <Icon size={16} aria-hidden="true" style={{ flex: 'none' }} /> <span className="dc-ellipsis">{children}</span>
    </span>
  );
}

function Reason({ label, text, emptyText = 'Sabab ko‘rsatilmagan' }) {
  return (
    <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <span style={{ font: `500 12px/16px ${FONT}`, color: C.n600 }}>{label}</span>
      <span className="dc-clamp2" title={text || ''} style={{ font: `400 13px/18px ${FONT}`, color: text ? C.n900 : C.n600, overflowWrap: 'anywhere' }}>{text || emptyText}</span>
    </span>
  );
}

// Buxgalterdan qaytgan qator — summani tuzatib qayta yuborish
function AccountantRow({ o, grid, online, busyId, setBusyId }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [tried, setTried] = useState(false);
  const [err, setErr] = useState(null);
  const parsed = Number(draft.replace(/[\s ]/g, '').replace(',', '.'));
  const invalid = editing && !(parsed > 0);
  const mut = useMutation({
    mutationFn: () => documentAPI.resendToAccountant(o.id, editing ? parsed : undefined),
    onMutate: () => setBusyId(o.id),
    onSuccess: () => {
      notify({ title: 'Buxgalterga qayta yuborildi', desc: `${o.invoiceNumber}${editing ? ` · yangi summa ${money(parsed)}` : ''}. Buyurtma ro‘yxatdan chiqdi.` });
      qc.invalidateQueries({ queryKey: ['document'] });
    },
    onError: (e) => setErr(`Yuborib bo‘lmadi: ${getErrorMessage(e)} Kiritilgan summa saqlandi — qayta urinib ko‘ring.`),
    onSettled: () => setBusyId(null),
  });
  const busy = mut.isPending;
  const anyBusy = !!busyId;
  const send = () => { setTried(true); if (invalid) return; setErr(null); mut.mutate(); };
  return (
    <div style={{ borderBottom: `1px solid ${C.n200}`, background: busy ? C.n50 : '#fff' }}>
      <div style={{ display: 'grid', gridTemplateColumns: grid, gap: 16, alignItems: 'center', minHeight: 68, padding: '10px 16px' }}>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="tnum" style={{ font: `600 13px/18px ${FONT}`, color: C.p800, whiteSpace: 'nowrap' }}>{o.invoiceNumber}</span>
          <span className="tnum" style={{ font: `400 12px/16px ${FONT}`, color: C.n600 }}>{dateTime(o.returnedToDocumentAt)}</span>
        </span>
        <span className="dc-ellipsis" title={o.client?.orgName} style={{ font: `500 13px/18px ${FONT}` }}>{o.client?.orgName || '—'}</span>
        <Reason label="Buxgalter sababi" text={o.returnReason} />
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          {editing ? (
            <>
              <span style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                <input
                  autoFocus
                  inputMode="decimal"
                  value={draft}
                  disabled={busy}
                  aria-label={`${o.invoiceNumber} — tuzatilgan summa`}
                  aria-invalid={tried && invalid ? 'true' : undefined}
                  onChange={(e) => { setDraft(e.target.value.replace(/[^\d\s.,]/g, '')); setErr(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') send(); if (e.key === 'Escape') { setEditing(false); setTried(false); } }}
                  className={`dc-input tnum ${tried && invalid ? 'invalid' : ''}`}
                  style={{ paddingRight: 48, textAlign: 'right', fontWeight: 500, borderColor: tried && invalid ? undefined : C.p500 }}
                />
                <span style={{ position: 'absolute', right: 10, font: `400 12px/16px ${FONT}`, color: C.n600 }}>so‘m</span>
              </span>
              <span className="tnum" style={{ font: `400 12px/16px ${FONT}`, color: C.n600 }}>Avval: {money(o.totalAmount)}</span>
            </>
          ) : (
            <span className="tnum" style={{ font: `600 13px/18px ${FONT}` }}>{money(o.totalAmount)}</span>
          )}
        </span>
        <span style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
          {editing ? (
            <Button variant="ghost" size="sm" icon={X} disabled={busy} title="Tuzatishni bekor qilish" onClick={() => { setEditing(false); setTried(false); setErr(null); }}>Bekor</Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              icon={PencilLine}
              offline={!online}
              disabled={!online || anyBusy}
              title="Summani tuzatish"
              aria-label={`Tuzatish: ${o.invoiceNumber}`}
              onClick={() => { setDraft(String(o.totalAmount ?? '').replace('.', ',')); setEditing(true); setTried(false); }}
            >
              Tuzatish
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            icon={Send}
            loading={busy}
            loadingLabel="Yuborilmoqda…"
            offline={!online}
            disabled={!online || (anyBusy && !busy)}
            title="Buxgalterga qayta yuborish"
            aria-label={`Qayta yuborish: ${o.invoiceNumber}`}
            onClick={send}
          >
            Qayta yuborish
          </Button>
        </span>
      </div>
      {tried && invalid && <InlineAlert style={{ margin: '0 16px 12px' }}>Summa 0 dan katta son bo‘lishi kerak.</InlineAlert>}
      {err && <InlineAlert style={{ margin: '0 16px 12px' }}>{err}</InlineAlert>}
    </div>
  );
}

export default function DocumentReturnedPage() {
  const navigate = useNavigate();
  const online = useOnline();
  const [params, setParams] = useSearchParams();
  const tabKey = TAB_KEYS.includes(params.get('tab')) ? params.get('tab') : 'goods';
  const tab = TABS.find((t) => t.key === tabKey);
  const [q, setQ] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [dlErr, setDlErr] = useState(null);

  const queries = {
    driver: useTabQuery(TABS[0]),
    accountant: useTabQuery(TABS[1]),
    goods: useTabQuery(TABS[2]),
    full: useTabQuery(TABS[3]),
  };
  const query = queries[tabKey];
  const list = useMemo(() => query.data || [], [query.data]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter((o) => [o.invoiceNumber, o.client?.orgName, tabKey === 'goods' ? o.returnedGoodsBy?.fullName : null].some((v) => v?.toLowerCase().includes(s)));
  }, [list, q, tabKey]);

  const switchTab = (k) => {
    setQ(''); setDlErr(null);
    setParams({ tab: k });
  };

  const download = async (o) => {
    setDownloading(o.id); setDlErr(null);
    try {
      const res = await documentAPI.downloadReturnReport(o.id);
      saveBlob(res.data, `qaytarilgan-${o.invoiceNumber}.docx`);
      notify({ title: 'Hisobot yuklab olindi', desc: `qaytarilgan-${o.invoiceNumber}.docx` });
    } catch {
      setDlErr(o.id);
    } finally {
      setDownloading(null);
    }
  };

  const loading = query.isLoading;
  const error = query.isError && !query.data;
  const updated = query.dataUpdatedAt ? time(query.dataUpdatedAt, true) : '—';
  const [HintIcon, hintColor, hintText] = tab.hint;

  const renderRow = (o) => {
    if (tabKey === 'accountant') {
      return <AccountantRow key={o.id} o={o} grid={tab.grid} online={online} busyId={busyId} setBusyId={setBusyId} />;
    }
    let date;
    let who = null;
    let reason;
    let actions;
    if (tabKey === 'driver') {
      date = dateTime(o.returnedToDocumentByDriverAt);
      const u = o.returnedToDocumentByDriverUser;
      who = <Who icon={Truck}>{u ? `${u.fullName}${u.phone ? ` · ${u.phone}` : ''}` : 'Haydovchi'}</Who>;
      reason = <Reason label="Haydovchi sababi" text={o.returnReason} />;
      actions = (
        <>
          <Badge {...TONE.warning} icon={Truck}>Haydovchidan</Badge>
          <Button variant="secondary" size="sm" icon={ArrowRight} title="Biriktirish bo‘limida qayta haydovchi biriktirish" aria-label={`Biriktirishga o‘tish: ${o.invoiceNumber}`} onClick={() => navigate('/document')}>
            Biriktirishga o‘tish
          </Button>
        </>
      );
    } else if (tabKey === 'goods') {
      date = null;
      who = <Who icon={User}>{`${o.returnedGoodsBy?.fullName || '—'} · ${dateTime(o.returnedGoodsAt)}`}</Who>;
      reason = <Reason label="Izoh" text={o.returnedGoodsNote} emptyText="Izoh yo‘q" />;
      actions = (
        <>
          <Button variant="secondary" size="sm" icon={PackageMinus} offline={!online} disabled={!online} title="Yana tovar qaytarishni qayd etish" aria-label={`Yana qaytarish: ${o.invoiceNumber}`} onClick={() => navigate(`/document/orders/${o.id}/return`)}>
            Yana qaytarish
          </Button>
          <Button variant="tint" size="sm" icon={FileDown} loading={downloading === o.id} loadingLabel="Yuklanmoqda…" offline={!online} disabled={!online} title="Qaytarish hisobotini .docx yuklab olish" aria-label={`Wordga yuklash: ${o.invoiceNumber}`} onClick={() => download(o)}>
            Wordga yuklash
          </Button>
        </>
      );
    } else {
      date = dateTime(o.fullyReturnedAt);
      who = <Who icon={UserRound}>{o.fullyReturnedBy?.fullName || '—'}</Who>;
      reason = <Reason label="Qaytarish sababi" text={o.fullyReturnedReason} />;
      actions = <Badge {...TONE.warning} icon={Undo2}>Qaytarilgan</Badge>;
    }
    return (
      <div key={o.id} style={{ borderBottom: `1px solid ${C.n200}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: tab.grid, gap: 16, alignItems: 'center', minHeight: 68, padding: '10px 16px' }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="tnum" style={{ font: `600 13px/18px ${FONT}`, color: C.p800, whiteSpace: 'nowrap' }}>{o.invoiceNumber}</span>
            {date && <span className="tnum" style={{ font: `400 12px/16px ${FONT}`, color: C.n600 }}>{date}</span>}
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span className="dc-ellipsis" title={o.client?.orgName} style={{ font: `500 13px/18px ${FONT}` }}>{o.client?.orgName || '—'}</span>
            {who}
          </span>
          {reason}
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            {tabKey === 'goods' && o.originalAmount != null && o.originalAmount !== o.totalAmount && (
              <span className="tnum" style={{ font: `400 12px/16px ${FONT}`, color: C.n600, textDecoration: 'line-through' }}>{money(o.originalAmount)}</span>
            )}
            <span className="tnum" style={{ font: `600 13px/18px ${FONT}` }}>{money(o.totalAmount)}</span>
            {tabKey === 'goods' && o.returnedAmount != null && (
              <span className="tnum" style={{ display: 'flex', alignItems: 'center', gap: 4, font: `500 12px/16px ${FONT}`, color: C.warning.text }}>
                <PackageMinus size={16} aria-hidden="true" /> −{money(o.returnedAmount)}
              </span>
            )}
          </span>
          <span style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>{actions}</span>
        </div>
        {dlErr === o.id && <InlineAlert style={{ margin: '0 16px 12px' }}>Hisobotni yuklab bo‘lmadi. Qayta urinib ko‘ring.</InlineAlert>}
      </div>
    );
  };

  return (
    <Page>
      <PageHeader title="Qaytganlar" description="Qaytarilgan va qayta ishlashni kutayotgan buyurtmalar.">
        <RefreshControl
          label={loading ? 'Yuklanmoqda…' : error ? 'Yangilanmadi' : `${count(list.length)} ta · yangilangan ${updated}`}
          fetching={query.isFetching}
          offline={!online}
          onRefresh={() => query.refetch()}
          title="Faol toifani yangilash"
        />
      </PageHeader>

      {!online && <OfflineBanner at={updated} />}

      <Card style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div role="tablist" aria-label="Qaytganlar toifalari" style={{ display: 'flex', gap: 4, padding: '0 12px', borderBottom: `1px solid ${C.n200}`, overflowX: 'auto' }}>
          {TABS.map((t) => {
            const qy = queries[t.key];
            const on = t.key === tabKey;
            const n = qy.isError && !qy.data ? '!' : qy.isLoading ? '–' : (qy.data?.length ?? 0);
            return (
              <button key={t.key} type="button" role="tab" id={`tab-${t.key}`} aria-selected={on} aria-controls="returned-panel" className="dc-tab" onClick={() => switchTab(t.key)}>
                <t.icon size={16} aria-hidden="true" /> {t.label}
                <CountChip on={on} tone={n === '!' ? 'danger' : undefined}>{n}</CountChip>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${C.n200}`, flexWrap: 'wrap' }}>
          <SearchInput value={q} onChange={setQ} placeholder={tab.placeholder} disabled={loading || error || list.length === 0} style={{ flex: '0 1 380px' }} />
          <span style={{ flex: '1 1 280px', display: 'flex', alignItems: 'flex-start', gap: 8, font: `400 13px/18px ${FONT}`, color: C.n700 }}>
            <HintIcon size={16} aria-hidden="true" style={{ color: hintColor, flex: 'none', marginTop: 1 }} /> {hintText}
          </span>
        </div>

        <div id="returned-panel" role="tabpanel" aria-labelledby={`tab-${tabKey}`} style={{ position: 'relative', minHeight: 360, display: 'flex', flexDirection: 'column', overflowX: 'auto' }}>
          <RefreshBar show={query.isFetching && !loading} />
          {error ? (
            <ErrorState bare title="Ma’lumotni yuklab bo‘lmadi" text={`«${tab.label}» ro‘yxatini serverdan olib bo‘lmadi. Bu bo‘sh ro‘yxat degani emas.`} onRetry={() => query.refetch()} />
          ) : !loading && list.length === 0 ? (
            <BlankState bare icon={tab.icon} tone="neutral" title={tab.empty[0]} text={tab.empty[1]} />
          ) : !loading && filtered.length === 0 ? (
            <SearchEmpty bare text={`«${q}» bo‘yicha «${tab.label}» toifasida buyurtma topilmadi.`} onClear={() => setQ('')} />
          ) : (
            <div style={{ minWidth: 960 }}>
              <div style={{ display: 'grid', gridTemplateColumns: tab.grid, gap: 16, alignItems: 'center', height: 44, padding: '0 16px', background: C.n50, borderBottom: `1px solid ${C.n200}`, font: `600 12px/16px ${FONT}`, color: C.n700 }}>
                {tab.heads.map((h, i) => <span key={h} style={{ textAlign: i >= 3 ? 'right' : 'left' }}>{h}</span>)}
              </div>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="dc-pulse" style={{ display: 'grid', gridTemplateColumns: tab.grid, gap: 16, alignItems: 'center', height: 68, padding: '0 16px', borderBottom: `1px solid ${C.n100}` }}>
                  <span><Skel w="80%" /><Skel w="60%" h={10} bg={C.n100} style={{ marginTop: 8 }} /></span>
                  <span><Skel w={`${55 + (i % 3) * 10}%`} /><Skel w="40%" h={10} bg={C.n100} style={{ marginTop: 8 }} /></span>
                  <span><Skel w="30%" h={10} bg={C.n100} /><Skel w={`${60 + (i % 2) * 15}%`} style={{ marginTop: 8 }} /></span>
                  <Skel w="70%" style={{ justifySelf: 'end' }} />
                  <Skel w={120} h={36} r={7} bg={C.n100} style={{ justifySelf: 'end' }} />
                </div>
              )) : filtered.map(renderRow)}
            </div>
          )}
        </div>
      </Card>
    </Page>
  );
}
