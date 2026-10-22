import { Button, Table, theme, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import { EditOutlined, SoundOutlined } from '@ant-design/icons'
import useStripedTableRow from '../../../components/common/useStripedTableRow'
import { canEavesdropMember } from '../active-call-center.utils'
import type { MemberRow } from '../active-call-center.types'

interface QueueMemberTableProps {
  data: MemberRow[]
  loading: boolean
  onEavesdrop: (member: MemberRow) => void
  onEdit: () => void
}

const compareText = (a: string, b: string) => a.localeCompare(b)

/**
 * Queue members table of the Activity screen (active-call-center.md §5): six data columns, an
 * Eavesdrop option (hidden for Abandoned members, §26) and an Edit action. No selection, no
 * pagination — it scrolls inside a fixed height.
 */
const QueueMemberTable = ({ data, loading, onEavesdrop, onEdit }: QueueMemberTableProps) => {
  const onRow = useStripedTableRow()
  const { token } = theme.useToken()

  const columns: TableColumnsType<MemberRow> = [
    { title: 'Time', dataIndex: 'time', key: 'time', sorter: (a, b) => a.joined_epoch - b.joined_epoch },
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => compareText(a.name, b.name) },
    { title: 'Number', dataIndex: 'number', key: 'number', sorter: (a, b) => compareText(a.number, b.number) },
    { title: 'Status', dataIndex: 'status', key: 'status', sorter: (a, b) => compareText(a.status, b.status) },
    {
      title: 'Options',
      key: 'options',
      render: (_, member) =>
        canEavesdropMember(member) ? (
          // TODO: permission-gate Eavesdrop once RBAC permissions are populated from the backend.
          <Tooltip title="Eavesdrop">
            <Button type="text" size="small" icon={<SoundOutlined style={{ color: token.colorPrimary }} />} onClick={() => onEavesdrop(member)} aria-label={`Eavesdrop on ${member.name || member.number}`} />
          </Tooltip>
        ) : null,
    },
    { title: 'Agent', dataIndex: 'agent', key: 'agent', sorter: (a, b) => compareText(a.agent, b.agent) },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 80,
      render: () => (
        <Tooltip title="Edit queue">
          <Button type="text" size="small" icon={<EditOutlined style={{ color: token.colorPrimary }} />} onClick={onEdit} aria-label="Edit queue" />
        </Tooltip>
      ),
    },
  ]

  return (
    <Table<MemberRow>
      rowKey="key"
      size="small"
      showSorterTooltip={false}
      columns={columns}
      dataSource={data}
      loading={loading}
      onRow={onRow}
      pagination={false}
      locale={{ emptyText: 'No callers in this queue.' }}
      scroll={{ x: 'max-content', y: 300 }}
    />
  )
}

export default QueueMemberTable
