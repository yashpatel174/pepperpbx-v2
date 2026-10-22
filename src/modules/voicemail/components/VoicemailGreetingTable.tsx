import { Button, Space, Table, theme, Tooltip, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
import { defaultPageSize, pageSizeOptions } from '../voicemail.constants'
import type { VoicemailGreeting } from '../voicemail.types'
import useStripedTableRow from '../../../components/common/useStripedTableRow'

const { Text } = Typography

interface VoicemailGreetingTableProps {
  data: VoicemailGreeting[]
  loading: boolean
  page: number
  pageSize: number
  total: number
  /** View / Edit — admin or edit (voicemail.md §19). */
  canEditRow: boolean
  /** Delete — module-admin tier. */
  canDeleteRow: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onView: (greeting: VoicemailGreeting) => void
  onEdit: (greeting: VoicemailGreeting) => void
  onDelete: (greeting: VoicemailGreeting) => void
  selectedRowKeys: string[]
  onSelectionChange: (keys: string[]) => void
}

const dateFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
const formatUploaded = (iso: string): string => {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

const renderTruncated = (value?: string) => (value ? <Tooltip title={value}>{value}</Tooltip> : <Text type="secondary">—</Text>)
const compareText = (a?: string, b?: string) => (a ?? '').localeCompare(b ?? '')

const VoicemailGreetingTable = ({
  data,
  loading,
  page,
  pageSize,
  total,
  canEditRow,
  canDeleteRow,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onDelete,
  selectedRowKeys,
  onSelectionChange,
}: VoicemailGreetingTableProps) => {
  const onRow = useStripedTableRow()
  const { token } = theme.useToken()

  const columns: TableColumnsType<VoicemailGreeting> = [
    { title: 'ID', dataIndex: 'greeting_id', key: 'greeting_id', width: 80, sorter: (a, b) => a.greeting_id - b.greeting_id },
    {
      title: 'Name',
      dataIndex: 'greeting_name',
      key: 'greeting_name',
      width: 200,
      ellipsis: true,
      render: renderTruncated,
      sorter: (a, b) => compareText(a.greeting_name, b.greeting_name),
    },
    {
      title: 'File Name',
      dataIndex: 'greeting_filename',
      key: 'greeting_filename',
      render: renderTruncated,
      sorter: (a, b) => compareText(a.greeting_filename, b.greeting_filename),
    },
    { title: 'Size', dataIndex: 'size', key: 'size', render: (value?: string) => value ?? <Text type="secondary">—</Text> },
    {
      title: 'Uploaded',
      dataIndex: 'date',
      key: 'date',
      render: formatUploaded,
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: 'Description',
      dataIndex: 'greeting_description',
      key: 'greeting_description',
      width: 220,
      ellipsis: true,
      render: renderTruncated,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 130,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ color: token.colorPrimary }}/>}
              disabled={!canEditRow}
              onClick={() => onView(record)}
              aria-label={`View greeting ${record.greeting_name}`}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: token.colorPrimary }} />}
              disabled={!canEditRow}
              onClick={() => onEdit(record)}
              aria-label={`Edit greeting ${record.greeting_name}`}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={!canDeleteRow}
              onClick={() => onDelete(record)}
              aria-label={`Delete greeting ${record.greeting_name}`}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <Table<VoicemailGreeting>
      rowKey="voicemail_greeting_uuid"
      showSorterTooltip={false}
      columns={columns}
      dataSource={data}
      loading={loading}
      rowSelection={{ selectedRowKeys, onChange: (keys) => onSelectionChange(keys as string[]) }}
      onRow={onRow}
      pagination={{
        current: page,
        pageSize,
        total,
        defaultPageSize,
        showSizeChanger: true,
        pageSizeOptions: pageSizeOptions.map(String),
        showTotal: (count) => `${count} greetings`,
        onChange: (nextPage, nextSize) => {
          if (nextSize !== pageSize) onPageSizeChange(nextSize)
          else onPageChange(nextPage)
        },
      }}
      scroll={{ x: 'max-content' }}
    />
  )
}

export default VoicemailGreetingTable
