"use client";

import React, { useRef, useState } from "react";
import { Camera, Loader2, Upload } from "lucide-react";
import { parseReceipt } from "@/lib/actions/ai";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReceiptScannerProps {
  compact?: boolean;
  onScanSuccess: (data: {
    amount: string;
    type: "income" | "expense";
    category: string;
    payment_method: "cash" | "credit_card";
    date: Date;
    note: string;
  }) => void;
}

export function ReceiptScannerButton({ onScanSuccess, compact }: ReceiptScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error" | "loading", text: string } | null>(null);

  const showToast = (type: "success" | "error" | "loading", text: string) => {
    setToastMessage({ type, text });
    if (type !== "loading") {
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    showToast("loading", "Fiş okunuyor, lütfen bekleyin... 🤖");

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(",")[1];
        
        try {
          const result = await parseReceipt(base64Data, file.type);
          if (result.success && result.data) {
            showToast("success", "Fiş başarıyla okundu!");
            
            let parsedDate = new Date();
            if (result.data.date) {
              const d = new Date(result.data.date);
              if (!isNaN(d.getTime())) parsedDate = d;
            }

            onScanSuccess({
              amount: result.data.amount?.toString() || "",
              type: result.data.type === "income" ? "income" : "expense",
              category: result.data.category || "",
              payment_method: result.data.payment_method === "credit_card" ? "credit_card" : "cash",
              date: parsedDate,
              note: result.data.note || "",
            });
          }
        } catch (error: any) {
          showToast("error", error.message || "Fiş okunurken bir hata oluştu.");
        } finally {
          setIsScanning(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };
      
      reader.onerror = () => {
        showToast("error", "Dosya okunurken hata oluştu.");
        setIsScanning(false);
      };

    } catch (error) {
      showToast("error", "Beklenmeyen bir hata oluştu.");
      setIsScanning(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        type="button"
        variant={compact ? "ghost" : "outline"}
        className={cn(
          compact
            ? "h-7 px-2 text-xs rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-medium flex items-center justify-center gap-1 shrink-0"
            : "h-10 px-6 mx-auto flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium rounded-full transition-all shadow-sm relative text-sm"
        )}
        onClick={() => fileInputRef.current?.click()}
        disabled={isScanning}
      >
        {isScanning ? (
          <>
            <Loader2 className={cn(compact ? "w-3 h-3 animate-spin" : "w-4 h-4 animate-spin")} />
            <span>{compact ? "..." : "Okunuyor..."}</span>
          </>
        ) : (
          <>
            <Camera className={cn(compact ? "w-3 h-3" : "w-4 h-4")} />
            <span>{compact ? "Yapay Zeka" : "Fiş / Fatura Tara"}</span>
          </>
        )}
      </Button>

      {/* Local Custom Toast for Scanner */}
      {toastMessage && (
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-300 z-[60] ${
          toastMessage.type === "success" ? "bg-green-500 text-white" :
          toastMessage.type === "error" ? "bg-red-500 text-white" :
          "bg-blue-500 text-white"
        }`}>
          {toastMessage.type === "loading" && <Loader2 className="w-5 h-5 animate-spin" />}
          {toastMessage.type === "success" && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
          {toastMessage.type === "error" && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
          <span className="font-medium whitespace-nowrap">{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
