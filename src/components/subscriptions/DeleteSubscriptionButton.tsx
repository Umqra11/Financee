'use client';

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteSubscription } from "@/lib/actions/subscriptions";

export function DeleteSubscriptionButton({ id }: { id: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (window.confirm("Bu aboneliği/taksidi silmek istediğinize emin misiniz?")) {
      try {
        await deleteSubscription(id);
        router.refresh();
      } catch (error) {
        console.error(error);
        alert("Silme işlemi başarısız oldu.");
      }
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="p-2 text-muted-foreground hover:text-red-600 transition-colors rounded-md hover:bg-red-50 dark:hover:bg-red-950"
      title="Sil"
    >
      <Trash2 className="w-5 h-5" />
    </button>
  );
}
