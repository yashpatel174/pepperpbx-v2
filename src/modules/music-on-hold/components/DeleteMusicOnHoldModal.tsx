import { Typography } from 'antd'
import ConfirmActionModal from '../../../components/common/ConfirmActionModal'

const { Paragraph, Text } = Typography

export interface DeleteMohTarget {
  categoryUuid: string
  categoryLabel: string
  fileName: string
}

interface DeleteMusicOnHoldModalProps {
  open: boolean
  /** Stays set until `onAfterClose`, so the text survives the closing animation. */
  target: DeleteMohTarget | null
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  onAfterClose: () => void
}

/**
 * Single audio-file delete confirmation (music-on-hold.md §3/§20). Fixes the audited defect (§28)
 * where Axion closed the popup before the request resolved: the shared ConfirmActionModal keeps it
 * open with a loading confirm button, reports a failure in place, and the caller closes it only on success.
 */
const DeleteMusicOnHoldModal = ({ open, target, onConfirm, onCancel, onAfterClose }: DeleteMusicOnHoldModalProps) => (
  <ConfirmActionModal
    open={open}
    afterClose={onAfterClose}
    title="Delete Audio File"
    confirmText="Delete"
    danger
    width={480}
    errorMessage="Failed to delete the audio file."
    onConfirm={onConfirm}
    onCancel={onCancel}
  >
    <Paragraph style={{ marginBottom: 0 }}>
      Are you sure you want to delete <Text strong>{target?.fileName}</Text>
      {target ? <> from <Text strong>{target.categoryLabel}</Text></> : null}?
    </Paragraph>
  </ConfirmActionModal>
)

export default DeleteMusicOnHoldModal
