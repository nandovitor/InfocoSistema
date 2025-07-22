
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

import Sidebar from './Sidebar';
import Header from './Header';
import DashboardTab from './tabs/DashboardTab';
import EmployeesTab from './tabs/EmployeesTab';
import TasksTab from './tabs/TasksTab';
import FinanceTab from './tabs/FinanceTab';
import ReportsTab from './tabs/ReportsTab';
import MunicipalitiesTab from './tabs/MunicipalitiesTab';
import SettingsTab from './tabs/SettingsTab';
import HumanResourcesTab from './tabs/HumanResourcesTab';
import InternalExpensesTab from './tabs/InternalExpensesTab';
import AssetsTab from './tabs/AssetsTab';
import DatabaseTab from './tabs/DatabaseTab';
import NotesTab from './tabs/NotesTab';
import UsersTab from './tabs/UsersTab';
import UpdatesFeedTab from './tabs/UpdatesFeedTab';
import AiAssistant from '../ai/AiAssistant';
import { Bot } from 'lucide-react';
import { PermissionSet } from '../../types';
import { cn } from '../../lib/utils';

const DashboardLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const authContext = useContext(AuthContext);
  const { permissions } = useData();
  const user = authContext?.user;
  const userPermissions = user ? permissions[user.role] : null;

  useEffect(() => {
    if (!userPermissions) return;

    const tabPermissionMap: Record<string, keyof PermissionSet> = {
        dashboard: 'canViewDashboard',
        'updates-feed': 'canViewDashboard',
        database: 'canManageDocuments',
        employees: 'canManageEmployees',
        tasks: 'canManageTasks',
        finance: 'canManageFinance',
        notes: 'canManageNotes',
        hr: 'canManageHR',
        'internal-expenses': 'canManageInternalExpenses',
        assets: 'canManageAssets',
        municipalities: 'canManageFinance',
        reports: 'canViewReports',
        settings: 'canManageSettings',
        users: 'canManageUsers',
    };
    
    const currentTabPermission = tabPermissionMap[activeTab];

    if (currentTabPermission && !userPermissions[currentTabPermission]) {
        setActiveTab('dashboard');
    }
  }, [activeTab, userPermissions]);

  const renderContent = () => {
    if (!userPermissions) return <div className="p-6">Carregando permissões...</div>;

    const tabs: Record<string, { component: React.ReactNode, permission: keyof PermissionSet }> = {
        dashboard: { component: <DashboardTab setActiveTab={setActiveTab} />, permission: 'canViewDashboard' },
        'updates-feed': { component: <UpdatesFeedTab />, permission: 'canViewDashboard' },
        database: { component: <DatabaseTab />, permission: 'canManageDocuments' },
        employees: { component: <EmployeesTab />, permission: 'canManageEmployees' },
        tasks: { component: <TasksTab />, permission: 'canManageTasks' },
        finance: { component: <FinanceTab />, permission: 'canManageFinance' },
        notes: { component: <NotesTab />, permission: 'canManageNotes' },
        hr: { component: <HumanResourcesTab />, permission: 'canManageHR' },
        'internal-expenses': { component: <InternalExpensesTab />, permission: 'canManageInternalExpenses' },
        assets: { component: <AssetsTab />, permission: 'canManageAssets' },
        municipalities: { component: <MunicipalitiesTab />, permission: 'canManageFinance' },
        reports: { component: <ReportsTab />, permission: 'canViewReports' },
        settings: { component: <SettingsTab />, permission: 'canManageSettings' },
        users: { component: <UsersTab />, permission: 'canManageUsers' },
    }
    
    const currentTabInfo = tabs[activeTab];

    if(currentTabInfo && userPermissions[currentTabInfo.permission]) {
        return currentTabInfo.component;
    }
    
    // Fallback to dashboard if something goes wrong or access is denied
    return <DashboardTab setActiveTab={setActiveTab} />;
  };

  const pageTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    'updates-feed': 'Notas de Atualização',
    database: 'Base de Dados de Municípios',
    employees: 'Gerenciar Funcionários',
    tasks: 'Gerenciar Tarefas',
    finance: 'Balanço Financeiro',
    notes: 'Gestão de Notas de Pagamento',
    hr: 'Recursos Humanos',
    'internal-expenses': 'ADM Infoco - Gastos Internos',
    assets: 'Patrimônio da Empresa',
    municipalities: 'Gerenciar Municípios',
    reports: 'Relatórios e Análises',
    settings: 'Configurações Gerais',
    users: 'Gerenciamento de Usuários'
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header title={pageTitles[activeTab] ?? 'Dashboard'} onMenuClick={() => setIsSidebarOpen(true)} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6">
          <div className="container mx-auto max-w-7xl">
            {renderContent()}
          </div>
        </main>
         {isSidebarOpen && (
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" 
                onClick={() => setIsSidebarOpen(false)}
                aria-hidden="true"
            ></div>
        )}
      </div>
      
      <button 
        onClick={() => setIsAiAssistantOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform duration-300 z-40"
        aria-label="Abrir Assistente de IA"
      >
        <Bot size={24} />
      </button>

      <AiAssistant
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
      />
    </div>
  );
};

export default DashboardLayout;