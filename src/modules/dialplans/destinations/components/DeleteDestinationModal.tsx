import { useState } from 'react'
import { Alert, App, Button, Modal, Typography } from 'antd'

const { Paragraph, Text } = Typography

export interface DeleteTarget {
  id: string
  destination: string
}

interface DeleteDestinationModalProps {
  open: boolean
  targets: DeleteTarget[]
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

/**
 * Single-row and bulk delete share this confirmation, matching the shared warning copy the
 * Axion reference uses for Destinations (destinations.md §20's deleteMessage('destination')).
 * Unlike Extensions there is no "with/without voicemail" choice here — just Confirm/Cancel.
 */
const DeleteDestinationModal = ({ open, targets, onConfirm, onCancel }: DeleteDestinationModalProps) => {
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
      title="Delete Destination"
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
        Are you sure you want to delete {single ? 'this destination' : `these ${targets.length} destinations`}?
      </Paragraph>
      {!single && (
        <ul style={{ paddingLeft: 20, maxHeight: 160, overflow: 'auto' }}>
          {targets.map((target) => (
            <li key={target.id}>
              <Text>{target.destination}</Text>
            </li>
          ))}
        </ul>
      )}
      <Alert
        type="warning"
        showIcon
        style={{ marginTop: 16 }}
        title="Note: Please ensure this destination is not linked to any other records before proceeding, as deleting it may affect related data."
      />
    </Modal>
  )
}

export default DeleteDestinationModal
