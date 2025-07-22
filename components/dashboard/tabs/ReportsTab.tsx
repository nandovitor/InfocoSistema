import React, { useState, useMemo, useContext } from 'react';
import { useData } from '../../../contexts/DataContext';
import { DEPARTMENTS } from '../../../constants';
import { AuthContext } from '../../../contexts/AuthContext';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Select from '../../ui/Select';
import { generatePdfReport } from '../../../lib/pdfGenerator';
import Spinner from '../../ui/Spinner';
import { FileDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ReportsTabProps {}

const ReportsTab: React.FC<ReportsTabProps> = () => {
  const { tasks, employees } = useData();
  const [filters, setFilters] = useState({ period: '30', department: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const authContext = useContext(AuthContext);

  const filteredData = useMemo(() => {
    let filteredTasks = [...tasks];
    
    if (filters.period !== 'all') {
      const days = parseInt(filters.period, 10);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filteredTasks = filteredTasks.filter(task => new Date(task.date) >= cutoffDate);
    }
    
    if (filters.department) {
      const employeesInDept = employees.filter(emp => emp.department === filters.department).map(emp => emp.id);
      filteredTasks = filteredTasks.filter(task => employeesInDept.includes(task.employeeId));
    }

    const totalHours = filteredTasks.reduce((sum, task) => sum + task.hours, 0);
    const completedTasks = filteredTasks.filter(task => task.status === 'Concluída').length;
    
    const employeeReports = employees
      .filter(emp => !filters.department || emp.department === filters.department)
      .map(employee => {
        const employeeTasks = filteredTasks.filter(task => task.employeeId === employee.id);
        return {
          name: employee.name,
          totalHours: employeeTasks.reduce((sum, task) => sum + task.hours, 0),
          completedTasks: employeeTasks.filter(task => task.status === 'Concluída').length
        };
      }).filter(report => report.totalHours > 0 || report.completedTasks > 0);

    return {
      totalHours,
      completionRate: filteredTasks.length ? Math.round((completedTasks / filteredTasks.length) * 100) : 0,
      employeeReports
    };
  }, [tasks, employees, filters]);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
        const periodText = document.querySelector(`select option[value="${filters.period}"]`)?.textContent || 'Período selecionado';
        const departmentText = filters.department || 'Todos os Departamentos';
        await generatePdfReport('report-content', authContext?.user || null, periodText, departmentText);
    } catch(e) {
        console.error("PDF Generation failed", e);
        alert("Falha ao gerar o PDF. Verifique o console para mais detalhes.");
    } finally {
        setIsGenerating(false);
    }
  };

  const ReportContentForPDF = () => (
    <div id="report-content" style={{ display: 'none', padding: '20px', background: 'white', color: 'black'}}>
      <h3 style={{fontSize: '18px', fontWeight: 'bold', marginBottom: '16px'}}>Resumo do Relatório</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px'}}>
        <div style={{border: '1px solid #ddd', padding: '12px', borderRadius: '8px'}}>
          <p style={{fontSize: '14px', color: '#555'}}>Total de Horas</p>
          <p style={{fontSize: '24px', fontWeight: 'bold'}}>{filteredData.totalHours.toFixed(1)}h</p>
        </div>
        <div style={{border: '1px solid #ddd', padding: '12px', borderRadius: '8px'}}>
          <p style={{fontSize: '14px', color: '#555'}}>Taxa de Conclusão</p>
          <p style={{fontSize: '24px', fontWeight: 'bold'}}>{filteredData.completionRate}%</p>
        </div>
      </div>
      <h3 style={{fontSize: '18px', fontWeight: 'bold', marginBottom: '16px'}}>Horas por Funcionário</h3>
       <div style={{ width: '980px', height: '400px' }}>
            {/* Use non-lazy components for PDF generation to avoid capturing fallbacks */}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredData.employeeReports}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalHours" name="Horas Trabalhadas" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
       </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-sm font-medium text-blue-700">Período</label>
            <Select value={filters.period} onChange={e => setFilters({ ...filters, period: e.target.value })}>
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="all">Todo o período</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-blue-700">Departamento</label>
            <Select value={filters.department} onChange={e => setFilters({ ...filters, department: e.target.value })}>
              <option value="">Todos</option>
              {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </Select>
          </div>
          <Button onClick={handleGenerateReport} isLoading={isGenerating}>
            <FileDown size={16} className="mr-2"/>
            Gerar Relatório PDF
          </Button>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumo do Período</h3>
            <div className="flex justify-around text-center">
                <div>
                    <p className="text-4xl font-bold text-blue-600">{filteredData.totalHours.toFixed(1)}</p>
                    <p className="text-sm text-gray-500">Total de Horas</p>
                </div>
                 <div>
                    <p className="text-4xl font-bold text-green-600">{filteredData.completionRate}%</p>
                    <p className="text-sm text-gray-500">Taxa de Conclusão</p>
                </div>
            </div>
        </Card>
        <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Horas por Funcionário</h3>
            <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredData.employeeReports} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <XAxis dataKey="name" fontSize={10} interval={0} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="totalHours" name="Horas Trabalhadas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
      </div>
      <ReportContentForPDF />
    </div>
  );
};

export default ReportsTab;
