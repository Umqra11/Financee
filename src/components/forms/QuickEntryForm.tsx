"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import * as React from "react";
import { cn } from "@/lib/utils";
import { addTransaction } from "@/lib/actions/finance";
import { ReceiptScannerButton } from "./ReceiptScannerButton";
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

export function QuickEntryForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      type: "expense",
      category: "",
      note: "",
      date: new Date(),
      payment_method: "cash",
    },
  });

  const formType = form.watch("type");

  React.useEffect(() => {
    form.setValue("category", "");
  }, [formType, form]);

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
      await addTransaction({
        amount: Number(values.amount),
        type: values.type,
        category: values.category,
        date: formatLocalDate(values.date),
        note: values.note,
        payment_method: values.payment_method,
      });
      form.reset({
        amount: "",
        type: values.type,
        category: "",
        note: "",
        date: new Date(),
        payment_method: "cash",
      });
      toast.success("Başarıyla kaydedildi.");
    } catch (error) {
      console.error(error);
      toast.error("Bir hata oluştu. Lütfen tekrar deneyiniz.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tür</FormLabel>
                  <Select
                    onValueChange={field.onChange}
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
                  <div className="flex justify-between items-center h-8">
                    <FormLabel className="m-0">Tutar (₺)</FormLabel>
                    <ReceiptScannerButton
                      compact
                      onScanSuccess={(data) => {
                        form.setValue("type", data.type);
                        setTimeout(() => {
                          form.setValue("amount", data.amount);
                          form.setValue("category", data.category);
                          form.setValue("payment_method", data.payment_method);
                          form.setValue("date", data.date);
                          form.setValue("note", data.note);
                        }, 100);
                      }}
                    />
                  </div>
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
                        {categoryLabels[field.value] || "Kategori seçin"}
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
                      <SelectItem value="cash">Nakit / Banka Kartı</SelectItem>
                      <SelectItem value="credit_card">Kredi Kartı</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Kredi kartı harcamaları "Toplam Gider" tutarına yansımaz,
                    böylece kart ekstresini ödediğinizde duplikasyon oluşmaz.
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
                          format(field.value, "d MMM yyyy", { locale: tr })
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
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="date"
                    className="w-auto min-w-[140px] h-10"
                    value={
                      field.value ? format(field.value, "yyyy-MM-dd") : ""
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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </form>
      </Form>
    </div>
  );
}