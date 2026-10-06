import { useState } from 'react'
import { Alert, App, Button, Modal, Typography } from 'antd'
import { getApiErrorMessage } from '../../../../services/api/apiError'
import { presetDeleteWarning } from '../time-group-preset.constants'

const { Paragraph, Text } = Typography

export interface DeleteTarget {
  id: string
  name: string
}

interface DeleteTimeGroupPresetModalProps {
  open: boolean
  targets: DeleteTarget[]
  onConfirm: () => Promise<void>
  onCancel: () => void
}

/**
 * Row and bulk delete confirmation (Axion's `DeletePreset`, `deleteMessage('preset')`). Stays open
 * with a loading Delete button until the request settles — Axion's spinner never rendered.
 */
const DeleteTimeGroupPresetModal = ({ open, targets, onConfirm, onCancel }: DeleteTimeGroupPresetModalProps) => {
  const { message } = App.useApp()
  const [deleting, setDeleting] = useState(false)
  const single = targets.length === 1

  const handleConfirm = async () => {
    setDeleting(true)
    try {
      await onConfirm()
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to delete preset.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Delete Preset"
      onCancel={deleting ? undefined : onCancel}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button disabled={deleting} onClick={onCancel}>
            Cancel
          </Button>
          <Button danger type="primary" loading={deleting} onClick={handleConfirm}>
            Delete
          </Button>
        </div>
      }
      width={480}
    >
      <Paragraph>
        Are you sure you want to delete {single ? <Text strong>{targets[0]?.name}</Text> : `these ${targets.length} presets`}?
      </Paragraph>
      {!single && (
        <ul style={{ paddingLeft: 20, maxHeight: 160, overflow: 'auto' }}>
          {targets.map((target) => (
            <li key={target.id}>
              <Text>{target.name}</Text>
            </li>
          ))}
        </ul>
      )}
      <Alert type="warning" showIcon message={presetDeleteWarning} />
    </Modal>
  )
}

export default DeleteTimeGroupPresetModal
