import { useState } from 'react'
import { Alert, App, Button, Modal, Typography } from 'antd'
import { getApiErrorMessage } from '../../../services/api/apiError'
import { timeConditionDeleteWarning } from '../time-condition.constants'

const { Paragraph, Text } = Typography

export interface DeleteTarget {
  id: string
  name: string
}

interface DeleteTimeConditionModalProps {
  open: boolean
  targets: DeleteTarget[]
  onConfirm: () => Promise<void>
  onCancel: () => void
}

/**
 * Single-row and bulk delete confirmation (time-conditions.md §3/§20), with Axion's "not linked
 * elsewhere" warning. Unlike Axion, which closes the popup before the request resolves (§28), this
 * stays open with a loading Delete button until the request settles, and stays open on failure.
 */
const DeleteTimeConditionModal = ({ open, targets, onConfirm, onCancel }: DeleteTimeConditionModalProps) => {
  const { message } = App.useApp()
  const [deleting, setDeleting] = useState(false)
  const single = targets.length === 1

  const handleConfirm = async () => {
    setDeleting(true)
    try {
      await onConfirm()
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to delete time condition.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Delete Time Condition"
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
        {single ? <Text strong>{targets[0]?.name}</Text> : `these ${targets.length} time conditions`}?
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
      <Alert type="warning" showIcon message={timeConditionDeleteWarning} />
    </Modal>
  )
}

export default DeleteTimeConditionModal
