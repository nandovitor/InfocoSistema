import React, { useState, useMemo } from 'react';
import { Asset, AssetStatus, MaintenanceRecord, Employee } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { ASSET_STATUSES } from '../../../constants';
import { formatDate, getEmployeeName } from '../../../lib/utils';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import { PlusCircle, Wrench } from 'lucide-react';
import DataTable, { Column } from '../../ui/DataTable';
import DeleteConfirmationModal from '../../ui/DeleteConfirmationModal';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// Maintenance Log Modal
const MaintenanceLogModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    asset: Asset;
    onAddRecord: (assetId: number, record: Omit<MaintenanceRecord, 'id'>) => void;
}> = ({ isOpen, onClose, asset, onAddRecord }) => {
    const [newRecord, setNewRecord] = useState<Omit<MaintenanceRecord, 'id'>>({ date: new Date().toISOString().split('T')[0], description: '', cost: 0 });

    const handleAdd = () => {
        if (newRecord.description && newRecord.cost >= 0) {
            onAddRecord(asset.id, newRecord);
            setNewRecord({ date: new Date().toISOString().split('T')[0], description: '', cost: 0 });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Histórico de Manutenção: ${asset.name}`} size="lg">
            <div className="space-y-4">
                {/* Add new record form */}
                <div className="p-4 border rounded-lg space-y-3">
                    <h4 className="font-semibold">Adicionar Novo Registro</h4>
                    <Input type="date" value={newRecord.date} onChange={e => setNewRecord({...newRecord, date: e.target.value})} />
                    <Input placeholder="Descrição do serviço" value={newRecord.description} onChange={e => setNewRecord({...newRecord, description: e.target.value})} />
                    <Input type="number" placeholder="Custo" value={newRecord.cost} onChange={e => setNewRecord({...newRecord, cost: Number(e.target.value)})} />
                    <Button onClick={handleAdd}>Adicionar Registro</Button>
                </div>
                {/* Log history */}
                <div className="max-h-64 overflow-y-auto">
                    {asset.maintenanceLog.length > 0 ? (
                        asset.maintenanceLog.map(log => (
                            <div key={log.id} className="p-3 border-b">
                                <p className="font-semibold">{log.description}</p>
                                <p className="text-sm text-gray-600">Data: {formatDate(log.date)} | Custo: {formatCurrency(log.cost)}</p>
                            </div>
                        ))
                    ) : <p className="text-gray-500 text-center p-4">Nenhum registro de manutenção.</p>}
                </div>
            </div>
        </Modal>
    );
};

// Form Component
const AssetForm: React.FC<{
  asset: Partial<Asset>;
  setAsset: React.Dispatch<React.SetStateAction<Partial<Asset>>>;
  employees: Employee[];
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}> = ({ asset, setAsset, employees, onSubmit, onCancel }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <Input placeholder="Nome do Item" type="text" value={asset.name || ''} onChange={e => setAsset({ ...asset, name: e.target.value })} required />
    <Input placeholder="Descrição (Modelo, marca, etc.)" type="text" value={asset.description || ''} onChange={e => setAsset({ ...asset, description: e.target.value })} />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input type="date" value={asset.purchaseDate || ''} onChange={e => setAsset({ ...asset, purchaseDate: e.target.value })} required />
      <Input placeholder="Valor de Compra" type="number" value={asset.purchaseValue || ''} onChange={e => setAsset({ ...asset, purchaseValue: Number(e.target.value) })} min="0" step="0.01" required />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input placeholder="Localização" type="text" value={asset.location || ''} onChange={e => setAsset({ ...asset, location: e.target.value })} required />
        <Select value={asset.status || ''} onChange={e => setAsset({ ...asset, status: e.target.value as AssetStatus })} required>
            <option value="">Selecione o status</option>
            {ASSET_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
    </div>
     <div>
        <label className="block text-sm font-medium text-blue-700">Atribuído a (Opcional)</label>
        <Select value={asset.assignedToEmployeeId || ''} onChange={e => setAsset({ ...asset, assignedToEmployeeId: Number(e.target.value) || undefined })}>
            <option value="">Não atribuído</option>
            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
        </Select>
    </div>
    <div className="flex justify-end gap-4 pt-4">
      <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
      <Button type="submit">Salvar Item</Button>
    </div>
  </form>
);

const AssetsTab: React.FC = () => {
  const { assets, employees, addAsset, updateAsset, deleteAsset, addMaintenanceRecord } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingAsset, setEditingAsset] = useState<Partial<Asset>>({});
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  
  const summary = useMemo(() => ({
    totalValue: assets.reduce((sum, asset) => sum + asset.purchaseValue, 0),
    totalItems: assets.length
  }), [assets]);

  const openModalForNew = () => {
    setEditingAsset({ purchaseDate: new Date().toISOString().split('T')[0], status: 'Em Uso' });
    setIsModalOpen(true);
  };
  const openModalForEdit = (asset: Asset) => { setEditingAsset(asset); setIsModalOpen(true); };
  const openMaintModal = (asset: Asset) => { setSelectedAsset(asset); setIsMaintModalOpen(true); };
  
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    editingAsset.id ? updateAsset(editingAsset as Asset) : addAsset(editingAsset as Omit<Asset, 'id'|'maintenanceLog'>);
    setIsModalOpen(false);
  };
  const handleDeleteRequest = (id: number) => { setDeletingId(id); setIsConfirmModalOpen(true); };
  const handleConfirmDelete = () => { if (deletingId) deleteAsset(deletingId); setIsConfirmModalOpen(false); };

  const columns: Column<Asset>[] = [
    { key: 'name', header: 'Item', className: 'font-medium text-gray-900' },
    { key: 'assignedToEmployeeId', header: 'Atribuído a', render: (item) => item.assignedToEmployeeId ? getEmployeeName(item.assignedToEmployeeId, employees) : 'N/A' },
    { key: 'purchaseValue', header: 'Valor', render: (item) => formatCurrency(item.purchaseValue), className: 'text-right' },
    { key: 'location', header: 'Localização' },
    { key: 'status', header: 'Status', render: (item) => <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'Em Uso' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{item.status}</span> },
    { key: 'actions', header: 'Ações', className: 'text-right', render: (item) => (
        <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => openMaintModal(item)} className="p-2 h-auto" aria-label="Manutenção"><Wrench size={16} /></Button>
            {/* Base actions are now part of DataTable default render */}
        </div>
    )},
  ];

  return (
    <div className="space-y-6">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card><h3 className="text-gray-500 font-medium">Total de Itens</h3><p className="text-3xl font-bold text-blue-600">{summary.totalItems}</p></Card>
        <Card><h3 className="text-gray-500 font-medium">Valor Total do Patrimônio</h3><p className="text-3xl font-bold text-green-600">{formatCurrency(summary.totalValue)}</p></Card>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Gerenciamento de Patrimônio</h2>
          <Button onClick={openModalForNew} className="w-full md:w-auto"><PlusCircle size={16} className="mr-2" />Adicionar Patrimônio</Button>
        </div>
        <DataTable columns={columns} data={assets} onEdit={openModalForEdit} onDelete={handleDeleteRequest} emptyMessage="Nenhum item de patrimônio encontrado." />
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAsset.id ? 'Editar Item' : 'Adicionar Item ao Patrimônio'} size="lg">
        <AssetForm asset={editingAsset} setAsset={setEditingAsset} employees={employees} onSubmit={handleSave} onCancel={() => setIsModalOpen(false)} />
      </Modal>

      {selectedAsset && <MaintenanceLogModal isOpen={isMaintModalOpen} onClose={() => setIsMaintModalOpen(false)} asset={selectedAsset} onAddRecord={addMaintenanceRecord} />}

      <DeleteConfirmationModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir este item do patrimônio?" />
    </div>
  );
};

export default AssetsTab;
