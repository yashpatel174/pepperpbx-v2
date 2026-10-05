import { useState } from 'react'
import { App, Button, Modal, Typography } from 'antd'
import { getApiErrorMessage } from '../../../services/api/apiError'

interface ToggleIVRMenuModalProps {
  open: boolean
  count: number
  onConfirm: () => Promise<void>
  onCancel: () => void
}

/**
 * Bulk Toggle confirmation (ivr-menus.md §3/§20) — Axion's "Do you really want to toggle this IVR
 * Menu?". Each selected menu flips to the opposite state. Only the bulk path confirms; the inline
 * Status pill toggles immediately. Stays open on failure.
 */
const ToggleIVRMenuModal = ({ open, count, onConfirm, onCancel }: ToggleIVRMenuModalProps) => {
  const { message } = App.useApp()
  const [toggling, setToggling] = useState(false)

  const handleConfirm = async () => {
    setToggling(true)
    try {
      await onConfirm()
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to toggle IVR menus.'))
    } finally {
      setToggling(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Toggle IVR Menu"
      onCancel={toggling ? undefined : onCancel}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
          <Button disabled={toggling} onClick={onCancel}>
            Close
          </Button>
          <Button type="primary" loading={toggling} onClick={handleConfirm}>
            Toggle
          </Button>
        </div>
      }
      width={440}
    >
      <Typography.Paragraph style={{ marginBottom: 0 }}>
        {count === 1 ? 'Do you really want to toggle this IVR Menu?' : `Do you really want to toggle these ${count} IVR Menus?`}
      </Typography.Paragraph>
    </Modal>
  )
}

export default ToggleIVRMenuModal
