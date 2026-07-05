import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsAPI } from '../../api';
import { MapContainer, TileLayer, CircleMarker, Marker, Polyline, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Modal from '../../components/shared/Modal';
import { Map, Truck, ChevronRight, AlertTriangle, CheckCircle2, Phone } from 'lucide-react';
import { format } from 'date-fns';

const carIcon = L.divIcon({
  html: '<div style="font-size:24px;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.55))">🚚</div>',
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function FitBoundsToPoints({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points, { padding: [50, 50] });
    else if (points.length === 1) map.setView(points[0], 12);
  }, [points, map]);
  return null;
}

// Marshrutni haydovchining hozirgi joylashuviga eng yaqin nuqtada ikkiga bo'lish —
// bosib o'tilgan (yashil) va qolgan (ko'k, punktir) qismini alohida chizish uchun
function splitRouteAtCurrent(route, current) {
  if (!route || route.length < 2 || !current) return { traveled: [], remaining: route || [] };
  let minDist = Infinity;
  let minIdx = 0;
  route.forEach(([lat, lon], i) => {
    const d = (lat - current.latitude) ** 2 + (lon - current.longitude) ** 2;
    if (d < minDist) { minDist = d; minIdx = i; }
  });
  return { traveled: route.slice(0, minIdx + 1), remaining: route.slice(minIdx) };
}

function useRoad(origin, destination, enabled) {
  return useQuery({
    queryKey: ['osrm-route', origin?.latitude, origin?.longitude, destination?.latitude, destination?.longitude],
    queryFn: async () => {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const json = await res.json();
      const coords = json.routes?.[0]?.geometry?.coordinates;
      return coords ? coords.map(([lon, lat]) => [lat, lon]) : null;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{label}</p>
      <p className="text-sm font-bold text-gray-800 truncate">{value ?? '—'}</p>
    </div>
  );
}

function OrderDetailModal({ order, onClose }) {
  const hasTracking = !!order.tracking;
  const origin = order.tracking?.origin;
  const current = order.tracking?.current;
  const destination = order.client;

  const { data: road } = useRoad(origin, destination, hasTracking && !!destination?.latitude);

  const points = hasTracking && destination?.latitude
    ? [[origin.latitude, origin.longitude], [destination.latitude, destination.longitude], [current.latitude, current.longitude]]
    : [];

  const { traveled, remaining } = road ? splitRouteAtCurrent(road, current) : { traveled: [], remaining: [] };

  return (
    <Modal title={`Order ${order.invoiceNumber}`} onClose={onClose} wide>
      {hasTracking && destination?.latitude ? (
        <>
          <div className="relative rounded-2xl overflow-hidden border border-gray-100 mb-3" style={{ height: 380 }}>
            <MapContainer center={points[0]} zoom={9} style={{ height: '100%', width: '100%' }}>
              <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <FitBoundsToPoints points={points} />
              {road ? (
                <>
                  <Polyline positions={traveled} pathOptions={{ color: '#10B981', weight: 5, opacity: 0.9 }} />
                  <Polyline positions={remaining} pathOptions={{ color: '#3B82F6', weight: 5, opacity: 0.55, dashArray: '1 10', lineCap: 'round' }} />
                </>
              ) : (
                <Polyline
                  positions={[[origin.latitude, origin.longitude], [destination.latitude, destination.longitude]]}
                  pathOptions={{ color: '#94A3B8', weight: 3, dashArray: '6 6' }}
                />
              )}
              <CircleMarker center={[origin.latitude, origin.longitude]} radius={7} pathOptions={{ color: '#fff', fillColor: '#6B7280', fillOpacity: 1, weight: 2 }}>
                <Tooltip permanent direction="top" offset={[0, -8]} className="!bg-gray-700 !text-white !border-0 !rounded-lg !py-0.5 !px-2 !text-[11px] !font-bold">
                  Chiqish nuqtasi
                </Tooltip>
              </CircleMarker>
              <CircleMarker center={[destination.latitude, destination.longitude]} radius={8} pathOptions={{ color: '#fff', fillColor: '#10B981', fillOpacity: 1, weight: 2 }}>
                <Tooltip permanent direction="top" offset={[0, -10]} className="!bg-green-600 !text-white !border-0 !rounded-lg !py-0.5 !px-2 !text-[11px] !font-bold">
                  🏁 {destination.orgName}
                </Tooltip>
              </CircleMarker>
              <Marker position={[current.latitude, current.longitude]} icon={carIcon}>
                <Tooltip permanent direction="right" offset={[12, 0]} className="!bg-blue-600 !text-white !border-0 !rounded-lg !py-0.5 !px-2 !text-[11px] !font-bold">
                  {order.driver?.fullName} — hozir shu yerda
                </Tooltip>
              </Marker>
            </MapContainer>
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur rounded-xl shadow-sm border border-gray-100 px-3 py-2 flex items-center gap-3 text-[11px] font-bold z-[1000]">
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-green-500 inline-block" /> Bosib o'tildi</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-blue-400 inline-block opacity-60" /> Qolgan yo'l</span>
              <span className="flex items-center gap-1.5">🚚 Haydovchi</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-1">
              <span className="text-green-600">{order.tracking.percentComplete}% bosib o'tildi</span>
              <span>{order.tracking.remainingDistanceKm} km qoldi · ~{order.tracking.etaMinutes} daqiqa</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${order.tracking.percentComplete}%` }} />
            </div>
          </div>
        </>
      ) : (
        <div className="h-32 flex items-center justify-center bg-gray-50 rounded-2xl mb-4 text-gray-400 text-sm text-center px-4">
          Haydovchi hali yo'lga chiqmagan — GPS ma'lumoti yo'q
        </div>
      )}

      {/* To'liq order ma'lumoti */}
      <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-2xl">
        <InfoRow label="Mijoz" value={order.client?.orgName} />
        <InfoRow label="Manzil" value={order.client?.address} />
        <InfoRow label="Shartnoma" value={order.contractNumber} />
        <InfoRow label="Lot" value={order.lotNumber} />
        <InfoRow label="Summasi" value={`${order.totalAmount?.toLocaleString()} so'm`} />
        <InfoRow label="Jo'natilgan vaqt" value={order.dispatchedAt ? format(new Date(order.dispatchedAt), 'dd.MM.yyyy HH:mm') : '—'} />
        <InfoRow label="Haydovchi" value={order.driver?.fullName} />
        <InfoRow label="Mashina" value={`${order.vehicle?.plateNumber || '—'}${order.vehicle?.model ? ' · ' + order.vehicle.model : ''}`} />
      </div>
      {(order.driver?.phone || order.client?.phone) && (
        <div className="flex items-center gap-4 mt-2 px-1 text-xs text-gray-400">
          {order.driver?.phone && <span className="flex items-center gap-1"><Phone size={11} /> Haydovchi: {order.driver.phone}</span>}
          {order.client?.phone && <span className="flex items-center gap-1"><Phone size={11} /> Mijoz: {order.client.phone}</span>}
        </div>
      )}

      {/* Bosqichlar bo'yicha kechikish */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Bosqichlar bo'yicha kechikish</p>
        <div className="space-y-1.5">
          {order.lateStages.map((s) => (
            <div key={s.key} className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">{s.stage}</span>
              {s.late ? (
                <span className="inline-flex items-center gap-1 text-red-600 font-bold text-xs bg-red-50 px-2.5 py-1 rounded-full">
                  <AlertTriangle size={12} /> {s.hoursLate} soat kechikdi
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-green-600 font-bold text-xs bg-green-50 px-2.5 py-1 rounded-full">
                  <CheckCircle2 size={12} /> O'z vaqtida
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

export default function SuperAdminDriversMapPage() {
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['driver-locations'],
    queryFn: () => statsAPI.getDriverLocations(),
    select: (r) => r.data.data,
    refetchInterval: 15000,
  });

  const orders = data || [];
  const onRoad = orders.filter((o) => o.tracking).length;
  const notStarted = orders.length - onRoad;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-100 rounded-2xl flex items-center justify-center">
            <Map size={18} className="text-orange-600" />
          </div>
          Haydovchilar va yetkazib berish
        </h1>
        <p className="text-xs text-gray-400 mt-1 ml-12">Haydovchiga biriktirilgan barcha faol orderlar — bosing va batafsil kuzating</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-orange-50 rounded-2xl p-4">
          <p className="text-3xl font-black text-orange-600">{orders.length}</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Jami faol yetkazib berish</p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4">
          <p className="text-3xl font-black text-blue-600">{onRoad}</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Yo'lda (GPS bor)</p>
        </div>
        <div className="bg-gray-100 rounded-2xl p-4">
          <p className="text-3xl font-black text-gray-600">{notStarted}</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Hali yo'lga chiqmagan</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-white border border-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <Truck size={28} className="mx-auto mb-2 text-gray-300" />
          <p className="text-gray-400 text-sm font-semibold">Hozirda haydovchiga biriktirilgan faol order yo'q</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {orders.map((o) => (
            <button
              key={o.orderId}
              onClick={() => setSelected(o)}
              className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 text-left hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div className="w-11 h-11 bg-orange-100 rounded-2xl flex items-center justify-center shrink-0">
                <Truck size={19} className="text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-black text-sm text-gray-900">{o.invoiceNumber}</span>
                  <span className="text-xs text-gray-400">{o.driver?.fullName} · {o.vehicle?.plateNumber || '—'}</span>
                </div>
                <p className="font-bold text-gray-800 text-sm mt-0.5 truncate">{o.client?.orgName}</p>
                {o.tracking ? (
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden max-w-[220px]">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${o.tracking.percentComplete}%` }} />
                    </div>
                    <span className="text-xs font-bold text-gray-500 shrink-0">{o.tracking.percentComplete}% · {o.tracking.remainingDistanceKm} km qoldi</span>
                  </div>
                ) : (
                  <span className="inline-flex items-center text-xs font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full mt-1.5">
                    Hali yo'lga chiqmagan
                  </span>
                )}
              </div>
              <ChevronRight size={18} className="text-gray-300 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {selected && <OrderDetailModal order={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
