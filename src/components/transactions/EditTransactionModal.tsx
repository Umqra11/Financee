"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarIcon, Edit2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { editTransaction } from "@/lib/actions/finance";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  amount: z.string().min(1, { message: "Tutar girmelisiniz." }),
  type: z.enum(["income", "expense"], {
    message: "Lütfen bir tür seçin.",
  }),
  category: z.string().min(1, { message: "Kategori seçmelisiniz." }),
  date: z.date({
    message: "Tarih seçmelisiniz.",
  }),
  note: z.string().optional(),
  payment_method: z.enum(["cash", "credit_card"]).optional(),
});

const categoryLabels: Record<string, string> = {
  maaş: "Maaş",
  diğer_gelir: "Diğer Gelir",
  gıda: "Gıda",
  ulaşım: "Ulaşım",
  faturalar: "Faturalar",
  eğlence: "Eğlence",
  kredi: "Kredi & Borç",
  diğer_gider: "Diğer Gider",
  yatırım: "Yatırım",
  kredi_kartı_ödemesi: "Kredi Kartı Ödemesi",
  market: "Market",
  sağlık: "Sağlık",
};

type EditTransactionType = {
  id: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  description?: string;
  payment_method?: "cash" | "credit_card";
  categories?: { name: string };
};

export function EditTransactionModal({
  transaction,
  onEditSuccess,
}: {
  transaction: EditTransactionType;
  onEditSuccess?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: transaction.amount.toString(),
      type: transaction.type,
      category: transaction.categories?.name || "",
      note: transaction.description || "",
      date: new Date(transaction.date),
      payment_method: transaction.payment_method || "cash",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        amount: transaction.amount.toString(),
        type: transaction.type,
        category: transaction.categories?.name || "",
        note: transaction.description || "",
        date: new Date(transaction.date),
        payment_method: transaction.payment_method || "cash",
      });
    }
  }, [open, transaction, form]);

  const formatLocalDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await editTransaction(transaction.id, {
        amount: Number(values.amount),
        type: values.type,
        category: values.category,
        date: formatLocalDate(values.date),
        note: values.note,
        payment_method: values.payment_method,
      });
      setOpen(false);
      if (onEditSuccess) onEditSuccess();
      toast.success("Başarıyla güncellendi.");
    } catch (error) {
      console.error(error);
      toast.error("Bir hata oluştu. Lütfen tekrar deneyiniz.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-neutral-500 hover:text-blue-600 transition-colors"
        onClick={() => setOpen(true)}
      >
        <Edit2 className="h-4 w-4" />
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 sm:max-w-[425px] w-full rounded-2xl shadow-lg p-6 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 h-6 w-6 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4 mt-2">
              <h2 className="text-lg font-semibold leading-none tracking-tight">
                İşlemi Düzenle
              </h2>
            </div>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tür</FormLabel>
                        <Select
                          onValueChange={(val) => {
                            field.onChange(val);
                            form.setValue("category", "");
                          }}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Tür seçin">
                                {field.value === "income"
                                  ? "Gelir"
                                  : field.value === "expense"
                                    ? "Gider"
                                    : "Tür seçin"}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="income">Gelir</SelectItem>
                            <SelectItem value="expense">Gider</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tutar (₺)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            inputMode="decimal"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Kategori seçin">
                              {categoryLabels[field.value] ||
                                field.value ||
                                "Kategori seçin"}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {form.watch("type") === "income" ? (
                            <>
                              <SelectItem value="maaş">Maaş</SelectItem>
                              <SelectItem value="diğer_gelir">Diğer Gelir</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="gıda">Gıda</SelectItem>
                              <SelectItem value="market">Market</SelectItem>
                              <SelectItem value="ulaşım">Ulaşım</SelectItem>
                              <SelectItem value="faturalar">Faturalar</SelectItem>
                              <SelectItem value="eğlence">Eğlence</SelectItem>
                              <SelectItem value="yatırım">Yatırım</SelectItem>
                              <SelectItem value="kredi">Kredi & Borç</SelectItem>
                              <SelectItem value="kredi_kartı_ödemesi">Kredi Kartı Ödemesi</SelectItem>
                              <SelectItem value="sağlık">Sağlık</SelectItem>
                              <SelectItem value="diğer_gider">Diğer Gider</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("type") === "expense" && (
                  <FormField
                    control={form.control}
                    name="payment_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ödeme Şekli</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Ödeme şekli seçin">
                                {field.value === "credit_card"
                                  ? "Kredi Kartı"
                                  : "Nakit / Banka Kartı"}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">
                              Nakit / Banka Kartı
                            </SelectItem>
                            <SelectItem value="credit_card">
                              Kredi Kartı
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Kredi kartı harcamaları "Toplam Gider" tutarına
                          yansımaz.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Tarih</FormLabel>
                      <div className="flex gap-2">
                        <Popover>
                          <FormControl>
                            <PopoverTrigger
                              className={cn(
                                buttonVariants({ variant: "outline" }),
                                "flex-1 pl-3 text-left font-normal h-10",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "d MMM yyyy", {
                                  locale: tr,
                                })
                              ) : (
                                <span>Tarih seçin</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </PopoverTrigger>
                          </FormControl>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                            />
                          </PopoverContent>
                        </Popover>
                        <Input
                          type="date"
                          className="w-auto min-w-[140px] h-10"
                          value={
                            field.value
                              ? format(field.value, "yyyy-MM-dd")
                              : ""
                          }
                          onChange={(e) => {
                            const d = new Date(e.target.value);
                            if (!isNaN(d.getTime())) field.onChange(d);
                          }}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Not</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="İşlem hakkında kısa bir not..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full mt-4"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Güncelleniyor..." : "Güncelle"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      )}
    </>
  );
}