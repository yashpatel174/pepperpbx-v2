import { Typography } from 'antd'
import ConfirmActionModal from '../../../../components/common/ConfirmActionModal'

interface ToggleTimeGroupPresetsModalProps {
  open: boolean
  count: number
  onConfirm: () => Promise<void>
  onCancel: () => void
}

/**
 * Bulk Toggle confirmation (Axion's `TogglePreset`: "Do you really want to toggle this?"). Each
 * selected preset's status flips. Stays open on failure and shows the in-flight state.
 */
const ToggleTimeGroupPresetsModal = ({ open, count, onConfirm, onCancel }: ToggleTimeGroupPresetsModalProps) => {
  return (
    <ConfirmActionModal
      open={open}
      title="Toggle Preset"
      confirmText="Toggle"
      width={440}
      errorMessage="Failed to toggle presets."
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <Typography.Paragraph>
        Do you really want to toggle {count === 1 ? 'this preset' : `these ${count} presets`}?
      </Typography.Paragraph>
    </ConfirmActionModal>
  )
}

export default ToggleTimeGroupPresetsModal
