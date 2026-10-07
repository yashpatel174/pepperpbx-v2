import { Alert, Typography } from 'antd'
import ConfirmActionModal from '../../../components/common/ConfirmActionModal'

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
  const single = targets.length === 1

  return (
    <ConfirmActionModal
      open={open}
      title="Delete Announcement"
      confirmText="Delete"
      danger
      width={480}
      errorMessage="Delete failed."
      onConfirm={onConfirm}
      onCancel={onCancel}
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
    </ConfirmActionModal>
  )
}

export default DeleteAnnouncementsModal
