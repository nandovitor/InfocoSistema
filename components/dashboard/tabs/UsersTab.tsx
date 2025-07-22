
import React, { useState, useEffect } from 'react';
import { SystemUser, UserRole } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { DEPARTMENTS, ROLE_LABELS } from '../../../constants';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import { PlusCircle } from 'lucide-react';
import DataTable, { Column } from '../../ui/DataTable';
import DeleteConfirmationModal from '../../ui/DeleteConfirmationModal';

interface UsersTabProps {}

const UserForm: React.FC<{
  user: Partial<SystemUser>;
  setUser: React.Dispatch<React.SetStateAction<Partial<SystemUser>>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing: boolean;
}> = ({ user, setUser, onSubmit, onCancel, isEditing }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-blue-700">Nome Completo</label>
      <Input
        type="text"
        placeholder='Nome do Usuário'
        value={user.name || ''}
        onChange={(e) => setUser({ ...user, name: e.target.value })}
        required
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-blue-700">Email (Login)</label>
      <Input
        type="email"
        placeholder='email@exemplo.com'
        value={user.email || ''}
        onChange={(e) => setUser({ ...user, email: e.target.value })}
        required
      />
    </div>
     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label className="block text-sm font-medium text-blue-700">Função</label>
            <Select
            value={user.role || ''}
            onChange={(e) => setUser({ ...user, role: e.target.value as UserRole })}
            required
            >
            <option value="">Selecione uma função</option>
            {Object.entries(ROLE_LABELS).map(([role, label]) => (
                <option key={role} value={role}>{label}</option>
            ))}
            </Select>
      </div>
      <div>
        <label className="block text-sm font-medium text-blue-700">Departamento</label>
        <Select
          value={user.department || ''}
          onChange={(e) => setUser({ ...user, department: e.target.value })}
          required
        >
          <option value="">Selecione um departamento</option>
          {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
        </Select>
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-blue-700">Senha</label>
      <Input
        type="password"
        placeholder={isEditing ? 'Deixe em branco para não alterar' : 'Senha forte'}
        value={user.password || ''}
        onChange={(e) => setUser({ ...user, password: e.target.value })}
        required={!isEditing}
      />
    </div>
    <div className="flex justify-end gap-4 pt-4 border-t mt-6">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{isEditing ? 'Salvar Alterações' : 'Adicionar Usuário'}</Button>
    </div>
  </form>
);

const UsersTab: React.FC<UsersTabProps> = () => {
  const { systemUsers, addUser, updateUser, deleteUser } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<Partial<SystemUser>>({});

  const openModalForNew = () => {
    setEditingUser({});
    setIsModalOpen(true);
  };

  const openModalForEdit = (user: SystemUser) => {
    // Exclude password from the form state for editing
    const { password, ...userToEdit } = user;
    setEditingUser(userToEdit);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingUser({});
    setIsModalOpen(false);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const { id, ...userData } = editingUser;

    if (id) {
      updateUser(editingUser as SystemUser);
    } else {
      addUser(userData as Omit<SystemUser, 'id'>);
    }
    closeModal();
  };

  const handleDeleteRequest = (id: number) => {
    setDeletingId(id);
    setIsConfirmModalOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (deletingId !== null) {
        deleteUser(deletingId);
    }
    setIsConfirmModalOpen(false);
    setDeletingId(null);
  };

  const columns: Column<SystemUser>[] = [
    { key: 'name', header: 'Nome', className: 'font-medium text-gray-900' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Função', render: (user) => ROLE_LABELS[user.role] || user.role },
    { key: 'department', header: 'Departamento' },
    { key: 'actions', header: 'Ações', className: 'text-right' },
  ];

  return (
    <Card>
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Gerenciar Usuários do Sistema</h2>
        <Button onClick={openModalForNew} className="w-full md:w-auto">
            <PlusCircle size={16} className="mr-2"/>
            Adicionar Usuário
        </Button>
      </div>
      
      <DataTable
        columns={columns}
        data={systemUsers}
        onEdit={openModalForEdit}
        onDelete={handleDeleteRequest}
        emptyMessage="Nenhum usuário encontrado."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingUser.id ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
        size="lg"
      >
        <UserForm 
            user={editingUser} 
            setUser={setEditingUser} 
            onSubmit={handleSaveUser} 
            onCancel={closeModal}
            isEditing={!!editingUser.id}
        />
      </Modal>

      <DeleteConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão de Usuário"
        message="Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita e removerá permanentemente seu acesso."
      />
    </Card>
  );
};

export default UsersTab;
