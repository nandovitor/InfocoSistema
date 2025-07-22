
import { GoogleGenAI } from "@google/genai";
import type { Employee, Task, FinanceData } from '../types';

interface ContextData {
    employees: Employee[];
    tasks: Task[];
    financeData: FinanceData[];
}

// Esta função será detectada como uma função serverless por plataformas como a Vercel.
// Para melhor tipagem, você poderia adicionar o pacote `@vercel/node` e usar
// `import type { VercelRequest, VercelResponse } from '@vercel/node';`
// e então definir o handler como `handler(req: VercelRequest, res: VercelResponse)`
export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    console.log("Function /api/analyze invoked.");

    try {
        const { userInput, contextData }: { userInput: string; contextData: ContextData } = req.body;
        
        if (!userInput || !contextData) {
            console.error("Bad Request: Missing userInput or contextData.");
            return res.status(400).json({ error: 'Faltando userInput ou contextData no corpo da requisição' });
        }
        
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            const env = process.env.VERCEL_ENV || 'desconhecido';
            const errorMessage = `A chave da API (API_KEY) não foi encontrada no ambiente '${env}'. Por favor, verifique se a variável de ambiente 'API_KEY' está corretamente configurada nas configurações do projeto Vercel para este ambiente específico. É crucial fazer um novo deploy após adicionar a variável para que a alteração tenha efeito.`;
            
            console.error(`Server Configuration Error: API_KEY is not set in the '${env}' environment.`);
            
            return res.status(500).json({ error: errorMessage });
        }
        
        console.log("API_KEY found. Initializing GoogleGenAI client.");

        const ai = new GoogleGenAI({
            apiKey: apiKey, // Use the variable to ensure it's the one we checked
        });

        const systemInstruction = `Você é um assistente de análise de dados para um sistema de gestão chamado Infoco.
Sua tarefa é analisar os dados em formato JSON fornecidos no prompt e responder à pergunta do usuário de forma clara, concisa e útil.
Atenha-se estritamente aos dados fornecidos. Os dados contêm três arrays principais: 'employees', 'tasks', e 'financeData'.
- 'employees': Contém informações sobre os funcionários da empresa.
- 'tasks': Contém uma lista de tarefas atribuídas aos funcionários, incluindo status e horas.
- 'financeData': Contém dados financeiros relacionados aos municípios.
Sempre formate sua resposta usando markdown para melhor legibilidade (use **negrito** para destacar termos importantes, *itálico*, e listas de itens com hífens ou asteriscos).
Se a pergunta não puder ser respondida com os dados fornecidos, informe educadamente que a informação não está disponível. Não invente informações.
Seja direto e objetivo na resposta.`;
        
        const prompt = `**DADOS PARA ANÁLISE (JSON):**\n${JSON.stringify(contextData, null, 2)}\n\n---\n\n**PERGUNTA DO USUÁRIO:**\n${userInput}`;
        
        console.log("Sending request to Google Gemini API...");
        
        const genAIResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
            }
        });
        
        console.log("Received response from Google Gemini API.");
        
        const aiText = genAIResponse.text;
        
        if (!aiText) {
            console.error("Gemini API returned an empty response text.");
            return res.status(500).json({ error: 'A resposta do serviço de IA estava vazia.' });
        }

        return res.status(200).json({ response: aiText.trim() });

    } catch (error: any) {
        console.error("--- UNHANDLED ERROR in /api/analyze ---");
        console.error("Error Message:", error.message);
        if (error.stack) console.error("Error Stack:", error.stack);
        if (error.details) console.error("Error Details:", error.details);
        console.error("--- END OF ERROR ---");

        let errorMessage = 'Ocorreu um erro ao processar sua solicitação de IA. Verifique os logs do servidor para detalhes.';
        let statusCode = 500;

        if (error.message) {
            if (error.message.includes('API key not valid')) {
                errorMessage = 'A chave da API (API_KEY) fornecida é inválida ou não tem permissão para usar o modelo.';
                statusCode = 401;
            } else if (error.message.toLowerCase().includes('deadline')) {
                 errorMessage = 'A solicitação para o serviço de IA demorou muito para responder (timeout). Tente novamente.';
                 statusCode = 504;
            } else {
                 // Forward a sanitized version of the error message to the client
                 errorMessage = `Erro do serviço de IA: ${error.message}`;
            }
        }
        
        return res.status(statusCode).json({ error: errorMessage });
    }
}