import React, { useState, useMemo, useContext } from 'react';
import { EmployeeExpense, Employee, ExpenseType, PaymentStatus, PayrollRecord, LeaveRequest, LeaveType, LeaveStatus, UserRole } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { EXPENSE_TYPES, PAYMENT_STATUSES, LEAVE_TYPES, LEAVE_STATUSES } from '../../../constants';
import { formatDate, getEmployeeName } from '../../../lib/utils';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import { PlusCircle, Upload, FileText, Check, X } from 'lucide-react';
import DataTable, { Column } from '../../ui/DataTable';
import DeleteConfirmationModal from '../../ui/DeleteConfirmationModal';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../../../lib/utils';

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// --- Expenses View Components ---
const ExpenseForm: React.FC<{
  expense: Partial<EmployeeExpense>;
  setExpense: React.Dispatch<React.SetStateAction<Partial<EmployeeExpense>>>;
  employees: Employee[];
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}> = ({ expense, setExpense, employees, onSubmit, onCancel }) => (
    <form onSubmit={onSubmit} className="space-y-4">
        <Select value={expense.employeeId || ''} onChange={e => setExpense({...expense, employeeId: Number(e.target.value)})} required>
            <option value="">Selecione um funcionário</option>
            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
        </Select>
        <Input type="text" placeholder="Descrição" value={expense.description || ''} onChange={e => setExpense({...expense, description: e.target.value})} required />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={expense.type || ''} onChange={e => setExpense({...expense, type: e.target.value as ExpenseType})} required>
                <option value="">Tipo de Despesa</option>
                {EXPENSE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </Select>
            <Input type="number" placeholder="Valor" value={expense.amount || ''} onChange={e => setExpense({...expense, amount: Number(e.target.value)})} min="0" step="0.01" required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input type="date" value={expense.date || ''} onChange={e => setExpense({...expense, date: e.target.value})} required />
            <Select value={expense.status || ''} onChange={e => setExpense({...expense, status: e.target.value as PaymentStatus})} required>
                <option value="">Status</option>
                {PAYMENT_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
            </Select>
        </div>
        <Input type="text" placeholder="Link ou nome do arquivo da nota" value={expense.receipt || ''} onChange={e => setExpense({...expense, receipt: e.target.value})} icon={<Upload size={16}/>}/>
        <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
        </div>
    </form>
);

const ExpensesView: React.FC = () => {
    const { employees, employeeExpenses, addEmployeeExpense, updateEmployeeExpense, deleteEmployeeExpense } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [editingExpense, setEditingExpense] = useState<Partial<EmployeeExpense>>({});
    
    const openModalForNew = () => {
        setEditingExpense({ date: new Date().toISOString().split('T')[0], status: 'Pendente' });
        setIsModalOpen(true);
    };
    const openModalForEdit = (expense: EmployeeExpense) => {
        setEditingExpense(expense);
        setIsModalOpen(true);
    };
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        editingExpense.id ? updateEmployeeExpense(editingExpense as EmployeeExpense) : addEmployeeExpense(editingExpense as Omit<EmployeeExpense, 'id'>);
        setIsModalOpen(false);
    };
    const handleDeleteRequest = (id: number) => {
        setDeletingId(id);
        setIsConfirmModalOpen(true);
    };
    const handleConfirmDelete = () => {
        if (deletingId) deleteEmployeeExpense(deletingId);
        setIsConfirmModalOpen(false);
    };

    const columns: Column<EmployeeExpense>[] = [
        { key: 'employeeId', header: 'Funcionário', render: (item) => getEmployeeName(item.employeeId, employees), className: 'font-medium text-gray-900'},
        { key: 'description', header: 'Descrição' },
        { key: 'type', header: 'Tipo' },
        { key: 'amount', header: 'Valor', render: (item) => formatCurrency(item.amount), className: 'text-right' },
        { key: 'date', header: 'Data', render: (item) => formatDate(item.date) },
        { key: 'status', header: 'Status', render: (item) => <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'Pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{item.status}</span> },
        { key: 'receipt', header: 'Nota Fiscal', render: (item) => item.receipt ? <a href={item.receipt} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1"><FileText size={14}/> Ver</a> : 'N/A' },
        { key: 'actions', header: 'Ações', className: 'text-right' },
    ];
    
    return (
        <Card>
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Gerenciar Despesas de Funcionários</h2>
                <Button onClick={openModalForNew} className="w-full md:w-auto"><PlusCircle size={16} className="mr-2"/>Adicionar Lançamento</Button>
            </div>
            <DataTable columns={columns} data={employeeExpenses} onEdit={openModalForEdit} onDelete={handleDeleteRequest} emptyMessage="Nenhum lançamento encontrado." />
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingExpense.id ? 'Editar Lançamento' : 'Adicionar Lançamento'} size="lg">
                <ExpenseForm expense={editingExpense} setExpense={setEditingExpense} employees={employees} onSubmit={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
            <DeleteConfirmationModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir este lançamento?" />
        </Card>
    );
};


// --- Payroll View Components ---
const PayrollView: React.FC = () => {
    const { payrolls, employees, addPayroll } = useData();
    const [monthYear, setMonthYear] = useState(new Date().toISOString().slice(0, 7));

    const generatePayroll = () => {
        employees.forEach(emp => {
            if (!emp.baseSalary) return;
            const existing = payrolls.find(p => p.employeeId === emp.id && p.monthYear === monthYear);
            if (existing) return; // Don't generate if already exists for that month

            const benefits = emp.baseSalary * 0.1; // Simulate 10% benefits
            const deductions = emp.baseSalary * 0.08; // Simulate 8% deductions
            const netPay = emp.baseSalary + benefits - deductions;

            addPayroll({
                employeeId: emp.id,
                monthYear,
                baseSalary: emp.baseSalary,
                benefits,
                deductions,
                netPay,
                payDate: new Date(monthYear + '-05T00:00:00').toISOString().split('T')[0] // Simulate payment on the 5th
            });
        });
    };

    const columns: Column<PayrollRecord>[] = [
        { key: 'employeeId', header: 'Funcionário', render: (item) => getEmployeeName(item.employeeId, employees), className: 'font-medium text-gray-900'},
        { key: 'monthYear', header: 'Mês/Ano' },
        { key: 'baseSalary', header: 'Salário Base', render: (item) => formatCurrency(item.baseSalary), className: 'text-right' },
        { key: 'benefits', header: 'Benefícios', render: (item) => formatCurrency(item.benefits), className: 'text-right text-green-600' },
        { key: 'deductions', header: 'Deduções', render: (item) => formatCurrency(item.deductions), className: 'text-right text-red-600' },
        { key: 'netPay', header: 'Líquido', render: (item) => formatCurrency(item.netPay), className: 'text-right font-bold' },
        { key: 'payDate', header: 'Data Pgto.', render: item => formatDate(item.payDate) },
    ];
    
    return (
        <Card>
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Folha de Pagamento</h2>
                <div className="flex gap-2">
                    <Input type="month" value={monthYear} onChange={e => setMonthYear(e.target.value)} />
                    <Button onClick={generatePayroll}>Gerar Folha</Button>
                </div>
            </div>
            <DataTable columns={columns} data={payrolls.filter(p => p.monthYear === monthYear)} emptyMessage="Nenhum registro de pagamento para este mês. Clique em 'Gerar Folha'." />
        </Card>
    );
};

// --- Leave Management View Components ---
const LeaveRequestForm: React.FC<{ request: Partial<LeaveRequest>, setRequest: any, employees: Employee[], onSubmit: any, onCancel: any }> = ({ request, setRequest, employees, onSubmit, onCancel }) => (
    <form onSubmit={onSubmit} className="space-y-4">
        <Select value={request.employeeId || ''} onChange={e => setRequest({...request, employeeId: Number(e.target.value)})} required>
            <option value="">Selecione o funcionário</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </Select>
        <Select value={request.type || ''} onChange={e => setRequest({...request, type: e.target.value as LeaveType})} required>
            <option value="">Tipo de Ausência</option>
            {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
        <div className="grid grid-cols-2 gap-4">
            <Input type="date" value={request.startDate || ''} onChange={e => setRequest({...request, startDate: e.target.value})} required/>
            <Input type="date" value={request.endDate || ''} onChange={e => setRequest({...request, endDate: e.target.value})} required min={request.startDate}/>
        </div>
        <textarea value={request.reason || ''} onChange={e => setRequest({...request, reason: e.target.value})} rows={3} className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" placeholder="Motivo" required/>
        <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
            <Button type="submit">Enviar Solicitação</Button>
        </div>
    </form>
);

const LeaveView: React.FC = () => {
    const { leaveRequests, employees, addLeaveRequest, updateLeaveRequest } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newRequest, setNewRequest] = useState<Partial<LeaveRequest>>({});
    
    const openModal = () => {
        setNewRequest({ status: 'Pendente', type: 'Férias' });
        setIsModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        addLeaveRequest(newRequest as Omit<LeaveRequest, 'id'>);
        setIsModalOpen(false);
    };

    const handleStatusChange = (id: number, status: LeaveStatus) => {
        const request = leaveRequests.find(r => r.id === id);
        if(request) {
            updateLeaveRequest({ ...request, status });
        }
    };
    
    const getStatusBadge = (status: LeaveStatus) => {
        const classes = {
            Pendente: 'bg-yellow-100 text-yellow-800',
            Aprovada: 'bg-green-100 text-green-800',
            Rejeitada: 'bg-red-100 text-red-800',
        };
        return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${classes[status]}`}>{status}</span>;
    };

    const columns: Column<LeaveRequest>[] = [
        { key: 'employeeId', header: 'Funcionário', render: (item) => getEmployeeName(item.employeeId, employees), className: 'font-medium text-gray-900'},
        { key: 'type', header: 'Tipo' },
        { key: 'period', header: 'Período', render: item => `${formatDate(item.startDate)} - ${formatDate(item.endDate)}`},
        { key: 'reason', header: 'Motivo' },
        { key: 'status', header: 'Status', render: item => getStatusBadge(item.status) },
        { key: 'actions', header: 'Ações', className: 'text-right', render: item => (
            item.status === 'Pendente' ? (
                <div className="flex items-center justify-end gap-2">
                    <Button size="sm" onClick={() => handleStatusChange(item.id, 'Aprovada')} className="p-2 h-auto bg-green-500 hover:bg-green-600"><Check size={16}/></Button>
                    <Button variant="danger" size="sm" onClick={() => handleStatusChange(item.id, 'Rejeitada')} className="p-2 h-auto"><X size={16}/></Button>
                </div>
            ) : null
        )},
    ];

    return (
        <Card>
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Controle de Férias e Ausências</h2>
                <Button onClick={openModal} className="w-full md:w-auto"><PlusCircle size={16} className="mr-2"/>Solicitar Ausência</Button>
            </div>
            <DataTable columns={columns} data={leaveRequests} emptyMessage="Nenhuma solicitação de ausência encontrada." />
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Solicitar Ausência">
                <LeaveRequestForm request={newRequest} setRequest={setNewRequest} employees={employees} onSubmit={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
        </Card>
    );
};

// --- Main Component ---
const HumanResourcesTab: React.FC = () => {
    const [activeView, setActiveView] = useState('expenses');
    
    return (
        <div className="space-y-6">
            <Card className="p-2">
                <div className="flex items-center justify-center space-x-2">
                    <Button variant={activeView === 'expenses' ? 'primary' : 'secondary'} onClick={() => setActiveView('expenses')} className="flex-1">Despesas</Button>
                    <Button variant={activeView === 'payroll' ? 'primary' : 'secondary'} onClick={() => setActiveView('payroll')} className="flex-1">Folha de Pagamento</Button>
                    <Button variant={activeView === 'leave' ? 'primary' : 'secondary'} onClick={() => setActiveView('leave')} className="flex-1">Férias e Ausências</Button>
                </div>
            </Card>

            {activeView === 'expenses' && <ExpensesView />}
            {activeView === 'payroll' && <PayrollView />}
            {activeView === 'leave' && <LeaveView />}
        </div>
    );
};

export default HumanResourcesTab;
