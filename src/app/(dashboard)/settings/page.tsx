"use client";

import React, { useTransition } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop, LogOut, Settings as SettingsIcon } from "lucide-react";
import { logout } from "@/app/(auth)/login/actions";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  const themeOptions = [
    { id: "light", label: "Açık Mod", icon: Sun },
    { id: "dark", label: "Koyu Mod", icon: Moon },
    { id: "system", label: "Sistem", icon: Laptop },
  ];

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ayarlar</h1>
          <p className="text-muted-foreground text-sm">
            Uygulama tercihlerini yönetin ve oturumunuzu kontrol edin.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Görünüm Tercihleri Kartı */}
        <div className="rounded-2xl border bg-card/50 backdrop-blur-md p-6 shadow-sm flex flex-col justify-between min-h-[220px] transition-all hover:shadow-md">
          <div>
            <h2 className="text-lg font-semibold mb-1">Görünüm</h2>
            <p className="text-muted-foreground text-xs mb-6">
              Uygulamanın renk temasını kişiselleştirin.
            </p>
          </div>

          {/* Premium Tema Seçici */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-muted/50 rounded-2xl border">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.id;

              return (
                <button
                  key={option.id}
                  onClick={() => setTheme(option.id)}
                  className={cn(
                    "flex flex-col items-center justify-center py-3.5 px-2 rounded-xl transition-all duration-200 gap-1.5 text-xs font-medium cursor-pointer",
                    isActive
                      ? "bg-background text-foreground shadow-sm scale-100"
                      : "text-muted-foreground hover:bg-background/30 hover:text-foreground/80"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-primary animate-pulse" : "")} />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hesap ve Oturum Kartı */}
        <div className="rounded-2xl border bg-card/50 backdrop-blur-md p-6 shadow-sm flex flex-col justify-between min-h-[220px] transition-all hover:shadow-md">
          <div>
            <h2 className="text-lg font-semibold mb-1">Hesap Tercihleri</h2>
            <p className="text-muted-foreground text-xs mb-4">
              Güvenliğiniz için oturumunuzu dilediğiniz zaman kapatabilirsiniz.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl bg-muted/30 p-3 text-xs text-muted-foreground border">
              <span className="font-semibold text-foreground">Financee v1.0.0</span>
              <br />
              Tüm verileriniz Supabase üzerinde uçtan uca şifrelenmiş olarak saklanır.
            </div>

            {/* Crimson Kırmızısı Çıkış Yap Butonu */}
            <button
              onClick={handleLogout}
              disabled={isPending}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all duration-300 font-medium text-sm text-rose-500 hover:text-white border border-rose-500/20 bg-rose-500/5 hover:bg-rose-600 disabled:opacity-50 cursor-pointer shadow-sm active:scale-[0.98]",
                isPending && "animate-pulse"
              )}
            >
              <LogOut className="w-4 h-4" />
              <span>{isPending ? "Oturum Kapatılıyor..." : "Oturumu Kapat"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
