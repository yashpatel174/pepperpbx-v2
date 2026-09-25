import { useState } from 'react'
import { App, Button, Modal, Typography } from 'antd'

interface ToggleConferenceCentersModalProps {
  open: boolean
  onConfirm: () => Promise<void>
  onCancel: () => void
}

/**
 * Bulk Toggle confirmation only — the inline Status click toggles without a popup. The Toggle
 * button shows a real loading state (Axion's `saveLoading` prop here is never passed, so its
 * spinner never renders — conference-centers.md §16/§28).
 */
const ToggleConferenceCentersModal = ({ open, onConfirm, onCancel }: ToggleConferenceCentersModalProps) => {
  const { message } = App.useApp()
  const [toggling, setToggling] = useState(false)

  const handleConfirm = async () => {
    setToggling(true)
    try {
      await onConfirm()
    } catch {
      message.error('Toggle failed.')
    } finally {
      setToggling(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Toggle Conference Centers"
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

export default ToggleConferenceCentersModal
