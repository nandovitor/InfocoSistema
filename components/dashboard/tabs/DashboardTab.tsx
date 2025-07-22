
import React, { useMemo } from 'react';
import { useData } from '../../../contexts/DataContext';
import Card from '../../ui/Card';
import { Users, ListChecks, CheckCircle, Clock } from 'lucide-react';
import Calendar, { CalendarEvent } from '../Calendar';
import NewsFeed from '../NewsFeed';

interface DashboardTabProps {
  setActiveTab: (tab: string) => void;
}

const StatCard: React.FC<{ icon: React.ElementType; title: string; value: string | number; color: string; }> = ({ icon: Icon, title, value, color }) => (
  <Card className={`relative overflow-hidden border-l-4 ${color}`}>
    <div className="flex items-center">
      <div className={`p-3 rounded-full bg-opacity-20 ${color.replace('border-', 'bg-').replace('-500', '-100')}`}>
        <Icon className={`w-6 h-6 ${color.replace('border-', 'text-')}`} />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
        <p className="text-xl sm:text-2xl font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  </Card>
);

const DashboardTab: React.FC<DashboardTabProps> = ({ setActiveTab }) => {
  const { employees, tasks, financeData } = useData();

  const stats = useMemo(() => ({
    employees: employees.length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter(task => task.status === 'Concluída').length,
    pendingTasks: tasks.filter(task => task.status !== 'Concluída').length,
  }), [employees, tasks]);

  const calendarEvents = useMemo(() => {
    const contractEvents: CalendarEvent[] = financeData.map(item => ({
      date: item.contractEndDate,
      color: 'red',
      title: `Vencimento Contrato: ${item.municipality}`,
      type: 'contract',
      id: item.id
    }));

    const taskEvents: CalendarEvent[] = tasks.map(task => ({
      date: task.date,
      color: 'blue',
      title: `Tarefa: ${task.title}`,
      type: 'task',
      id: task.id
    }));

    return [...contractEvents, ...taskEvents];
  }, [financeData, tasks]);

  const handleCalendarEventClick = (event: CalendarEvent) => {
    if (event.type === 'contract') {
        setActiveTab('municipalities');
    } else if (event.type === 'task') {
        setActiveTab('tasks');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} title="Funcionários Ativos" value={stats.employees} color="border-blue-500" />
        <StatCard icon={ListChecks} title="Tarefas Totais" value={stats.totalTasks} color="border-purple-500" />
        <StatCard icon={CheckCircle} title="Tarefas Concluídas" value={stats.completedTasks} color="border-green-500" />
        <StatCard icon={Clock} title="Tarefas Pendentes" value={stats.pendingTasks} color="border-yellow-500" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
            <Calendar 
                title="Calendário de Eventos" 
                events={calendarEvents} 
                onEventClick={handleCalendarEventClick}
            />
        </div>
        <div className="lg:col-span-3">
            <NewsFeed />
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;