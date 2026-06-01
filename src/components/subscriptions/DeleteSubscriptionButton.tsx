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
      type="button"
      onClick={handleDelete}
      className="p-2 text-neutral-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-500 transition-colors cursor-pointer rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-800"
      title="Sil"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
