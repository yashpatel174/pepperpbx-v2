import { Alert, Typography } from 'antd'
import ConfirmActionModal from '../../../components/common/ConfirmActionModal'

const { Paragraph, Text } = Typography

export interface DeleteTarget {
  id: string
  name: string
}

interface DeleteCallCentersModalProps {
  open: boolean
  targets: DeleteTarget[]
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

/**
 * Single-row and bulk delete share this confirmation, matching the audit's shared warning copy
 * for Call Center (call-center.md §20's `deleteMessage('call center')`).
 */
const DeleteCallCentersModal = ({ open, targets, onConfirm, onCancel }: DeleteCallCentersModalProps) => {
  const single = targets.length === 1

  return (
    <ConfirmActionModal
      open={open}
      title="Delete Call Center Queue"
      confirmText="Delete"
      danger
      width={480}
      errorMessage="Delete failed."
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <Paragraph>
        Are you sure you want to delete {single ? 'this call center queue' : `these ${targets.length} call center queues`}?
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
        title="Note: Please ensure this call center queue is not linked to any other records before proceeding, as deleting it may affect related data."
      />
    </ConfirmActionModal>
  )
}

export default DeleteCallCentersModal
