import { useState } from 'react'
import type { ReactNode } from 'react'
import { App, Button, Modal } from 'antd'
import { getApiErrorMessage } from '../../services/api/apiError'

export interface ConfirmActionModalProps {
  open: boolean
  title: ReactNode
  /** Confirmation message and any extra content (target list, warning, inputs). */
  children?: ReactNode
  /** Confirm button label, e.g. "Delete", "Toggle", "Copy". */
  confirmText: string
  /** Destructive actions get a danger confirm button. */
  danger?: boolean
  /** Blocks the confirm button, e.g. until a required choice is made. */
  confirmDisabled?: boolean
  width?: number
  /** Shown when `onConfirm` rejects without a usable message. */
  errorMessage: string
  /** Runs the action. The modal shows a loading state until it settles and stays open if it rejects. */
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  afterClose?: () => void
}

/**
 * Shared confirm dialog for list-page actions (delete / toggle / copy / start-stop). Owns the
 * footer (Cancel + confirm), the in-flight loading state, and error reporting; closing is
 * blocked while the action runs. Callers own the content and close it on success.
 */
const ConfirmActionModal = ({
  open,
  title,
  children,
  confirmText,
  danger = false,
  confirmDisabled = false,
  width = 440,
  errorMessage,
  onConfirm,
  onCancel,
  afterClose,
}: ConfirmActionModalProps) => {
  const { message } = App.useApp()
  const [confirming, setConfirming] = useState(false)

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      await onConfirm()
    } catch (err) {
      message.error(getApiErrorMessage(err, errorMessage))
    } finally {
      setConfirming(false)
    }
  }

  return (
    <Modal
      open={open}
      title={title}
      onCancel={confirming ? undefined : onCancel}
      afterClose={afterClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button disabled={confirming} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="primary" danger={danger} loading={confirming} disabled={confirmDisabled} onClick={handleConfirm}>
            {confirmText}
          </Button>
        </div>
      }
      width={width}
    >
      {children}
    </Modal>
  )
}

export default ConfirmActionModal
