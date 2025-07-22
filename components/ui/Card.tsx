import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

const Card: React.FC<CardProps> = ({ children, className, as: Component = 'div' }) => {
  return (
    <Component className={cn('bg-white rounded-xl shadow-md p-6', className)}>
      {children}
    </Component>
  );
};

export default Card;