"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set in environment variables!");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

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
          `[Gemini] Rate limit (429) hit. Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw error; // Diğer hataları hemen fırlat
    }
  }
  throw lastError;
}

export async function parseReceipt(base64Image: string, mimeType: string) {
  if (!apiKey) {
    throw new Error("Sistemde API anahtarı bulunamadı. Lütfen yöneticinizle iletişime geçin.");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });

    const prompt = `
Sen bir finansal asistan yapay zekasısın. Gönderilen görsel bir alışveriş fişi, restoran adisyonu, POS cihazı slibi veya bir banka uygulamasının ekran görüntüsü olabilir.
Görseli incele ve aşağıdaki bilgileri çıkararak SADECE JSON formatında döndür. Kesinlikle başka bir metin veya markdown bloğu kullanma, saf JSON dön!

JSON Formatı:
{
  "amount": <tutar_sayı_olarak>,
  "type": "expense", // (eğer gelir ekran görüntüsü ise "income" yap)
  "category": "<kategori>", // Aşağıdaki listeden en uygun olanı seç.
  "payment_method": "<ödeme_yöntemi>", // "cash" veya "credit_card" seç. Eğer belirsizse "credit_card" varsay.
  "date": "<tarih>", // YYYY-MM-DD formatında fiş tarihi. Bulamazsan bugünün tarihi.
  "note": "<not>" // Fişin kesildiği yerin adı (Market adı, restoran adı vs.). En fazla 3 kelime.
}

Kategori Listesi:
Eğer gider (expense) ise: "gıda" (gıda/yemek), "market" (market/alışveriş), "ulaşım" (ulaşım/akaryakıt), "faturalar" (fatura), "eğlence" (eğlence), "yatırım" (yatırım), "kredi" (kredi/borç), "kredi_kartı_ödemesi" (kredi kartı ödemesi), "diğer_gider" (diğer)
Eğer gelir (income) ise: "maaş" (maaş), "diğer_gelir" (diğer)
    `;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType,
      },
    };

    const result = await withRetry(async () => {
      return await model.generateContent([prompt, imagePart]);
    });

    const responseText = result.response.text();

    // Token kullanımını çıkar
    const usage = result.response.usageMetadata ?? null;

    // JSON parse işlemi (Eğer AI markdown block ile sararsa temizle)
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleanedText);

    return {
      success: true,
      data: parsedData,
      _usage: usage
        ? {
          promptTokens: usage.promptTokenCount ?? 0,
          completionTokens: usage.candidatesTokenCount ?? 0,
          totalTokens: usage.totalTokenCount ?? 0,
        }
        : null,
    };
  } catch (error: any) {
    console.error("Gemini AI Error:", error);

    // 409 / 429 rate limit kontrolleri
    const status = error?.status ?? error?.code;
    if (status === 409 || status === 429) {
      throw new Error(
        "Şu an sunucuda yoğunluk yaşanmaktadır. Lütfen kısa bir süre sonra tekrar deneyiniz."
      );
    }

    throw new Error(
      error.message || "Fiş okunurken yapay zeka bir sorunla karşılaştı."
    );
  }
}