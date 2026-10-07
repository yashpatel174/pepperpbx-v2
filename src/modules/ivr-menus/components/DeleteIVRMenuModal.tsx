import { Alert, Typography } from 'antd'
import ConfirmActionModal from '../../../components/common/ConfirmActionModal'
import { ivrMenuDeleteWarning } from '../ivr-menu.constants'

const { Paragraph, Text } = Typography

export interface DeleteTarget {
  id: string
  name: string
}

interface DeleteIVRMenuModalProps {
  open: boolean
  targets: DeleteTarget[]
  onConfirm: () => Promise<void>
  onCancel: () => void
}

/**
 * Single-row and bulk delete confirmation (ivr-menus.md §3/§20) with Axion's shared
 * `deleteMessage('IVR menu')` warning. Unlike Axion — whose popup closes before the request
 * resolves (§28) — this stays open until the request settles and on failure.
 */
const DeleteIVRMenuModal = ({ open, targets, onConfirm, onCancel }: DeleteIVRMenuModalProps) => {
  const single = targets.length === 1

  return (
    <ConfirmActionModal
      open={open}
      title="Delete IVR Menu"
      confirmText="Delete"
      danger
      width={480}
      errorMessage="Failed to delete IVR menu."
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <Paragraph>
        Are you sure you want to delete {single ? <Text strong>{targets[0]?.name}</Text> : `these ${targets.length} IVR menus`}?
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
      <Alert type="warning" showIcon title={ivrMenuDeleteWarning} />
    </ConfirmActionModal>
  )
}

export default DeleteIVRMenuModal
