
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Employee, Supplier, SystemUser } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (dateString: string) => {
    if (!dateString) return 'N/D';
    // Handles both 'YYYY-MM-DD' and full ISO strings by ensuring we only consider the date part
    const datePart = dateString.split('T')[0];
    return new Date(datePart + 'T00:00:00').toLocaleDateString('pt-BR');
};

export const getUserInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const generateId = () => {
    return Date.now() + Math.floor(Math.random() * 1000);
}

export const getEmployeeName = (employeeId: number, employees: Employee[]): string => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : 'Desconhecido';
};

export const getSupplierName = (supplierId: number, suppliers: Supplier[]): string => {
    const supplier = suppliers.find(sup => sup.id === supplierId);
    return supplier ? supplier.name : 'N/D';
};

export const timeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    const intervals: { [key: string]: number } = {
        ano: 31536000,
        mês: 2592000,
        dia: 86400,
        hora: 3600,
        minuto: 60,
    };

    if (seconds < 30) return "agora";

    for (const unit in intervals) {
        const interval = Math.floor(seconds / intervals[unit]);
        if (interval >= 1) {
            if (unit === 'mês' && interval > 1) {
                return `há ${interval} meses`;
            }
            const plural = interval > 1 ? 's' : '';
            return `há ${interval} ${unit}${plural}`;
        }
    }
    return "agora";
};

export const getSystemUser = (userId: number, users: SystemUser[]): SystemUser | null => {
    return users.find(u => u.id === userId) || null;
};
