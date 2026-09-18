import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Editorial minimalist Card component.
 * Replaced heavy 3D tilt/glare with a calm, flat, elegant surface
 * with subtle hover elevation and crisp border.
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
        'bg-white rounded-2xl border border-[#E5E5DE] p-6 transition-all duration-200 shadow-card hover:shadow-card-hover hover:border-[#D4D4CA] text-[#202522]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
