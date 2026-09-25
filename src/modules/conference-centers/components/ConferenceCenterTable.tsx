import { Button, Space, Table, Tag, theme, Tooltip, Typography } from 'antd'
import type { TableColumnsType, TableProps } from 'antd'
import { CheckCircleOutlined, DeleteOutlined, EditOutlined, MinusCircleOutlined } from '@ant-design/icons'
import { conferenceCenterStatusLabels, pageSizeOptions } from '../conference-center.constants'
import type { ConferenceCenter } from '../conference-center.types'
import useStripedTableRow from '../../../components/common/useStripedTableRow'

const { Text } = Typography

interface ConferenceCenterTableProps {
  data: ConferenceCenter[]
  loading: boolean
  page: number
  pageSize: number
  total: number
  showAll: boolean
  canEditRow: boolean
  canToggleRow: boolean
  canDeleteRow: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onEdit: (center: ConferenceCenter) => void
  onDelete: (center: ConferenceCenter) => void
  onToggleStatus: (center: ConferenceCenter) => void
  selectedRowKeys: string[]
  onSelectionChange: (selectedRowKeys: string[]) => void
}

const compareOptional = (a?: string, b?: string) => (a ?? '').localeCompare(b ?? '')

const renderTruncated = (value?: string) => (value ? <Tooltip title={value}>{value}</Tooltip> : <Text type="secondary">—</Text>)

/**
 * Columns per conference-centers.md §5: Domain (Show All only), Name, Extension, Greeting, PIN
 * Length, Status, Description, Actions (Edit/Delete — no Copy, the module has none). Sorting is
 * client-side on the loaded page only, as in Axion.
 */
const ConferenceCenterTable = ({
  data,
  loading,
  page,
  pageSize,
  total,
  showAll,
  canEditRow,
  canToggleRow,
  canDeleteRow,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onToggleStatus,
  selectedRowKeys,
  onSelectionChange,
}: ConferenceCenterTableProps) => {
  const onRow = useStripedTableRow()
  const { token } = theme.useToken()

  const rowSelection: TableProps<ConferenceCenter>['rowSelection'] = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: (keys) => onSelectionChange(keys as string[]),
  }

  const columns: TableColumnsType<ConferenceCenter> = [
    ...(showAll
      ? [
          {
            title: 'Domain',
            dataIndex: 'domain',
            key: 'domain',
            width: 200,
            ellipsis: true,
            render: renderTruncated,
            sorter: (a: ConferenceCenter, b: ConferenceCenter) => compareOptional(a.domain, b.domain),
          },
        ]
      : []),
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      render: renderTruncated,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Extension',
      dataIndex: 'extension',
      key: 'extension',
      width: 120,
      sorter: (a, b) => a.extension.localeCompare(b.extension),
    },
    {
      title: 'Greeting',
      dataIndex: 'greeting',
      key: 'greeting',
      width: 220,
      ellipsis: true,
      render: renderTruncated,
      sorter: (a, b) => compareOptional(a.greeting, b.greeting),
    },
    {
      title: 'PIN Length',
      dataIndex: 'pinLength',
      key: 'pinLength',
      width: 120,
      sorter: (a, b) => a.pinLength - b.pinLength,
    },
    {
      title: 'Status',
      key: 'status',
      width: 130,
      render: (_, record) => {
        const isEnabled = record.enabled
        const toggle = () => canToggleRow && onToggleStatus(record)

        return (
          // TODO: wrap with <PermissionGuard permission="conference.edit"> once RBAC is populated.
          <Tooltip title={canToggleRow ? `Click to ${isEnabled ? 'disable' : 'enable'}` : undefined}>
            <Tag
              role="button"
              tabIndex={canToggleRow ? 0 : -1}
              aria-disabled={!canToggleRow}
              aria-label={`${record.name} is ${isEnabled ? 'enabled' : 'disabled'}${canToggleRow ? ', click to toggle' : ''}`}
              icon={isEnabled ? <CheckCircleOutlined /> : <MinusCircleOutlined />}
              onClick={toggle}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggle()
                }
              }}
             style={{
                cursor: canToggleRow ? 'pointer' : 'not-allowed',
                opacity: canToggleRow ? 1 : 0.6,
                backgroundColor: isEnabled ? '#00D27A' : '#f16b3e',
                color: '#fff',
                borderColor: isEnabled ? '#00D27A' : '#f16b3e',
                fontWeight: 500,
                borderRadius: '999px',
                padding: '4px 14px',
                minHeight: '28px',
                lineHeight: '20px',
              }}
            >
              {conferenceCenterStatusLabels[isEnabled ? 'enabled' : 'disabled']}
            </Tag>
          </Tooltip>
        )
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 220,
      ellipsis: true,
      render: renderTruncated,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          {/* TODO: wrap with <PermissionGuard permission="conference.edit"> once RBAC is populated. */}
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: token.colorPrimary }} />}
              disabled={!canEditRow}
              onClick={() => onEdit(record)}
              aria-label={`Edit conference center ${record.name}`}
            />
          </Tooltip>
          {/* TODO: wrap with <PermissionGuard permission="conference.manage"> once RBAC is populated. */}
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={!canDeleteRow}
              onClick={() => onDelete(record)}
              aria-label={`Delete conference center ${record.name}`}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <Table<ConferenceCenter>
      rowKey="id"
      showSorterTooltip={false}
      columns={columns}
      dataSource={data}
      loading={loading}
      rowSelection={rowSelection}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: pageSizeOptions.map(String),
        showTotal: (count) => `${count} conference centers`,
        // One handler for both: a size change always returns to page 1 (the hook does that).
        onChange: (nextPage, nextSize) => (nextSize !== pageSize ? onPageSizeChange(nextSize) : onPageChange(nextPage)),
      }}
      scroll={{ x: 'max-content' }}
      onRow={onRow}
    />
  )
}

export default ConferenceCenterTable
