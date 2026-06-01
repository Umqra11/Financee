"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format, subDays, subMonths, startOfYear } from "date-fns"
import { tr } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useRouter, useSearchParams } from "next/navigation"

const PRESETS = [
  { label: "Bugün", getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: "Son 7 Gün", getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: "Son 30 Gün", getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: "Son 3 Ay", getValue: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
  { label: "Son 6 Ay", getValue: () => ({ from: subMonths(new Date(), 6), to: new Date() }) },
  { label: "Bu Yıl", getValue: () => ({ from: startOfYear(new Date()), to: new Date() }) },
  { label: "Tüm Zamanlar", getValue: () => ({ from: new Date('2000-01-01'), to: new Date() }) },
]

const parseLocalDate = (dateStr: string) => {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  return new Date(dateStr);
};

const formatLocalDate = (d: Date) => {
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
};

export function PresetDateRangePicker({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')

  const [date, setDate] = React.useState<{ from: Date; to?: Date } | undefined>(() => {
    if (fromParam && toParam) {
      return {
        from: parseLocalDate(fromParam),
        to: parseLocalDate(toParam),
      }
    }
    const now = new Date();
    return {
      from: now,
      to: now,
    }
  })

  // URL parametreleri değiştiğinde state'i güncelle
  React.useEffect(() => {
    if (fromParam && toParam) {
      setDate({
        from: parseLocalDate(fromParam),
        to: parseLocalDate(toParam),
      });
    } else {
      const now = new Date();
      setDate({
        from: now,
        to: now,
      });
    }
  }, [fromParam, toParam]);
  
  const [isOpen, setIsOpen] = React.useState(false)

  // URL'yi güncelle
  const updateUrl = (newDate: { from: Date; to?: Date } | undefined) => {
    setDate(newDate)
    if (newDate?.from && newDate?.to) {
      const fromStr = formatLocalDate(newDate.from)
      const toStr = formatLocalDate(newDate.to)
      const params = new URLSearchParams(searchParams)
      params.set('from', fromStr)
      params.set('to', toStr)
      router.push(`/?${params.toString()}`)
    } else if (!newDate?.from && !newDate?.to) {
      router.push('/')
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger render={
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-[260px] sm:w-[300px] justify-start text-left font-normal tracking-tight rounded-xl shadow-sm border-neutral-200 transition-all hover:bg-neutral-50",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-3 h-4 w-4 text-neutral-500 opacity-70" />
            {date?.from ? (
              date.to ? (
                <span className="text-sm font-medium text-neutral-800">
                  {format(date.from, "d MMM yyyy", { locale: tr })} -{" "}
                  {format(date.to, "d MMM yyyy", { locale: tr })}
                </span>
              ) : (
                <span className="text-sm font-medium text-neutral-800">
                  {format(date.from, "d MMM yyyy", { locale: tr })}
                </span>
              )
            ) : (
              <span className="text-sm">Tarih aralığı seçin</span>
            )}
          </Button>
        } />
        <PopoverContent 
          className="w-auto p-0 rounded-2xl shadow-xl border-neutral-100 bg-white/95 backdrop-blur-md" 
          align="start"
        >
          <div className="flex flex-col sm:flex-row">
            <div className="flex flex-col gap-1 border-r border-neutral-100 p-4 sm:w-48 bg-neutral-50/50 rounded-l-2xl">
              <span className="text-[11px] font-semibold text-neutral-400 mb-2 px-2 uppercase tracking-widest">
                Hızlı Seçim
              </span>
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  className="justify-start text-[13px] font-medium rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50 transition-colors px-3 py-2 h-auto"
                  onClick={() => {
                    updateUrl(preset.getValue())
                    setIsOpen(false)
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            
            <div className="p-4">
              <Calendar
                mode="range"
                defaultMonth={date?.from}
                selected={date as any}
                onSelect={(val) => {
                  setDate(val as any)
                  if (val && (val as any).from && (val as any).to) {
                     updateUrl(val as any)
                     // setIsOpen(false) // Seçildiğinde kapatmak isterseniz
                  }
                }}
                numberOfMonths={2}
                locale={tr}
                className="font-sans"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
