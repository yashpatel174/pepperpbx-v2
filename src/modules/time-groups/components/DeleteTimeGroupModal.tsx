import { Alert, Typography } from 'antd'
import ConfirmActionModal from '../../../components/common/ConfirmActionModal'
import { timeGroupDeleteWarning } from '../time-group.constants'

const { Paragraph, Text } = Typography

export interface DeleteTarget {
  id: string
  name: string
}

interface DeleteTimeGroupModalProps {
  open: boolean
  targets: DeleteTarget[]
  onConfirm: () => Promise<void>
  onCancel: () => void
}

/**
 * Single-row and bulk delete confirmation (time-groups.md §3/§20), with Axion's shared
 * `deleteMessage('time group')` warning. Axion's `saveLoading` spinner never rendered because the
 * parent never passed it (§28); here the Delete button shows loading until the request settles,
 * and the modal stays open on failure.
 */
const DeleteTimeGroupModal = ({ open, targets, onConfirm, onCancel }: DeleteTimeGroupModalProps) => {
  const single = targets.length === 1

  return (
    <ConfirmActionModal
      open={open}
      title="Delete Time Group"
      confirmText="Delete"
      danger
      width={480}
      errorMessage="Failed to delete time group."
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <Paragraph>
        Are you sure you want to delete{' '}
        {single ? <Text strong>{targets[0]?.name}</Text> : `these ${targets.length} time groups`}?
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
      <Alert type="warning" showIcon title={timeGroupDeleteWarning} />
    </ConfirmActionModal>
  )
}

export default DeleteTimeGroupModal
