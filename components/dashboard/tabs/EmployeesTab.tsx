import React, { useState } from 'react';
import { Employee } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { DEPARTMENTS } from '../../../constants';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import { PlusCircle } from 'lucide-react';
import DataTable, { Column } from '../../ui/DataTable';
import DeleteConfirmationModal from '../../ui/DeleteConfirmationModal';

interface EmployeesTabProps {}

const EmployeeForm: React.FC<{
  employee: Partial<Employee>;
  setEmployee: React.Dispatch<React.SetStateAction<Partial<Employee>>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}> = ({ employee, setEmployee, onSubmit, onCancel }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-blue-700">Nome Completo</label>
      <Input
        type="text"
        value={employee.name || ''}
        onChange={(e) => setEmployee({ ...employee, name: e.target.value })}
        required
      />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-blue-700">Cargo</label>
        <Input
          type="text"
          value={employee.position || ''}
          onChange={(e) => setEmployee({ ...employee, position: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-blue-700">Departamento</label>
        <Select
          value={employee.department || ''}
          onChange={(e) => setEmployee({ ...employee, department: e.target.value })}
          required
        >
          <option value="">Selecione</option>
          {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
        </Select>
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-blue-700">Email</label>
      <Input
        type="email"
        value={employee.email || ''}
        onChange={(e) => setEmployee({ ...employee, email: e.target.value })}
        required
      />
    </div>
    <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
    </div>
  </form>
);

const EmployeesTab: React.FC<EmployeesTabProps> = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee>>({});

  const openModalForNew = () => {
    setEditingEmployee({});
    setIsModalOpen(true);
  };

  const openModalForEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const { id, ...employeeData } = editingEmployee;
    if (id) {
      updateEmployee(editingEmployee as Employee);
    } else {
      addEmployee(employeeData as Omit<Employee, 'id'>);
    }
    closeModal();
  };

  const handleDeleteRequest = (id: number) => {
    setDeletingId(id);
    setIsConfirmModalOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (deletingId !== null) {
        deleteEmployee(deletingId);
    }
    setIsConfirmModalOpen(false);
    setDeletingId(null);
  };

  const columns: Column<Employee>[] = [
    { key: 'name', header: 'Nome', className: 'font-medium text-gray-900' },
    { key: 'position', header: 'Cargo' },
    { key: 'department', header: 'Departamento' },
    { key: 'email', header: 'Email' },
    { key: 'actions', header: 'Ações', className: 'text-right' },
  ];

  return (
    <Card>
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Gerenciar Funcionários</h2>
        <Button onClick={openModalForNew} className="w-full md:w-auto">
            <PlusCircle size={16} className="mr-2"/>
            Adicionar Funcionário
        </Button>
      </div>
      
      <DataTable
        columns={columns}
        data={employees}
        onEdit={openModalForEdit}
        onDelete={handleDeleteRequest}
        emptyMessage="Nenhum funcionário encontrado."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingEmployee.id ? 'Editar Funcionário' : 'Adicionar Funcionário'}
        size="lg"
      >
        <EmployeeForm employee={editingEmployee} setEmployee={setEditingEmployee} onSubmit={handleSaveEmployee} onCancel={closeModal} />
      </Modal>

      <DeleteConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita."
      />
    </Card>
  );
};

export default EmployeesTab;
