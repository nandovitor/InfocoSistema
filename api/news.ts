
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        const env = process.env.VERCEL_ENV || 'desconhecido';
        const errorMessage = `A chave da API (API_KEY) do Gemini não foi encontrada no ambiente '${env}'. Por favor, verifique se a variável de ambiente está configurada nas configurações do seu projeto na Vercel e faça um novo deploy.`;
        
        console.error(`Server Configuration Error in /api/news: API_KEY is not set in the '${env}' environment.`);
        
        return res.status(500).json({ error: errorMessage });
    }

    try {
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `Você é um agregador de notícias para um sistema de gestão. Sua tarefa é encontrar as notícias mais recentes e relevantes usando a Busca Google com base nas seguintes palavras-chave: 'licitações e contratos', 'AGU', 'TCU', 'TCM'.
        Formate a saída como um único objeto JSON. O objeto deve conter uma chave chamada 'articles', que é um array de notícias. Não inclua nenhum texto, explicação ou formatação de markdown antes ou depois do objeto JSON.
        Cada item no array 'articles' deve ser um objeto JSON com as seguintes chaves:
        - 'title': O título completo do artigo.
        - 'summary': Um resumo conciso de uma frase do artigo.
        - 'url': A URL direta para o artigo.
        - 'sourceTitle': O título do site de origem (ex: 'G1', 'Consultor Jurídico').
        Retorne entre 5 e 7 artigos. A resposta deve ser apenas o objeto JSON.`;

        const genAIResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                temperature: 0.2, // Lower temperature for more deterministic JSON output
            },
        });
        
        const textResponse = (genAIResponse.text || '').trim();
        const groundingMetadata = genAIResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        let articles = [];
        try {
            // Attempt to parse the entire response as JSON
            const jsonResponse = JSON.parse(textResponse);
            articles = jsonResponse.articles || [];
        } catch (e) {
            // If it fails, try to extract from a markdown code block
            console.warn("Resposta da IA não era JSON puro. Tentando extrair de um bloco de código Markdown.");
            const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                try {
                    const jsonResponse = JSON.parse(jsonMatch[1]);
                    articles = jsonResponse.articles || [];
                } catch (e2) {
                    console.error("Falha ao analisar JSON extraído do bloco de código:", e2);
                    throw new Error("A resposta da IA não estava em um formato JSON válido, mesmo após a extração.");
                }
            } else {
                console.error("Resposta da IA não continha um formato JSON reconhecível:", textResponse);
                throw new Error("A resposta da IA não estava em um formato JSON reconhecível.");
            }
        }
        
        // Set cache headers
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200'); // Cache for 1 hour

        return res.status(200).json({ articles, sources: groundingMetadata });

    } catch (error: any) {
        console.error("--- ERRO NA API /api/news ---", error);
        return res.status(500).json({ error: error.message || 'Ocorreu um erro ao processar a solicitação de notícias.' });
    }
}
