import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Environment variable MUST be set: GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json(); // Beklenen: base64 string
    
    if (!image) {
      return NextResponse.json({ error: 'Resim verisi bulunamadı' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    let base64Data = image;
    let mimeType = 'image/jpeg'; // varsayılan
    
    if (image.startsWith('data:')) {
      const parts = image.split(';');
      mimeType = parts[0].split(':')[1];
      base64Data = parts[1].split(',')[1];
    }
    
    const prompt = "Bu bir fiş veya faturadır. Tutar (amount), Kategori (category), Kurum (name) ve Tarih (date) bilgilerini çıkarıp JSON olarak dön.";
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType,
        }
      }
    ]);
    
    const responseText = result.response.text();
    
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
    
    return NextResponse.json(parsedData, { status: 200 });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message || 'Fiş okunurken bir hata oluştu' }, { status: 500 });
  }
}
