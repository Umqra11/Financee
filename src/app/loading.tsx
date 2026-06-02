"use client";

export default function Loading() {
    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <div className="h-9 w-48 bg-muted animate-pulse rounded-lg" />
                    <div className="h-4 w-64 bg-muted animate-pulse rounded" />
                </div>
                <div className="flex flex-col gap-2 w-[260px] sm:w-[300px]">
                    <div className="h-10 w-full bg-muted animate-pulse rounded-xl" />
                    <div className="h-10 w-full bg-muted animate-pulse rounded-xl" />
                    <div className="h-8 w-full bg-muted animate-pulse rounded-lg" />
                </div>
            </div>

            {/* Progress Bar skeleton */}
            <div className="rounded-xl border bg-card/50 backdrop-blur-sm p-5 space-y-3">
                <div className="flex justify-between">
                    <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-3 w-full bg-muted animate-pulse rounded-full" />
                <div className="h-4 w-48 bg-muted animate-pulse rounded" />
            </div>

            {/* 3 kart skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl border bg-card p-6 space-y-3">
                        <div className="flex justify-between">
                            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                            <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                        </div>
                        <div className="h-8 w-28 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-36 bg-muted animate-pulse rounded" />
                    </div>
                ))}
            </div>

            {/* Grafik skeleton */}
            <div className="rounded-2xl border bg-card/50 p-6 space-y-4">
                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                <div className="h-4 w-64 bg-muted animate-pulse rounded" />
                <div className="h-80 w-full bg-muted/50 animate-pulse rounded-xl" />
            </div>

            {/* Trend skeleton */}
            <div className="rounded-2xl border bg-card/50 p-6 space-y-4">
                <div className="h-6 w-40 bg-muted animate-pulse rounded" />
                <div className="h-4 w-72 bg-muted animate-pulse rounded" />
                <div className="h-80 w-full bg-muted/50 animate-pulse rounded-xl" />
            </div>
        </div>
    );
}