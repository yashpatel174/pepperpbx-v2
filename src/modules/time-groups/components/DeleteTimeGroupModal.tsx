import { useState } from 'react'
import { Alert, App, Button, Modal, Typography } from 'antd'
import { getApiErrorMessage } from '../../../services/api/apiError'
import { timeGroupDeleteWarning } from '../time-group.constants'

const { Paragraph, Text } = Typography

export interface DeleteTarget {
  id: string
  name: string
}

interface DeleteTimeGroupModalProps {
  open: boolean
  targets: DeleteTarget[]
  onConfirm: () => Promise<void>
  onCancel: () => void
}

/**
 * Single-row and bulk delete confirmation (time-groups.md §3/§20), with Axion's shared
 * `deleteMessage('time group')` warning. Axion's `saveLoading` spinner never rendered because the
 * parent never passed it (§28); here the Delete button shows loading until the request settles,
 * and the modal stays open on failure.
 */
const DeleteTimeGroupModal = ({ open, targets, onConfirm, onCancel }: DeleteTimeGroupModalProps) => {
  const { message } = App.useApp()
  const [deleting, setDeleting] = useState(false)
  const single = targets.length === 1

  const handleConfirm = async () => {
    setDeleting(true)
    try {
      await onConfirm()
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to delete time group.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Delete Time Group"
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
        Are you sure you want to delete{' '}
        {single ? <Text strong>{targets[0]?.name}</Text> : `these ${targets.length} time groups`}?
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
      <Alert type="warning" showIcon message={timeGroupDeleteWarning} />
    </Modal>
  )
}

export default DeleteTimeGroupModal
