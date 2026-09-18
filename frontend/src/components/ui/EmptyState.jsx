import React from 'react';
import { FolderSearch } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EmptyState({ title, description, icon: Icon = FolderSearch, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-[#E5E5DE] bg-white", className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EFF4F0] text-[#315C4A] mb-4">
        <Icon size={24} strokeWidth={1.75} />
      </div>

      <h3 className="text-base font-bold text-[#202522] mb-1 tracking-tight">{title}</h3>
      <p className="text-sm text-[#68716B] max-w-sm mb-5 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
