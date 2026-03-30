import { Modal, Form, Button, Spinner } from 'react-bootstrap'
import './StandardModal.css'

/**
 * StandardModal — Unified CRM modal wrapper.
 *
 * Props:
 *   show, onHide          — visibility
 *   title                 — header text
 *   size                  — 'sm' | 'lg' | 'xl'  (default 'lg')
 *   onSubmit              — called on save / create
 *   submitLabel           — button text (default 'Save')
 *   onDelete              — if set, renders delete button
 *   deleteLabel           — delete button text
 *   saving                — shows spinner when true
 *   children              — modal body content
 *   extraFooter           — optional extra JSX in footer
 *   bodyStyle             — override body inline styles
 */
export const StandardModal = ({
  show,
  onHide,
  title,
  size = 'lg',
  onSubmit,
  submitLabel = 'Save',
  onDelete,
  deleteLabel = 'Delete',
  saving = false,
  children,
  extraFooter,
  bodyStyle,
}) => {
  const handleSubmit = (e) => {
    e?.preventDefault?.()
    if (onSubmit) onSubmit()
  }

  return (
    <Modal
      show={show}
      onHide={onHide}
      size={size}
      centered
      backdrop="static"
      keyboard={false}
      className="standard-modal"
    >
      <Modal.Header closeButton className="standard-modal-header">
        <Modal.Title className="standard-modal-title">{title}</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className="standard-modal-body" style={bodyStyle}>
          {children}
        </Modal.Body>

        <Modal.Footer className="standard-modal-footer">
          {onDelete && (
            <Button
              variant="link"
              className="standard-modal-delete-btn me-auto"
              onClick={onDelete}
              disabled={saving}
            >
              {deleteLabel}
            </Button>
          )}

          {extraFooter}

          <Button
            variant="outline-secondary"
            size="sm"
            onClick={onHide}
            disabled={saving}
            className="standard-modal-cancel-btn"
          >
            Cancel
          </Button>

          <Button
            variant="dark"
            type="submit"
            size="sm"
            disabled={saving}
            className="standard-modal-submit-btn"
          >
            {saving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
