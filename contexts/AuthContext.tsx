
import React, { createContext, useState, useEffect } from 'react';
import { User, SystemUser } from '../types';
import { DEFAULT_SYSTEM_USERS } from '../constants';


interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<User>;
  logout: () => void;
  updatePfp: (pfp: string) => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUserStr = sessionStorage.getItem('infoco_user') || localStorage.getItem('infoco_user');
    if (storedUserStr) {
      const storedUser = JSON.parse(storedUserStr);
      // Ensure pfp from localStorage is loaded if not in session, for robustness
      const pfp = localStorage.getItem(`infoco_user_pfp_${storedUser.email}`);
      if (pfp && !storedUser.pfp) {
        storedUser.pfp = pfp;
      }
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = (email: string, pass: string): Promise<User> => {
    setLoading(true);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const storedUsersStr = localStorage.getItem('infoco_system_users');
        const systemUsers: SystemUser[] = storedUsersStr ? JSON.parse(storedUsersStr) : DEFAULT_SYSTEM_USERS;

        const potentialUser = systemUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (potentialUser && potentialUser.password === pass) {
          const authenticatedUser: User = { 
              email: potentialUser.email,
              name: potentialUser.name,
              role: potentialUser.role,
              department: potentialUser.department
          };
          
          const pfp = localStorage.getItem(`infoco_user_pfp_${authenticatedUser.email}`);
          if (pfp) {
              authenticatedUser.pfp = pfp;
          }

          setUser(authenticatedUser);
          sessionStorage.setItem('infoco_user', JSON.stringify(authenticatedUser));
          setLoading(false);
          resolve(authenticatedUser);
        } else {
          setLoading(false);
          reject(new Error('Login falhou. Verifique se o e-mail e a senha estão corretos.'));
        }
      }, 1500);
    });
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('infoco_user');
    // Keep localStorage for pfp and other potential settings
  };

  const updatePfp = (pfp: string) => {
    if (user) {
        const updatedUser = { ...user, pfp };
        setUser(updatedUser);
        sessionStorage.setItem('infoco_user', JSON.stringify(updatedUser));
        localStorage.setItem(`infoco_user_pfp_${user.email}`, pfp);
    }
  };


  return (
    <AuthContext.Provider value={{ user, login, logout, updatePfp, loading }}>
      {children}
    </AuthContext.Provider>
  );
};