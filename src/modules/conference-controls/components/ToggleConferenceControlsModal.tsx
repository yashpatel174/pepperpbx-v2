import { useState } from 'react'
import { App, Button, Modal, Typography } from 'antd'

interface ToggleConferenceControlsModalProps {
  open: boolean
  onConfirm: () => Promise<void>
  onCancel: () => void
}

/**
 * Bulk Toggle confirmation only (conference-controls.md §3/§20) — the inline Status click toggles
 * without a popup. The Toggle button shows a loading state, and the modal stays open if the request
 * fails so the user can retry or cancel.
 */
const ToggleConferenceControlsModal = ({ open, onConfirm, onCancel }: ToggleConferenceControlsModalProps) => {
  const { message } = App.useApp()
  const [toggling, setToggling] = useState(false)

  const handleConfirm = async () => {
    setToggling(true)
    try {
      await onConfirm()
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Toggle failed.')
    } finally {
      setToggling(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Toggle Conference Controls"
      onCancel={toggling ? undefined : onCancel}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button disabled={toggling} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="primary" loading={toggling} onClick={handleConfirm}>
            Toggle
          </Button>
        </div>
      }
      width={440}
    >
      <Typography.Paragraph>Do you really want to toggle this?</Typography.Paragraph>
    </Modal>
  )
}

export default ToggleConferenceControlsModal
