import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const apiKey = process.env.DEEPSEEK_API_KEY;

function getOpenAIClient() {
    if (!apiKey) {
        throw new Error("DEEPSEEK_API_KEY environment variable is not set");
    }
    return new OpenAI({
        baseURL: "https://api.deepseek.com",
        apiKey: apiKey,
    });
}

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

async function getFinancialContext(userId: string) {
    const supabase = await createClient();
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;

    const startDate = new Date(Date.UTC(y, m - 1, 1));
    const endDate = new Date(Date.UTC(y, m, 1));
    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    // Bu ay işlemleri
    const { data: transactions } = await supabase
        .from("transactions")
        .select("amount, type, categories(name), payment_method")
        .eq("user_id", userId)
        .gte("date", startStr)
        .lt("date", endStr);

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryExpenses: Record<string, number> = {};

    transactions?.forEach((tx) => {
        const amount = Number(tx.amount);
        const rawCat =
            tx.categories && !Array.isArray(tx.categories)
                ? tx.categories.name
                : "Kategorisiz";

        if (tx.type === "income") {
            totalIncome += amount;
        } else {
            // Kredi kartı işlemlerini ve kredi/borç kategorilerini bütçe hesaplamasına dahil etme
            const isCreditCard = tx.payment_method === "credit_card";
            const isExcludedCategory =
                rawCat === "kredi" || rawCat === "kredi_kartı_ödemesi" || rawCat === "sağlık";

            if (!isCreditCard && !isExcludedCategory) {
                totalExpense += amount;
            }

            // Kategori harcamalarına kredi/borç kategorilerini ekleme
            if (!isExcludedCategory) {
                categoryExpenses[rawCat] =
                    (categoryExpenses[rawCat] || 0) + amount;
            }
        }
    });

    // Genel bütçe
    const { data: budgets } = await supabase
        .from("budgets")
        .select("amount")
        .eq("user_id", userId)
        .is("category_id", null)
        .eq("period", "monthly")
        .lt("start_date", endStr)
        .gte("end_date", startStr)
        .limit(1);

    const budgetAmount = budgets?.[0]?.amount
        ? Number(budgets[0].amount)
        : 0;

    // Aktif abonelikler
    const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("name, amount, frequency, next_billing_date")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("next_billing_date", { ascending: true })
        .limit(5);

    const subs = subscriptions || [];
    const totalSubCostMonthly = subs.reduce((sum, sub) => {
        const amt = Number(sub.amount);
        if (sub.frequency === "yearly") return sum + amt / 12;
        if (sub.frequency === "weekly") return sum + amt * 4.33;
        return sum + amt;
    }, 0);

    // Ay bitimine kalan gün
    const lastDayOfMonth = new Date(y, m, 0).getDate();
    const today = now.getDate();
    const daysRemaining = Math.max(lastDayOfMonth - today, 0);

    // Finansal özet
    const context = {
        dönem: `${m}/${y}`,
        aylık_gelir: totalIncome,
        aylık_gider: totalExpense,
        kategori_bazlı_harcamalar: categoryExpenses,
        aylık_bütçe: budgetAmount,
        bütçe_kullanım_yüzdesi:
            budgetAmount > 0
                ? Math.round((totalExpense / budgetAmount) * 100)
                : 0,
        ay_bitimine_kalan_gün: daysRemaining,
        aktif_abonelikler: subs.map(
            (s) =>
                `${s.name}: ${s.amount} ₺/${s.frequency === "monthly" ? "ay" : s.frequency === "yearly" ? "yıl" : "hafta"}${s.next_billing_date ? ` (sonraki: ${s.next_billing_date.split("T")[0]})` : ""}`
        ),
        aylık_toplam_abonelik_maliyeti: Math.round(totalSubCostMonthly),
    };

    return context;
}

