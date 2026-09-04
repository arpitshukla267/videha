import React from 'react';
import { LeadStatus, OrderStatus, TaskStatus } from '../../types/crm';

interface StatusBadgeProps {
  status: LeadStatus | OrderStatus | TaskStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    // Lead statuses
    case 'New':
      colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'Contacted':
      colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      break;
    case 'Interested':
      colorClass = 'bg-teal-50 text-teal-700 border-teal-200';
      break;
    case 'Follow-up':
      colorClass = 'bg-sky-50 text-sky-700 border-sky-200';
      break;
    case 'Converted':
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'Not Interested':
    case 'Lost':
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
      break;

    // Task statuses
    case 'Pending':
      colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
      break;
    case 'In Progress':
      colorClass = 'bg-sky-50 text-sky-700 border-sky-200';
      break;
    case 'Completed':
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'Cancelled':
      colorClass = 'bg-slate-100 text-slate-500 border-slate-200';
      break;

    // Order statuses
    case 'Order Confirmed':
      colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'Processing':
    case 'Production':
      colorClass = 'bg-cyan-50 text-cyan-700 border-cyan-200';
      break;
    case 'Packed':
      colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      break;
    case 'Shipped':
    case 'In Transit':
      colorClass = 'bg-sky-50 text-sky-700 border-sky-200';
      break;
    case 'Delivered':
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;

    default:
      colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass} whitespace-nowrap ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {status}
    </span>
  );
};
