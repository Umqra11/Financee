import { SubscriptionList } from "@/components/subscriptions/SubscriptionList";
import { SubscriptionForm } from "@/components/forms/SubscriptionForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SubscriptionsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Düzenli Ödemeler</h1>
        <p className="text-muted-foreground">Kredilerinizi, taksitlerinizi ve aboneliklerinizi yönetin.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: List */}
        <div className="lg:col-span-2">
          <SubscriptionList />
        </div>

        {/* Right Column: Add Form */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Yeni Ekle</CardTitle>
              <CardDescription>
                Abonelik, taksit veya kredi ödemesi ekleyin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubscriptionForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
