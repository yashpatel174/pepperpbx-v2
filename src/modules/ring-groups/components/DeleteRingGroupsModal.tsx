import { useState } from 'react'
import { Alert, App, Button, Modal, Typography } from 'antd'
import { getApiErrorMessage } from '../../../services/api/apiError'
import { ringGroupDeleteWarning } from '../ring-group.constants'

const { Paragraph, Text } = Typography

export interface DeleteTarget {
  id: string
  name: string
}

interface DeleteRingGroupsModalProps {
  open: boolean
  targets: DeleteTarget[]
  onConfirm: () => Promise<void>
  onCancel: () => void
}

/**
 * Single-row and bulk delete confirmation (ring-groups.md §3/§20), with Axion's shared
 * `deleteMessage('ring group')` warning. Stays open until the request settles and on failure, as
 * Axion's does — and, unlike Axion (§28), actually shows the in-flight state on the button.
 */
const DeleteRingGroupsModal = ({ open, targets, onConfirm, onCancel }: DeleteRingGroupsModalProps) => {
  const { message } = App.useApp()
  const [deleting, setDeleting] = useState(false)
  const single = targets.length === 1

  const handleConfirm = async () => {
    setDeleting(true)
    try {
      await onConfirm()
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to delete ring group.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Delete Ring Group"
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
        Are you sure you want to delete {single ? <Text strong>{targets[0]?.name}</Text> : `these ${targets.length} ring groups`}?
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
      <Alert type="warning" showIcon message={ringGroupDeleteWarning} />
    </Modal>
  )
}

export default DeleteRingGroupsModal
