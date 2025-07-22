import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, icon, ...props }, ref) => {
    const hasIcon = !!icon;
    return (
        <div className="relative">
            {hasIcon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    {icon}
                </div>
            )}
            <input
                type={type}
                className={cn(
                    'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
                    hasIcon ? 'pl-10' : '',
                    className
                )}
                ref={ref}
                {...props}
            />
        </div>
    );
});
Input.displayName = 'Input';

export default Input;