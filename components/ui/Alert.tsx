import React from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface AlertProps {
  message: string;
  type: 'success' | 'danger';
  className?: string;
}

const Alert: React.FC<AlertProps> = ({ message, type, className }) => {
  const baseClasses = 'p-4 mb-4 text-sm rounded-lg flex items-center gap-3';
  const typeClasses = {
    success: 'bg-green-100 text-green-700',
    danger: 'bg-red-100 text-red-700',
  };

  const Icon = type === 'success' ? CheckCircle : AlertTriangle;

  return (
    <div className={cn(baseClasses, typeClasses[type], className)} role="alert">
      <Icon className="w-5 h-5" />
      <span className="font-medium">{message}</span>
    </div>
  );
};

export default Alert;