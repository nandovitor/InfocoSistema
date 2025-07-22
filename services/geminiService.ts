
import { Employee, Task, FinanceData } from '../types';

interface AiContextData {
    employees: Employee[];
    tasks: Task[];
    financeData: FinanceData[];
}

/**
 * Gera uma análise baseada em IA chamando o endpoint de backend da aplicação.
 * @param userInput A pergunta do usuário.
 * @param contextData Os dados da aplicação (funcionários, tarefas, etc.).
 * @returns O texto da resposta da IA.
 * @throws Lançará um erro se a chamada da API falhar.
 */
export const getAiDataAnalysis = async (userInput: string, contextData: AiContextData): Promise<string> => {
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userInput, contextData }),
        });

        if (!response.ok) {
            let errorMsg;
            // Try to parse the error response as JSON. Vercel functions usually return JSON errors.
            try {
                const errorData = await response.json();
                // Use the specific error message from the backend if available.
                errorMsg = errorData.error || `O servidor respondeu com o status ${response.status}.`;
            } catch (jsonError) {
                // If the response is not JSON (e.g., HTML 404 page), use the status text.
                errorMsg = `Falha na comunicação com o servidor: ${response.status} ${response.statusText}. Verifique se o serviço de backend (API) está em execução.`;
            }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        
        if (!data.response) {
            throw new Error('A resposta da API estava em um formato inválido.');
        }

        return data.response;

    } catch (error: any) {
        console.error("Erro ao chamar /api/analyze:", error);
        // Catch specific network errors and provide a helpful message for local development.
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
             throw new Error('Não foi possível conectar ao serviço de IA. Verifique sua conexão e se o servidor está online. Para desenvolvimento local, use o comando `vercel dev`.');
        }
        // Re-lança o erro para que o componente da UI possa exibi-lo.
        // O erro agora deve ter uma mensagem mais descritiva.
        throw error;
    }
};
