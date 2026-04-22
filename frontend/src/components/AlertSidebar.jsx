import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';

export default function AlertSidebar({ alerts = [], onClose, getAlertCategory }) {
  return (
    <AnimatePresence>
      <>
        <motion.div
          className="dash-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.aside
          className="dash-alert-sidebar"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        >
          <div className="dash-sidebar-header">
            <div>
              <h3>AI Alerts</h3>
              <p>{alerts.length} total alert{alerts.length !== 1 ? 's' : ''}</p>
            </div>
            <button className="dash-sidebar-close" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
          <div className="dash-sidebar-content no-scrollbar">
            {alerts.length === 0 && (
              <div className="activity-empty">
                <CheckCircle2 size={24} style={{ color: '#10B981' }} />
                <p>No alerts — all systems nominal.</p>
              </div>
            )}
            {alerts.map((alert, i) => {
              const isCritical = alert.severity === 'critical';
              const isWarning = alert.severity === 'warning';
              const level = isCritical ? 'critical' : isWarning ? 'warning' : 'info';
              const category = getAlertCategory ? getAlertCategory(alert) : { label: 'General', className: 'bg-slate-100 text-slate-700' };
              return (
                <div key={alert.id || `${alert.title}-${i}`} className={`dash-alert-card ${level}`}>
                  <div className="dash-alert-card-head">
                    <span className={`dash-alert-badge ${level}`}>
                      {isCritical ? 'Critical' : isWarning ? 'Warning' : 'Info'}
                    </span>
                    <span className={`dash-alert-card-cat ${category.className}`}>{category.label}</span>
                    {alert.daysOverdue > 0 && (
                      <span className="dash-alert-overdue">{alert.daysOverdue}d overdue</span>
                    )}
                  </div>
                  <p className="dash-alert-card-title">{alert.title || alert.message || 'AI alert'}</p>
                  {alert.clientName && <p className="dash-alert-card-client">{alert.clientName}</p>}
                </div>
              );
            })}
          </div>
        </motion.aside>
      </>
    </AnimatePresence>
  );
}
