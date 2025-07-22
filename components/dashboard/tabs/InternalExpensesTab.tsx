import React, { useState, useMemo } from 'react';
import { InternalExpense, InternalExpenseCategory, Supplier } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { INTERNAL_EXPENSE_CATEGORIES } from '../../../constants';
import { formatDate, getSupplierName } from '../../../lib/utils';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import { PlusCircle } from 'lucide-react';
import DataTable, { Column } from '../../ui/DataTable';
import DeleteConfirmationModal from '../../ui/DeleteConfirmationModal';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { cn } from '../../../lib/utils';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// --- Overview View ---
const Overview: React.FC<{ internalExpenses: InternalExpense[] }> = ({ internalExpenses }) => {
    const summary = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthByCategory: { [key: string]: number } = {};
        internalExpenses.forEach(exp => {
            const expenseDate = new Date(exp.date + 'T00:00:00');
            if (expenseDate.getFullYear() === currentYear && expenseDate.getMonth() === currentMonth) {
                monthByCategory[exp.category] = (monthByCategory[exp.category] || 0) + exp.amount;
            }
        });
        const chartData = Object.entries(monthByCategory).map(([name, value]) => ({ name, value }));
        return { chartData };
    }, [internalExpenses]);

    return (
        <Card>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Gastos do Mês por Categoria</h2>
            <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={summary.chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                            {summary.chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

// --- History View ---
const HistoryView: React.FC = () => {
    const { internalExpenses, suppliers, addInternalExpense, updateInternalExpense, deleteInternalExpense } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number|null>(null);
    const [editingExpense, setEditingExpense] = useState<Partial<InternalExpense>>({});
    
    const openModalForNew = () => { setEditingExpense({ date: new Date().toISOString().split('T')[0] }); setIsModalOpen(true); };
    const openModalForEdit = (expense: InternalExpense) => { setEditingExpense(expense); setIsModalOpen(true); };
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        editingExpense.id ? updateInternalExpense(editingExpense as InternalExpense) : addInternalExpense(editingExpense as Omit<InternalExpense, 'id'>);
        setIsModalOpen(false);
    };
    const handleDeleteRequest = (id: number) => { setDeletingId(id); setIsConfirmOpen(true); };
    const handleConfirmDelete = () => { if(deletingId) deleteInternalExpense(deletingId); setIsConfirmOpen(false); };

    const columns: Column<InternalExpense>[] = [
        { key: 'description', header: 'Descrição', className: 'font-medium text-gray-900' },
        { key: 'category', header: 'Categoria' },
        { key: 'supplierId', header: 'Fornecedor', render: item => item.supplierId ? getSupplierName(item.supplierId, suppliers) : 'N/A' },
        { key: 'amount', header: 'Valor', render: (item) => formatCurrency(item.amount), className: 'text-right' },
        { key: 'date', header: 'Data', render: (item) => formatDate(item.date) },
        { key: 'actions', header: 'Ações', className: 'text-right' },
    ];

    return (
        <Card>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Histórico de Gastos</h2>
                <Button onClick={openModalForNew}><PlusCircle size={16} className="mr-2"/>Adicionar Gasto</Button>
            </div>
            <DataTable columns={columns} data={internalExpenses} onEdit={openModalForEdit} onDelete={handleDeleteRequest} emptyMessage="Nenhum gasto interno encontrado."/>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingExpense.id ? 'Editar Gasto' : 'Adicionar Gasto'} size="lg">
                 <form onSubmit={handleSave} className="space-y-4">
                    <Input type="text" placeholder="Descrição" value={editingExpense.description || ''} onChange={e => setEditingExpense({ ...editingExpense, description: e.target.value })} required />
                    <div className="grid md:grid-cols-2 gap-4">
                        <Select value={editingExpense.category || ''} onChange={e => setEditingExpense({ ...editingExpense, category: e.target.value as InternalExpenseCategory })} required>
                            <option value="">Selecione a categoria</option>
                            {INTERNAL_EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </Select>
                        <Input type="number" placeholder="Valor" value={editingExpense.amount || ''} onChange={e => setEditingExpense({ ...editingExpense, amount: Number(e.target.value) })} min="0" step="0.01" required />
                    </div>
                     <Select value={editingExpense.supplierId || ''} onChange={e => setEditingExpense({ ...editingExpense, supplierId: Number(e.target.value) || undefined })}>
                        <option value="">Nenhum Fornecedor</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                    <Input type="date" value={editingExpense.date || ''} onChange={e => setEditingExpense({ ...editingExpense, date: e.target.value })} required />
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">Salvar Gasto</Button>
                    </div>
                </form>
            </Modal>
            <DeleteConfirmationModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir este gasto?" />
        </Card>
    );
};

// --- Suppliers View ---
const SuppliersView: React.FC = () => {
    const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number|null>(null);
    const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier>>({});

    const openModalForNew = () => { setEditingSupplier({}); setIsModalOpen(true); };
    const openModalForEdit = (supplier: Supplier) => { setEditingSupplier(supplier); setIsModalOpen(true); };
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        editingSupplier.id ? updateSupplier(editingSupplier as Supplier) : addSupplier(editingSupplier as Omit<Supplier, 'id'>);
        setIsModalOpen(false);
    };
    const handleDeleteRequest = (id: number) => { setDeletingId(id); setIsConfirmOpen(true); };
    const handleConfirmDelete = () => { if(deletingId) deleteSupplier(deletingId); setIsConfirmOpen(false); };

    const columns: Column<Supplier>[] = [
        { key: 'name', header: 'Nome', className: 'font-medium text-gray-900' },
        { key: 'category', header: 'Categoria' },
        { key: 'contactPerson', header: 'Contato' },
        { key: 'email', header: 'Email' },
        { key: 'phone', header: 'Telefone' },
        { key: 'actions', header: 'Ações', className: 'text-right' },
    ];
    
    return (
        <Card>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Gerenciar Fornecedores</h2>
                <Button onClick={openModalForNew}><PlusCircle size={16} className="mr-2"/>Adicionar Fornecedor</Button>
            </div>
            <DataTable columns={columns} data={suppliers} onEdit={openModalForEdit} onDelete={handleDeleteRequest} emptyMessage="Nenhum fornecedor encontrado."/>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSupplier.id ? 'Editar Fornecedor' : 'Adicionar Fornecedor'} size="lg">
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <Input placeholder="Nome do Fornecedor" value={editingSupplier.name || ''} onChange={e => setEditingSupplier({ ...editingSupplier, name: e.target.value })} required />
                        <Input placeholder="Categoria" value={editingSupplier.category || ''} onChange={e => setEditingSupplier({ ...editingSupplier, category: e.target.value })} required />
                    </div>
                    <Input placeholder="Nome do Contato" value={editingSupplier.contactPerson || ''} onChange={e => setEditingSupplier({ ...editingSupplier, contactPerson: e.target.value })} required />
                    <div className="grid md:grid-cols-2 gap-4">
                        <Input type="email" placeholder="Email" value={editingSupplier.email || ''} onChange={e => setEditingSupplier({ ...editingSupplier, email: e.target.value })} required />
                        <Input placeholder="Telefone" value={editingSupplier.phone || ''} onChange={e => setEditingSupplier({ ...editingSupplier, phone: e.target.value })} required />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">Salvar</Button>
                    </div>
                </form>
            </Modal>
            <DeleteConfirmationModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir este fornecedor?" />
        </Card>
    );
};

