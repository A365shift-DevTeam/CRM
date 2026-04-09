import { Modal, Button } from 'react-bootstrap'
import './ConfirmModal.css'

/**
 * ConfirmModal — styled confirmation dialog
 *
 * Props:
 *   show           — boolean
 *   onHide         — () => void (cancel/close)
 *   onConfirm      — () => void (confirm action)
 *   title          — modal title (default "Confirm")
 *   message        — message text or ReactNode
 *   confirmLabel   — confirm button text (default "Delete")
 *   cancelLabel    — cancel button text (default "Cancel")
 *   variant        — 'danger' | 'warning' | 'primary' (default 'danger')
 *   loading        — boolean, shows spinner on confirm button
 */
export default function ConfirmModal({
  show,
  onHide,
  onConfirm,
  title = 'Confirm',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  return (
    <Modal show={show} onHide={onHide} centered className="confirm-modal">
      <Modal.Header closeButton className="cm-header">
        <Modal.Title className="cm-title">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="cm-body">
        <p className="cm-message">{message}</p>
      </Modal.Body>
      <Modal.Footer className="cm-footer">
        <Button variant="light" onClick={onHide} className="cm-cancel-btn" disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant}
          onClick={onConfirm}
          className="cm-confirm-btn"
          disabled={loading}
        >
          {loading && (
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
          )}
          {confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
