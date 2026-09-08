import React from 'react';
import { AlertCircle, Inbox } from 'lucide-react';

type ListStatePanelProps = {
  isLoading: boolean;
  error?: string | null;
  isEmpty: boolean;
  loadingLabel?: string;
  emptyTitle: string;
  emptyDescription?: string;
  className?: string;
};

export const ListStatePanel: React.FC<ListStatePanelProps> = ({
  isLoading,
  error,
  isEmpty,
  loadingLabel = 'Loading…',
  emptyTitle,
  emptyDescription,
  className = 'p-8 text-center bg-white border border-slate-200 rounded-xl'
}) => {
  if (isLoading) {
    return (
      <div className={`${className} text-xs text-slate-500 animate-pulse`}>
        {loadingLabel}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} text-xs text-rose-700`}>
        <div className="inline-flex items-center gap-2 justify-center">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={`${className} text-xs text-slate-500`}>
        <div className="inline-flex flex-col items-center gap-2 max-w-md mx-auto">
          <Inbox className="w-8 h-8 text-slate-300" />
          <p className="font-medium text-slate-700">{emptyTitle}</p>
          {emptyDescription ? <p className="text-slate-500 leading-relaxed">{emptyDescription}</p> : null}
        </div>
      </div>
    );
  }

  return null;
};

export function ownScopeEmptyCopy(entityLabel: string): { title: string; description: string } {
  return {
    title: `No ${entityLabel} assigned to you yet`,
    description:
      'Records assigned to you by your manager will appear here. You can also create new records and assign them to yourself.'
  };
}
