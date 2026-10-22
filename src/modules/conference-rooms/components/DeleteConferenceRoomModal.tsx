import { Alert, Typography } from 'antd'
import ConfirmActionModal from '../../../components/common/ConfirmActionModal'

const { Paragraph, Text } = Typography

export interface DeleteTarget {
  id: string
  name: string
}

interface DeleteConferenceRoomModalProps {
  open: boolean
  targets: DeleteTarget[]
  onConfirm: () => Promise<void>
  onCancel: () => void
  /** After the close animation — the page clears `targets` here so the closing modal never shows "0". */
  afterClose?: () => void
}

/**
 * Shared by row Delete and bulk Delete, with the shared relational-data warning (conference-rooms.md
 * §3/§20). Stays open until `onConfirm` resolves and stays open on failure — Axion only
 * `console.warn`s a failed delete (§11).
 */
const DeleteConferenceRoomModal = ({ open, targets, onConfirm, onCancel, afterClose }: DeleteConferenceRoomModalProps) => {
  const single = targets.length === 1

  return (
    <ConfirmActionModal
      open={open}
      title="Delete Conference Room"
      confirmText="Delete"
      danger
      width={480}
      errorMessage="Delete failed."
      onConfirm={onConfirm}
      onCancel={onCancel}
      afterClose={afterClose}
    >
      <Paragraph>
        Are you sure you want to delete {single ? 'this conference room' : `these ${targets.length} conference rooms`}?
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
        title="Note: Please ensure this conference room is not linked to any other records before proceeding, as deleting it may affect related data."
      />
    </ConfirmActionModal>
  )
}

export default DeleteConferenceRoomModal
