import React from 'react';
import { FileText, CheckCircle, XCircle } from 'lucide-react';

const STATUS_STYLE = {
  Draft:     { bg: '#F1F5F9', color: '#64748B' },
  Sent:      { bg: 'rgba(67,97,238,0.10)', color: '#4361EE' },
  Paid:      { bg: 'rgba(16,185,129,0.10)', color: '#059669' },
  Overdue:   { bg: 'rgba(239,68,68,0.10)', color: '#DC2626' },
  Cancelled: { bg: '#F1F5F9', color: '#94A3B8' },
};

export default function InvoiceCard({ invoice, onMarkPaid, onCancel, onViewPdf }) {
  const s = STATUS_STYLE[invoice.status] ?? STATUS_STYLE.Draft;
  const fmt = (n) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <tr style={{ borderBottom: '1px solid #F1F5F9', fontSize: 13 }}>
      <td style={{ padding: '10px 16px', fontWeight: 700, color: '#4361EE', fontFamily: 'monospace' }}>
        {invoice.invoiceNumber}
      </td>
      <td style={{ padding: '10px 16px', color: '#475569' }}>
        {invoice.milestoneName ?? '—'}
        {invoice.milestonePercentage && <span style={{ color: '#94A3B8', marginLeft: 4 }}>({invoice.milestonePercentage}%)</span>}
      </td>
      <td style={{ padding: '10px 16px', color: '#0F172A', fontWeight: 600 }}>
        {invoice.currency} {fmt(invoice.subTotal)}
      </td>
      <td style={{ padding: '10px 16px', color: '#64748B' }}>
        {invoice.currency} {fmt(invoice.taxAmount)}
      </td>
      <td style={{ padding: '10px 16px', fontWeight: 800, color: '#0F172A' }}>
        {invoice.currency} {fmt(invoice.totalAmount)}
      </td>
      <td style={{ padding: '10px 16px' }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 999, background: s.bg, color: s.color }}>
          {invoice.status}
        </span>
      </td>
      <td style={{ padding: '10px 16px', color: '#64748B' }}>
        {new Date(invoice.invoiceDate).toLocaleDateString()}
      </td>
      <td style={{ padding: '10px 16px', color: invoice.dueDate && new Date(invoice.dueDate) < Date.now() && invoice.status !== 'Paid' ? '#EF4444' : '#64748B' }}>
        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}
      </td>
      <td style={{ padding: '10px 16px' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {invoice.pdfUrl && (
            <button className="action-icon-btn text-info" title="View PDF" onClick={() => onViewPdf(invoice)}>
              <FileText size={12} />
            </button>
          )}
          {invoice.status !== 'Paid' && invoice.status !== 'Cancelled' && (
            <button className="action-icon-btn text-success" title="Mark Paid" onClick={() => onMarkPaid(invoice)}>
              <CheckCircle size={12} />
            </button>
          )}
          {invoice.status !== 'Cancelled' && invoice.status !== 'Paid' && (
            <button className="action-icon-btn text-danger" title="Cancel" onClick={() => onCancel(invoice)}>
              <XCircle size={12} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
