"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

interface SavingTip {
  title: string;
  impact: "Düşük" | "Orta" | "Yüksek";
  description: string;
}

export async function getFinancialAdvice(params: { month: number; year: number }) {
  if (!apiKey) {
    throw new Error("Sistemde API anahtarı bulunamadı. Lütfen yöneticinizle iletişime geçin.");
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    throw new Error("Unauthorized");
  }

  const userId = userData.user.id;

  // Tarih aralığını belirleme (ilgili ayın başı ve sonu)
  const startDate = new Date(Date.UTC(params.year, params.month - 1, 1));
  const endDate = new Date(Date.UTC(params.year, params.month, 1));
  const startStr = startDate.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];

  // 1. İlgili ayın işlemlerini çekelim
  const { data: transactions, error: txError } = await supabase
    .from("transactions")
    .select("amount, type, categories(name)")
    .eq("user_id", userId)
    .gte("date", startStr)
    .lt("date", endStr);

  if (txError) {
    console.error("Error fetching transactions for advice:", txError);
    throw new Error("İşlemler analiz edilirken bir hata oluştu.");
  }

  // Gelir ve giderleri toplayalım
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryExpenses: Record<string, number> = {};

  transactions?.forEach((tx) => {
    const amount = Number(tx.amount);
    if (tx.type === "income") {
      totalIncome += amount;
    } else {
      totalExpense += amount;
      const catName = tx.categories && !Array.isArray(tx.categories) 
        ? tx.categories.name 
        : "Kategorisiz";
      categoryExpenses[catName] = (categoryExpenses[catName] || 0) + amount;
    }
  });

  // 2. Aktif abonelikleri çekelim
  const { data: subscriptions, error: subError } = await supabase
    .from("subscriptions")
    .select("name, amount, billing_period")
    .eq("user_id", userId)
    .eq("status", "active");

  if (subError) {
    console.error("Error fetching subscriptions for advice:", subError);
  }

  const activeSubs = subscriptions || [];
  const totalSubCostMonthly = activeSubs.reduce((sum, sub) => {
    const amt = Number(sub.amount);
    if (sub.billing_period === "yearly") {
      return sum + amt / 12;
    } else if (sub.billing_period === "weekly") {
      return sum + amt * 4.33; // ortalama 1 aydaki hafta sayısı
    }
    return sum + amt;
  }, 0);

  // Verileri yapay zekaya göndereceğimiz özete dönüştürelim
  const financialSummary = {
    period: `${params.month}/${params.year}`,
    totalIncome,
    totalExpense,
    categoryExpenses,
    activeSubscriptionsCount: activeSubs.length,
    activeSubscriptionsDetails: activeSubs.map(s => `${s.name} (${s.amount} ₺/${s.billing_period})`),
    totalMonthlySubscriptionCost: Math.round(totalSubCostMonthly),
  };

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `
Sen kişisel finans yönetiminde uzman, son derece zeki ve profesyonel bir finansal danışman (AI Financial Advisor) yapay zekasısın.
Kullanıcının ${financialSummary.period} dönemine ait finansal verileri aşağıdadır:

- Toplam Gelir: ${financialSummary.totalIncome} ₺
- Toplam Gider: ${financialSummary.totalExpense} ₺
- Kategorik Harcamalar: ${JSON.stringify(financialSummary.categoryExpenses)}
- Aktif Abonelik Sayısı: ${financialSummary.activeSubscriptionsCount}
- Abonelik Detayları: ${JSON.stringify(financialSummary.activeSubscriptionsDetails)}
- Aylık Ortalama Abonelik Gideri: ${financialSummary.totalMonthlySubscriptionCost} ₺

Bu verileri derinlemesine analiz et. Kullanıcının tasarruf yapabilmesi için tamamen Türkçe, yapıcı, gerçekçi, somut ve doğrudan uygulanabilir 3 akıllı tasarruf önerisi sun.
Her öneri için bir başlık (title), tasarruf etki derecesi (impact: "Düşük", "Orta" veya "Yüksek") ve detaylı bir açıklama (description) belirle.
Açıklamalarda kullanıcının kategorik harcamalarına ve aboneliklerine özel atıflarda bulun (örn: "Gıda harcamanız toplam bütçenizin %X'ini oluşturuyor..." veya "X aboneliğiniz aylık şu kadar maliyete sahip...").

Yanıtı sadece ve sadece aşağıdaki şablona uygun bir JSON array olarak döndür. Kesinlikle başka bir açıklama metni veya markdown bloğu yazma, doğrudan saf JSON dön!

JSON Şablonu:
[
  {
    "title": "<Öneri Başlığı>",
    "impact": "Yüksek", 
    "description": "<Detaylı ve kullanıcı verilerine dayalı Türkçe finansal tavsiye açıklaması. En az 2-3 cümle olsun.>"
  },
  {
    "title": "<İkinci Öneri Başlığı>",
    "impact": "Orta",
    "description": "<Açıklama>"
  },
  {
    "title": "<Üçüncü Öneri Başlığı>",
    "impact": "Düşük",
    "description": "<Açıklama>"
  }
]
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // JSON parse işlemi (Eğer AI markdown block ile sararsa temizle)
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedAdvice = JSON.parse(cleanedText) as SavingTip[];

    return { success: true, advice: parsedAdvice };
  } catch (error: any) {
    console.error("AI Advisor Error:", error);
    throw new Error(error.message || "Finansal tavsiyeler üretilirken bir hata oluştu.");
  }
}
