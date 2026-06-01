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

export function QuickEntryForm() {
  const [successMsg, setSuccessMsg] = React.useState(false);

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
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
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
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (error) {
      console.error(error);
      alert("Hata oluştu.");
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
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Tür seçin">
                          {field.value === 'income' ? 'Gelir' : field.value === 'expense' ? 'Gider' : 'Tür seçin'}
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
                    <Input type="number" step="0.01" inputMode="decimal" placeholder="0.00" {...field} />
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
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin">
                        {{
                          salary: "Maaş",
                          investment: "Yatırım",
                          other_income: "Diğer",
                          food: "Gıda",
                          transport: "Ulaşım",
                          utilities: "Faturalar",
                          entertainment: "Eğlence",
                          other_expense: "Diğer"
                        }[field.value] || "Kategori seçin"}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {form.watch("type") === "income" ? (
                      <>
                        <SelectItem value="salary">Maaş</SelectItem>
                        <SelectItem value="investment">Yatırım</SelectItem>
                        <SelectItem value="other_income">Diğer</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="food">Gıda</SelectItem>
                        <SelectItem value="transport">Ulaşım</SelectItem>
                        <SelectItem value="utilities">Faturalar</SelectItem>
                        <SelectItem value="entertainment">Eğlence</SelectItem>
                        <SelectItem value="other_expense">Diğer</SelectItem>
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
                  <FormDescription>
                    Kredi kartı harcamaları "Toplam Gider" tutarına yansımaz, böylece kart ekstresini ödediğinizde duplikasyon oluşmaz.
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

          <Button type="submit" className="w-full">
            Kaydet
          </Button>
        </form>

        {/* Toast Notification */}
        {successMsg && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-300 z-50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <span className="font-medium">İşlem başarıyla eklendi!</span>
          </div>
        )}
      </Form>
    </div>
  );
}
