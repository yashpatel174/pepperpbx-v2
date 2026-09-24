import { useState } from 'react'
import { Alert, App, Button, Modal, Typography } from 'antd'

const { Paragraph, Text } = Typography

export interface DeleteTarget {
  id: string
  name: string
}

interface DeleteConferenceModalProps {
  open: boolean
  targets: DeleteTarget[]
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

/**
 * Single-row and bulk delete share this confirmation, matching the audit's shared warning copy
 * for Conferences (conferences.md §20's `deleteMessage('conference')`). The modal only closes once
 * `onConfirm` resolves — deliberately not reproducing the audit's own confirmed bug where
 * `DeleteConferences.handleDelete()` closes the popup before the API call resolves (conferences.md
 * §28).
 */
const DeleteConferenceModal = ({ open, targets, onConfirm, onCancel }: DeleteConferenceModalProps) => {
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
      title="Delete Conference"
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
      <Paragraph>Are you sure you want to delete {single ? 'this conference' : `these ${targets.length} conferences`}?</Paragraph>
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
        message="Note: Please ensure this conference is not linked to any other records before proceeding, as deleting it may affect related data."
      />
    </Modal>
  )
}

export default DeleteConferenceModal
