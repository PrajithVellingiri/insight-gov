import React from 'react';
import { FolderSearch } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EmptyState({ title, description, icon: Icon = FolderSearch, action, className }) {
  return (
    <div className={cn("relative overflow-hidden flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/80 bg-slate-950/40 backdrop-blur-sm", className)}>
      {/* Ambient background bloom */}
      <div className="pointer-events-none absolute h-36 w-36 rounded-full bg-blue-500/05 blur-2xl" aria-hidden="true" />
      
      {/* 3D Holographic Icon Container */}
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-2xl bg-blue-500/10 blur-xl animate-pulse-glow" aria-hidden="true" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/25 bg-slate-900/80 shadow-card-3d">
          <Icon size={28} className="text-blue-400" />
        </div>
      </div>

      <h3 className="text-lg font-bold text-foreground mb-1.5 tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">{description}</p>
      {action && <div className="relative z-10">{action}</div>}
    </div>
  );
}
