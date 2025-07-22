import React, { useState, useMemo } from 'react';
import { useData } from '../../../contexts/DataContext';
import Card from '../../ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DataTable, { Column } from '../../ui/DataTable';
import { FinanceData, Transaction, TransactionStatus, TransactionType } from '../../../types';
import { cn } from '../../../lib/utils';
import Button from '../../ui/Button';
import { PlusCircle } from 'lucide-react';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import { formatDate } from '../../../lib/utils';
import DeleteConfirmationModal from '../../ui/DeleteConfirmationModal';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const BalanceView: React.FC = () => {
    const { financeData } = useData();
    const totalPaid = financeData.reduce((acc, item) => acc + item.paid, 0);
    const totalPending = financeData.reduce((acc, item) => acc + item.pending, 0);

    const columns: Column<FinanceData>[] = [
        { key: 'municipality', header: 'Município', className: 'font-medium text-gray-900' },
        { key: 'paid', header: 'Valor Pago', className: 'text-right text-green-600', render: (item) => formatCurrency(item.paid) },
        { key: 'pending', header: 'Valor Pendente', className: 'text-right text-yellow-600', render: (item) => formatCurrency(item.pending) },
        { key: 'total', header: 'Total', className: 'text-right font-semibold', render: (item) => formatCurrency(item.paid + item.pending) }
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <h3 className="text-gray-500 font-medium">Total Pago</h3>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
                </Card>
                <Card>
                    <h3 className="text-gray-500 font-medium">Total Pendente</h3>
                    <p className="text-3xl font-bold text-yellow-600">{formatCurrency(totalPending)}</p>
                </Card>
                <Card>
                    <h3 className="text-gray-500 font-medium">Balanço Geral</h3>
                    <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalPaid + totalPending)}</p>
                </Card>
            </div>

            <Card>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Balanço por Município</h2>
                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <BarChart data={financeData} margin={{ top: 20, right: 30, left: 50, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="municipality" />
                            <YAxis tickFormatter={(value) => `R$${Number(value) / 1000}k`} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Legend />
                            <Bar dataKey="paid" name="Pago" fill="#22c55e" />
                            <Bar dataKey="pending" name="Pendente" fill="#f59e0b" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <Card>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Detalhes Financeiros</h2>
                <DataTable columns={columns} data={financeData} emptyMessage="Nenhum dado financeiro encontrado." />
            </Card>
        </div>
    );
};

