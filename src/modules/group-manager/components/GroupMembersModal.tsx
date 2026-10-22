import { useState } from 'react'
import { Button, Modal, Select, Space } from 'antd'
import type { GroupMember } from '../group-manager.types'

interface GroupMembersModalProps {
  open: boolean
  users: GroupMember[]
  /** User ids staged so far on the Add Group page. */
  value: string[]
  onApply: (userIds: string[]) => void
  onCancel: () => void
}

type BodyProps = Omit<GroupMembersModalProps, 'open'>

/** Mounted only while the modal is open (destroyOnHidden), so its draft always starts from `value`. */
const Body = ({ users, value, onApply, onCancel }: BodyProps) => {
  const [draft, setDraft] = useState<string[]>(value)

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <Select
        mode="multiple"
        showSearch={{ optionFilterProp: 'label' }}
        value={draft}
        onChange={setDraft}
        options={users.map((u) => ({ value: u.user_uuid, label: `${u.username} (${u.full_name})` }))}
        placeholder="Select members"
        style={{ width: '100%' }}
        aria-label="Group members"
      />
      <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="primary" onClick={() => onApply(draft)}>
          Apply ({draft.length})
        </Button>
      </Space>
    </Space>
  )
}

const GroupMembersModal = ({ open, ...rest }: GroupMembersModalProps) => (
  <Modal open={open} title="Group Members" footer={null} width={560} destroyOnHidden onCancel={rest.onCancel}>
    <Body {...rest} />
  </Modal>
)

export default GroupMembersModal
