import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import './Toast.css'

const ToastContext = createContext(null)

let toastId = 0

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const ICON_MAP = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const COLOR_MAP = {
  success: { bg: '#f0fdf4', border: '#bbf7d0', icon: '#16a34a', text: '#15803d' },
  error: { bg: '#fef2f2', border: '#fecaca', icon: '#dc2626', text: '#b91c1c' },
  warning: { bg: '#fffbeb', border: '#fed7aa', icon: '#d97706', text: '#b45309' },
  info: { bg: '#eff6ff', border: '#bfdbfe', icon: '#2563eb', text: '#1d4ed8' },
}

const ToastItem = ({ toast, onDismiss }) => {
  const Icon = ICON_MAP[toast.type] || Info
  const colors = COLOR_MAP[toast.type] || COLOR_MAP.info

  return (
    <div
      className={`crm-toast crm-toast-${toast.type} ${toast.exiting ? 'crm-toast-exit' : 'crm-toast-enter'}`}
      style={{ background: colors.bg, borderColor: colors.border }}
      role="alert"
    >
      <div className="crm-toast-icon" style={{ color: colors.icon }}>
        <Icon size={18} />
      </div>
      <div className="crm-toast-content">
        {toast.title && <div className="crm-toast-title" style={{ color: colors.text }}>{toast.title}</div>}
        <div className="crm-toast-message">{toast.message}</div>
      </div>
      <button className="crm-toast-close" onClick={() => onDismiss(toast.id)} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  )
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef({})

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
      if (timersRef.current[id]) {
        clearTimeout(timersRef.current[id])
        delete timersRef.current[id]
      }
    }, 300)
  }, [])

  const addToast = useCallback((message, type = 'info', options = {}) => {
    const id = ++toastId
    const duration = options.duration ?? 4000
    const title = options.title || null

    setToasts(prev => [...prev, { id, message, type, title, exiting: false }])

    if (duration > 0) {
      timersRef.current[id] = setTimeout(() => dismiss(id), duration)
    }
    return id
  }, [dismiss])

  const toast = {
    success: (message, options) => addToast(message, 'success', options),
    error: (message, options) => addToast(message, 'error', options),
    warning: (message, options) => addToast(message, 'warning', options),
    info: (message, options) => addToast(message, 'info', options),
    dismiss,
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <div className="crm-toast-container">
          {toasts.map(t => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}
