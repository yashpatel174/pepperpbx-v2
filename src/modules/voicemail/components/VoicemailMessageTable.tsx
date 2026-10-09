import { Button, Space, Table, theme, Tooltip, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import { DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { defaultPageSize, pageSizeOptions } from '../voicemail.constants'
import type { VoicemailMessage } from '../voicemail.types'
import useStripedTableRow from '../../../components/common/useStripedTableRow'

const { Text } = Typography

interface VoicemailMessageTableProps {
  data: VoicemailMessage[]
  loading: boolean
  page: number
  pageSize: number
  total: number
  /** Gates the View action (voicemail.md §19: admin or edit). */
  canViewRow: boolean
  /** Gates the Delete action (voicemail.md §19: module-admin tier). */
  canDeleteRow: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onView: (message: VoicemailMessage) => void
  onDelete: (message: VoicemailMessage) => void
  selectedRowKeys: string[]
  onSelectionChange: (keys: string[]) => void
}

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })

/** `created_epoch` is epoch seconds; absent shows "-" (voicemail.md §23a). */
const formatReceived = (epoch?: number): string => (epoch ? dateTimeFormatter.format(new Date(epoch * 1000)) : '-')

const renderOptionalText = (value?: string) => (value ? value : <Text type="secondary">—</Text>)
const compareText = (a?: string, b?: string) => (a ?? '').localeCompare(b ?? '')

const VoicemailMessageTable = ({
  data,
  loading,
  page,
  pageSize,
  total,
  canViewRow,
  canDeleteRow,
  onPageChange,
  onPageSizeChange,
  onView,
  onDelete,
  selectedRowKeys,
  onSelectionChange,
}: VoicemailMessageTableProps) => {
  const stripedRow = useStripedTableRow()
  const { token } = theme.useToken()

  const columns: TableColumnsType<VoicemailMessage> = [
    {
      title: 'Received',
      dataIndex: 'created_epoch',
      key: 'created_epoch',
      render: formatReceived,
      sorter: (a, b) => (a.created_epoch ?? 0) - (b.created_epoch ?? 0),
    },
    {
      title: 'Caller ID Name',
      dataIndex: 'caller_id_name',
      key: 'caller_id_name',
      render: renderOptionalText,
      sorter: (a, b) => compareText(a.caller_id_name, b.caller_id_name),
    },
    {
      title: 'Caller ID Number',
      dataIndex: 'caller_id_number',
      key: 'caller_id_number',
      render: renderOptionalText,
      sorter: (a, b) => compareText(a.caller_id_number, b.caller_id_number),
    },
    { title: 'Length', dataIndex: 'length', key: 'length', render: renderOptionalText, sorter: (a, b) => compareText(a.length, b.length) },
    { title: 'Size', dataIndex: 'size', key: 'size', render: renderOptionalText, sorter: (a, b) => compareText(a.size, b.size) },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          {/* View only exists when the message has playable audio (voicemail.md §23a). */}
          {record.message_base64.length > 0 && (
            <Tooltip title="View">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined style={{ color: token.colorPrimary }} />}
                disabled={!canViewRow}
                onClick={() => onView(record)}
                aria-label={`View message from ${record.caller_id_number ?? 'unknown caller'}`}
              />
            </Tooltip>
          )}
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={!canDeleteRow}
              onClick={() => onDelete(record)}
              aria-label={`Delete message from ${record.caller_id_number ?? 'unknown caller'}`}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <Table<VoicemailMessage>
      rowKey="voicemail_message_uuid"
      showSorterTooltip={false}
      columns={columns}
      dataSource={data}
      loading={loading}
      rowSelection={{ selectedRowKeys, onChange: (keys) => onSelectionChange(keys as string[]) }}
      onRow={(record, index) => {
        const striped = stripedRow(record, index)
        // Unread messages (message_status == null) are bold (voicemail.md §23a).
        return record.message_status === null ? { ...striped, style: { ...striped.style, fontWeight: 600 } } : striped
      }}
      pagination={{
        current: page,
        pageSize,
        total,
        defaultPageSize,
        showSizeChanger: true,
        pageSizeOptions: pageSizeOptions.map(String),
        showTotal: (count) => `${count} messages`,
        onChange: (nextPage, nextSize) => {
          if (nextSize !== pageSize) onPageSizeChange(nextSize)
          else onPageChange(nextPage)
        },
      }}
      scroll={{ x: 'max-content' }}
    />
  )
}

export default VoicemailMessageTable
