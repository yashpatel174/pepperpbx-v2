import { Button, Space, Table, theme, Tooltip, Typography } from 'antd'
import type { TableColumnsType, TableProps } from 'antd'
import { CopyOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { callBlockDirectionIconSrc, callBlockStatusLabels, defaultPageSize, pageSizeOptions } from '../call-block.constants'
import type { CallBlock } from '../call-block.types'
import useStripedTableRow from '../../../components/common/useStripedTableRow'
import StatusToggleTag from '../../../components/common/StatusToggleTag'

const { Text } = Typography

interface CallBlockTableProps {
  data: CallBlock[]
  loading: boolean
  page: number
  pageSize: number
  total: number
  showAll: boolean
  /** Gates Edit — broadest tier (view-only users can still open the read-only form). */
  canEditRow: boolean
  /** Gates Copy — matches the audit's "disabled when user lacks pbx_callblock_add" (call-block.md §14). */
  canCopyRow: boolean
  /** Gates Delete — module-admin tier only, per the audit (call-block.md §14). */
  canDeleteRow: boolean
  /** Gates the inline Status pill — module-admin or edit tier, NOT view-only (call-block.md §14). */
  canToggleRow: boolean
  onPageChange: (page: number, pageSize: number) => void
  onPageSizeChange: (size: number) => void
  onEdit: (callBlock: CallBlock) => void
  onCopy: (callBlock: CallBlock) => void
  onDelete: (callBlock: CallBlock) => void
  onToggleStatus: (callBlock: CallBlock) => void
  selectedRowKeys: string[]
  onSelectionChange: (selectedRowKeys: string[]) => void
}

const renderOptionalText = (value?: string | number) => (value === undefined || value === '' ? <Text type="secondary">—</Text> : value)

const compareOptional = (a?: string, b?: string) => (a ?? '').localeCompare(b ?? '')

/** No date-library dependency — native Intl formatting is sufficient for a single "date added" column. */
const dateFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: '2-digit' })

