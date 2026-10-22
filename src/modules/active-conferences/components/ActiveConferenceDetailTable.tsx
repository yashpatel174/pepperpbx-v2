import { Table, Tooltip, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import useStripedTableRow from '../../../components/common/useStripedTableRow'
import { formatElapsedSeconds } from '../active-conferences.utils'
import type { ActiveConferenceMemberRow } from '../active-conferences.types'

const { Text } = Typography

interface ActiveConferenceDetailTableProps {
  data: ActiveConferenceMemberRow[]
}

const compareText = (a?: string, b?: string) => (a ?? '').localeCompare(b ?? '')

/**
 * Live member table for one conference (active-conferences.md §5). Read-only — no selection, no
 * pagination footer, and no per-participant actions (Axion's only Actions column is commented out).
 */
const ActiveConferenceDetailTable = ({ data }: ActiveConferenceDetailTableProps) => {
  const onRow = useStripedTableRow()

  const columns: TableColumnsType<ActiveConferenceMemberRow> = [
    {
      title: 'CID Name',
      dataIndex: 'caller_id_name',
      key: 'caller_id_name',
      sorter: (a, b) => compareText(a.caller_id_name, b.caller_id_name),
    },
    {
      title: 'CID Number',
      dataIndex: 'caller_id_number',
      key: 'caller_id_number',
      sorter: (a, b) => compareText(a.caller_id_number, b.caller_id_number),
    },
    {
      title: 'Joined',
      dataIndex: 'join_time',
      key: 'join_time',
      render: (value: number) => formatElapsedSeconds(value),
      sorter: (a, b) => a.join_time - b.join_time,
    },
    {
      title: 'Quiet',
      dataIndex: 'last_talking',
      key: 'last_talking',
      render: (value: number) => formatElapsedSeconds(value),
      sorter: (a, b) => a.last_talking - b.last_talking,
    },
    {
      title: 'Has Floor',
      key: 'has_floor',
      render: (_, record) => (record.flags?.has_floor ? 'Yes' : 'No'),
      sorter: (a, b) => Number(a.flags?.has_floor ?? false) - Number(b.flags?.has_floor ?? false),
    },
    {
      // TODO: Axion hardcodes this cell to 'false' and never reads data (§5/§26). No hand-raised
      // field is documented for the backend, so this renders "—" (unknown) instead of claiming
      // "No" — wire it once the backend contract names the field.
      title: 'Hand Raised',
      key: 'hand_raised',
      render: () => (
        <Tooltip title="Not provided by the backend yet">
          <Text type="secondary">—</Text>
        </Tooltip>
      ),
    },
  ]

  return (
    <Table<ActiveConferenceMemberRow>
      rowKey="key"
      showSorterTooltip={false}
      columns={columns}
      dataSource={data}
      pagination={false}
      scroll={{ x: 'max-content' }}
      onRow={onRow}
    />
  )
}

export default ActiveConferenceDetailTable
