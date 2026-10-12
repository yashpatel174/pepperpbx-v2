import { Button, Table, theme, Tooltip, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import useStripedTableRow from '../../../components/common/useStripedTableRow'
import { queueStrategyLabel } from '../../call-center/call-center.constants'
import { defaultPageSize, pageSizeOptions } from '../active-call-center.constants'
import type { ActiveCallCenterQueue } from '../active-call-center.types'

const { Text } = Typography

interface ActiveCallCenterQueueTableProps {
  data: ActiveCallCenterQueue[]
  loading: boolean
  page: number
  pageSize: number
  total: number
  /** The Domain column is shown in Show All mode only (active-call-center.md §5). */
  showAll: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onView: (queue: ActiveCallCenterQueue) => void
}

const compareText = (a?: string, b?: string) => (a ?? '').localeCompare(b ?? '')

/** Queue List (active-call-center.md §5): no row selection; View is the only row action. */
const ActiveCallCenterQueueTable = ({ data, loading, page, pageSize, total, showAll, onPageChange, onPageSizeChange, onView }: ActiveCallCenterQueueTableProps) => {
  const onRow = useStripedTableRow()
  const { token } = theme.useToken()

  const columns: TableColumnsType<ActiveCallCenterQueue> = [
    ...(showAll
      ? [{ title: 'Domain', dataIndex: 'domain', key: 'domain', sorter: (a: ActiveCallCenterQueue, b: ActiveCallCenterQueue) => compareText(a.domain, b.domain) }]
      : []),
    { title: 'Queue Name', dataIndex: 'name', key: 'name', sorter: (a, b) => compareText(a.name, b.name) },
    { title: 'Extension', dataIndex: 'extension', key: 'extension', sorter: (a, b) => compareText(a.extension, b.extension) },
    {
      title: 'Strategy',
      dataIndex: 'strategy',
      key: 'strategy',
      render: (strategy: ActiveCallCenterQueue['strategy']) => queueStrategyLabel(strategy),
      sorter: (a, b) => compareText(queueStrategyLabel(a.strategy), queueStrategyLabel(b.strategy)),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
      render: (value?: string) => (value ? <Tooltip title={value}>{value}</Tooltip> : <Text type="secondary">—</Text>),
      sorter: (a, b) => compareText(a.description, b.description),
    },
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
            aria-label={`View activity of queue ${record.name}`}
          />
        </Tooltip>
      ),
    },
  ]

  return (
    <Table<ActiveCallCenterQueue>
      rowKey="id"
      showSorterTooltip={false}
      columns={columns}
      dataSource={data}
      loading={loading}
      onRow={onRow}
      pagination={{
        current: page,
        pageSize,
        total,
        defaultPageSize,
        showSizeChanger: true,
        pageSizeOptions: pageSizeOptions.map(String),
        locale: { items_per_page: 'per page' },
        showTotal: (count) => `${count} queues`,
        onChange: (nextPage, nextSize) => {
          if (nextSize !== pageSize) onPageSizeChange(nextSize)
          else onPageChange(nextPage)
        },
      }}
      scroll={{ x: 'max-content' }}
    />
  )
}

export default ActiveCallCenterQueueTable
