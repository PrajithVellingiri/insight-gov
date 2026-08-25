import { FolderSearch } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EmptyState({ title, description, icon: Icon = FolderSearch, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-10 text-center rounded-xl border border-dashed border-border bg-card/50", className)}>
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon size={24} className="text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
