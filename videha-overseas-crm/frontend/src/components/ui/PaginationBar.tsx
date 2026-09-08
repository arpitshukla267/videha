import React from 'react';

type PaginationBarProps = {
  page: number;
  totalPages: number;
  total: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  label?: string;
};

export const PaginationBar: React.FC<PaginationBarProps> = ({
  page,
  totalPages,
  total,
  isLoading = false,
  onPageChange,
  label = 'records'
}) => {
  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
      <span>
        Showing page {page} of {totalPages} ({total} total {label})
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
          className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors text-slate-700 font-medium"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isLoading}
          className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors text-slate-700 font-medium"
        >
          Next
        </button>
      </div>
    </div>
  );
};
