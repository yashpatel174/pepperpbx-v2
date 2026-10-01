import { useState } from 'react'
import { App, Button, Modal, Typography } from 'antd'
import { getApiErrorMessage } from '../../../services/api/apiError'

interface ToggleRingGroupsModalProps {
  open: boolean
  count: number
  onConfirm: () => Promise<void>
  onCancel: () => void
}

/**
 * Bulk Toggle confirmation (ring-groups.md §3/§20) — "Do you really want to toggle this ring
 * group?". Each selected ring group's Enabled flag flips. Stays open on failure, and shows the
 * in-flight state Axion's never did (§28).
 */
const ToggleRingGroupsModal = ({ open, count, onConfirm, onCancel }: ToggleRingGroupsModalProps) => {
  const { message } = App.useApp()
  const [toggling, setToggling] = useState(false)

  const handleConfirm = async () => {
    setToggling(true)
    try {
      await onConfirm()
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to toggle ring groups.'))
    } finally {
      setToggling(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Toggle Ring Group"
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
      <Typography.Paragraph>
        Do you really want to toggle {count === 1 ? 'this ring group' : `these ${count} ring groups`}?
      </Typography.Paragraph>
    </Modal>
  )
}

export default ToggleRingGroupsModal
