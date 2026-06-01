"use client";

import React, { useRef, useState, useEffect } from "react";
import { Camera, Loader2, Image, ClipboardPaste, ChevronDown } from "lucide-react";
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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error" | "loading"; text: string } | null>(null);

  // Dışarı tıklayınca menüyü kapat
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const showToast = (type: "success" | "error" | "loading", text: string) => {
    setToastMessage({ type, text });
    if (type !== "loading") {
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Ortak base64 işleme fonksiyonu
  const processBase64 = async (base64Data: string, mimeType: string) => {
    setIsScanning(true);
    showToast("loading", "Fiş okunuyor, lütfen bekleyin... 🤖");

    try {
      const result = await parseReceipt(base64Data, mimeType);
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
      setIsMenuOpen(false);
    }
  };

  // File'dan base64 oku
  const readFileAsBase64 = (file: File): Promise<{ base64Data: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(",")[1];
        resolve({ base64Data, mimeType: file.type });
      };
      reader.onerror = () => reject(new Error("Dosya okunurken hata oluştu."));
    });
  };

  // Kamera / Galeri dosya seçimi
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, inputRef: React.RefObject<HTMLInputElement | null>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { base64Data, mimeType } = await readFileAsBase64(file);
      await processBase64(base64Data, mimeType);
    } catch (error: any) {
      showToast("error", error.message || "Dosya okunurken hata oluştu.");
      setIsScanning(false);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  // Panodan yapıştırma
  const handleClipboardPaste = async () => {
    try {
      // Clipboard API desteği kontrolü
      if (!navigator.clipboard?.read) {
        showToast("error", "Tarayıcınız pano okumayı desteklemiyor. Lütfen galeriden seçin.");
        return;
      }

      const clipboardItems = await navigator.clipboard.read();
      let found = false;

      for (const item of clipboardItems) {
        const imageTypes = item.types.filter((t) => t.startsWith("image/"));
        if (imageTypes.length > 0) {
          const imageType = imageTypes[0];
          const blob = await item.getType(imageType);

          // Blob'u base64'e çevir
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = () => {
              const base64String = reader.result as string;
              resolve(base64String.split(",")[1]);
            };
            reader.onerror = () => reject(new Error("Pano görüntüsü okunamadı."));
          });

          await processBase64(base64Data, imageType);
          found = true;
          break;
        }
      }

      if (!found) {
        showToast("error", "Panoda görüntü bulunamadı. Lütfen bir ekran görüntüsü kopyalayın.");
      }
    } catch (error: any) {
      // Permission denied veya clipboard boş
      if (error.name === "NotAllowedError") {
        showToast("error", "Pano erişimi reddedildi. Lütfen izin verin veya galeriden seçin.");
      } else {
        showToast("error", "Panodan okunurken hata oluştu.");
      }
    }
    setIsMenuOpen(false);
  };

  // Compact modda: küçük buton + dropdown
  if (compact) {
    return (
      <div ref={menuRef} className="relative shrink-0">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          onChange={(e) => handleFileChange(e, cameraInputRef)}
          className="hidden"
        />
        <input
          type="file"
          accept="image/*"
          ref={galleryInputRef}
          onChange={(e) => handleFileChange(e, galleryInputRef)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          disabled={isScanning}
          className={cn(
            "h-7 px-2 text-xs rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-medium flex items-center justify-center gap-0.5 shrink-0 transition-colors duration-150",
            isScanning && "opacity-50"
          )}
        >
          {isScanning ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <>
              <Camera className="w-3 h-3" />
              <span>Yapay Zeka</span>
              <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
            </>
          )}
        </button>

        {isMenuOpen && !isScanning && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 z-50 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 py-1 min-w-[180px]">
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                cameraInputRef.current?.click();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150"
            >
              <Camera className="w-3.5 h-3.5 text-blue-500" />
              <span>Kamera ile Çek</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                galleryInputRef.current?.click();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150"
            >
              <Image className="w-3.5 h-3.5 text-green-500" />
              <span>Galeriden Seç</span>
            </button>
            <button
              type="button"
              onClick={handleClipboardPaste}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-purple-500" />
              <span>Panodan Yapıştır</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Full modda: büyük buton + dropdown
  return (
    <div ref={menuRef} className="relative">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraInputRef}
        onChange={(e) => handleFileChange(e, cameraInputRef)}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*"
        ref={galleryInputRef}
        onChange={(e) => handleFileChange(e, galleryInputRef)}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        className={cn(
          "h-10 px-6 mx-auto flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium rounded-full transition-all shadow-sm relative text-sm"
        )}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        disabled={isScanning}
      >
        {isScanning ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Okunuyor...</span>
          </>
        ) : (
          <>
            <Camera className="w-4 h-4" />
            <span>Fiş / Fatura Tara</span>
            <ChevronDown className="w-3.5 h-3.5 ml-1" />
          </>
        )}
      </Button>

      {isMenuOpen && !isScanning && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 py-1.5 min-w-[200px]">
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              cameraInputRef.current?.click();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150"
          >
            <Camera className="w-4 h-4 text-blue-500" />
            <div className="text-left">
              <div className="font-medium">Kamera ile Çek</div>
              <div className="text-[10px] text-zinc-400">Fişin fotoğrafını çek</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              galleryInputRef.current?.click();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150"
          >
            <Image className="w-4 h-4 text-green-500" />
            <div className="text-left">
              <div className="font-medium">Galeriden Seç</div>
              <div className="text-[10px] text-zinc-400">Kayıtlı ekran görüntüsü</div>
            </div>
          </button>
          <button
            type="button"
            onClick={handleClipboardPaste}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150"
          >
            <ClipboardPaste className="w-4 h-4 text-purple-500" />
            <div className="text-left">
              <div className="font-medium">Panodan Yapıştır</div>
              <div className="text-[10px] text-zinc-400">Kopyalanan görüntüyü kullan</div>
            </div>
          </button>
        </div>
      )}

      {/* Local Custom Toast for Scanner */}
      {toastMessage && (
        <div
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-300 z-[60] ${toastMessage.type === "success"
              ? "bg-green-500 text-white"
              : toastMessage.type === "error"
                ? "bg-red-500 text-white"
                : "bg-blue-500 text-white"
            }`}
        >
          {toastMessage.type === "loading" && <Loader2 className="w-5 h-5 animate-spin" />}
          {toastMessage.type === "success" && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {toastMessage.type === "error" && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className="font-medium whitespace-nowrap">{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}