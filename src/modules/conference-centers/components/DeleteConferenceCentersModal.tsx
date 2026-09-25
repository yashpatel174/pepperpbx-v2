import { useState } from 'react'
import { Alert, App, Button, Modal, Typography } from 'antd'

const { Paragraph, Text } = Typography

export interface DeleteTarget {
  id: string
  name: string
}

interface DeleteConferenceCentersModalProps {
  open: boolean
  targets: DeleteTarget[]
  onConfirm: () => Promise<void>
  onCancel: () => void
}

/**
 * Shared by row Delete and bulk Delete. Stays open until `onConfirm` resolves and stays open on
 * failure — unlike Axion, which closes the popup before the request finishes and swallows errors
 * (conference-centers.md §28).
 */
const DeleteConferenceCentersModal = ({ open, targets, onConfirm, onCancel }: DeleteConferenceCentersModalProps) => {
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
      title="Delete Conference Center"
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
        Are you sure you want to delete {single ? 'this conference center' : `these ${targets.length} conference centers`}?
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
        message="Note: Please ensure this conference center is not linked to any other records (such as conference rooms) before proceeding, as deleting it may affect related data."
      />
    </Modal>
  )
}

export default DeleteConferenceCentersModal
