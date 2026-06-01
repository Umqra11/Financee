"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { addTransaction } from "@/lib/actions/finance";
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
});

export function QuickEntryForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      type: "expense",
      category: "",
      note: "",
      date: new Date(),
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await addTransaction({
        amount: Number(values.amount),
        type: values.type,
        category: values.category,
        date: values.date.toISOString(),
        note: values.note,
      });
      form.reset();
      // Yönlendirme ya da başarılı mesajı eklenebilir.
    } catch (error) {
      console.error(error);
      alert("Hata oluştu.");
    }
  }

  return (
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
                <FormLabel>Tutar (₺)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
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

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Tarih</FormLabel>
              <Popover>
                <FormControl>
                  <PopoverTrigger
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(field.value, "PPP", { locale: tr })
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
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                  />
                </PopoverContent>
              </Popover>
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
    </Form>
  );
}
