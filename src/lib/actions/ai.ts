"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set in environment variables!");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export async function parseReceipt(base64Image: string, mimeType: string) {
  if (!apiKey) {
    throw new Error("Sistemde API anahtarı bulunamadı. Lütfen yöneticinizle iletişime geçin.");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
Eğer gider (expense) ise: "food" (gıda/yemek), "transport" (ulaşım/akaryakıt), "utilities" (fatura), "entertainment" (eğlence/giyim/alışveriş), "other_expense" (diğer)
Eğer gelir (income) ise: "salary" (maaş), "investment" (yatırım), "other_income" (diğer)
    `;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    
    // JSON parse işlemi (Eğer AI markdown block ile sararsa temizle)
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleanedText);

    return { success: true, data: parsedData };
  } catch (error: any) {
    console.error("Gemini AI Error:", error);
    throw new Error(error.message || "Fiş okunurken yapay zeka bir sorunla karşılaştı.");
  }
}
