import { Table } from 'antd'
import type { TableColumnsType } from 'antd'
import useStripedTableRow from '../../../components/common/useStripedTableRow'
import { PAGE_SIZE_OPTIONS } from '../registrations.constants'
import type { Registration } from '../registrations.types'

interface RegistrationTableProps {
  data: Registration[]
  loading: boolean
  totalRecords: number
  pageNumber: number
  pageSize: number
  onPageChange: (pageNumber: number, pageSize: number) => void
}

const compareText = (a?: string, b?: string) => (a ?? '').localeCompare(b ?? '', undefined, { numeric: true })

/**
 * Registrations table (registrations.md §5): nine columns in the audit's order, all sortable
 * client-side — sorting only reorders the loaded page, as in Axion. Pagination is server-driven
 * (controlled). No selection column and no actions column: Axion has neither (§5/§21).
 */
const RegistrationTable = ({ data, loading, totalRecords, pageNumber, pageSize, onPageChange }: RegistrationTableProps) => {
  const onRow = useStripedTableRow()

  const columns: TableColumnsType<Registration> = [
    { title: 'User', dataIndex: 'username', key: 'username', sorter: (a, b) => compareText(a.username, b.username) },
    { title: 'Domain', dataIndex: 'domain', key: 'domain', sorter: (a, b) => compareText(a.domain, b.domain) },
    { title: 'Agent', dataIndex: 'userAgent', key: 'userAgent', sorter: (a, b) => compareText(a.userAgent, b.userAgent) },
    { title: 'Contact', dataIndex: 'contact', key: 'contact', sorter: (a, b) => compareText(a.contact, b.contact) },
    { title: 'LAN IP', dataIndex: 'lanIP', key: 'lanIP', sorter: (a, b) => compareText(a.lanIP, b.lanIP) },
    { title: 'IP', dataIndex: 'ip', key: 'ip', sorter: (a, b) => compareText(a.ip, b.ip) },
    { title: 'Port', dataIndex: 'port', key: 'port', sorter: (a, b) => compareText(a.port, b.port) },
    // Plain text: Axion maps status to no badge/colour (§5), and the allowed values are unknown.
    { title: 'Status', dataIndex: 'status', key: 'status', sorter: (a, b) => compareText(a.status, b.status) },
    { title: 'Expires', dataIndex: 'expires', key: 'expires', sorter: (a, b) => compareText(a.expires, b.expires) },
  ]

  return (
    <Table<Registration>
      rowKey="id"
      showSorterTooltip={false}
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={{
        current: pageNumber,
        pageSize,
        total: totalRecords,
        showSizeChanger: true,
        pageSizeOptions: PAGE_SIZE_OPTIONS.map(String),
        showTotal: (total) => `${total} registrations`,
        onChange: onPageChange,
      }}
      scroll={{ x: 'max-content' }}
      onRow={onRow}
    />
  )
}

export default RegistrationTable
