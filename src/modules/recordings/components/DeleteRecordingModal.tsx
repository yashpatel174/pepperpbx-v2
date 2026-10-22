import { Alert, Typography } from 'antd'
import ConfirmActionModal from '../../../components/common/ConfirmActionModal'

const { Paragraph, Text } = Typography

export interface DeleteTarget {
  id: string
  label: string
}

interface DeleteRecordingModalProps {
  open: boolean
  targets: DeleteTarget[]
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

/**
 * Single-row and bulk delete share this confirmation (recordings.md §3/§20). It stays open while
 * the request runs and closes only on success (the shared ConfirmActionModal contract) — the
 * behavior the audit calls correct (§28). The audit does not print the shared `deleteMessage`
 * copy, so the wording follows the other modules' delete popups.
 */
const DeleteRecordingModal = ({ open, targets, onConfirm, onCancel }: DeleteRecordingModalProps) => {
  const single = targets.length === 1

  return (
    <ConfirmActionModal
      open={open}
      title="Delete Recording"
      confirmText="Delete"
      danger
      width={480}
      errorMessage="Delete failed."
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <Paragraph>Are you sure you want to delete {single ? 'this recording' : `these ${targets.length} recordings`}?</Paragraph>
      {!single && (
        <ul style={{ paddingLeft: 20, maxHeight: 160, overflow: 'auto' }}>
          {targets.map((target) => (
            <li key={target.id}>
              <Text>{target.label}</Text>
            </li>
          ))}
        </ul>
      )}
      <Alert
        type="warning"
        showIcon
        style={{ marginTop: 16 }}
        title="Note: Please ensure that this recording is not linked to any other records before proceeding, as deleting it may affect related data."
      />
    </ConfirmActionModal>
  )
}

export default DeleteRecordingModal
