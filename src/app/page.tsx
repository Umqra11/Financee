import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react";
import { getTransactions } from "@/lib/actions/finance";

export default async function Home() {
  let totalIncome = 0;
  let totalExpense = 0;
  
  try {
    const transactions = await getTransactions();
    transactions.forEach((tx: any) => {
      const amount = Number(tx.amount);
      if (tx.type === "income") {
        totalIncome += amount;
      } else if (tx.type === "expense") {
        totalExpense += amount;
      }
    });
  } catch (error) {
    console.error(error);
  }

  const balance = totalIncome - totalExpense;

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("tr-TR", {
      style: "currency",
      currency: "TRY",
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Mevcut finansal durumunuzun özeti.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Toplam Bakiye</CardTitle>
            <Wallet className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
            <p className="text-xs text-muted-foreground">
              Tüm zamanların toplam bakiyesi
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <ArrowUpCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{formatCurrency(totalIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Toplam Gider</CardTitle>
            <ArrowDownCircle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">-{formatCurrency(totalExpense)}</div>
          </CardContent>
        </Card>
      </div>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Gelir Gider Grafiği</CardTitle>
            <CardDescription>Aylık harcama trendiniz (Çok yakında!)</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center bg-accent/20 rounded-md">
            <p className="text-sm text-muted-foreground">Grafik Yükleniyor...</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
