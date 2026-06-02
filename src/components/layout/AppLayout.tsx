"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { Home, Plus, List, Settings, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { OfflineSyncBanner } from "./OfflineSyncBanner";
import ControlCenter from "./ControlCenter";

const navItems = [
  { name: "Ana Sayfa", href: "/", icon: Home },
  { name: "İşlemler", href: "/transactions", icon: List },
  { name: "Ekle", href: "/add", icon: Plus, featured: true },
  { name: "Düzenli Ödemeler", href: "/subscriptions", icon: Repeat },
  { name: "Ayarlar", href: "/settings", icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [controlCenterOpen, setControlCenterOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-background">
      <OfflineSyncBanner />
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-card px-4 py-8">
        <div className="mb-10 px-4 flex items-center gap-3">
          {/* Uygulama Logosu */}
          <svg viewBox="0 0 28 28" className="w-8 h-8 shrink-0">
            <circle cx="14" cy="14" r="14" fill="#111827" />
            <polygon points="14,6 6,21 22,21" fill="white" />
          </svg>
          <h1
            className="text-2xl font-bold tracking-tight text-primary cursor-pointer select-none"
            onClick={() => setControlCenterOpen(true)}
            title="Kontrol Merkezi"
          >
            Financee
          </h1>
        </div>
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const isFeatured = (item as any).featured;

            if (isFeatured) {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={true}
                  scroll={false}
                  className={cn(
                    "flex items-center justify-center gap-2 px-5 py-3.5 mx-2 rounded-2xl transition-all duration-300",
                    "bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg shadow-violet-500/25",
                    "hover:shadow-violet-500/40 hover:-translate-y-0.5 active:translate-y-0",
                    isActive && "ring-2 ring-violet-300 dark:ring-violet-700"
                  )}
                >
                  <span className="relative flex items-center justify-center w-7 h-7">
                    <svg viewBox="0 0 28 28" className="w-7 h-7">
                      <circle cx="14" cy="14" r="14" fill="#111827" />
                      <polygon points="14,6 6,21 22,21" fill="white" />
                    </svg>
                  </span>
                  <span>Ekle</span>
                </Link>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                scroll={false}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-150",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          {/* Header (Mobile) */}
          <header className="md:hidden flex items-center gap-3 mb-6 pt-2">
            {/* Logo */}
            <svg viewBox="0 0 28 28" className="w-8 h-8 shrink-0">
              <circle cx="14" cy="14" r="14" fill="#111827" />
              <polygon points="14,6 6,21 22,21" fill="white" />
            </svg>
            <h1 className="text-xl font-bold text-primary">Financee</h1>
          </header>
          {children}
        </div>
      </main>

      {/* Gizli Kontrol Merkezi */}
      <ControlCenter
        open={controlCenterOpen}
        onClose={() => setControlCenterOpen(false)}
      />

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-none pb-safe will-change-transform">
        <div className="flex items-center justify-around px-2 py-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const isFeatured = (item as any).featured;

            if (isFeatured) {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={true}
                  scroll={false}
                  className={cn(
                    "flex flex-col items-center justify-center -mt-5",
                    "active:scale-95 transition-transform duration-200"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-14 h-14 rounded-full",
                      "bg-gradient-to-br from-violet-600 to-indigo-600 text-white",
                      "shadow-lg shadow-violet-500/30",
                      isActive && "ring-2 ring-violet-300 dark:ring-violet-700"
                    )}
                  >
                    <span className="relative flex items-center justify-center w-10 h-10">
                      <svg viewBox="0 0 28 28" className="w-10 h-10">
                        <circle cx="14" cy="14" r="14" fill="#111827" />
                        <polygon points="14,6 6,21 22,21" fill="white" />
                      </svg>
                    </span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold mt-1",
                    isActive ? "text-violet-600 dark:text-violet-400" : "text-muted-foreground"
                  )}>
                    {item.name}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                scroll={false}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg min-w-[64px] transition-colors duration-150 active:scale-95",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
