"use client";

import { useEffect, useState } from "react";

export function OfflineSyncBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // İlk bağlantı durumunu kontrol edelim
    setIsOffline(!window.navigator.onLine);

    const handleOnline = () => {
      setIsOffline(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // İnternet geri geldiğinde başarı mesajını 4 saniye sonra kapatalım
  useEffect(() => {
    if (!isOffline && wasOffline) {
      const timer = setTimeout(() => {
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOffline, wasOffline]);

  if (isOffline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] animate-in slide-in-from-top duration-300">
        <div className="bg-rose-500 text-white text-xs font-semibold px-4 py-2 flex items-center justify-center gap-2 shadow-md backdrop-blur-md bg-opacity-95">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-200 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-100"></span>
          </span>
          <span>⚠️ Çevrimdışı moddasınız. İnternet bağlantınızı kontrol edin. Yapılan işlemler yerel olarak tutulacaktır.</span>
        </div>
      </div>
    );
  }

  if (wasOffline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] animate-in fade-in slide-in-from-top out-to-top duration-500">
        <div className="bg-emerald-500 text-white text-xs font-semibold px-4 py-2 flex items-center justify-center gap-2 shadow-md backdrop-blur-md bg-opacity-95">
          <span className="text-base">⚡</span>
          <span>Bağlantı kuruldu! Veriler bulut ile güvenli bir şekilde senkronize ediliyor.</span>
        </div>
      </div>
    );
  }

  return null;
}
