"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface PullToRefreshProps {
    children: React.ReactNode;
}

export function PullToRefresh({ children }: PullToRefreshProps) {
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const touchStartY = useRef(0);
    const isPulling = useRef(false);

    const THRESHOLD = 80;
    const MAX_PULL = 120;

    const handleTouchStart = useCallback((e: TouchEvent) => {
        const container = containerRef.current;
        if (!container) return;

        // Sadece sayfa en üstteyken pull-to-refresh çalışsın
        const scrollContainer = container.closest(".overflow-y-auto") || window;
        const scrollTop = scrollContainer === window
            ? document.documentElement.scrollTop
            : (scrollContainer as HTMLElement).scrollTop;

        if (scrollTop <= 0) {
            touchStartY.current = e.touches[0].clientY;
            isPulling.current = true;
        }
    }, []);

    const handleTouchMove = useCallback(
        (e: TouchEvent) => {
            if (!isPulling.current || isRefreshing) return;

            const currentY = e.touches[0].clientY;
            const diff = currentY - touchStartY.current;

            // Sadece aşağı çekme (pozitif diff)
            if (diff > 0) {
                const distance = Math.min(diff * 0.5, MAX_PULL);
                setPullDistance(distance);
            }
        },
        [isRefreshing]
    );

    const handleTouchEnd = useCallback(() => {
        if (!isPulling.current) return;
        isPulling.current = false;

        if (pullDistance >= THRESHOLD && !isRefreshing) {
            setIsRefreshing(true);
            setPullDistance(THRESHOLD);

            // Sayfayı yenile
            router.refresh();

            // Kısa bir süre sonra refresh animasyonunu kapat
            setTimeout(() => {
                setIsRefreshing(false);
                setPullDistance(0);
            }, 800);
        } else {
            setPullDistance(0);
        }
    }, [pullDistance, isRefreshing, router]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener("touchstart", handleTouchStart, { passive: true });
        container.addEventListener("touchmove", handleTouchMove, { passive: true });
        container.addEventListener("touchend", handleTouchEnd);

        return () => {
            container.removeEventListener("touchstart", handleTouchStart);
            container.removeEventListener("touchmove", handleTouchMove);
            container.removeEventListener("touchend", handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    return (
        <div ref={containerRef} className="relative">
            {/* Pull indicator */}
            {pullDistance > 0 && (
                <div
                    className="absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                    style={{ top: Math.min(pullDistance - 20, 30) }}
                >
                    <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full bg-primary/90 text-primary-foreground shadow-lg transition-all duration-200 ${pullDistance >= THRESHOLD ? "scale-110" : "scale-75 opacity-70"
                            }`}
                    >
                        <svg
                            className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                        </svg>
                    </div>
                </div>
            )}

            {children}
        </div>
    );
}