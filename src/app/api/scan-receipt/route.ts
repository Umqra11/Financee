import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Environment variable MUST be set: GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json(); // Beklenen: base64 string

    if (!image) {
      return NextResponse.json({ error: 'Resim verisi bulunamadı' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-pro-preview' });

    let base64Data = image;
    let mimeType = 'image/jpeg'; // varsayılan

    if (image.startsWith('data:')) {
      const parts = image.split(';');
      mimeType = parts[0].split(':')[1];
      base64Data = parts[1].split(',')[1];
    }

    const prompt = "Bu bir fiş veya faturadır. Tutar (amount), Kategori (category), Kurum (name) ve Tarih (date) bilgilerini çıkarıp JSON olarak dön.";

    const result = await withRetry(async () => {
      return await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType,
          }
        }
      ]);
    });

    const responseText = result.response.text();
    const usage = result.response.usageMetadata ?? null;

    // JSON içeriğini ayıkla
    let jsonData = responseText;
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonData = jsonMatch[1];
    } else {
      const start = responseText.indexOf('{');
      const end = responseText.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        jsonData = responseText.substring(start, end + 1);
      }
    }

    const parsedData = JSON.parse(jsonData);

    const responsePayload: Record<string, unknown> = { ...parsedData };
    if (usage) {
      responsePayload._usage = {
        promptTokens: usage.promptTokenCount ?? 0,
        completionTokens: usage.candidatesTokenCount ?? 0,
        totalTokens: usage.totalTokenCount ?? 0,
      };
    }

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error: any) {
    console.error("Gemini API Error:", error);

    const status = error?.status ?? error?.code;
    if (status === 409 || status === 429) {
      return NextResponse.json(
        { error: "Şu an sunucuda yoğunluk yaşanmaktadır. Lütfen kısa bir süre sonra tekrar deneyiniz." },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: error.message || 'Fiş okunurken bir hata oluştu' }, { status: 500 });
  }
}