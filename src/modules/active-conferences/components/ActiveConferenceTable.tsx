import { Button, Table, theme, Tooltip, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import useStripedTableRow from '../../../components/common/useStripedTableRow'
import { getConferenceKey } from '../active-conferences.utils'
import type { ActiveConference } from '../active-conferences.types'

const { Text } = Typography

interface ActiveConferenceTableProps {
  data: ActiveConference[]
  loading: boolean
  showAll: boolean
  onView: (conference: ActiveConference) => void
}

const compareText = (a?: string, b?: string) => (a ?? '').localeCompare(b ?? '')

/**
 * Live list table (active-conferences.md §5): read-only, no selection, no pagination footer —
 * every loaded row is shown. The only row action is View.
 */
const ActiveConferenceTable = ({ data, loading, showAll, onView }: ActiveConferenceTableProps) => {
  const onRow = useStripedTableRow()
  const { token } = theme.useToken()

  const columns: TableColumnsType<ActiveConference> = [
    {
      title: 'Name',
      dataIndex: 'conference_name',
      key: 'conference_name',
      sorter: (a, b) => compareText(a.conference_name, b.conference_name),
    },
    {
      title: 'Participant PIN',
      dataIndex: 'participant_pin',
      key: 'participant_pin',
      render: (value?: string) => (value ? value : <Text type="secondary">—</Text>),
      sorter: (a, b) => compareText(a.participant_pin, b.participant_pin),
    },
    {
      title: 'Member Count',
      dataIndex: 'member_count',
      key: 'member_count',
      sorter: (a, b) => a.member_count - b.member_count,
    },
    // Hidden entirely (header and cells) unless Show All is on (§5/§15).
    ...(showAll
      ? [
          {
            title: 'Domain Name',
            dataIndex: 'domain',
            key: 'domain',
            sorter: (a: ActiveConference, b: ActiveConference) => compareText(a.domain, b.domain),
          },
        ]
      : []),
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 90,
      render: (_, record) => (
        <Tooltip title="View">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined style={{ color: token.colorPrimary }} />}
            onClick={() => onView(record)}
            aria-label={`View conference ${record.conference_name}`}
          />
        </Tooltip>
      ),
    },
  ]

  return (
    <Table<ActiveConference>
      rowKey={getConferenceKey}
      showSorterTooltip={false}
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
      scroll={{ x: 'max-content' }}
      onRow={onRow}
    />
  )
}

export default ActiveConferenceTable
