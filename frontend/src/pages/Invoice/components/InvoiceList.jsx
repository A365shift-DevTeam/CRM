import React, { useEffect, useState, useCallback } from 'react';
import { invoiceService } from '../../../services/invoiceService';
import InvoiceCard from './InvoiceCard';
import { FileText } from 'lucide-react';

export default function InvoiceList({ projectFinanceId }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!projectFinanceId) return;
    setLoading(true);
    try {
      const data = await invoiceService.getByProject(projectFinanceId);
      setInvoices(data);
    } finally {
      setLoading(false);
    }
  }, [projectFinanceId]);

  useEffect(() => { load(); }, [load]);

  const handleMarkPaid = async (invoice) => {
    if (!window.confirm(`Mark ${invoice.invoiceNumber} as Paid?`)) return;
    try {
      await invoiceService.updateStatus(invoice.id, { status: 'Paid' });
      load();
    } catch (e) { alert(e.message); }
  };

  const handleCancel = async (invoice) => {
    if (!window.confirm(`Cancel ${invoice.invoiceNumber}?`)) return;
    try {
      await invoiceService.updateStatus(invoice.id, { status: 'Cancelled' });
      load();
    } catch (e) { alert(e.message); }
  };

  const handleViewPdf = (invoice) => {
    if (invoice.pdfUrl) window.open(invoice.pdfUrl, '_blank');
  };

  if (loading) return <div className="text-center py-3"><div className="spinner-border spinner-border-sm text-primary" /></div>;

  return (
    <div style={{ marginTop: 24 }}>
      <h6 style={{ fontSize: 13, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <FileText size={14} /> Invoices
        <span style={{ fontSize: 11, fontWeight: 700, background: '#F4F7FD', color: '#64748B', padding: '1px 8px', borderRadius: 999, border: '1px solid #E1E8F4' }}>{invoices.length}</span>
      </h6>
      {invoices.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#94A3B8', padding: '20px', fontSize: 13, background: '#F8FAFC', borderRadius: 10, border: '1px dashed #E1E8F4' }}>
          No invoices yet. Set a milestone to "Invoiced" to auto-generate one.
        </div>
      ) : (
        <div style={{ background: '#FFF', border: '1px solid #E1E8F4', borderRadius: 10, overflow: 'hidden' }}>
          <table className="table mb-0" style={{ fontSize: 13 }}>
            <thead style={{ background: '#F8FAFC', borderBottom: '2px solid #E1E8F4' }}>
              <tr>
                {['Invoice #', 'Milestone', 'Sub-total', 'Tax', 'Total', 'Status', 'Invoice Date', 'Due Date', ''].map(h => (
                  <th key={h} style={{ padding: '8px 16px', fontWeight: 700, color: '#64748B', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <InvoiceCard
                  key={inv.id}
                  invoice={inv}
                  onMarkPaid={handleMarkPaid}
                  onCancel={handleCancel}
                  onViewPdf={handleViewPdf}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
