import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseNaturalLanguageQuery } from '@/lib/ai-search-parser';
import { SELLERS, STATUS_OPTIONS, COMPANY_OPTIONS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = body.query;
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query inválida' }, { status: 400 });
    }

    const rawKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const apiKey = rawKey ? rawKey.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 39) : null;

    if (apiKey && apiKey.startsWith('AIza')) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-3.8-flash',
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });

        const todayStr = new Date().toISOString().split('T')[0];
        const prompt = `Analise a pergunta do CRM: "${query}". Data atual: ${todayStr}.
Traduza em JSON com salesFilters, quotesFilters e responseText.
sellers disponíveis: ${JSON.stringify(SELLERS)}.
companies disponíveis: ${JSON.stringify(COMPANY_OPTIONS)}.
statuses disponíveis: ${JSON.stringify(STATUS_OPTIONS)}.
Formato:
{
  "salesFilters": { "sellers": [], "companies": [], "statuses": [], "dateRange": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" }, "searchTerm": "" },
  "quotesFilters": { "sellers": [], "companies": [], "dateRange": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" }, "searchTerm": "" },
  "responseText": "Explicacao amigavel"
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = JSON.parse(text);

        return NextResponse.json({
          salesFilters: parsed.salesFilters,
          quotesFilters: parsed.quotesFilters,
          responseText: parsed.responseText || 'Resultados encontrados.',
        });
      } catch (geminiErr: any) {
        console.warn('[api/intelligent-search] Gemini API fallback to local parser:', geminiErr?.message);
      }
    }

    // Fallback gracioso local
    const fallback = parseNaturalLanguageQuery(query);
    return NextResponse.json(fallback);
  } catch (err: any) {
    console.error('[api/intelligent-search] Unexpected error:', err);
    return NextResponse.json(parseNaturalLanguageQuery(''), { status: 200 });
  }
}
