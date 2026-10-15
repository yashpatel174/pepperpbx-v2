import { Button, Space, Table, Tooltip, Typography, theme } from 'antd'
import type { TableColumnsType } from 'antd'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import useStripedTableRow from '../../../components/common/useStripedTableRow'
import { defaultPageSize, pageSizeOptions } from '../group-manager.constants'
import type { Group } from '../group-manager.types'

const { Text } = Typography

interface GroupManagerTableProps {
  data: Group[]
  loading: boolean
  page: number
  pageSize: number
  total: number
  /** Show All adds a Domain column, same as the other domain-scoped modules. */
  showAll: boolean
  onPageChange: (page: number, pageSize: number) => void
  onPageSizeChange: (size: number) => void
  onEdit: (group: Group) => void
  onDelete: (group: Group) => void
  onOpenPermissions: (group: Group) => void
  onOpenMembers: (group: Group) => void
}

const GroupManagerTable = ({
  data,
  loading,
  page,
  pageSize,
  total,
  showAll,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onOpenPermissions,
  onOpenMembers,
}: GroupManagerTableProps) => {
  const onRow = useStripedTableRow()
  const { token } = theme.useToken()

  const columns: TableColumnsType<Group> = [
    {
      title: 'Name',
      dataIndex: 'group_name',
      key: 'group_name',
      // width: 200,
      sorter: (a, b) => a.group_name.localeCompare(b.group_name),
    },
    ...(showAll
      ? [
          {
            title: 'Domain',
            dataIndex: 'domain_name',
            key: 'domain_name',
            width: 220,
            render: (value?: string) => value ?? <Text type="secondary">All domains</Text>,
            sorter: (a: Group, b: Group) => (a.domain_name ?? '').localeCompare(b.domain_name ?? ''),
          },
        ]
      : []),
    {
      title: 'Tools',
      key: 'tools',
      // width: 170,
      render: (_, record) => (
        <Button type="link" size="small" style={{ padding: 0 }} onClick={() => onOpenPermissions(record)}>
          Permissions ({record.permission_count})
        </Button>
      ),
    },
    {
      title: 'Members',
      key: 'members',
      // width: 140,
      render: (_, record) => (
        <Button type="link" size="small" style={{ padding: 0 }} onClick={() => onOpenMembers(record)}>
          Members ({record.member_count})
        </Button>
      ),
    },
    {
      title: 'Level',
      dataIndex: 'group_level',
      key: 'group_level',
      width: 100,
      sorter: (a, b) => a.group_level - b.group_level,
    },
    {
      title: 'Description',
      dataIndex: 'group_description',
      key: 'group_description',
      ellipsis: true,
      render: (value?: string) => (value ? <Tooltip title={value}> <div  style={{
          width: "100%",
          maxWidth: "100%",
          overflowX: "auto",
          overflowY: "hidden",
          whiteSpace: "nowrap",
        }}  >{value}</div></Tooltip> : <Text type="secondary">—</Text>),
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space size="small">
        <Tooltip title="Edit">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined style={{ color: token.colorPrimary }} />}
            onClick={() => onEdit(record)}
            aria-label={`Edit group ${record.group_name}`}
          />
        </Tooltip>
        <Tooltip title={record.member_count === 0 ? 'Delete' : 'Remove all members before deleting this group'}>
          <span>
            <Button
              type="text"
              size="small"
              danger
              disabled={record.member_count > 0}
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record)}
              aria-label={`Delete group ${record.group_name}`}
            />
          </span>
        </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <Table<Group>
      rowKey="group_uuid"
      showSorterTooltip={false}
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={{
        current: page,
        pageSize,
        total,
        defaultPageSize,
        showSizeChanger: true,
        pageSizeOptions: pageSizeOptions.map(String),
        showTotal: (count) => `${count} groups`,
        onChange: onPageChange,
        onShowSizeChange: (_current, size) => onPageSizeChange(size),
      }}
      scroll={{ x: 800 }}
      onRow={onRow}
    />
  )
}

export default GroupManagerTable
