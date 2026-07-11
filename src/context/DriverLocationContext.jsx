import { createContext, useContext, useEffect, useRef, useState } from 'react';

const DriverLocationContext = createContext({ position: null, error: null });

// Butun haydovchi sessiyasi uchun YAGONA watchPosition manbai — shu orqali
// ham GPS ulashish (useShareLocation), ham order sahifasidagi masofa/ETA
// ko'rsatkichi bitta joylashuv oqimidan foydalanadi (ikkita alohida GPS
// watch ochib batareyani behuda sarflamaslik uchun).
export function DriverLocationProvider({ enabled, children }) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return undefined;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setError(null);
        setPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, updatedAt: Date.now() });
      },
      (err) => setError(err.message || 'Joylashuvni aniqlab bo\'lmadi'),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }
    );

    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [enabled]);

  return (
    <DriverLocationContext.Provider value={{ position, error }}>
      {children}
    </DriverLocationContext.Provider>
  );
}

export const useDriverLocation = () => useContext(DriverLocationContext);
