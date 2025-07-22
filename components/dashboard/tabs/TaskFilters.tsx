import React from 'react';
import { Employee } from '../../../types';
import Select from '../../ui/Select';
import Input from '../../ui/Input';

interface TaskFiltersProps {
  filters: { employee: string; status: string; date: string };
  setFilters: React.Dispatch<React.SetStateAction<{ employee: string; status: string; date: string }>>;
  employees: Employee[];
}

const TaskFilters: React.FC<TaskFiltersProps> = ({ filters, setFilters, employees }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
      <Select value={filters.employee} onChange={e => setFilters({...filters, employee: e.target.value})}>
        <option value="">Todos Funcionários</option>
        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
      </Select>
      <Select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
        <option value="">Todos Status</option>
        <option value="Pendente">Pendente</option>
        <option value="Em Andamento">Em Andamento</option>
        <option value="Concluída">Concluída</option>
      </Select>
      <Input type="date" value={filters.date} onChange={e => setFilters({...filters, date: e.target.value})}/>
    </div>
  );
};

export default TaskFilters;
