import { Typography } from 'antd'
import ConfirmActionModal from '../../../../components/common/ConfirmActionModal'

const { Paragraph } = Typography

interface ToggleOutboundRoutesModalProps {
  open: boolean
  count: number
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

/**
 * Bulk-only confirmation — the audit documents no per-row popup for the Status pill (it toggles
 * inline, no confirmation, see outbound-route.service.ts's toggleOutboundRoutes and
 * OutboundRouteTable.tsx); this modal backs only the "Toggle" bulk action
 * (outbound-routes.md §3/§20/§21/§26's "Do you really want to toggle this?").
 */
const ToggleOutboundRoutesModal = ({ open, count, onConfirm, onCancel }: ToggleOutboundRoutesModalProps) => {
  return (
    <ConfirmActionModal
      open={open}
      title="Toggle Outbound Routes"
      confirmText="Toggle"
      width={440}
      errorMessage="Toggle failed."
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <Paragraph>
        Do you really want to toggle the status of {count === 1 ? 'this outbound route' : `these ${count} outbound routes`}?
      </Paragraph>
    </ConfirmActionModal>
  )
}

export default ToggleOutboundRoutesModal