// --- Main Component ---
const InternalExpensesTab: React.FC = () => {
  const { internalExpenses } = useData();
  const [activeView, setActiveView] = useState('overview');

  const summary = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return internalExpenses.reduce((acc, exp) => {
        acc.year += exp.amount;
        if (new Date(exp.date + 'T00:00:00').getMonth() === currentMonth && new Date(exp.date + 'T00:00:00').getFullYear() === currentYear) {
            acc.month += exp.amount;
        }
        if (exp.date === todayStr) {
            acc.today += exp.amount;
        }
        return acc;
    }, { today: 0, month: 0, year: 0 });
  }, [internalExpenses]);

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card><h3 className="text-gray-500 font-medium">Gasto Hoje</h3><p className="text-3xl font-bold text-red-600">{formatCurrency(summary.today)}</p></Card>
            <Card><h3 className="text-gray-500 font-medium">Gasto no Mês</h3><p className="text-3xl font-bold text-yellow-600">{formatCurrency(summary.month)}</p></Card>
            <Card><h3 className="text-gray-500 font-medium">Gasto no Ano</h3><p className="text-3xl font-bold text-blue-600">{formatCurrency(summary.year)}</p></Card>
        </div>
      
        <Card className="p-2">
            <div className="flex items-center justify-center space-x-2">
                <Button variant={activeView === 'overview' ? 'primary' : 'secondary'} onClick={() => setActiveView('overview')} className="flex-1">Visão Geral</Button>
                <Button variant={activeView === 'history' ? 'primary' : 'secondary'} onClick={() => setActiveView('history')} className="flex-1">Histórico</Button>
                <Button variant={activeView === 'suppliers' ? 'primary' : 'secondary'} onClick={() => setActiveView('suppliers')} className="flex-1">Fornecedores</Button>
            </div>
        </Card>

        {activeView === 'overview' && <Overview internalExpenses={internalExpenses} />}
        {activeView === 'history' && <HistoryView />}
        {activeView === 'suppliers' && <SuppliersView />}
    </div>
  );
};

export default InternalExpensesTab;
