import { useState } from 'react'
import { App, Button, Form, Modal, Select, Typography } from 'antd'
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
  const { message } = App.useApp()
  const [toggleKey, setToggleKey] = useState<ConferenceRoomToggleKey | undefined>(undefined)
  const [toggling, setToggling] = useState(false)

  const handleConfirm = async () => {
    if (!toggleKey) return
    setToggling(true)
    try {
      await onConfirm(toggleKey)
    } catch {
      message.error('Toggle failed.')
    } finally {
      setToggling(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Toggle Conference Rooms"
      onCancel={toggling ? undefined : onCancel}
      afterClose={() => {
        setToggleKey(undefined)
        afterClose?.()
      }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button disabled={toggling} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="primary" loading={toggling} disabled={!toggleKey} onClick={handleConfirm}>
            Toggle
          </Button>
        </div>
      }
      width={440}
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
    </Modal>
  )
}

export default ToggleConferenceRoomModal
