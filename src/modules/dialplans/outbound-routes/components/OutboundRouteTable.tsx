import { Button, Space, Table, Tag, theme, Tooltip, Typography } from 'antd'
import type { TableColumnsType, TableProps } from 'antd'
import { CheckCircleOutlined, CopyOutlined, DeleteOutlined, EditOutlined, MinusCircleOutlined } from '@ant-design/icons'
import { defaultPageSize, outboundRouteStatusLabels, pageSizeOptions } from '../outbound-route.constants'
import type { OutboundRoute } from '../outbound-route.types'
import useStripedTableRow from '../../../../components/common/useStripedTableRow'

const { Text } = Typography

interface OutboundRouteTableProps {
  data: OutboundRoute[]
  loading: boolean
  page: number
  pageSize: number
  total: number
  showAll: boolean
  canManage: boolean
  onPageChange: (page: number, pageSize: number) => void
  onPageSizeChange: (size: number) => void
  onEdit: (route: OutboundRoute) => void
  onCopy: (route: OutboundRoute) => void
  onDelete: (route: OutboundRoute) => void
  onToggleStatus: (route: OutboundRoute) => void
  selectedRowKeys: string[]
  onSelectionChange: (selectedRowKeys: string[]) => void
}

const renderOptionalText = (value?: string | number) => (value === undefined || value === '' ? <Text type="secondary">—</Text> : value)

const compareOptional = (a?: string, b?: string) => (a ?? '').localeCompare(b ?? '')

const OutboundRouteTable = ({
  data,
  loading,
  page,
  pageSize,
  total,
  showAll,
  canManage,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onCopy,
  onDelete,
  onToggleStatus,
  selectedRowKeys,
  onSelectionChange,
}: OutboundRouteTableProps) => {
  const onRow = useStripedTableRow()
  const { token } = theme.useToken()

  const rowSelection: TableProps<OutboundRoute>['rowSelection'] = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: (selectedKeys) => {
      onSelectionChange(selectedKeys as string[])
    },
  }

  const columns: TableColumnsType<OutboundRoute> = [
    ...(showAll
      ? [
          {
            title: 'Domain',
            dataIndex: 'domain',
            key: 'domain',
            render: renderOptionalText,
            sorter: (a: OutboundRoute, b: OutboundRoute) => compareOptional(a.domain, b.domain),
          },
        ]
      : []),

    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      ellipsis: true,
      render: (value: string) => <Tooltip title={value}>{value}</Tooltip>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },

    {
      title: 'Number',
      dataIndex: 'number',
      key: 'number',
      width: 140,
      render: renderOptionalText,
      sorter: (a, b) => compareOptional(a.number, b.number),
    },

    {
      title: 'Context',
      dataIndex: 'context',
      key: 'context',
      render: renderOptionalText,
      sorter: (a, b) => compareOptional(a.context, b.context),
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
          <Tooltip title={`Click to ${isEnabled ? 'disable' : 'enable'}`}>
            <Tag
              icon={isEnabled ? <CheckCircleOutlined style={{ color: '#fff' }} /> : <MinusCircleOutlined style={{ color: '#fff' }} />}
              style={{
                cursor: 'pointer',
                backgroundColor: isEnabled ? '#00D27A' : '#f16b3e',
                color: '#fff',
                borderColor: isEnabled ? '#00D27A' : '#f16b3e',
                fontWeight: 500,
                borderRadius: '999px',
                padding: '4px 14px',
                minHeight: '28px',
                lineHeight: '20px',
              }}
              onClick={() => onToggleStatus(record)}
            >
              {outboundRouteStatusLabels[isEnabled ? 'enabled' : 'disabled']}
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
      render: (value?: string) => (value ? <Tooltip title={value}> <div  style={{
          width: "100%",
          maxWidth: "100%",
          overflowX: "auto",
          overflowY: "hidden",
          whiteSpace: "nowrap",
        }}  >{value}</div></Tooltip> : <Text type="secondary">—</Text>),
      sorter: (a, b) => compareOptional(a.description, b.description),
    },

    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          {/* TODO: wrap with <PermissionGuard permission="outboundRoute.manage"> once RBAC
              permissions are populated from the backend. */}
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: token.colorPrimary }} />}
              disabled={!canManage}
              onClick={() => onEdit(record)}
              aria-label={`Edit outbound route ${record.name}`}
            />
          </Tooltip>

          <Tooltip title="Copy">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ color: token.colorSuccess }} />}
              disabled={!canManage}
              onClick={() => onCopy(record)}
              aria-label={`Copy outbound route ${record.name}`}
            />
          </Tooltip>

          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={!canManage}
              onClick={() => onDelete(record)}
              aria-label={`Delete outbound route ${record.name}`}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <Table<OutboundRoute>
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
        showTotal: (totalCount) => `${totalCount} outbound routes`,
        onChange: onPageChange,
        onShowSizeChange: (_current, size) => onPageSizeChange(size),
      }}
      scroll={{ x: 1100 }}
      onRow={onRow}
    />
  )
}

export default OutboundRouteTable
