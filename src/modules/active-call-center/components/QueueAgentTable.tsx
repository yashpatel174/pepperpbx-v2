import { Button, Space, Table, theme, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import { EditOutlined, PhoneOutlined, SoundOutlined, SwapOutlined } from '@ant-design/icons'
import useStripedTableRow from '../../../components/common/useStripedTableRow'
import { ACTIVE_INBOUND_TIER_STATE } from '../active-call-center.constants'
import type { AgentRow } from '../active-call-center.types'

interface QueueAgentTableProps {
  data: AgentRow[]
  loading: boolean
  onEavesdrop: (agent: AgentRow) => void
  onTransfer: (agent: AgentRow) => void
  onCall: (agent: AgentRow) => void
  onEdit: () => void
}

const compareText = (a: string, b: string) => a.localeCompare(b)

const textColumn = (title: string, key: keyof AgentRow): TableColumnsType<AgentRow>[number] => ({
  title,
  dataIndex: key,
  key,
  sorter: (a, b) => compareText(String(a[key]), String(b[key])),
})

/**
 * Agent table of the Activity screen (active-call-center.md §5): 11 data columns, an Options
 * column whose actions depend on the tier state, and an Edit action. No selection and no pagination
 * — it scrolls inside a fixed height. The actions are fire-and-forget, as in Axion (§11).
 */
const QueueAgentTable = ({ data, loading, onEavesdrop, onTransfer, onCall, onEdit }: QueueAgentTableProps) => {
  const onRow = useStripedTableRow()
  const { token } = theme.useToken()

  const columns: TableColumnsType<AgentRow> = [
    textColumn('Name', 'name'),
    textColumn('Extension', 'extension'),
    textColumn('Status', 'status'),
    textColumn('State', 'state'),
    {
      title: 'Status Change',
      dataIndex: 'status_change',
      key: 'status_change',
      sorter: (a, b) => a.last_status_change - b.last_status_change,
    },
    { title: 'Missed', dataIndex: 'missed', key: 'missed', sorter: (a, b) => a.missed - b.missed },
    { title: 'Answered', dataIndex: 'answered', key: 'answered', sorter: (a, b) => a.answered - b.answered },
    textColumn('Tier State', 'tier_state'),
    { title: 'Tier Level', dataIndex: 'tier_level', key: 'tier_level', sorter: (a, b) => a.tier_level - b.tier_level },
    { title: 'Tier Position', dataIndex: 'tier_position', key: 'tier_position', sorter: (a, b) => a.tier_position - b.tier_position },
    {
      title: 'Options',
      key: 'options',
      render: (_, agent) =>
        agent.tier_state === ACTIVE_INBOUND_TIER_STATE ? (
          <Space size="small">
            {/* TODO: permission-gate Eavesdrop/Transfer/Call once RBAC permissions are populated from the backend. */}
            <Tooltip title="Eavesdrop">
              <Button type="text" size="small" icon={<SoundOutlined style={{ color: token.colorPrimary }} />} onClick={() => onEavesdrop(agent)} aria-label={`Eavesdrop on ${agent.name}`} />
            </Tooltip>
            <Tooltip title="Transfer">
              <Button type="text" size="small" icon={<SwapOutlined style={{ color: token.colorWarning }} />} onClick={() => onTransfer(agent)} aria-label={`Transfer ${agent.name}`} />
            </Tooltip>
          </Space>
        ) : (
          <Tooltip title="Call">
            <Button type="text" size="small" icon={<PhoneOutlined style={{ color: token.colorSuccess }} />} onClick={() => onCall(agent)} aria-label={`Call ${agent.name}`} />
          </Tooltip>
        ),
    },
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
    <Table<AgentRow>
      rowKey="key"
      size="small"
      showSorterTooltip={false}
      columns={columns}
      dataSource={data}
      loading={loading}
      onRow={onRow}
      pagination={false}
      locale={{ emptyText: 'No agents in this queue.' }}
      scroll={{ x: 'max-content', y: 300 }}
    />
  )
}

export default QueueAgentTable
