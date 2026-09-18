import { useState } from 'react'
import { Alert, App, Button, Modal, Typography } from 'antd'

const { Paragraph, Text } = Typography

export interface DeleteTarget {
  id: string
  name: string
}

interface DeleteAnnouncementsModalProps {
  open: boolean
  targets: DeleteTarget[]
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

/**
 * Single-row and bulk delete share this confirmation, matching the audit's shared warning copy
 * for Announcements (announcements.md §20's `deleteMessage('Announcement')`).
 */
const DeleteAnnouncementsModal = ({ open, targets, onConfirm, onCancel }: DeleteAnnouncementsModalProps) => {
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
      title="Delete Announcement"
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
      <Paragraph>
        Are you sure you want to delete {single ? 'this announcement' : `these ${targets.length} announcements`}?
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
      <Alert
        type="warning"
        showIcon
        style={{ marginTop: 16 }}
        title="Note: Please ensure this announcement is not referenced by any other records before proceeding, as deleting it may affect related data."
      />
    </Modal>
  )
}

export default DeleteAnnouncementsModal
