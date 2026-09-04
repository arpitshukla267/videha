import React from 'react';
import { Priority } from '../../types/crm';

interface PriorityBadgeProps {
  priority: Priority | string;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = '' }) => {
  let badgeStyles = 'text-slate-600 bg-slate-100 border-slate-200';

  switch (priority) {
    case 'Urgent':
      badgeStyles = 'text-rose-700 bg-rose-50 border-rose-200 font-semibold';
      break;
    case 'High':
      badgeStyles = 'text-teal-700 bg-teal-50 border-teal-200 font-medium';
      break;
    case 'Medium':
      badgeStyles = 'text-sky-700 bg-sky-50 border-sky-200 font-medium';
      break;
    case 'Low':
      badgeStyles = 'text-emerald-700 bg-emerald-50 border-emerald-200 font-medium';
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${badgeStyles} whitespace-nowrap ${className}`}
    >
      {priority}
    </span>
  );
};
