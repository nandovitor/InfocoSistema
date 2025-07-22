
import React, { createContext, useContext, useState, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Employee, Task, FinanceData, Permissions, PermissionSet, UserRole, EmployeeExpense, InternalExpense, Asset, DocumentData, ManagedFile, PaymentNoteData, PaymentNote, Notification, Supplier, Transaction, PayrollRecord, LeaveRequest, MaintenanceRecord, SystemUser, UpdatePost, ExternalSystem, NewsArticle, GroundingSource } from '../types';
import { DEFAULT_EMPLOYEES, DEFAULT_TASKS, DEFAULT_FINANCE_DATA, DEFAULT_PERMISSIONS, DEFAULT_EMPLOYEE_EXPENSES, DEFAULT_INTERNAL_EXPENSES, DEFAULT_ASSETS, DEFAULT_DOCUMENTS, DEFAULT_PAYMENT_NOTES, DEFAULT_NOTIFICATIONS, DEFAULT_SUPPLIERS, DEFAULT_TRANSACTIONS, DEFAULT_PAYROLLS, DEFAULT_LEAVE_REQUESTS, DEFAULT_SYSTEM_USERS, DEFAULT_UPDATE_POSTS, DEFAULT_EXTERNAL_SYSTEMS } from '../constants';
import { generateId } from '../lib/utils';

