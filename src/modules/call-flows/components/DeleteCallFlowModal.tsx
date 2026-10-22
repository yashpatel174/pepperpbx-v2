import { Alert, Typography } from 'antd'
import ConfirmActionModal from '../../../components/common/ConfirmActionModal'
import { callFlowDeleteWarning } from '../call-flows.constants'

const { Paragraph, Text } = Typography

export interface DeleteTarget {
  id: string
  name: string
}

interface DeleteCallFlowModalProps {
  open: boolean
  targets: DeleteTarget[]
  onConfirm: () => Promise<void>
  onCancel: () => void
}

/**
 * Single-row and bulk delete confirmation (call-flows.md §3/§20), with Axion's "not linked
 * elsewhere" warning. Stays open until the request settles and on failure, as Axion's does.
 */
const DeleteCallFlowModal = ({ open, targets, onConfirm, onCancel }: DeleteCallFlowModalProps) => {
  const single = targets.length === 1

  return (
    <ConfirmActionModal
      open={open}
      title="Delete Call Flow"
      confirmText="Delete"
      danger
      width={480}
      errorMessage="Failed to delete call flow."
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <Paragraph>
        Are you sure you want to delete {single ? <Text strong>{targets[0]?.name}</Text> : `these ${targets.length} call flows`}?
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
      <Alert type="warning" showIcon title={callFlowDeleteWarning} />
    </ConfirmActionModal>
  )
}

export default DeleteCallFlowModal
