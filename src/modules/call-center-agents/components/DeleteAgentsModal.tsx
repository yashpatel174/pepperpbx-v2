import { Alert, Typography } from 'antd'
import ConfirmActionModal from '../../../components/common/ConfirmActionModal'

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
  const single = targets.length === 1

  return (
    <ConfirmActionModal
      open={open}
      title="Delete Call Center Agent"
      confirmText="Delete"
      danger
      width={480}
      errorMessage="Delete failed."
      onConfirm={onConfirm}
      onCancel={onCancel}
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
        title="Note: Please ensure this agent is not linked to any other records before proceeding, as deleting it may affect related data."
      />
    </ConfirmActionModal>
  )
}

export default DeleteAgentsModal
