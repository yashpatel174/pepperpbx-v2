import { Table } from 'antd'
import type { TableColumnsType } from 'antd'
import useStripedTableRow from '../../../components/common/useStripedTableRow'
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../active-calls.constants'
import { formatCreated } from '../active-calls.utils'
import type { ActiveCall } from '../active-calls.types'

interface ActiveCallTableProps {
  data: ActiveCall[]
  loading: boolean
}

const compareText = (a?: string, b?: string) => (a ?? '').localeCompare(b ?? '')

/**
 * Live list table (active-calls.md §5): nine columns in the audit's order, sortable, paginated.
 * Row checkboxes mirror Axion's `selection: true`, but — as in Axion — no bulk action consumes
 * them. No per-row actions exist. Domain is always visible, regardless of Show All (§5/§15).
 */
const ActiveCallTable = ({ data, loading }: ActiveCallTableProps) => {
  const onRow = useStripedTableRow()

  const columns: TableColumnsType<ActiveCall> = [
    { title: 'Call State', dataIndex: 'callState', key: 'callState', sorter: (a, b) => compareText(a.callState, b.callState) },
    { title: 'Direction', dataIndex: 'direction', key: 'direction', sorter: (a, b) => compareText(a.direction, b.direction) },
    {
      title: 'Created',
      dataIndex: 'created',
      key: 'created',
      render: (value?: string) => formatCreated(value),
      sorter: (a, b) => (a.created ? Date.parse(a.created) : 0) - (b.created ? Date.parse(b.created) : 0),
    },
    { title: 'CID Name', dataIndex: 'cid_name', key: 'cid_name', sorter: (a, b) => compareText(a.cid_name, b.cid_name) },
    { title: 'CID Number', dataIndex: 'cid_num', key: 'cid_num', sorter: (a, b) => compareText(a.cid_num, b.cid_num) },
    { title: 'Destination', dataIndex: 'destination', key: 'destination', sorter: (a, b) => compareText(a.destination, b.destination) },
    { title: 'SBC IP', dataIndex: 'ip_addr', key: 'ip_addr', sorter: (a, b) => compareText(a.ip_addr, b.ip_addr) },
    { title: 'Domain', dataIndex: 'domain', key: 'domain', sorter: (a, b) => compareText(a.domain, b.domain) },
    { title: 'Freeswitch IP', dataIndex: 'hostname', key: 'hostname', sorter: (a, b) => compareText(a.hostname, b.hostname) },
  ]

  return (
    <Table<ActiveCall>
      rowKey="uuid"
      showSorterTooltip={false}
      columns={columns}
      dataSource={data}
      loading={loading}
      rowSelection={{}}
      pagination={{
        defaultPageSize: DEFAULT_PAGE_SIZE,
        showSizeChanger: true,
        pageSizeOptions: PAGE_SIZE_OPTIONS.map(String),
        showTotal: (total) => `${total} active calls`,
      }}
      scroll={{ x: 'max-content' }}
      onRow={onRow}
    />
  )
}

export default ActiveCallTable
