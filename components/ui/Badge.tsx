import React from 'react';
import { cn } from '../../lib/utils';
import { TaskStatus } from '../../types';

interface BadgeProps {
  status: TaskStatus;
}

const Badge: React.FC<BadgeProps> = ({ status }) => {
  const statusClasses: Record<TaskStatus, string> = {
    'Concluída': 'bg-green-100 text-green-800',
    'Em Andamento': 'bg-yellow-100 text-yellow-800',
    'Pendente': 'bg-red-100 text-red-800',
  };

  return (
    <span className={cn('px-3 py-1 text-xs font-medium rounded-full', statusClasses[status])}>
      {status}
    </span>
  );
};

export default Badge;