import { QuickEntryForm } from "@/components/forms/QuickEntryForm";
import { TransactionList } from "@/components/transactions/TransactionList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Hızlı Ekle</CardTitle>
            <CardDescription>Yeni bir gelir veya gider ekleyin.</CardDescription>
          </CardHeader>
          <CardContent>
            <QuickEntryForm />
          </CardContent>
        </Card>
      </section>

      <section>
        <TransactionList />
      </section>
    </div>
  );
}
