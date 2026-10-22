import { useState } from 'react'
import { Form, Select, Typography } from 'antd'
import ConfirmActionModal from '../../../components/common/ConfirmActionModal'
import { conferenceRoomToggleFields } from '../conference-room.constants'
import type { ConferenceRoomToggleKey } from '../conference-room.types'

interface ToggleConferenceRoomModalProps {
  open: boolean
  count: number
  onConfirm: (toggleKey: ConferenceRoomToggleKey) => Promise<void>
  onCancel: () => void
  /** After the close animation — the page clears `count`'s source here so the closing modal never shows "0". */
  afterClose?: () => void
}

/**
 * Bulk Toggle only — pick which of the seven flags to flip on every selected room, then confirm
 * (conference-rooms.md §3/§20). The inline column toggles never open this. Unlike Axion (§28), the
 * Toggle button shows a real loading state and the modal stays open if the request fails.
 */
const ToggleConferenceRoomModal = ({ open, count, onConfirm, onCancel, afterClose }: ToggleConferenceRoomModalProps) => {
  const [toggleKey, setToggleKey] = useState<ConferenceRoomToggleKey | undefined>(undefined)
  // Locks the field choice while the request runs (the modal itself owns the button loading state).
  const [toggling, setToggling] = useState(false)

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
      title="Toggle Conference Rooms"
      confirmText="Toggle"
      confirmDisabled={!toggleKey}
      width={440}
      errorMessage="Toggle failed."
      onConfirm={handleConfirm}
      onCancel={onCancel}
      afterClose={() => {
        setToggleKey(undefined)
        afterClose?.()
      }}
    >
      <Typography.Paragraph>
        Select the field to toggle on {count === 1 ? 'the selected conference room' : `the ${count} selected conference rooms`}.
      </Typography.Paragraph>
      <Form layout="vertical">
        <Form.Item label="Field to toggle" required style={{ marginBottom: 0 }}>
          <Select<ConferenceRoomToggleKey>
            placeholder="Select field"
            value={toggleKey}
            onChange={setToggleKey}
            options={conferenceRoomToggleFields.map(({ key, label }) => ({ value: key, label }))}
            disabled={toggling}
            aria-label="Field to toggle"
          />
        </Form.Item>
      </Form>
    </ConfirmActionModal>
  )
}

export default ToggleConferenceRoomModal
