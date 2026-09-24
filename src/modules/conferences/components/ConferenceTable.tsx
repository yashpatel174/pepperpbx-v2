import { Button, Space, Table, Tag, theme, Tooltip, Typography } from 'antd'
import type { TableColumnsType, TableProps } from 'antd'
import { CheckCircleOutlined, CopyOutlined, DeleteOutlined, EditOutlined, MinusCircleOutlined } from '@ant-design/icons'
import { conferenceStatusLabels, defaultPageSize, pageSizeOptions } from '../conference.constants'
import type { Conference } from '../conference.types'
import useStripedTableRow from '../../../components/common/useStripedTableRow'

const { Text } = Typography

interface ConferenceTableProps {
  data: Conference[]
  loading: boolean
  page: number
  pageSize: number
  total: number
  showAll: boolean
  canEditRow: boolean
  /** Gates only the clickable Status Tag — narrower than canEditRow (excludes view-only). */
  canToggleRow: boolean
  canCopyRow: boolean
  canDeleteRow: boolean
  onPageChange: (page: number, pageSize: number) => void
  onPageSizeChange: (size: number) => void
  onEdit: (conference: Conference) => void
  onCopy: (conference: Conference) => void
  onDelete: (conference: Conference) => void
  onToggleStatus: (conference: Conference) => void
  selectedRowKeys: string[]
  onSelectionChange: (selectedRowKeys: string[]) => void
}

const renderOptionalText = (value?: string | number) => (value === undefined || value === '' ? <Text type="secondary">—</Text> : value)

const compareOptional = (a?: string, b?: string) => (a ?? '').localeCompare(b ?? '')

const ConferenceTable = ({
  data,
  loading,
  page,
  pageSize,
  total,
  showAll,
  canEditRow,
  canToggleRow,
  canCopyRow,
  canDeleteRow,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onCopy,
  onDelete,
  onToggleStatus,
  selectedRowKeys,
  onSelectionChange,
}: ConferenceTableProps) => {
  const onRow = useStripedTableRow()
  const { token } = theme.useToken()

  const rowSelection: TableProps<Conference>['rowSelection'] = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: (selectedKeys) => {
      onSelectionChange(selectedKeys as string[])
    },
  }

  const columns: TableColumnsType<Conference> = [
    ...(showAll
      ? [
          {
            title: 'Domain',
            dataIndex: 'domain',
            key: 'domain',
            render: renderOptionalText,
            sorter: (a: Conference, b: Conference) => compareOptional(a.domain, b.domain),
          },
        ]
      : []),

    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (value: string) => <Tooltip title={value}>{value}</Tooltip>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },

    {
      title: 'Extension',
      dataIndex: 'extension',
      key: 'extension',
      render: renderOptionalText,
      sorter: (a, b) => compareOptional(a.extension, b.extension),
    },

    {
      title: 'Profile',
      dataIndex: 'profile',
      key: 'profile',
      render: renderOptionalText,
      sorter: (a, b) => compareOptional(a.profile, b.profile),
    },

    {
      title: 'Order',
      dataIndex: 'order',
      key: 'order',
      width: 100,
      sorter: (a, b) => a.order - b.order,
    },

    {
      title: 'Status',
      key: 'status',
      width: 130,
      sorter: (a, b) => Number(a.enabled) - Number(b.enabled),
      render: (_, record) => {
        const isEnabled = record.enabled

        return (
          <Tooltip title={canToggleRow ? `Click to ${isEnabled ? 'disable' : 'enable'}` : undefined}>
            <Tag
              icon={isEnabled ? <CheckCircleOutlined style={{ color: '#fff' }} /> : <MinusCircleOutlined style={{ color: '#fff' }} />}
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
              onClick={() => canToggleRow && onToggleStatus(record)}
            >
              {conferenceStatusLabels[isEnabled ? 'enabled' : 'disabled']}
            </Tag>
          </Tooltip>
        )
      },
    },

    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (value?: string) => (value ? <Tooltip title={value}>{value}</Tooltip> : <Text type="secondary">—</Text>),
      sorter: (a, b) => compareOptional(a.description, b.description),
    },

    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          {/* TODO: wrap with <PermissionGuard permission="conference.edit"> once RBAC
              permissions are populated from the backend. */}
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: token.colorPrimary }} />}
              disabled={!canEditRow}
              onClick={() => onEdit(record)}
              aria-label={`Edit conference ${record.name}`}
            />
          </Tooltip>

          <Tooltip title="Copy">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ color: token.colorSuccess }} />}
              disabled={!canCopyRow}
              onClick={() => onCopy(record)}
              aria-label={`Copy conference ${record.name}`}
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
              aria-label={`Delete conference ${record.name}`}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <Table<Conference>
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
        defaultPageSize,
        showSizeChanger: true,
        pageSizeOptions: pageSizeOptions.map(String),
        showTotal: (totalCount) => `${totalCount} conferences`,
        onChange: onPageChange,
        onShowSizeChange: (_current, size) => onPageSizeChange(size),
      }}
      scroll={{ x: 1200 }}
      onRow={onRow}
    />
  )
}

export default ConferenceTable
