import { useEffect, useState } from 'react'
import { Form, Radio, Typography } from 'antd'
import ConfirmActionModal from '../../../components/common/ConfirmActionModal'
import { callFlowToggleKeyLabels } from '../call-flows.constants'
import type { CallFlowToggleKey } from '../call-flows.types'

interface ToggleCallFlowsModalProps {
  open: boolean
  count: number
  onConfirm: (toggleKey: CallFlowToggleKey) => Promise<void>
  onCancel: () => void
}

const toggleKeyOptions = (Object.keys(callFlowToggleKeyLabels) as CallFlowToggleKey[]).map((key) => ({
  value: key,
  label: callFlowToggleKeyLabels[key],
}))

/**
 * Bulk Toggle (call-flows.md §3/§20): pick which flag to flip — Enable Feature Code
 * (`call_flow_status`) or Status (`call_flow_enabled`) — then Toggle. A choice is required, and the
 * button stays disabled until one is made, as in Axion. Stays open on failure.
 */
const ToggleCallFlowsModal = ({ open, count, onConfirm, onCancel }: ToggleCallFlowsModalProps) => {
  const [toggleKey, setToggleKey] = useState<CallFlowToggleKey | undefined>(undefined)
  // Locks the choice while the request runs (the modal itself owns the button loading state).
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    if (!open) setToggleKey(undefined)
  }, [open])

  const handleConfirm = async () => {
    if (!toggleKey) return
    setToggling(true)
    try {
      await onConfirm(toggleKey)
    } finally {
      setToggling(false)
    }
  }

  return (
    <ConfirmActionModal
      open={open}
      title="Toggle Call Flows"
      confirmText="Toggle"
      confirmDisabled={!toggleKey}
      width={440}
      errorMessage="Failed to toggle call flows."
      onConfirm={handleConfirm}
      onCancel={onCancel}
    >
      <Typography.Paragraph>
        Toggle {count === 1 ? 'the selected call flow' : `the ${count} selected call flows`}. Each flow's chosen setting is switched to its opposite value.
      </Typography.Paragraph>
      <Form layout="vertical" disabled={toggling}>
        <Form.Item label="Setting to toggle" required style={{ marginBottom: 0 }}>
          <Radio.Group
            value={toggleKey}
            onChange={(e) => setToggleKey(e.target.value as CallFlowToggleKey)}
            options={toggleKeyOptions}
            aria-label="Setting to toggle"
          />
        </Form.Item>
      </Form>
    </ConfirmActionModal>
  )
}

export default ToggleCallFlowsModal