interface DataContextType {
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (employee: Employee) => void;
  deleteEmployee: (employeeId: number) => void;
  
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: number) => void;

  financeData: FinanceData[];
  addMunicipality: (municipality: Omit<FinanceData, 'id'>) => void;
  updateMunicipality: (municipality: FinanceData) => void;
  deleteMunicipality: (municipalityId: number) => void;

  employeeExpenses: EmployeeExpense[];
  addEmployeeExpense: (expense: Omit<EmployeeExpense, 'id'>) => void;
  updateEmployeeExpense: (expense: EmployeeExpense) => void;
  deleteEmployeeExpense: (expenseId: number) => void;

  internalExpenses: InternalExpense[];
  addInternalExpense: (expense: Omit<InternalExpense, 'id'>) => void;
  updateInternalExpense: (expense: InternalExpense) => void;
  deleteInternalExpense: (expenseId: number) => void;

  assets: Asset[];
  addAsset: (asset: Omit<Asset, 'id' | 'maintenanceLog'>) => void;
  updateAsset: (asset: Asset) => void;
  deleteAsset: (assetId: number) => void;
  addMaintenanceRecord: (assetId: number, record: Omit<MaintenanceRecord, 'id'>) => void;

  documents: DocumentData;
  addFile: (municipality: string, folder: string, file: Omit<ManagedFile, 'id'>) => void;
  deleteFile: (municipality: string, folder: string, fileId: number) => void;

  paymentNotes: PaymentNoteData;
  addPaymentNote: (municipality: string, note: Omit<PaymentNote, 'id'>) => void;
  deletePaymentNote: (municipality: string, noteId: number) => void;

  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'date'>) => void;
  markNotificationAsRead: (id: number) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: number) => void;

  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (supplierId: number) => void;

  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (transactionId: number) => void;

  payrolls: PayrollRecord[];
  addPayroll: (payroll: Omit<PayrollRecord, 'id'>) => void;
  deletePayroll: (payrollId: number) => void;

  leaveRequests: LeaveRequest[];
  addLeaveRequest: (request: Omit<LeaveRequest, 'id'>) => void;
  updateLeaveRequest: (request: LeaveRequest) => void;
  
  systemUsers: SystemUser[];
  addUser: (user: Omit<SystemUser, 'id'>) => void;
  updateUser: (user: SystemUser) => void;
  deleteUser: (userId: number) => void;

  updatePosts: UpdatePost[];
  addUpdatePost: (post: Omit<UpdatePost, 'id' | 'createdAt'>) => void;
  updateUpdatePost: (post: UpdatePost) => void;
  deleteUpdatePost: (postId: number) => void;
  
  externalSystems: ExternalSystem[];
  addExternalSystem: (system: Omit<ExternalSystem, 'id'>) => void;
  updateExternalSystem: (system: ExternalSystem) => void;
  deleteExternalSystem: (systemId: number) => void;
  
  news: NewsArticle[];
  newsSources: GroundingSource[];
  isNewsLoading: boolean;
  newsError: string | null;
  fetchNews: () => void;

  permissions: Permissions;
  updatePermissions: (role: UserRole, permissionKey: keyof PermissionSet, value: boolean) => void;
  
  loginScreenImageUrl: string | null;
  updateLoginScreenImage: (imageUrl: string | null) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useLocalStorage<Employee[]>('infoco_employees', DEFAULT_EMPLOYEES);
  const [tasks, setTasks] = useLocalStorage<Task[]>('infoco_tasks', DEFAULT_TASKS);
  const [financeData, setFinanceData] = useLocalStorage<FinanceData[]>('infoco_finance', DEFAULT_FINANCE_DATA);
  const [permissions, setPermissions] = useLocalStorage<Permissions>('infoco_permissions', DEFAULT_PERMISSIONS);
  const [employeeExpenses, setEmployeeExpenses] = useLocalStorage<EmployeeExpense[]>('infoco_employee_expenses', DEFAULT_EMPLOYEE_EXPENSES);
  const [internalExpenses, setInternalExpenses] = useLocalStorage<InternalExpense[]>('infoco_internal_expenses', DEFAULT_INTERNAL_EXPENSES);
  const [assets, setAssets] = useLocalStorage<Asset[]>('infoco_assets', DEFAULT_ASSETS);
  const [documents, setDocuments] = useLocalStorage<DocumentData>('infoco_documents', DEFAULT_DOCUMENTS);
  const [paymentNotes, setPaymentNotes] = useLocalStorage<PaymentNoteData>('infoco_payment_notes', DEFAULT_PAYMENT_NOTES);
  const [notifications, setNotifications] = useLocalStorage<Notification[]>('infoco_notifications', DEFAULT_NOTIFICATIONS);
  const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('infoco_suppliers', DEFAULT_SUPPLIERS);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('infoco_transactions', DEFAULT_TRANSACTIONS);
  const [payrolls, setPayrolls] = useLocalStorage<PayrollRecord[]>('infoco_payrolls', DEFAULT_PAYROLLS);
  const [leaveRequests, setLeaveRequests] = useLocalStorage<LeaveRequest[]>('infoco_leave_requests', DEFAULT_LEAVE_REQUESTS);
  const [updatePosts, setUpdatePosts] = useLocalStorage<UpdatePost[]>('infoco_update_posts', DEFAULT_UPDATE_POSTS);
  const [loginScreenImageUrl, setLoginScreenImageUrl] = useLocalStorage<string | null>('infoco_login_image', null);
  const [systemUsers, setSystemUsers] = useLocalStorage<SystemUser[]>('infoco_system_users', DEFAULT_SYSTEM_USERS);
  const [externalSystems, setExternalSystems] = useLocalStorage<ExternalSystem[]>('infoco_external_systems', DEFAULT_EXTERNAL_SYSTEMS);
  
  // News Feed State
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [newsSources, setNewsSources] = useState<GroundingSource[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState<boolean>(false);
  const [newsError, setNewsError] = useState<string | null>(null);


  const fetchNews = useCallback(async () => {
    setIsNewsLoading(true);
    setNewsError(null);
    try {
        const response = await fetch('/api/news');
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Falha ao buscar notícias.');
        }
        const data = await response.json();
        setNews(data.articles || []);
        setNewsSources(data.sources || []);
    } catch (err: any) {
        console.error("Fetch News Error:", err);
        setNewsError(err.message);
        setNews([]);
        setNewsSources([]);
    } finally {
        setIsNewsLoading(false);
    }
  }, []);

  const updateLoginScreenImage = (imageUrl: string | null) => {
    setLoginScreenImageUrl(imageUrl);
  };
  
  // Employee CRUD
  const addEmployee = (employee: Omit<Employee, 'id'>) => {
    setEmployees(prev => [...prev, { ...employee, id: generateId() }]);
  };
  const updateEmployee = (updatedEmployee: Employee) => {
    setEmployees(prev => prev.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp));
  };
  const deleteEmployee = (employeeId: number) => {
    setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
  };

  // Task CRUD
  const addTask = (task: Omit<Task, 'id'>) => {
    setTasks(prev => [...prev, { ...task, id: generateId() }]);
  };
  const updateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };
  const deleteTask = (taskId: number) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Municipality CRUD
  const addMunicipality = (municipality: Omit<FinanceData, 'id'>) => {
    setFinanceData(prev => [...prev, { ...municipality, id: generateId() }]);
  };
  const updateMunicipality = (updatedMunicipality: FinanceData) => {
    setFinanceData(prev => prev.map(m => m.id === updatedMunicipality.id ? updatedMunicipality : m));
  };
  const deleteMunicipality = (municipalityId: number) => {
    setFinanceData(prev => prev.filter(m => m.id !== municipalityId));
  };

  // Employee Expense CRUD
  const addEmployeeExpense = (expense: Omit<EmployeeExpense, 'id'>) => {
    setEmployeeExpenses(prev => [...prev, { ...expense, id: generateId() }]);
  };
  const updateEmployeeExpense = (updatedExpense: EmployeeExpense) => {
    setEmployeeExpenses(prev => prev.map(exp => exp.id === updatedExpense.id ? updatedExpense : exp));
  };
  const deleteEmployeeExpense = (expenseId: number) => {
    setEmployeeExpenses(prev => prev.filter(exp => exp.id !== expenseId));
  };
  
  // Internal Expense CRUD
  const addInternalExpense = (expense: Omit<InternalExpense, 'id'>) => {
    setInternalExpenses(prev => [...prev, { ...expense, id: generateId() }]);
  };
  const updateInternalExpense = (updatedExpense: InternalExpense) => {
    setInternalExpenses(prev => prev.map(exp => exp.id === updatedExpense.id ? updatedExpense : exp));
  };
  const deleteInternalExpense = (expenseId: number) => {
    setInternalExpenses(prev => prev.filter(exp => exp.id !== expenseId));
  };

  // Asset CRUD
  const addAsset = (asset: Omit<Asset, 'id' | 'maintenanceLog'>) => {
    setAssets(prev => [...prev, { ...asset, id: generateId(), maintenanceLog: [] }]);
  };
  const updateAsset = (updatedAsset: Asset) => {
    setAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
  };
  const deleteAsset = (assetId: number) => {
    setAssets(prev => prev.filter(a => a.id !== assetId));
  };
  const addMaintenanceRecord = (assetId: number, record: Omit<MaintenanceRecord, 'id'>) => {
    setAssets(prev => prev.map(a => {
      if (a.id === assetId) {
        return { ...a, maintenanceLog: [...a.maintenanceLog, { ...record, id: generateId() }] };
      }
      return a;
    }));
  };

  // Documents CRUD
  const addFile = (municipality: string, folder: string, file: Omit<ManagedFile, 'id'>) => {
    setDocuments(prev => {
        const newFile = { ...file, id: generateId() };
        const newDocs = { ...prev };
        if (!newDocs[municipality]) {
            newDocs[municipality] = {};
        }
        if (!newDocs[municipality][folder]) {
            newDocs[municipality][folder] = [];
        }
        newDocs[municipality][folder].push(newFile);
        return newDocs;
    });
  };
  const deleteFile = (municipality: string, folder: string, fileId: number) => {
    setDocuments(prev => {
        const newDocs = { ...prev };
        if (newDocs[municipality] && newDocs[municipality][folder]) {
            newDocs[municipality][folder] = newDocs[municipality][folder].filter(f => f.id !== fileId);
        }
        return newDocs;
    });
  };

    // Payment Notes CRUD
    const addPaymentNote = (municipality: string, note: Omit<PaymentNote, 'id'>) => {
        setPaymentNotes(prev => {
            const newNote = { ...note, id: generateId() };
            const newNotes = { ...prev };
            if (!newNotes[municipality]) {
                newNotes[municipality] = [];
            }
            newNotes[municipality].unshift(newNote); // Add to the beginning
            return newNotes;
        });
    };

    const deletePaymentNote = (municipality: string, noteId: number) => {
        setPaymentNotes(prev => {
            const newNotes = { ...prev };
            if (newNotes[municipality]) {
                newNotes[municipality] = newNotes[municipality].filter(n => n.id !== noteId);
            }
            return newNotes;
        });
    };

    // Notifications CRUD
    const addNotification = (notification: Omit<Notification, 'id' | 'read' | 'date'>) => {
        const newNotification: Notification = {
            ...notification,
            id: generateId(),
            read: false,
            date: new Date().toISOString(),
        };
        setNotifications(prev => [newNotification, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    };
    const markNotificationAsRead = (id: number) => {
        setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    };
    const markAllNotificationsAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };
    const deleteNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

  // Permissions CRUD
  const updatePermissions = (role: UserRole, permissionKey: keyof PermissionSet, value: boolean) => {
    setPermissions(prev => ({
        ...prev,
        [role]: {
            ...prev[role],
            [permissionKey]: value,
        }
    }));
  };

  // Supplier CRUD
    const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
        setSuppliers(prev => [...prev, { ...supplier, id: generateId() }]);
    };
    const updateSupplier = (updatedSupplier: Supplier) => {
        setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
    };
    const deleteSupplier = (supplierId: number) => {
        setSuppliers(prev => prev.filter(s => s.id !== supplierId));
    };

    // Transaction CRUD
    const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
        setTransactions(prev => [...prev, { ...transaction, id: generateId() }]);
    };
    const updateTransaction = (updatedTransaction: Transaction) => {
        setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
    };
    const deleteTransaction = (transactionId: number) => {
        setTransactions(prev => prev.filter(t => t.id !== transactionId));
    };

    // Payroll CRUD
    const addPayroll = (payroll: Omit<PayrollRecord, 'id'>) => {
        setPayrolls(prev => [...prev, { ...payroll, id: generateId() }]);
    };
    const deletePayroll = (payrollId: number) => {
        setPayrolls(prev => prev.filter(p => p.id !== payrollId));
    };

    // Leave Request CRUD
    const addLeaveRequest = (request: Omit<LeaveRequest, 'id'>) => {
        setLeaveRequests(prev => [...prev, { ...request, id: generateId() }]);
    };
    const updateLeaveRequest = (updatedRequest: LeaveRequest) => {
        setLeaveRequests(prev => prev.map(r => r.id === updatedRequest.id ? updatedRequest : r));
    };

    // System User CRUD
    const addUser = (user: Omit<SystemUser, 'id'>) => {
      setSystemUsers(prev => [...prev, { ...user, id: generateId() }]);
    };
    const updateUser = (updatedUser: SystemUser) => {
      setSystemUsers(prev => prev.map(u => {
        if (u.id === updatedUser.id) {
          // If password is not provided or is an empty string in the update payload, keep the old one
          const newPassword = updatedUser.password ? updatedUser.password : u.password;
          return { ...updatedUser, password: newPassword };
        }
        return u;
      }));
    };
    const deleteUser = (userId: number) => {
      setSystemUsers(prev => prev.filter(u => u.id !== userId));
    };

  // Update Post CRUD
  const addUpdatePost = (post: Omit<UpdatePost, 'id' | 'createdAt'>) => {
    setUpdatePosts(prev => [{ ...post, id: generateId(), createdAt: new Date().toISOString() }, ...prev]);
  };
  const updateUpdatePost = (updatedPost: UpdatePost) => {
    setUpdatePosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  };
  const deleteUpdatePost = (postId: number) => {
    setUpdatePosts(prev => prev.filter(p => p.id !== postId));
  };
  
    // External System CRUD
    const addExternalSystem = (system: Omit<ExternalSystem, 'id'>) => {
        setExternalSystems(prev => [...prev, { ...system, id: generateId() }]);
    };
    const updateExternalSystem = (updatedSystem: ExternalSystem) => {
        setExternalSystems(prev => prev.map(sys => sys.id === updatedSystem.id ? updatedSystem : sys));
    };
    const deleteExternalSystem = (systemId: number) => {
        setExternalSystems(prev => prev.filter(sys => sys.id !== systemId));
    };

  const value = {
    employees, addEmployee, updateEmployee, deleteEmployee,
    tasks, addTask, updateTask, deleteTask,
    financeData, addMunicipality, updateMunicipality, deleteMunicipality,
    employeeExpenses, addEmployeeExpense, updateEmployeeExpense, deleteEmployeeExpense,
    internalExpenses, addInternalExpense, updateInternalExpense, deleteInternalExpense,
    assets, addAsset, updateAsset, deleteAsset, addMaintenanceRecord,
    documents, addFile, deleteFile,
    paymentNotes, addPaymentNote, deletePaymentNote,
    notifications, addNotification, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification,
    suppliers, addSupplier, updateSupplier, deleteSupplier,
    transactions, addTransaction, updateTransaction, deleteTransaction,
    payrolls, addPayroll, deletePayroll,
    leaveRequests, addLeaveRequest, updateLeaveRequest,
    systemUsers, addUser, updateUser, deleteUser,
    updatePosts, addUpdatePost, updateUpdatePost, deleteUpdatePost,
    externalSystems, addExternalSystem, updateExternalSystem, deleteExternalSystem,
    news, newsSources, isNewsLoading, newsError, fetchNews,
    permissions, updatePermissions,
    loginScreenImageUrl, updateLoginScreenImage
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};