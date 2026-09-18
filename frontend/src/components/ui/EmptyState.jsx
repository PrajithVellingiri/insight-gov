import React from 'react';
import { FolderSearch } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EmptyState({ title, description, icon: Icon = FolderSearch, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center rounded-lg border border-dashed border-[#DDDCD7] bg-white", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#FFF0EB] text-[#F05A3C] mb-3">
        <Icon size={22} strokeWidth={1.75} />
      </div>

      <h3 className="text-sm font-bold text-[#181817] mb-1 tracking-tight">{title}</h3>
      <p className="text-xs text-[#6F6F6A] max-w-sm mb-4 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