const AccountsView: React.FC = () => {
    const { transactions, financeData, addTransaction, updateTransaction, deleteTransaction } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Partial<Transaction>>({});
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const openModalForNew = () => {
        setEditingTransaction({ dueDate: new Date().toISOString().split('T')[0], status: 'pending', type: 'receivable' });
        setIsModalOpen(true);
    };

    const openModalForEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsModalOpen(true);
    };
    
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const { id, ...data } = editingTransaction;
        if (id) {
            updateTransaction(editingTransaction as Transaction);
        } else {
            addTransaction(data as Omit<Transaction, 'id'>);
        }
        setIsModalOpen(false);
    };

    const handleDeleteRequest = (id: number) => {
        setDeletingId(id);
        setIsConfirmOpen(true);
    };
    
    const handleConfirmDelete = () => {
        if (deletingId) {
            deleteTransaction(deletingId);
        }
        setIsConfirmOpen(false);
        setDeletingId(null);
    };

    const summary = useMemo(() => {
        return transactions.reduce((acc, t) => {
            if (t.status === 'pending') {
                if (t.type === 'receivable') acc.receivable += t.amount;
                if (t.type === 'payable') acc.payable += t.amount;
            }
            return acc;
        }, { receivable: 0, payable: 0 });
    }, [transactions]);
    
    const getMunicipalityName = (id?: number) => id ? financeData.find(f => f.id === id)?.municipality : 'N/A';

    const columns: Column<Transaction>[] = [
        { key: 'description', header: 'Descrição', className: 'font-medium text-gray-900'},
        { key: 'type', header: 'Tipo', render: t => t.type === 'receivable' ? <span className="text-green-600">A Receber</span> : <span className="text-red-600">A Pagar</span> },
        { key: 'amount', header: 'Valor', render: t => formatCurrency(t.amount), className: 'text-right' },
        { key: 'municipalityId', header: 'Município', render: t => getMunicipalityName(t.municipalityId) },
        { key: 'dueDate', header: 'Vencimento', render: t => formatDate(t.dueDate) },
        { key: 'status', header: 'Status', render: (t) => <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{t.status === 'paid' ? 'Pago' : 'Pendente'}</span> },
        { key: 'actions', header: 'Ações', className: 'text-right' }
    ];

    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <h3 className="text-gray-500 font-medium">Contas a Receber (Pendente)</h3>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(summary.receivable)}</p>
                </Card>
                <Card>
                    <h3 className="text-gray-500 font-medium">Contas a Pagar (Pendente)</h3>
                    <p className="text-3xl font-bold text-red-600">{formatCurrency(summary.payable)}</p>
                </Card>
                <Card>
                    <h3 className="text-gray-500 font-medium">Balanço Pendente</h3>
                    <p className="text-3xl font-bold text-blue-600">{formatCurrency(summary.receivable - summary.payable)}</p>
                </Card>
            </div>
            <Card>
                 <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Lançamentos Financeiros</h2>
                    <Button onClick={openModalForNew} className="w-full md:w-auto">
                        <PlusCircle size={16} className="mr-2"/> Adicionar Lançamento
                    </Button>
                </div>
                <DataTable columns={columns} data={transactions} onEdit={openModalForEdit} onDelete={handleDeleteRequest} emptyMessage="Nenhum lançamento encontrado." />
            </Card>

             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTransaction.id ? 'Editar Lançamento' : 'Adicionar Lançamento'}>
                <form onSubmit={handleSave} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-blue-700">Descrição</label>
                        <Input value={editingTransaction.description || ''} onChange={e => setEditingTransaction({...editingTransaction, description: e.target.value})} required/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-blue-700">Tipo</label>
                            <Select value={editingTransaction.type || ''} onChange={e => setEditingTransaction({...editingTransaction, type: e.target.value as TransactionType})} required>
                                <option value="receivable">A Receber</option>
                                <option value="payable">A Pagar</option>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-blue-700">Valor</label>
                            <Input type="number" value={editingTransaction.amount || ''} onChange={e => setEditingTransaction({...editingTransaction, amount: Number(e.target.value)})} required min="0" step="0.01"/>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-blue-700">Município (se aplicável)</label>
                        <Select value={editingTransaction.municipalityId || ''} onChange={e => setEditingTransaction({...editingTransaction, municipalityId: Number(e.target.value)})}>
                            <option value="">Nenhum</option>
                            {financeData.map(m => <option key={m.id} value={m.id}>{m.municipality}</option>)}
                        </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-blue-700">Data de Vencimento</label>
                            <Input type="date" value={editingTransaction.dueDate || ''} onChange={e => setEditingTransaction({...editingTransaction, dueDate: e.target.value})} required/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-blue-700">Status</label>
                            <Select value={editingTransaction.status || ''} onChange={e => setEditingTransaction({...editingTransaction, status: e.target.value as TransactionStatus})} required>
                                <option value="pending">Pendente</option>
                                <option value="paid">Pago</option>
                            </Select>
                        </div>
                    </div>
                    {editingTransaction.status === 'paid' && (
                         <div>
                            <label className="block text-sm font-medium text-blue-700">Data de Pagamento</label>
                            <Input type="date" value={editingTransaction.paymentDate || ''} onChange={e => setEditingTransaction({...editingTransaction, paymentDate: e.target.value})}/>
                        </div>
                    )}
                     <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">Salvar</Button>
                    </div>
                </form>
             </Modal>
             <DeleteConfirmationModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir este lançamento?" />
        </div>
    )
}


const FinanceTab: React.FC = () => {
    const [activeView, setActiveView] = useState('balance');

    return (
        <div className="space-y-6">
            <Card className="p-2">
                <div className="flex items-center justify-center space-x-2">
                    <Button variant={activeView === 'balance' ? 'primary' : 'secondary'} onClick={() => setActiveView('balance')} className="flex-1">Balanço por Município</Button>
                    <Button variant={activeView === 'accounts' ? 'primary' : 'secondary'} onClick={() => setActiveView('accounts')} className="flex-1">Contas a Pagar/Receber</Button>
                </div>
            </Card>

            {activeView === 'balance' && <BalanceView />}
            {activeView === 'accounts' && <AccountsView />}
        </div>
    );
};

export default FinanceTab;
