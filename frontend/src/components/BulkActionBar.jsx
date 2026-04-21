import React, { useState } from 'react';
import { FaTrash, FaArrowUpFromBracket } from 'react-icons/fa6';

const bulkBarStyle = {
  position: 'fixed',
  bottom: '24px',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(255,255,255,0.82)',
  backdropFilter: 'blur(24px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
  border: '1px solid rgba(60,60,67,0.16)',
  borderRadius: '16px',
  padding: '10px 16px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  animation: 'bulk-slide-up 0.22s cubic-bezier(0.22,1,0.36,1) forwards',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Nunito", "Helvetica Neue", sans-serif',
};

const dividerStyle = {
  width: '1px', height: '22px',
  background: 'rgba(60,60,67,0.14)',
  flexShrink: 0,
};

const countStyle = {
  fontWeight: 700,
  fontSize: '13px',
  color: '#000',
  whiteSpace: 'nowrap',
  letterSpacing: '-0.01em',
};

const actionBtnBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  border: 'none',
  borderRadius: '10px',
  padding: '7px 12px',
  cursor: 'pointer',
  fontSize: '12.5px',
  fontWeight: 600,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Nunito", sans-serif',
  transition: 'opacity 0.15s, transform 0.12s',
  minHeight: '32px',
};

const deleteBtnStyle = {
  ...actionBtnBase,
  background: 'rgba(255,59,48,0.10)',
  color: '#D70015',
};

const exportBtnStyle = {
  ...actionBtnBase,
  background: 'rgba(52,199,89,0.10)',
  color: '#248A3D',
};

const statusSelStyle = {
  background: 'rgba(0,122,255,0.10)',
  border: 'none',
  borderRadius: '10px',
  padding: '7px 12px',
  color: '#007AFF',
  fontSize: '12.5px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Nunito", sans-serif',
  outline: 'none',
  minHeight: '32px',
};

/* Confirm sheet overlay */
const overlayStyle = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.40)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  zIndex: 2100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const confirmSheetStyle = {
  background: '#fff',
  borderRadius: '20px',
  padding: '28px 28px 20px',
  maxWidth: '320px',
  width: '90%',
  textAlign: 'center',
  boxShadow: '0 20px 60px rgba(0,0,0,0.20)',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Nunito", sans-serif',
};

export default function BulkActionBar({ selectedCount, onBulkDelete, onBulkStatusChange, onBulkExport, statusOptions = [] }) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <>
      <style>{`
        @keyframes bulk-slide-up {
          from { opacity: 0; transform: translateX(-50%) translateY(12px) scale(0.96); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
      `}</style>

      <div style={bulkBarStyle}>
        <span style={countStyle}>{selectedCount} selected</span>

        {(onBulkDelete || onBulkStatusChange || onBulkExport) && <div style={dividerStyle} />}

        {onBulkDelete && (
          <button
            style={deleteBtnStyle}
            onClick={() => setShowConfirm(true)}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,59,48,0.17)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,59,48,0.10)'; }}
          >
            <FaTrash size={11} /> Delete
          </button>
        )}

        {onBulkStatusChange && statusOptions.length > 0 && (
          <select
            style={statusSelStyle}
            onChange={e => { if (e.target.value) { onBulkStatusChange(e.target.value); e.target.value = ''; } }}
          >
            <option value="">Change Status</option>
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}

        {onBulkExport && (
          <button
            style={exportBtnStyle}
            onClick={onBulkExport}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(52,199,89,0.17)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(52,199,89,0.10)'; }}
          >
            <FaArrowUpFromBracket size={11} /> Export CSV
          </button>
        )}
      </div>

      {/* iOS-style confirmation sheet */}
      {showConfirm && (
        <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) setShowConfirm(false); }}>
          <div style={confirmSheetStyle}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,59,48,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <FaTrash size={18} color="#FF3B30" />
            </div>
            <p style={{ fontWeight: 700, fontSize: '16px', color: '#000', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
              Delete {selectedCount} {selectedCount === 1 ? 'item' : 'items'}?
            </p>
            <p style={{ color: '#8E8E93', fontSize: '13px', margin: '0 0 22px', lineHeight: 1.5 }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                style={{ flex: 1, background: '#F2F2F7', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', color: '#000', fontFamily: 'inherit' }}
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                style={{ flex: 1, background: '#FF3B30', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', color: '#fff', fontFamily: 'inherit', boxShadow: '0 2px 10px rgba(255,59,48,0.30)' }}
                onClick={() => { setShowConfirm(false); onBulkDelete(); }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
