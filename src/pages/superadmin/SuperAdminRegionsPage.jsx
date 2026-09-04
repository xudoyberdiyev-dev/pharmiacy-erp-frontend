import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsAPI } from '../../api';
import { MapPinned, Building2, ChevronDown, Calendar, ArrowRight, Trophy, LandPlot, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { REGIONS, regionLabel } from '../../utils/regions';
import { formatSum } from '../../lib/format';

const PIE_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#06B6D4', '#EC4899', '#6366F1', '#84CC16', '#F97316', '#14B8A6', '#A855F7', '#EAB308', '#64748B'];
const RANK_COLORS = ['bg-amber-400', 'bg-slate-400', 'bg-orange-400'];

function rankColor(i) {
  return RANK_COLORS[i] || 'bg-blue-500';
}

function coverageColor(pct) {
  if (pct >= 70) return '#10B981';
  if (pct >= 40) return '#F59E0B';
  if (pct > 0) return '#F97316';
  return '#EF4444';
}

const RADIAN = Math.PI / 180;
function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, payload }) {
  const pct = Math.round(percent * 100);
  if (pct === 0) return null;

  if (percent >= 0.08) {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={800}>
        {pct}%
      </text>
    );
  }

  const cos = Math.cos(-midAngle * RADIAN);
  const sin = Math.sin(-midAngle * RADIAN);
  const sx = cx + outerRadius * cos;
  const sy = cy + outerRadius * sin;
  const mx = cx + (outerRadius + 18) * cos;
  const my = cy + (outerRadius + 18) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 12;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${my}`} stroke="#94A3B8" fill="none" />
      <text x={ex + (cos >= 0 ? 4 : -4)} y={my} textAnchor={textAnchor} dominantBaseline="central" fontSize={11} fontWeight={700} fill="#374151">
        {regionLabel(payload.region)} {pct}%
      </text>
    </g>
  );
}

const PERIODS = [
  { value: 'all', label: 'Barchasi' },
  { value: 'day', label: 'Kunlik' },
  { value: 'week', label: 'Haftalik' },
  { value: 'month', label: 'Oylik' },
  { value: 'custom', label: 'Sana tanlash' },
];

function periodDescription(period, customRange) {
  if (period === 'day') return 'Bugun yetkazilgan orderlar bo\'yicha';
  if (period === 'week') return 'So\'nggi 7 kunda yetkazilgan orderlar bo\'yicha';
  if (period === 'month') return 'So\'nggi 30 kunda yetkazilgan orderlar bo\'yicha';
  if (period === 'custom' && customRange.start && customRange.end) return `${customRange.start} — ${customRange.end} oralig'ida yetkazilgan orderlar bo'yicha`;
  return 'Barcha vaqt davomida yetkazilgan orderlar bo\'yicha';
}

// ── Top tumanlar — savdo bo'yicha reytingda, "Top 10 mijozlar" bilan bir xil uslubda ──
function TopDistricts({ districts, regionFilterLabel }) {
  const top = [...districts].sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 10);
  const maxAmount = Math.max(1, ...top.map((d) => d.totalAmount));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
          <Trophy size={17} className="text-amber-600" />
        </div>
        <div>
          <h2 className="font-black text-gray-900 text-sm">Top tumanlar/shaharlar</h2>
          <p className="text-xs text-gray-400">Savdo summasi bo'yicha{regionFilterLabel ? ` — ${regionFilterLabel}` : ' (butun O\'zbekiston)'}</p>
        </div>
      </div>

      {top.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          Bu davrda ma'lumot yo'q (klientlarda tuman/shahar kiritilmagan bo'lishi mumkin)
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {top.map((d, i) => {
            const pct = Math.round((d.totalAmount / maxAmount) * 100);
            return (
              <div key={`${d.region}-${d.district}`} className="flex items-center gap-3 py-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 ${rankColor(i)}`}>
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 text-sm truncate">
                    {d.district} <span className="text-gray-400 font-medium">· {regionLabel(d.region)}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden max-w-[160px]">
                      <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] text-gray-400 shrink-0">
                      {d.activeClients}/{d.totalClients} klient · {d.orderCount} ta order
                    </span>
                  </div>
                </div>
                <span className="text-sm font-black text-green-600 shrink-0">{formatSum(d.totalAmount)} so'm</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SuperAdminRegionsPage() {
  const [expanded, setExpanded] = useState(null);
  const [period, setPeriod] = useState('all');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [selectedRegion, setSelectedRegion] = useState('all');

  const handleRegionSelect = (value) => {
    setSelectedRegion(value);
    if (value !== 'all') setExpanded(value);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['regional-stats', period, customRange],
    queryFn: () => statsAPI.getRegional(
      period === 'custom'
        ? (customRange.start && customRange.end ? { startDate: customRange.start, endDate: customRange.end } : {})
        : (period === 'all' ? {} : { period })
    ),
    select: (r) => r.data.data,
  });

  const regions = data || [];
  // Viloyati hali kiritilmagan eski klientlar backendda "UNKNOWN" guruhida keladi —
  // bu sahifada mustaqil hudud sifatida ko'rsatilmaydi (REGIONS ro'yxatida yo'q),
  // lekin umumiy "Jami klientlar" hisobiga kiradi (pastda alohida eslatiladi).
  const knownRegions = regions.filter((r) => r.region !== 'UNKNOWN');
  const unknownRegion = regions.find((r) => r.region === 'UNKNOWN');

  const totalClients = regions.reduce((s, r) => s + r.totalClients, 0);
  const totalActive = regions.reduce((s, r) => s + r.activeClients, 0);
  const avgCoverage = totalClients > 0 ? Math.round((totalActive / totalClients) * 100) : 0;
  const withClients = knownRegions.filter((r) => r.totalClients > 0);
  const best = withClients.length ? withClients.reduce((a, b) => (b.coveragePct > a.coveragePct ? b : a)) : null;
  const worst = withClients.length ? withClients.reduce((a, b) => (b.coveragePct < a.coveragePct ? b : a)) : null;

  const rankedByCoverage = [...withClients].sort((a, b) => b.coveragePct - a.coveragePct);
  const selected = selectedRegion !== 'all' ? regions.find((r) => r.region === selectedRegion) || null : null;
  const selectedRank = selected ? rankedByCoverage.findIndex((r) => r.region === selected.region) + 1 : null;

  const allDistricts = knownRegions.flatMap((r) => r.districts || []);
  const districtsForTop = selectedRegion !== 'all' ? (selected?.districts || []) : allDistricts;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-100 rounded-2xl flex items-center justify-center">
              <MapPinned size={18} className="text-purple-600" />
            </div>
            Hudud tahlili
          </h1>
          <p className="text-xs text-gray-400 mt-1 ml-12">{periodDescription(period, customRange)}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedRegion}
            onChange={(e) => handleRegionSelect(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold border-2 border-gray-100 bg-white focus:outline-none focus:border-blue-400 transition-all cursor-pointer"
          >
            <option value="all">Barcha hududlar</option>
            {REGIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  period === p.value ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl shadow-sm px-3 py-2">
              <Calendar size={15} className="text-blue-500 shrink-0" />
              <input
                type="date"
                className="text-sm font-bold text-gray-700 outline-none bg-transparent cursor-pointer w-[124px]"
                value={customRange.start}
                onChange={(e) => setCustomRange((p) => ({ ...p, start: e.target.value }))}
              />
              <ArrowRight size={13} className="text-gray-300 shrink-0" />
              <input
                type="date"
                className="text-sm font-bold text-gray-700 outline-none bg-transparent cursor-pointer w-[124px]"
                value={customRange.end}
                onChange={(e) => setCustomRange((p) => ({ ...p, end: e.target.value }))}
              />
            </div>
          )}
        </div>
      </div>

      {/* Tanlangan hudud haqida batafsil karta */}
      {selectedRegion !== 'all' && (
        <div className="bg-white rounded-2xl border-2 border-blue-100 shadow-sm p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ background: coverageColor(selected?.coveragePct ?? 0) }}>
                <Building2 size={20} />
              </div>
              <div>
                <p className="font-black text-gray-900">{regionLabel(selectedRegion)}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  {selected ? (
                    <><Trophy size={12} className="text-amber-500" /> Qamrov bo'yicha {rankedByCoverage.length} hududdan {selectedRank}-o'rinda</>
                  ) : "Bu hududda hali klient kiritilmagan"}
                </p>
              </div>
            </div>
            {selected && (
              <div className="flex items-center gap-6 flex-wrap">
                <div className="text-center">
                  <p className="text-2xl font-black" style={{ color: coverageColor(selected.coveragePct) }}>{selected.coveragePct}%</p>
                  <p className="text-[11px] text-gray-400">Qamrov</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-gray-900">{selected.activeClients}/{selected.totalClients}</p>
                  <p className="text-[11px] text-gray-400">Faol klient</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-gray-900">{selected.orderCount}</p>
                  <p className="text-[11px] text-gray-400">Buyurtma soni</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-gray-900">{(selected.districts || []).length}</p>
                  <p className="text-[11px] text-gray-400">Tuman/shahar qamrab olingan</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-green-600">{formatSum(selected.totalAmount)}</p>
                  <p className="text-[11px] text-gray-400">Savdo (so'm)</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KPI qatori — butun O'zbekiston bo'yicha, hudud tanlangan bo'lsa ham doim ko'rinadi */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-2xl p-4">
          <p className="text-3xl font-black text-blue-600">{totalClients}</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Jami klientlar (O'zbekiston){unknownRegion ? ` — ${unknownRegion.totalClients} tasida hudud yo'q` : ''}
          </p>
        </div>
        <div className="bg-green-50 rounded-2xl p-4">
          <p className="text-3xl font-black text-green-600">{avgCoverage}%</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Butun O'zbekiston qamrovi</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-4">
          <p className="text-lg font-black text-emerald-700 truncate">{best ? regionLabel(best.region) : '—'}</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Eng yaxshi qamrov {best ? `(${best.coveragePct}%)` : ''}</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-4">
          <p className="text-lg font-black text-red-600 truncate">{worst ? regionLabel(worst.region) : '—'}</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Eng past qamrov {worst ? `(${worst.coveragePct}%)` : ''}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Foiz pie-diagramma */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-black text-gray-900 text-sm mb-1">Hudud bo'yicha savdo ulushi</h2>
          <p className="text-xs text-gray-400 mb-2">Yetkazilgan orderlar summasi bo'yicha foizli taqsimot</p>
          {isLoading ? (
            <div className="h-72 flex items-center justify-center text-gray-400 text-sm">Yuklanmoqda...</div>
          ) : knownRegions.every((r) => r.totalAmount === 0) ? (
            <div className="h-72 flex items-center justify-center text-gray-400 text-sm">Ma'lumot yo'q</div>
          ) : (
            <ResponsiveContainer width="100%" height={380}>
              <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                <Pie
                  data={knownRegions}
                  dataKey="totalAmount"
                  nameKey="region"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  label={renderPieLabel}
                  labelLine={false}
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {knownRegions.map((r, i) => (
                    <Cell
                      key={r.region}
                      fill={PIE_COLORS[i % PIE_COLORS.length]}
                      fillOpacity={selectedRegion === 'all' || r.region === selectedRegion ? 1 : 0.2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, _name, props) => [`${formatSum(value)} so'm`, regionLabel(props.payload.region)]}
                  contentStyle={{ borderRadius: 12, border: '1px solid #F1F5F9', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top tumanlar/shaharlar — xarita o'rniga: savdo bo'yicha eng kuchli tumanlar reytingi */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-96 flex items-center justify-center text-gray-400 text-sm">
            Yuklanmoqda...
          </div>
        ) : (
          <TopDistricts districts={districtsForTop} regionFilterLabel={selectedRegion !== 'all' ? regionLabel(selectedRegion) : null} />
        )}
      </div>

      {/* Hudud qamrovi — ro'yxat, har biri ochilganda tuman/shahar taqsimoti va klientlar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-1">
          <h2 className="font-black text-gray-900 text-sm flex items-center gap-2">
            <LandPlot size={15} className="text-purple-500" /> Hudud qamrovi
          </h2>
          <p className="text-xs text-gray-400 mb-2">
            Har bir hududdagi klientlardan nechtasi bizdan mahsulot olayotgani (kamida 1 ta yetkazilgan order). 100% — hududdagi barcha klientlar ta'minlangan.
          </p>
        </div>
        {isLoading ? (
          <div className="space-y-2 p-5">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}
          </div>
        ) : knownRegions.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">Ma'lumot yo'q</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {knownRegions.map((r) => {
              const isOpen = expanded === r.region;
              const isSelected = selectedRegion === r.region;
              const color = coverageColor(r.coveragePct);
              const districts = [...(r.districts || [])].sort((a, b) => b.totalAmount - a.totalAmount);
              return (
                <div
                  key={r.region}
                  className={`transition-opacity ${selectedRegion !== 'all' && !isSelected ? 'opacity-50' : ''} ${isSelected ? 'bg-blue-50/50' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => { setExpanded(isOpen ? null : r.region); setSelectedRegion(isOpen ? 'all' : r.region); }}
                    className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: color }}>
                      <Building2 size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-gray-900 text-sm">{regionLabel(r.region)}</p>
                        <span className="text-sm font-black shrink-0" style={{ color }}>{r.coveragePct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden mt-1.5">
                        <div className="h-full rounded-full transition-all" style={{ width: `${r.coveragePct}%`, background: color }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {r.activeClients}/{r.totalClients} klient xarid qilgan · {(r.districts || []).length} ta tuman/shahar · {formatSum(r.totalAmount)} so'm
                      </p>
                    </div>
                    <ChevronDown size={16} className={`text-gray-300 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="bg-gray-50 px-5 pb-4 space-y-4">
                      {/* Tuman/shahar taqsimoti */}
                      {districts.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-gray-400 pt-1 pb-2 flex items-center gap-1.5">
                            <TrendingUp size={12} /> Tuman/shahar bo'yicha taqsimot
                          </p>
                          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
                            {districts.map((d) => (
                              <div key={d.district} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-gray-800 truncate">{d.district}</p>
                                  <p className="text-[11px] text-gray-400">{d.activeClients}/{d.totalClients} klient · {d.orderCount} ta order</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-sm font-black text-green-600">{formatSum(d.totalAmount)} so'm</p>
                                  <p className="text-[11px] font-bold" style={{ color: coverageColor(d.coveragePct) }}>{d.coveragePct}% qamrov</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Klientlar ro'yxati */}
                      {(r.clients || []).length === 0 ? (
                        <p className="text-xs text-gray-400 py-1">Bu hududda klient yo'q</p>
                      ) : (
                        <div>
                          <p className="text-xs font-bold text-gray-400 pb-2">{r.clients.length} ta klient</p>
                          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                            {r.clients.map((c) => (
                              <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-gray-800 truncate">{c.orgName}</p>
                                  <p className="text-xs text-gray-400 truncate">{c.district ? `${c.district} · ` : ''}{c.address} · {c.phone}</p>
                                </div>
                                <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${c.hasOrdered ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                  {c.hasOrdered ? `${c.orderCount} ta order · ${formatSum(c.totalAmount)} so'm` : 'Hali xarid qilmagan'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
