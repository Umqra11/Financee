"use client";

// ---------------------------------------------------------------------------
// Token Counter — In-memory + localStorage hibrit sayaç
// Hem client hem server ortamında çalışabilir (localStorage yalnızca client)
// ---------------------------------------------------------------------------

const STORAGE_KEY = "financee_token_stats";

export interface TokenLogEntry {
    id: string;
    timestamp: string;
    model: string;
    endpoint: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    status: "success" | "error";
    errorMessage?: string;
}

export interface TokenStats {
    totalRequests: number;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    lastRequestAt: string | null;
    recentLogs: TokenLogEntry[];
}

let memoryStats: TokenStats = {
    totalRequests: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalTokens: 0,
    lastRequestAt: null,
    recentLogs: [],
};

const MAX_LOGS = 50;

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function persist() {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStats));
    } catch {
        // localStorage dolu veya erişilemez — sessizce geç
    }
}

function loadFromStorage() {
    if (typeof window === "undefined") return;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as TokenStats;
            if (
                typeof parsed.totalTokens === "number" &&
                Array.isArray(parsed.recentLogs)
            ) {
                memoryStats = parsed;
            }
        }
    } catch {
        // Bozuk veri — sıfırdan başla
    }
}

// İlk yüklemede localStorage'dan oku (client-only)
if (typeof window !== "undefined") {
    loadFromStorage();
}

/**
 * API çağrısı sonrası token kullanımını kaydeder.
 * Hem başarılı hem hatalı çağrılar için kullanılabilir.
 */
export function trackTokens(params: {
    model: string;
    endpoint: string;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    status?: "success" | "error";
    errorMessage?: string;
}): TokenLogEntry {
    const {
        model,
        endpoint,
        promptTokens = 0,
        completionTokens = 0,
        totalTokens = promptTokens + completionTokens,
        status = "success",
        errorMessage,
    } = params;

    const entry: TokenLogEntry = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        model,
        endpoint,
        promptTokens,
        completionTokens,
        totalTokens,
        status,
        errorMessage,
    };

    memoryStats.totalRequests++;
    memoryStats.totalPromptTokens += promptTokens;
    memoryStats.totalCompletionTokens += completionTokens;
    memoryStats.totalTokens += totalTokens;
    memoryStats.lastRequestAt = entry.timestamp;
    memoryStats.recentLogs.unshift(entry);

    if (memoryStats.recentLogs.length > MAX_LOGS) {
        memoryStats.recentLogs = memoryStats.recentLogs.slice(0, MAX_LOGS);
    }

    persist();
    return entry;
}

/**
 * Mevcut token istatistiklerini döner.
 */
export function getTokenStats(): TokenStats {
    loadFromStorage();
    return { ...memoryStats, recentLogs: [...memoryStats.recentLogs] };
}

/**
 * Tüm sayaçları sıfırlar.
 */
export function resetTokenStats(): void {
    memoryStats = {
        totalRequests: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalTokens: 0,
        lastRequestAt: null,
        recentLogs: [],
    };
    persist();
}

/**
 * API yanıtındaki usage nesnesinden token bilgilerini çıkarır.
 * OpenAI formatı: { prompt_tokens, completion_tokens, total_tokens }
 */
export function extractUsageFromResponse(
    usage: Record<string, unknown> | undefined,
): { promptTokens: number; completionTokens: number; totalTokens: number } {
    if (!usage) return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    return {
        promptTokens: (usage.prompt_tokens as number) ?? 0,
        completionTokens: (usage.completion_tokens as number) ?? 0,
        totalTokens: (usage.total_tokens as number) ?? 0,
    };
}