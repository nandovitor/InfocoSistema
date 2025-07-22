
import { DEFAULT_TASKS, DEFAULT_EMPLOYEES } from '../constants';

export default function handler(req: any, res: any) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.INFOCO_API_KEY;
    if (!apiKey) {
        const env = process.env.VERCEL_ENV || 'desconhecido';
        const errorMessage = `A chave da API de tarefas (INFOCO_API_KEY) não foi encontrada no ambiente '${env}'. Por favor, verifique se a variável de ambiente está configurada nas configurações do seu projeto na Vercel e faça um novo deploy.`;

        console.error(`Server Configuration Error in /api/tasks: INFOCO_API_KEY is not set in the '${env}' environment.`);
        return res.status(500).json({ error: errorMessage });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header is missing or malformed. It must be in the format: "Bearer <API_KEY>".' });
    }

    const providedKey = authHeader.split(' ')[1];
    if (providedKey !== apiKey) {
        return res.status(401).json({ error: 'Invalid API key provided.' });
    }

    try {
        // Combine tasks with employee names for a more useful API response
        const tasksWithEmployeeNames = DEFAULT_TASKS.map(task => {
            const employee = DEFAULT_EMPLOYEES.find(emp => emp.id === task.employeeId);
            const { employeeId, ...restOfTask } = task; // Exclude employeeId from root
            return {
                ...restOfTask,
                employee: {
                    id: employeeId,
                    name: employee ? employee.name : 'Unknown',
                    department: employee ? employee.department : 'Unknown',
                }
            };
        });
        
        // Set cache headers for better performance on production environments like Vercel
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
        return res.status(200).json({ data: tasksWithEmployeeNames });

    } catch (error) {
        console.error("Error processing tasks for API:", error);
        return res.status(500).json({ error: 'An internal server error occurred while processing the request.' });
    }
}