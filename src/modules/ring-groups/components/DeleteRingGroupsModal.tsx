import { Alert, Typography } from 'antd'
import ConfirmActionModal from '../../../components/common/ConfirmActionModal'
import { ringGroupDeleteWarning } from '../ring-group.constants'

const { Paragraph, Text } = Typography

export interface DeleteTarget {
  id: string
  name: string
}

interface DeleteRingGroupsModalProps {
  open: boolean
  targets: DeleteTarget[]
  onConfirm: () => Promise<void>
  onCancel: () => void
}

/**
 * Single-row and bulk delete confirmation (ring-groups.md §3/§20), with Axion's shared
 * `deleteMessage('ring group')` warning. Stays open until the request settles and on failure, as
 * Axion's does — and, unlike Axion (§28), actually shows the in-flight state on the button.
 */
const DeleteRingGroupsModal = ({ open, targets, onConfirm, onCancel }: DeleteRingGroupsModalProps) => {
  const single = targets.length === 1

  return (
    <ConfirmActionModal
      open={open}
      title="Delete Ring Group"
      confirmText="Delete"
      danger
      width={480}
      errorMessage="Failed to delete ring group."
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <Paragraph>
        Are you sure you want to delete {single ? <Text strong>{targets[0]?.name}</Text> : `these ${targets.length} ring groups`}?
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
      <Alert type="warning" showIcon title={ringGroupDeleteWarning} />
    </ConfirmActionModal>
  )
}

export default DeleteRingGroupsModal
