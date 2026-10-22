import { Alert, Typography } from 'antd'
import ConfirmActionModal from '../../../../components/common/ConfirmActionModal'
import { presetDeleteWarning } from '../time-group-preset.constants'

const { Paragraph, Text } = Typography

export interface DeleteTarget {
  id: string
  name: string
}

interface DeleteTimeGroupPresetModalProps {
  open: boolean
  targets: DeleteTarget[]
  onConfirm: () => Promise<void>
  onCancel: () => void
}

/**
 * Row and bulk delete confirmation (Axion's `DeletePreset`, `deleteMessage('preset')`). Stays open
 * with a loading Delete button until the request settles — Axion's spinner never rendered.
 */
const DeleteTimeGroupPresetModal = ({ open, targets, onConfirm, onCancel }: DeleteTimeGroupPresetModalProps) => {
  const single = targets.length === 1

  return (
    <ConfirmActionModal
      open={open}
      title="Delete Preset"
      confirmText="Delete"
      danger
      width={480}
      errorMessage="Failed to delete preset."
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <Paragraph>
        Are you sure you want to delete {single ? <Text strong>{targets[0]?.name}</Text> : `these ${targets.length} presets`}?
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
      <Alert type="warning" showIcon title={presetDeleteWarning} />
    </ConfirmActionModal>
  )
}

export default DeleteTimeGroupPresetModal
