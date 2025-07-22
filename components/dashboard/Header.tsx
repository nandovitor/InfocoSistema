
import React, { useContext, useState, useRef, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { getUserInitials, formatDate, timeAgo } from '../../lib/utils';
import { Notification, NotificationType } from '../../types';
import { Bell, User, LogOut, ChevronDown, Menu, BellRing, Trash2, Plus, X, SlidersHorizontal } from 'lucide-react';
import ProfileModal from './ProfileModal';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import DeleteConfirmationModal from '../ui/DeleteConfirmationModal';
import { cn } from '../../lib/utils';

const CreateReminderModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    onAddReminder: (description: string, eventDate: string) => void
}> = ({ isOpen, onClose, onAddReminder }) => {
    const [description, setDescription] = useState('');
    const [eventDate, setEventDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(description && eventDate) {
            onAddReminder(description, eventDate);
            setDescription('');
            setEventDate('');
            onClose();
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Criar Novo Lembrete">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">Descrição do lembrete</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Ex: Ligar para o cliente X"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">Data do Lembrete</label>
                    <Input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        required
                        min={new Date().toISOString().split("T")[0]}
                    />
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Salvar Lembrete</Button>
                </div>
            </form>
        </Modal>
    );
};

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
  setActiveTab: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ title, onMenuClick, setActiveTab }) => {
  const authContext = useContext(AuthContext);
  const { notifications, addNotification, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, permissions } = useData();
  const user = authContext?.user;

  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [isReminderModalOpen, setReminderModalOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const userPermissions = user ? permissions[user.role] : null;

  const confirmLogout = () => {
    authContext?.logout();
    setLogoutModalOpen(false);
  };
  
  const handleOutsideClick = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setDropdownOpen(false);
    }
    if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
      setNotificationsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);
  
  const handleNotificationClick = (notification: Notification) => {
    markNotificationAsRead(notification.id);
    if(notification.link) {
        setActiveTab(notification.link);
    }
    setNotificationsOpen(false);
  };
  
  const handleAddReminder = (description: string, eventDate: string) => {
    addNotification({
        type: 'reminder',
        title: 'Lembrete',
        description,
        eventDate
    });
  };

  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center shrink-0 z-10">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="text-gray-600 md:hidden" aria-label="Abrir menu">
            <Menu size={24} />
        </button>
        <h1 className="text-xl md:text-2xl font-semibold text-gray-800 truncate">{title}</h1>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-6">
        <div className="relative" ref={notificationsRef}>
            <button onClick={() => setNotificationsOpen(!isNotificationsOpen)} className="text-gray-500 hover:text-gray-700 relative p-2">
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center ring-2 ring-white">
                        {unreadCount}
                    </span>
                )}
            </button>
            {isNotificationsOpen && (
                 <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-md shadow-lg z-50 animate-fade-in flex flex-col max-h-[70vh]">
                    <div className="flex justify-between items-center p-3 border-b">
                        <h4 className="font-semibold text-gray-800">Notificações</h4>
                        {unreadCount > 0 && (
                             <button onClick={() => markAllNotificationsAsRead()} className="text-sm text-blue-600 hover:underline">Marcar todas como lidas</button>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(n => (
                                <div key={n.id} className={cn("flex items-start gap-3 p-3 border-b hover:bg-gray-50", !n.read && "bg-blue-50")}>
                                    <div className="mt-1">
                                        {n.type === 'reminder' ? <Bell className="w-5 h-5 text-yellow-500"/> : <BellRing className="w-5 h-5 text-blue-500"/>}
                                    </div>
                                    <div className="flex-1 cursor-pointer" onClick={() => handleNotificationClick(n)}>
                                        <p className="font-semibold text-sm text-gray-800">{n.title}</p>
                                        <p className="text-sm text-gray-600">{n.description}</p>
                                        {n.eventDate && <p className="text-xs text-gray-500 mt-1">Data do evento: {formatDate(n.eventDate)}</p>}
                                        <p className="text-xs text-gray-400 mt-1">{timeAgo(n.date)}</p>
                                    </div>
                                    <button onClick={() => deleteNotification(n.id)} className="text-gray-400 hover:text-red-500 p-1"><X size={16}/></button>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 p-6">Nenhuma notificação.</p>
                        )}
                    </div>
                    <div className="p-2 border-t bg-gray-50">
                        <Button variant="secondary" size="sm" className="w-full" onClick={() => { setReminderModalOpen(true); setNotificationsOpen(false); }}>
                            <Plus size={16} className="mr-2"/> Criar Lembrete
                        </Button>
                    </div>
                </div>
            )}
        </div>
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-3 cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0">
                    {user?.pfp ? (
                        <img src={user.pfp} alt="User profile" className="w-full h-full object-cover" />
                    ) : (
                        <span>{user ? getUserInitials(user.name) : 'U'}</span>
                    )}
                </div>
                <div className="hidden lg:block">
                    <p className="font-semibold text-sm text-gray-800 text-left">{user?.name}</p>
                    <p className="text-xs text-gray-500 text-left">{user?.email}</p>
                </div>
                <ChevronDown size={20} className={cn("text-gray-500 transition-transform hidden sm:block", isDropdownOpen && "rotate-180")} />
            </button>
            {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 animate-fade-in">
                    <button onClick={() => { setProfileModalOpen(true); setDropdownOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <User size={16} className="mr-2"/>
                        Alterar Foto
                    </button>
                    {userPermissions?.canManageSettings && (
                        <button onClick={() => { setActiveTab('settings'); setDropdownOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                           <SlidersHorizontal size={16} className="mr-2"/>
                           Configurações Gerais
                       </button>
                    )}
                    <div className="my-1 h-px bg-gray-100"></div>
                    <button onClick={() => { setLogoutModalOpen(true); setDropdownOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                       <LogOut size={16} className="mr-2"/>
                        Sair
                    </button>
                </div>
            )}
        </div>
      </div>
       <ProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
      <CreateReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        onAddReminder={handleAddReminder}
       />
      <DeleteConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={confirmLogout}
        title="Confirmar Saída"
        message="Tem certeza que deseja sair do sistema?"
      />
       <style>{`
          @keyframes fade-in {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </header>
  );
};

export default Header;