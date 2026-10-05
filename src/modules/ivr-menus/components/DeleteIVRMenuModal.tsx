import { useState } from 'react'
import { Alert, App, Button, Modal, Typography } from 'antd'
import { getApiErrorMessage } from '../../../services/api/apiError'
import { ivrMenuDeleteWarning } from '../ivr-menu.constants'

const { Paragraph, Text } = Typography

export interface DeleteTarget {
  id: string
  name: string
}

interface DeleteIVRMenuModalProps {
  open: boolean
  targets: DeleteTarget[]
  onConfirm: () => Promise<void>
  onCancel: () => void
}

/**
 * Single-row and bulk delete confirmation (ivr-menus.md §3/§20) with Axion's shared
 * `deleteMessage('IVR menu')` warning. Unlike Axion — whose popup closes before the request
 * resolves (§28) — this stays open until the request settles and on failure.
 */
const DeleteIVRMenuModal = ({ open, targets, onConfirm, onCancel }: DeleteIVRMenuModalProps) => {
  const { message } = App.useApp()
  const [deleting, setDeleting] = useState(false)
  const single = targets.length === 1

  const handleConfirm = async () => {
    setDeleting(true)
    try {
      await onConfirm()
    } catch (err) {
      message.error(getApiErrorMessage(err, 'Failed to delete IVR menu.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Delete IVR Menu"
      onCancel={deleting ? undefined : onCancel}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
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
        Are you sure you want to delete {single ? <Text strong>{targets[0]?.name}</Text> : `these ${targets.length} IVR menus`}?
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
      <Alert type="warning" showIcon message={ivrMenuDeleteWarning} />
    </Modal>
  )
}

export default DeleteIVRMenuModal
