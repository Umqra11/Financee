"use server";

import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const apiKey = process.env.DEEPSEEK_API_KEY;

const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: apiKey || "",
});

interface SavingTip {
  title: string;
  impact: "Düşük" | "Orta" | "Yüksek";
  description: string;
}

/**
 * Exponential backoff ile retry yapan yardımcı fonksiyon.
 * 429 (rate limit) durumunda 3 defaya kadar artan bekleme süreleriyle tekrar dener.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const status = error?.status ?? error?.code;

      // Sadece 429 (rate limit) için retry yap
      if (status === 429 && attempt < maxRetries) {
        const delay = initialDelayMs * Math.pow(2, attempt); // 1s, 2s, 4s
        console.warn(
          `[DeepSeek] Rate limit (429) hit. Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw error; // Diğer hataları hemen fırlat
    }
  }
  throw lastError;
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
    .select("name, amount, frequency")
    .eq("user_id", userId)
    .eq("status", "active");

  if (subError) {
    console.error("Error fetching subscriptions for advice:", subError);
  }

  const activeSubs = subscriptions || [];
  const totalSubCostMonthly = activeSubs.reduce((sum, sub) => {
    const amt = Number(sub.amount);
    if (sub.frequency === "yearly") {
      return sum + amt / 12;
    } else if (sub.frequency === "weekly") {
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
    activeSubscriptionsDetails: activeSubs.map(s => `${s.name} (${s.amount} ₺/${s.frequency})`),
    totalMonthlySubscriptionCost: Math.round(totalSubCostMonthly),
  };

  try {
    const systemPrompt = `Sen kişisel finans yönetiminde uzman, son derece zeki ve profesyonel bir finansal danışman (AI Financial Advisor) yapay zekasısın.`;

    const userPrompt = `
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
]`;

    // Exponential backoff ile retry mekanizması kullan
    const completion = await withRetry(async () => {
      return await openai.chat.completions.create({
        model: "deepseek-v4-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      });
    }, 3, 1000);

    const responseText = completion.choices?.[0]?.message?.content || "";

    // Token kullanımını çıkar
    const usage = completion.usage ?? null;

    // JSON parse işlemi (Eğer AI markdown block ile sararsa temizle)
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedAdvice = JSON.parse(cleanedText) as SavingTip[];

    return {
      success: true,
      advice: parsedAdvice,
      _usage: usage
        ? {
          promptTokens: usage.prompt_tokens ?? 0,
          completionTokens: usage.completion_tokens ?? 0,
          totalTokens: usage.total_tokens ?? 0,
        }
        : null,
    };
  } catch (error: any) {
    console.error("AI Advisor Error:", error);

    const status = error?.status ?? error?.code;

    // 429 rate limit - retry sonrası hala başarısız
    if (status === 429) {
      throw new Error(
        "Şu an sunucuda yoğunluk yaşanmaktadır. Lütfen kısa bir süre sonra tekrar deneyiniz."
      );
    }

    // DeepSeek API hataları
    if (status === 401) {
      throw new Error("API anahtarı geçersiz. Lütfen yöneticinizle iletişime geçin.");
    }

    if (status === 402) {
      throw new Error("Hesap bakiyesi yetersiz. Lütfen hesabınıza bakiye yükleyin.");
    }

    if (status === 503) {
      throw new Error("Servis şu anda kullanılamıyor. Lütfen kısa bir süre sonra tekrar deneyiniz.");
    }

    throw new Error(error.message || "Finansal tavsiyeler üretilirken bir hata oluştu.");
  }
}