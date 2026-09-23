import { useState } from 'react'
import { Alert, App, Button, Modal, Typography } from 'antd'

const { Paragraph, Text } = Typography

export interface DeleteTarget {
  id: string
  name: string
}

interface DeleteAgentsModalProps {
  open: boolean
  targets: DeleteTarget[]
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

/**
 * Single-row and bulk delete share this confirmation, matching the established template used
 * across every other PepperPBX module's delete flow (destinations.md/outbound-routes.md/
 * announcements.md/call-block.md §20's shared `deleteMessage(...)` copy) and, per this project's
 * own established convention, is used for BOTH the row Delete button and the bulk "Delete" action
 * — the project's own PepperPBX-side addition, since Axion itself deletes without confirmation but
 * every existing PepperPBX module deliberately adds one.
 */
const DeleteAgentsModal = ({ open, targets, onConfirm, onCancel }: DeleteAgentsModalProps) => {
  const { message } = App.useApp()
  const [deleting, setDeleting] = useState(false)

  const single = targets.length === 1

  const handleConfirm = async () => {
    setDeleting(true)
    try {
      await onConfirm()
    } catch {
      message.error('Delete failed.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Delete Call Center Agent"
      onCancel={deleting ? undefined : onCancel}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button disabled={deleting} onClick={onCancel}>
            Cancel
          </Button>
          <Button danger loading={deleting} onClick={handleConfirm}>
            Delete
          </Button>
        </div>
      }
      width={480}
    >
      <Paragraph>Are you sure you want to delete {single ? 'this call center agent' : `these ${targets.length} call center agents`}?</Paragraph>
      {!single && (
        <ul style={{ paddingLeft: 20, maxHeight: 160, overflow: 'auto' }}>
          {targets.map((target) => (
            <li key={target.id}>
              <Text>{target.name}</Text>
            </li>
          ))}
        </ul>
      )}
      <Alert
        type="warning"
        showIcon
        style={{ marginTop: 16 }}
        message="Note: Please ensure this agent is not linked to any other records before proceeding, as deleting it may affect related data."
      />
    </Modal>
  )
}

export default DeleteAgentsModal
