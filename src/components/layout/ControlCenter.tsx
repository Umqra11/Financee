"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Trash2, BarChart3, Activity, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    getTokenStats,
    resetTokenStats,
    type TokenStats,
} from "@/lib/token-counter";

interface ControlCenterProps {
    open: boolean;
    onClose: () => void;
}

function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

function formatTime(iso: string | null): string {
    if (!iso) return "—";
    try {
        return new Intl.DateTimeFormat("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }).format(new Date(iso));
    } catch {
        return "—";
    }
}

export default function ControlCenter({ open, onClose }: ControlCenterProps) {
    const [stats, setStats] = useState<TokenStats>({
        totalRequests: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalTokens: 0,
        lastRequestAt: null,
        recentLogs: [],
    });

    const refresh = useCallback(() => {
        setStats(getTokenStats());
    }, []);

    useEffect(() => {
        if (!open) return;
        refresh();
        // Periyodik yenile (5 saniyede bir)
        const interval = setInterval(refresh, 5000);
        return () => clearInterval(interval);
    }, [open, refresh]);

    if (!open) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed right-0 top-0 z-[201] h-full w-full max-w-lg border-l border-neutral-800 bg-neutral-950 text-neutral-100 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                            <Activity className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold tracking-tight">
                                Kontrol Merkezi
                            </h2>
                            <p className="text-xs text-neutral-500">AI Token İzleyici</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8 text-neutral-500 hover:text-neutral-200"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto px-6 py-5 space-y-6" style={{ maxHeight: "calc(100% - 65px)" }}>
                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
                            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-neutral-500">
                                <Zap className="h-3.5 w-3.5 text-amber-400" />
                                Toplam Token
                            </div>
                            <div className="text-2xl font-bold tabular-nums text-amber-300">
                                {formatNumber(stats.totalTokens)}
                            </div>
                        </div>

                        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
                            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-neutral-500">
                                <BarChart3 className="h-3.5 w-3.5 text-blue-400" />
                                İstek Sayısı
                            </div>
                            <div className="text-2xl font-bold tabular-nums text-blue-300">
                                {formatNumber(stats.totalRequests)}
                            </div>
                        </div>

                        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
                            <div className="mb-1 text-xs font-medium text-neutral-500">
                                Prompt Token
                            </div>
                            <div className="text-lg font-bold tabular-nums text-neutral-200">
                                {formatNumber(stats.totalPromptTokens)}
                            </div>
                        </div>

                        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
                            <div className="mb-1 text-xs font-medium text-neutral-500">
                                Completion Token
                            </div>
                            <div className="text-lg font-bold tabular-nums text-neutral-200">
                                {formatNumber(stats.totalCompletionTokens)}
                            </div>
                        </div>
                    </div>

                    {/* Last Request */}
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <Clock className="h-3.5 w-3.5" />
                        Son istek: {formatTime(stats.lastRequestAt)}
                    </div>

                    {/* Reset Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            resetTokenStats();
                            refresh();
                        }}
                        className="w-full border-neutral-800 text-neutral-400 hover:text-red-400 hover:border-red-800"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Sayaçları Sıfırla
                    </Button>

                    {/* Recent Logs */}
                    <div>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-600">
                            Son İstekler
                        </h3>
                        {stats.recentLogs.length === 0 ? (
                            <p className="py-8 text-center text-xs text-neutral-600">
                                Henüz hiç API isteği yapılmadı.
                            </p>
                        ) : (
                            <div className="overflow-hidden rounded-lg border border-neutral-800">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-neutral-800 bg-neutral-900/50 text-left text-neutral-500">
                                            <th className="px-3 py-2 font-medium">Saat</th>
                                            <th className="px-3 py-2 font-medium">Model</th>
                                            <th className="px-3 py-2 font-medium">Endpoint</th>
                                            <th className="px-3 py-2 font-medium text-right">
                                                Token
                                            </th>
                                            <th className="px-3 py-2 font-medium text-center">
                                                Durum
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.recentLogs.map((log) => (
                                            <tr
                                                key={log.id}
                                                className="border-b border-neutral-800/50 text-neutral-400 hover:bg-neutral-900/30"
                                            >
                                                <td className="px-3 py-2 tabular-nums">
                                                    {formatTime(log.timestamp)}
                                                </td>
                                                <td className="px-3 py-2 font-mono text-neutral-500">
                                                    {log.model}
                                                </td>
                                                <td className="px-3 py-2 font-mono text-neutral-500">
                                                    {log.endpoint}
                                                </td>
                                                <td className="px-3 py-2 text-right tabular-nums">
                                                    {formatNumber(log.totalTokens)}
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    {log.status === "success" ? (
                                                        <span className="inline-block rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-400">
                                                            ✓
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className="inline-block rounded-full bg-red-500/10 px-2 py-0.5 text-red-400"
                                                            title={log.errorMessage}
                                                        >
                                                            ✗
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}