const formatDateAdded = (iso: string): string => {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

const CallBlockTable = ({
  data,
  loading,
  page,
  pageSize,
  total,
  showAll,
  canEditRow,
  canCopyRow,
  canDeleteRow,
  canToggleRow,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onCopy,
  onDelete,
  onToggleStatus,
  selectedRowKeys,
  onSelectionChange,
}: CallBlockTableProps) => {
  const onRow = useStripedTableRow()
  const { token } = theme.useToken()

  const rowSelection: TableProps<CallBlock>['rowSelection'] = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: (selectedKeys) => {
      onSelectionChange(selectedKeys as string[])
    },
  }

  const columns: TableColumnsType<CallBlock> = [
    ...(showAll
      ? [
          {
            title: 'Domain',
            dataIndex: 'domain_name',
            key: 'domain_name',
            render: renderOptionalText,
            sorter: (a: CallBlock, b: CallBlock) => compareOptional(a.domain_name, b.domain_name),
          },
        ]
      : []),

    {
      title: 'Direction',
      dataIndex: 'call_block_direction',
      key: 'call_block_direction',
      width: 100,
      render: (direction: CallBlock['call_block_direction']) => {
        const label = direction === 'outbound' ? 'Outbound' : 'Inbound'
        return (
          <Tooltip title={label}>
            <img src={callBlockDirectionIconSrc(direction)} alt={label} style={{ width: 16, height: 16, objectFit: 'contain' }} />
          </Tooltip>
        )
      },
      sorter: (a, b) => compareOptional(a.call_block_direction, b.call_block_direction),
    },

    {
      title: 'Extension',
      dataIndex: 'extension',
      key: 'extension',
      render: renderOptionalText,
      sorter: (a, b) => compareOptional(a.extension, b.extension),
    },

    {
      title: 'Name',
      dataIndex: 'call_block_name',
      key: 'call_block_name',
      width: 180,
      ellipsis: true,
      render: (value?: string) => (value ? <Tooltip title={value}>{value}</Tooltip> : <Text type="secondary">—</Text>),
      sorter: (a, b) => compareOptional(a.call_block_name, b.call_block_name),
    },

    {
      title: 'Country Code',
      dataIndex: 'call_block_country_code',
      key: 'call_block_country_code',
      width: 120,
      render: renderOptionalText,
      sorter: (a, b) => compareOptional(a.call_block_country_code, b.call_block_country_code),
    },

    {
      title: 'Number',
      dataIndex: 'call_block_number',
      key: 'call_block_number',
      width: 140,
      render: renderOptionalText,
      sorter: (a, b) => compareOptional(a.call_block_number, b.call_block_number),
    },
    
    {
      title: 'Count',
      dataIndex: 'call_block_count',
      key: 'call_block_count',
      width: 90,
      sorter: (a, b) => a.call_block_count - b.call_block_count,
    },

    {
      title: 'Call Block Action',
      dataIndex: 'call_block_action',
      key: 'call_block_action',
      width: 120,
      render: renderOptionalText,
      sorter: (a, b) => compareOptional(a.call_block_action, b.call_block_action),
    },

    {
      title: 'Status',
      key: 'status',
      width: 130,
      sorter: (a, b) => Number(a.call_block_enabled) - Number(b.call_block_enabled),
      render: (_, record) => {
        const isEnabled = record.call_block_enabled

        return (
          <StatusToggleTag
            enabled={isEnabled}
            tooltip={canToggleRow ? `Click to ${isEnabled ? 'disable' : 'enable'}` : undefined}
            iconStyle={{ color: '#fff' }}
            style={{ cursor: canToggleRow ? 'pointer' : 'not-allowed', opacity: canToggleRow ? 1 : 0.6 }}
            onClick={() => canToggleRow && onToggleStatus(record)}
          >
            {callBlockStatusLabels[isEnabled ? 'enabled' : 'disabled']}
          </StatusToggleTag>
        )
      },
    },

    {
      title: 'Date Added',
      dataIndex: 'date_added',
      key: 'date_added',
      width: 130,
      render: (value: string) => formatDateAdded(value),
      sorter: (a, b) => new Date(a.date_added).getTime() - new Date(b.date_added).getTime(),
    },

    {
      title: 'Description',
      dataIndex: 'call_block_description',
      key: 'call_block_description',
      ellipsis: true,
      render: (value?: string) => (value ? <Tooltip title={value}> <div  style={{
          width: "100%",
          maxWidth: "100%",
          overflowX: "auto",
          overflowY: "hidden",
          whiteSpace: "nowrap",
        }}  >{value}</div></Tooltip> : <Text type="secondary">—</Text>),
      sorter: (a, b) => compareOptional(a.call_block_description, b.call_block_description),
    },

    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          {/* TODO: wrap with <PermissionGuard permission="callBlock.edit"> once RBAC
              permissions are populated from the backend. */}
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: token.colorPrimary }} />}
              disabled={!canEditRow}
              onClick={() => onEdit(record)}
              aria-label={`Edit call block ${record.call_block_name ?? record.call_block_number ?? record.call_block_uuid}`}
            />
          </Tooltip>

          <Tooltip title="Copy">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ color: token.colorSuccess }} />}
              disabled={!canCopyRow}
              onClick={() => onCopy(record)}
              aria-label={`Copy call block ${record.call_block_name ?? record.call_block_number ?? record.call_block_uuid}`}
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
              aria-label={`Delete call block ${record.call_block_name ?? record.call_block_number ?? record.call_block_uuid}`}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <Table<CallBlock>
      rowKey="call_block_uuid"
      showSorterTooltip={false}
      columns={columns}
      dataSource={data}
      loading={loading}
      rowSelection={rowSelection}
      pagination={{
        current: page,
        pageSize,
        total,
        defaultPageSize,
        showSizeChanger: true,
        pageSizeOptions: pageSizeOptions.map(String),
        showTotal: (totalCount) => `${totalCount} call blocks`,
        onChange: onPageChange,
        onShowSizeChange: (_current, size) => onPageSizeChange(size),
      }}
      scroll={{ x: 1500 }}
      onRow={onRow}
    />
  )
}

export default CallBlockTable
