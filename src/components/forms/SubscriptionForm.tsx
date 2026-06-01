"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { addSubscription } from "@/lib/actions/subscriptions";
import { Button } from "@/components/ui/button";
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
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır."),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Geçerli bir tutar giriniz.",
  }),
  category: z.string().min(1, "Lütfen kategori seçin."),
  frequency: z.enum(["monthly", "yearly", "weekly"], {
    message: "Lütfen bir periyot seçin.",
  }),
  next_payment_date: z.date({
    message: "İlk ödeme tarihi gereklidir.",
  }),
  payment_method: z.enum(["cash", "credit_card"]),
  end_date: z.date().optional(),
});

export function SubscriptionForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: "",
      category: "",
      frequency: "monthly" as const,
      next_payment_date: new Date(),
      payment_method: "cash" as const,
      end_date: undefined as Date | undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      await addSubscription({
        name: values.name,
        amount: Number(values.amount),
        frequency: values.frequency,
        category: values.category,
        next_payment_date: values.next_payment_date.toISOString(),
        payment_method: values.payment_method,
        end_date: values.end_date ? values.end_date.toISOString() : null,
      });
      form.reset();
      router.refresh();
      alert("Abonelik başarıyla eklendi.");
    } catch (error) {
      console.error(error);
      alert("Hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>İsim / Kurum</FormLabel>
                <FormControl>
                  <Input placeholder="Örn: Netflix, Kredi Taksiti" {...field} />
                </FormControl>
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
                  <Input type="number" step="0.01" inputMode="decimal" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategori</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin">
                        {{
                          entertainment: "Eğlence (Netflix, Spotify vb.)",
                          utilities: "Faturalar (İnternet, Su vb.)",
                          loan: "Kredi & Borç",
                          rent: "Kira",
                          other_expense: "Diğer Düzenli Gider"
                        }[field.value] || "Kategori seçin"}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="entertainment">Eğlence</SelectItem>
                    <SelectItem value="utilities">Faturalar</SelectItem>
                    <SelectItem value="loan">Kredi & Borç</SelectItem>
                    <SelectItem value="rent">Kira</SelectItem>
                    <SelectItem value="other_expense">Diğer</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Periyot</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Periyot seçin">
                        {{
                          weekly: "Haftalık",
                          monthly: "Aylık",
                          yearly: "Yıllık",
                        }[field.value] || "Periyot seçin"}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="weekly">Haftalık</SelectItem>
                    <SelectItem value="monthly">Aylık</SelectItem>
                    <SelectItem value="yearly">Yıllık</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="next_payment_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Sıradaki Ödeme Tarihi</FormLabel>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger render={
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
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
                        </Button>
                      </FormControl>
                    } />
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="date"
                    className="w-auto min-w-[140px] h-10"
                    value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
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
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Bitiş Tarihi (Opsiyonel)</FormLabel>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger render={
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "flex-1 pl-3 text-left font-normal h-10",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "d MMM yyyy", { locale: tr })
                          ) : (
                            <span>Yok (Süresiz)</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    } />
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        disabled={(date) => date <= new Date()}
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="date"
                    className="w-auto min-w-[140px] h-10"
                    value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      const d = new Date(e.target.value);
                      if (!isNaN(d.getTime())) field.onChange(d);
                    }}
                  />
                </div>
                <FormDescription className="text-xs text-muted-foreground">
                  Kredi taksiti gibi bitecek bir ödemeyse son tarihi seçin.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ödeme Şekli</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Ödeme şekli seçin">
                        {field.value === 'credit_card' ? 'Kredi Kartı' : 'Nakit / Banka Kartı'}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cash">Nakit / Banka Kartı</SelectItem>
                    <SelectItem value="credit_card">Kredi Kartı</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs text-muted-foreground">
                  Kredi kartı harcamaları "Toplam Gider" tutarına yansımaz, böylece kart ekstresini ödediğinizde duplikasyon oluşmaz.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

        </div>

        <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
          {isSubmitting ? "Kaydediliyor..." : "Ödemeyi Kaydet"}
        </Button>
      </form>
    </Form>
  );
}
