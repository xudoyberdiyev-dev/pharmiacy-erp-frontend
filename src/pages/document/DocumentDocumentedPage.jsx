import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentAPI } from '../../api';
import toast from 'react-hot-toast';
import { DEFAULT_ERROR_MESSAGE, getErrorMessage } from '../../lib/errors';
import { format } from 'date-fns';
import {
  FileCheck2, Search, X, CheckSquare, Square, MinusSquare,
  RefreshCw, Building2, Truck, User2, FileSpreadsheet,
  ChevronDown, ChevronRight, Undo2, Package,
} from 'lucide-react';
import DocumentBuilderModal from './DocumentBuilderModal';
import { formatSum } from '../../lib/format';

function EmptyState() {
  return (
    <div className="py-20 text-center">
      <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
        <FileCheck2 size={28} className="text-emerald-200" />
      </div>
      <p className="text-gray-400 text-sm font-medium">Hujjatlashtirish uchun buyurtmalar yo'q</p>
      <p className="text-gray-300 text-xs mt-1">"Chekingdan o'tganlar" bo'limida haydovchi biriktiring</p>
    </div>
  );
}

// Bir xil safarga (haydovchi + mashina + biriktirish vaqti) tegishli
// orderlarni bitta guruhga jamlaydi — shu bilan sahifa "safar" bo'yicha
// akkordion ko'rinishida chiqadi, hammasi bir tekis ro'yxatda aralashib
// ketmaydi.
function groupByTrip(orders) {
  const map = new Map();
  for (const o of orders) {
    const key = `${o.driverId}__${o.vehicleId}__${o.dispatchedAt}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        driver: o.driver,
        vehicle: o.vehicle,
        dispatchedAt: o.dispatchedAt,
        orders: [],
      });
    }
    map.get(key).orders.push(o);
  }
  return [...map.values()].sort((a, b) => new Date(b.dispatchedAt) - new Date(a.dispatchedAt));
}

// ── Bitta safar (trip) akkordion bo'limi ──────────────────────────────────────
function TripGroup({ group, selected, onToggle, onToggleGroup, collapsed, onToggleCollapse }) {
  const ids = group.orders.map(o => o.id);
  const selectedCount = ids.filter(id => selected.includes(id)).length;
  const allSelected = selectedCount === ids.length;
  const someSelected = selectedCount > 0 && !allSelected;
  const totalAmount = group.orders.reduce((s, o) => s + (o.totalAmount || 0), 0);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* Guruh sarlavhasi */}
      <div
        onClick={() => onToggleCollapse(group.key)}
        className="flex items-center gap-3 px-5 py-3.5 bg-gray-50/60 hover:bg-gray-50 cursor-pointer transition-colors select-none"
      >
        <button className="text-gray-400 shrink-0">
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleGroup(ids); }}
          className="text-gray-400 hover:text-emerald-600 transition-colors shrink-0"
          title="Guruhdagi barchasini tanlash"
        >
          {allSelected ? <CheckSquare size={17} className="text-emerald-600" />
            : someSelected ? <MinusSquare size={17} className="text-emerald-600" />
            : <Square size={17} />}
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shrink-0">
            <User2 size={12} className="text-blue-600" />
          </div>
          <span className="text-sm font-bold text-gray-900 truncate">{group.driver?.fullName || '—'}</span>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-gray-500 min-w-0">
          <Truck size={13} className="text-gray-400 shrink-0" />
          <span className="truncate">{group.vehicle?.model} · {group.vehicle?.plateNumber}</span>
        </div>

        <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-600 shrink-0">
          <Package size={11} /> {group.orders.length} ta buyurtma
        </span>

        <span className="ml-auto text-sm font-black text-gray-900 shrink-0">
          {formatSum(totalAmount)} so'm
        </span>
      </div>

      {/* Guruh ichidagi orderlar */}
      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody>
              {group.orders.map(o => {
                const isSel = selected.includes(o.id);
                return (
                  <tr
                    key={o.id}
                    onClick={() => onToggle(o.id)}
                    className={`border-b border-gray-50 last:border-b-0 cursor-pointer transition-colors ${isSel ? 'bg-emerald-50/60 hover:bg-emerald-50' : 'hover:bg-gray-50/70'}`}
                  >
                    <td className="pl-14 pr-3 py-3 w-10" onClick={e => e.stopPropagation()}>
                      <button onClick={() => onToggle(o.id)} className="text-gray-400 hover:text-emerald-600 transition-colors">
                        {isSel ? <CheckSquare size={16} className="text-emerald-600" /> : <Square size={16} />}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-sm font-mono font-bold text-gray-900 w-32">{o.invoiceNumber}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shrink-0">
                          <Building2 size={11} className="text-emerald-600" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800 truncate max-w-[220px]">{o.client?.orgName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right pr-5">
                      <p className="text-sm font-black text-gray-900 whitespace-nowrap">{formatSum(o.totalAmount)}</p>
                      <p className="text-[11px] text-gray-400">so'm</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function DocumentDocumentedPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());

  const { data: orders = [], isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['document', 'awaiting'],
    queryFn: () => documentAPI.getAwaitingDocument(),
    select: r => r.data.data || [],
    refetchInterval: 15000,
  });

  const filtered = orders.filter(o => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return o.invoiceNumber?.toLowerCase().includes(q)
      || o.client?.orgName?.toLowerCase().includes(q)
      || o.driver?.fullName?.toLowerCase().includes(q);
  });

  const groups = useMemo(() => groupByTrip(filtered), [filtered]);

  const selectedOrders = orders.filter(o => selected.includes(o.id));

  const exportMutation = useMutation({
    mutationFn: ({ columns, footer }) => documentAPI.exportExcel(selected, columns, footer),
    onSuccess: (res) => {
      const disposition = res.headers['content-disposition'] || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : 'hujjat.xlsx';
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Hujjat yaratildi va yuklab olindi');
      setSelected([]);
      setShowModal(false);
      qc.invalidateQueries(['document']);
    },
    onError: async (e) => {
      const msg = e.response?.data instanceof Blob
        ? JSON.parse(await e.response.data.text()).message
        : e.response?.data?.message;
      toast.error(msg || DEFAULT_ERROR_MESSAGE);
    },
  });

  const returnMutation = useMutation({
    mutationFn: () => documentAPI.returnToPending(selected),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Buyurtmalar qaytarildi');
      setSelected([]);
      qc.invalidateQueries(['document']);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
  const toggleGroup = (ids) => setSelected(p => {
    const allSelected = ids.every(id => p.includes(id));
    return allSelected ? p.filter(id => !ids.includes(id)) : [...new Set([...p, ...ids])];
  });
  const toggleCollapse = (key) => setCollapsedGroups(p => {
    const next = new Set(p);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
              <FileCheck2 size={16} className="text-emerald-600" />
            </div>
            Hujjatlashtirish
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 ml-10 font-medium">
            {filtered.length} ta order · {groups.length} ta safar · haydovchi biriktirilgan, hujjat kutilmoqda · {dataUpdatedAt ? format(new Date(dataUpdatedAt), 'HH:mm:ss') : '—'}
          </p>
        </div>
        <button
          onClick={() => qc.invalidateQueries(['document', 'awaiting'])}
          className={`w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:border-emerald-300 transition-colors ${isFetching ? 'animate-spin text-emerald-500' : ''}`}
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Faktura, tashkilot yoki haydovchi nomi..."
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm
              focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-emerald-100
              transition-all placeholder:text-gray-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors">
              <X size={12} className="text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Safarlar (akkordion) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Yuklanmoqda...</p>
          </div>
        ) : groups.length === 0 ? (
          <EmptyState />
        ) : (
          groups.map(group => (
            <TripGroup
              key={group.key}
              group={group}
              selected={selected}
              onToggle={toggle}
              onToggleGroup={toggleGroup}
              collapsed={collapsedGroups.has(group.key)}
              onToggleCollapse={toggleCollapse}
            />
          ))
        )}
      </div>

      {/* Sticky selection bar */}
      {selected.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
          <div className="max-w-screen-xl mx-auto px-5 pb-5">
            <div className="pointer-events-auto bg-gray-900 rounded-2xl shadow-2xl shadow-gray-900/30 px-5 py-4 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-4 fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <FileSpreadsheet size={16} className="text-emerald-300" />
                </div>
                <p className="text-sm font-bold text-white">{selected.length} ta buyurtma tanlandi</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelected([])}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/10 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={() => { if (window.confirm(`${selected.length} ta orderni haydovchi/mashinadan qaytarib, "Chekingdan o'tganlar" bo'limiga yubormoqchimisiz?`)) returnMutation.mutate(); }}
                  disabled={returnMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white
                    bg-white/10 hover:bg-white/20 border border-white/10 transition-all disabled:opacity-50"
                >
                  <Undo2 size={15} /> {returnMutation.isPending ? 'Qaytarilmoqda...' : 'Orqaga qaytarish'}
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white
                    bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700
                    shadow-lg shadow-emerald-500/30 transition-all"
                >
                  <FileSpreadsheet size={15} /> Hujjatlashtirish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <DocumentBuilderModal
          orders={selectedOrders}
          onClose={() => setShowModal(false)}
          onConfirm={(columns, footer) => exportMutation.mutate({ columns, footer })}
          loading={exportMutation.isPending}
        />
      )}
    </div>
  );
}
