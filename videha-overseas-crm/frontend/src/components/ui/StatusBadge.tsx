import React from 'react';
import { LeadStatus, OrderStatus, TaskStatus } from '../../types/crm';

interface StatusBadgeProps {
  status: LeadStatus | OrderStatus | TaskStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    // 11 B2B Pipeline Stages
    case 'New Lead':
    case 'New':
      colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'Verification':
    case 'Contacted':
      colorClass = 'bg-purple-50 text-purple-700 border-purple-200';
      break;
    case 'Qualified':
    case 'Interested':
      colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      break;
    case 'Quotation Sent':
      colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'Follow-up':
      colorClass = 'bg-sky-50 text-sky-700 border-sky-200';
      break;
    case 'Sample':
    case 'Sample Requested':
    case 'Sample Sent':
      colorClass = 'bg-teal-50 text-teal-700 border-teal-200';
      break;
    case 'Negotiation':
      colorClass = 'bg-orange-50 text-orange-700 border-orange-200';
      break;
    case 'Confirmed Order':
    case 'Converted':
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'Payment':
      colorClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
      break;
    case 'Shipment':
      colorClass = 'bg-cyan-50 text-cyan-700 border-cyan-200';
      break;
    case 'Closed':
    case 'Not Interested':
    case 'Lost':
      colorClass = 'bg-stone-100 text-stone-600 border-stone-200';
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

    // Order: Draft
    case 'Draft':
      colorClass = 'bg-slate-100 text-slate-600 border-slate-300';
      break;

    // Billing statuses
    case 'draft':
      colorClass = 'bg-slate-100 text-slate-600 border-slate-300';
      break;
    case 'pending':
      colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'partially_paid':
      colorClass = 'bg-orange-50 text-orange-700 border-orange-200';
      break;
    case 'paid':
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'overdue':
      colorClass = 'bg-red-50 text-red-700 border-red-200';
      break;
    case 'void':
      colorClass = 'bg-gray-100 text-gray-500 border-gray-200';
      break;
    case 'issued':
      colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
      break;

    // Customer & Company statuses
    case 'active':
    case 'Active':
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'inactive':
    case 'Inactive':
      colorClass = 'bg-slate-100 text-slate-500 border-slate-200';
      break;

    default:
      colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
  }

  const LABEL_MAP: Record<string, string> = {
    draft: 'Draft',
    pending: 'Pending',
    partially_paid: 'Partially Paid',
    paid: 'Paid',
    overdue: 'Overdue',
    void: 'Void',
    issued: 'Issued',
  };
  const displayLabel = LABEL_MAP[status] ?? status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass} whitespace-nowrap ${className}`}
    >
      {displayLabel}
    </span>
  );
};
