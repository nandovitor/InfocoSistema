
import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Alert from '../ui/Alert';
import { Building, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const authContext = useContext(AuthContext);
  const { loginScreenImageUrl } = useData();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Email e senha são obrigatórios.');
      triggerShake();
      return;
    }
    try {
      await authContext?.login(email, password);
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar.');
      triggerShake();
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4">
      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
      <div className={cn("w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6 transform transition-all duration-500", isShaking && 'animate-shake')}>
        <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full mb-4 shadow-lg overflow-hidden">
                 {loginScreenImageUrl ? (
                    <img src={loginScreenImageUrl} alt="Logo do Sistema" className="w-full h-full object-cover" />
                ) : (
                    <Building className="text-white w-10 h-10" />
                )}
            </div>
            <h1 className="text-3xl font-bold text-gray-800">INFOCO</h1>
            <p className="text-gray-500">Gestão Pública</p>
        </div>
        
        {error && <Alert type="danger" message={error} />}
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-blue-700 block mb-2">Email</label>
            <Input 
                id="email" 
                type="email" 
                placeholder="seu.email@exemplo.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail size={16}/>}
                disabled={authContext?.loading}
                required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-blue-700 block mb-2">Senha</label>
            <div className="relative">
                <Input 
                    id="password" 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Sua senha" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock size={16}/>}
                    disabled={authContext?.loading}
                    required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16}/>}
                </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <a href="#" className="text-sm text-blue-600 hover:underline">Esqueceu a senha?</a>
          </div>
          <Button type="submit" className="w-full" isLoading={authContext?.loading}>
            Entrar no Sistema
          </Button>
        </form>
        <p className="text-center text-xs text-gray-400 pt-4 border-t mt-6">
            &copy; {new Date().getFullYear()} Infoco Gestão Pública. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
