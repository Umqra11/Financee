"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportButton({ data }: { data: any[] }) {
  const handleExport = () => {
    if (!data || data.length === 0) return;

    // Hedeflenen kolonlar: İsim, Kategori, Tutar, Periyot, Sıradaki Ödeme, Bitiş Tarihi
    const headers = ["İsim", "Kategori", "Tutar", "Periyot", "Siradaki Odeme", "Bitis Tarihi"];
    
    const rows = data.map(sub => {
      const cat = sub.categories?.name || sub.category_id || "";
      const isEnded = sub.end_date && new Date(sub.end_date) < new Date();
      const status = isEnded ? "Bitti" : (sub.end_date ? new Date(sub.end_date).toLocaleDateString("tr-TR") : "Suresiz");
      
      return [
        `"${sub.name}"`,
        `"${cat}"`,
        sub.amount,
        sub.frequency,
        new Date(sub.next_payment_date).toLocaleDateString("tr-TR"),
        status
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `abonelikler_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
      <Download className="w-4 h-4" />
      Excel/CSV İndir
    </Button>
  );
}
