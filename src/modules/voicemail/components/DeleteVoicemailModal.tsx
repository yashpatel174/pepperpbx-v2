import { Alert, Typography } from 'antd'
import ConfirmActionModal from '../../../components/common/ConfirmActionModal'

const { Paragraph, Text } = Typography

export interface DeleteTarget {
  id: string
  label: string
}

interface DeleteVoicemailModalProps {
  open: boolean
  targets: DeleteTarget[]
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

/**
 * Single-row and bulk delete share this confirmation (voicemail.md §14): title "Delete Voicemail",
 * the shared deleteMessage('voicemail') text and its linked-records note. Uses the project's shared
 * ConfirmActionModal (as every other module's delete does) rather than a Popconfirm — the audit's
 * confirmation is a modal popup with a long warning, and bulk delete has no single anchor element.
 */
const DeleteVoicemailModal = ({ open, targets, onConfirm, onCancel }: DeleteVoicemailModalProps) => {
  const single = targets.length === 1

  return (
    <ConfirmActionModal
      open={open}
      title="Delete Voicemail"
      confirmText="Delete"
      danger
      width={480}
      errorMessage="Delete failed."
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <Paragraph>Are you sure you want to delete {single ? 'this voicemail' : `these ${targets.length} voicemails`}?</Paragraph>
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
        title="Note: Please ensure that this voicemail is not linked to any other records before proceeding, as deleting it may affect related data."
      />
    </ConfirmActionModal>
  )
}

export default DeleteVoicemailModal
