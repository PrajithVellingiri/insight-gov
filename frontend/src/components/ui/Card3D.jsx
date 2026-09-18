import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Minimalist operational panel component.
 * Flat, high-contrast, clean 1px border.
 */
export default function Card3D({
  children,
  className = '',
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg border border-[#DDDCD7] p-6 text-[#181817] shadow-card transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