export async function POST(req: NextRequest) {
    if (!apiKey) {
        return NextResponse.json(
            { error: "API anahtarı bulunamadı." },
            { status: 500 }
        );
    }

    const supabase = await createClient();
    const { data: userData, error: userError } =
        await supabase.auth.getUser();

    if (userError || !userData?.user) {
        return NextResponse.json(
            { error: "Yetkisiz erişim." },
            { status: 401 }
        );
    }

    let body: { messages: ChatMessage[] };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            { error: "Geçersiz istek gövdesi." },
            { status: 400 }
        );
    }

    const { messages } = body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return NextResponse.json(
            { error: "Mesaj dizisi gerekli." },
            { status: 400 }
        );
    }

    // Son 10 mesajı al (context limit)
    const recentMessages = messages.slice(-10);

    try {
        const openai = getOpenAIClient();
        const financialContext = await getFinancialContext(
            userData.user.id
        );

        const systemPrompt = `Sen kişisel finans yönetiminde uzman, dost canlısı ve yardımsever bir finansal danışman yapay zekasısın. 
Kullanıcıya finansal konularda Türkçe, net, samimi ve yapıcı cevaplar veriyorsun.

Kullanıcının GÜNCEL finansal durumu:
- Dönem: ${financialContext.dönem}
- Bu ay toplam gelir: ${financialContext.aylık_gelir} ₺
- Bu ay toplam gider: ${financialContext.aylık_gider} ₺
- Kategorik harcamalar: ${JSON.stringify(financialContext.kategori_bazlı_harcamalar)}
- Aylık bütçe limiti: ${financialContext.aylık_bütçe > 0 ? financialContext.aylık_bütçe + " ₺" : "Belirlenmemiş"}
- Bütçe kullanımı: %${financialContext.bütçe_kullanım_yüzdesi}
- Aktif abonelikler: ${financialContext.aktif_abonelikler.length > 0 ? financialContext.aktif_abonelikler.join(", ") : "Yok"}
- Aylık abonelik maliyeti: ${financialContext.aylık_toplam_abonelik_maliyeti} ₺
- Ay bitimine kalan gün: ${financialContext.ay_bitimine_kalan_gün} gün

Kurallar:
1. Her zaman kullanıcının GERÇEK verilerine dayanarak cevap ver. Rakamları ve kategorileri kullan.
2. Sorulan soruya spesifik, kısa ve öz cevap ver. Gereksiz uzun açıklamalardan kaçın.
3. Tasarruf önerilerini somut rakamlarla destekle.
4. Eğer kullanıcının bütçesi aşılmışsa uyar, iyiyse tebrik et.
5. Kredi kartı ödemeleri, kredi/borç ödemeleri ve sağlık harcamaları aylık tüketim bütçesine dahil DEĞİLDİR. Yukarıdaki "aylık gider" ve "kategori harcamaları" rakamlarından bu kalemler zaten çıkarılmıştır - ek bir filtreleme yapma.
6. Ay bitimine kalan gün sayısını dikkate al! Ayın sonuna yaklaşıldığında (5 gün veya daha az kaldıysa) kullanıcıya hatırlat. Bütçe durumuna göre kalan günler için günlük harcama limiti öner. Örneğin: "Ayın bitmesine 5 gün kaldı. Bütçende 1000 ₺ kaldıysa, günde yaklaşık 200 ₺ harcayabilirsin." şeklinde somut tavsiyeler ver.`;

        const completion = await openai.chat.completions.create({
            model: "deepseek-v4-flash",
            messages: [
                { role: "system", content: systemPrompt },
                ...recentMessages,
            ],
            stream: false,
        });

        const assistantMessage =
            completion.choices?.[0]?.message?.content || "";

        return NextResponse.json({
            message: assistantMessage,
            _usage: completion.usage
                ? {
                    promptTokens: completion.usage.prompt_tokens ?? 0,
                    completionTokens:
                        completion.usage.completion_tokens ?? 0,
                    totalTokens: completion.usage.total_tokens ?? 0,
                }
                : null,
        });
    } catch (error: any) {
        console.error("AI Chat Error:", error);

        const status = error?.status ?? error?.code;
        if (status === 429) {
            return NextResponse.json(
                {
                    error:
                        "Şu an sunucuda yoğunluk yaşanmaktadır. Lütfen kısa bir süre sonra tekrar deneyiniz.",
                },
                { status: 429 }
            );
        }

        return NextResponse.json(
            {
                error:
                    error.message ||
                    "Bir hata oluştu. Lütfen tekrar deneyin.",
            },
            { status: 500 }
        );
    }
}