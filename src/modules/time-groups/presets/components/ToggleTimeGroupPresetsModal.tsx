import { useState } from 'react'
import { App, Button, Modal, Typography } from 'antd'
import { getApiErrorMessage } from '../../../../services/api/apiError'

interface ToggleTimeGroupPresetsModalProps {
  open: boolean
  count: number
  onConfirm: () => Promise<void>
  onCancel: () => void
}

/**
 * Bulk Toggle confirmation (Axion's `TogglePreset`: "Do you really want to toggle this?"). Each
 * selected preset's status flips. Stays open on failure and shows the in-flight state.
 */
const ToggleTimeGroupPresetsModal = ({ open, count, onConfirm, onCancel }: ToggleTimeGroupPresetsModalProps) => {
  const { message } = App.useApp()
  const [toggling, setToggling] = useState(false)

  const handleConfirm = async () => {
    setToggling(true)
    try {
      await onConfirm()
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to toggle presets.'))
    } finally {
      setToggling(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Toggle Preset"
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
        Do you really want to toggle {count === 1 ? 'this preset' : `these ${count} presets`}?
      </Typography.Paragraph>
    </Modal>
  )
}

export default ToggleTimeGroupPresetsModal
