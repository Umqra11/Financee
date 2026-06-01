import { QuickEntryForm } from "@/components/forms/QuickEntryForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AddPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card>
        <CardHeader>
          <CardTitle>Hızlı Ekle</CardTitle>
          <CardDescription>Yeni bir gelir veya gider işlemi ekleyin.</CardDescription>
        </CardHeader>
        <CardContent>
          <QuickEntryForm />
        </CardContent>
      </Card>
    </div>
  );
}
