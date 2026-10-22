import { Alert, Typography } from 'antd'
import ConfirmActionModal from '../../../components/common/ConfirmActionModal'
import { timeConditionDeleteWarning } from '../time-condition.constants'

const { Paragraph, Text } = Typography

export interface DeleteTarget {
  id: string
  name: string
}

interface DeleteTimeConditionModalProps {
  open: boolean
  targets: DeleteTarget[]
  onConfirm: () => Promise<void>
  onCancel: () => void
}

/**
 * Single-row and bulk delete confirmation (time-conditions.md §3/§20), with Axion's "not linked
 * elsewhere" warning. Unlike Axion, which closes the popup before the request resolves (§28), this
 * stays open with a loading Delete button until the request settles, and stays open on failure.
 */
const DeleteTimeConditionModal = ({ open, targets, onConfirm, onCancel }: DeleteTimeConditionModalProps) => {
  const single = targets.length === 1

  return (
    <ConfirmActionModal
      open={open}
      title="Delete Time Condition"
      confirmText="Delete"
      danger
      width={480}
      errorMessage="Failed to delete time condition."
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <Paragraph>
        Are you sure you want to delete{' '}
        {single ? <Text strong>{targets[0]?.name}</Text> : `these ${targets.length} time conditions`}?
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
      <Alert type="warning" showIcon title={timeConditionDeleteWarning} />
    </ConfirmActionModal>
  )
}

export default DeleteTimeConditionModal
