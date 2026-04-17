import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, pageSize, onPageChange, onPageSizeChange }) {
  if (totalPages <= 1 && page === 1) return null;

  return (
    <div className="flex items-center justify-between px-1 py-3 mt-2">
      <div className="flex items-center gap-2 text-sm" style={{ color: '#64748B' }}>
        <span>Rows per page:</span>
        <select
          value={pageSize}
          onChange={e => onPageSizeChange(Number(e.target.value))}
          className="rounded-lg px-2 py-1 text-sm border"
          style={{
            background: 'var(--card-bg, #fff)',
            borderColor: 'var(--border-color, #e2e8f0)',
            color: 'var(--text-primary, #1e293b)',
          }}
        >
          {[25, 50, 100].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-sm mr-2" style={{ color: '#64748B' }}>
          Page {page} of {totalPages}
        </span>

        <button
          aria-label="Previous page"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'var(--card-bg, #fff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            color: page <= 1 ? '#94a3b8' : '#4361EE',
            cursor: page <= 1 ? 'not-allowed' : 'pointer',
          }}
        >
          <ChevronLeft size={16} />
        </button>

        <button
          aria-label="Next page"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'var(--card-bg, #fff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            color: page >= totalPages ? '#94a3b8' : '#4361EE',
            cursor: page >= totalPages ? 'not-allowed' : 'pointer',
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
