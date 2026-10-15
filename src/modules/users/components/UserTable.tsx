import { Button, Space, Table, Tag, Tooltip, Typography, theme } from 'antd'
import type { TableColumnsType } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import StatusToggleTag from '../../../components/common/StatusToggleTag'
import useStripedTableRow from '../../../components/common/useStripedTableRow'
import { defaultPageSize, pageSizeOptions } from '../users.constants'
import type { User } from '../users.types'

const { Text } = Typography

interface UserTableProps {
  data: User[]
  loading: boolean
  page: number
  pageSize: number
  total: number
  /** Show All adds a Domain column, same as the other domain-scoped modules. */
  showAll: boolean
  onPageChange: (page: number, pageSize: number) => void
  onPageSizeChange: (size: number) => void
  onEdit: (user: User) => void
  /** Opens the read-only permissions of a group (by Group Manager's `group_uuid`). */
  onOpenGroupPermissions: (groupId: string) => void
  /** Ids whose Enabled update is in flight — their pill ignores clicks until it settles. */
  pendingIds: string[]
  onToggleEnabled: (user: User) => void
}

const UserTable = ({ data, loading, page, pageSize, total, showAll, onPageChange, onPageSizeChange, onEdit, onOpenGroupPermissions, pendingIds, onToggleEnabled }: UserTableProps) => {
  const onRow = useStripedTableRow()
  const { token } = theme.useToken()

  const columns: TableColumnsType<User> = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      sorter: (a, b) => a.username.localeCompare(b.username),
    },
    ...(showAll
      ? [
          {
            title: 'Domain',
            dataIndex: 'domain_name',
            key: 'domain_name',
            // width: 220,
            render: (value?: string) => value ?? <Text type="secondary">—</Text>,
            sorter: (a: User, b: User) => (a.domain_name ?? '').localeCompare(b.domain_name ?? ''),
          },
        ]
      : []),
    {
      title: 'Groups',
      dataIndex: 'group_names',
      key: 'group_names',
      render: (names: string[]) =>
        names.length > 0 ? (
          <Space size={[4, 4]} wrap>
            {names.map((name) => (
              <Tag key={name} style={{ marginInlineEnd: 0 }}>
                {name}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Account Status',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record) => {
        const pending = pendingIds.includes(record.user_uuid)
        return (
          <StatusToggleTag
            enabled={enabled}
            tooltip={`Click to ${enabled ? 'disable' : 'enable'}`}
            iconStyle={{ color: '#fff' }}
            style={pending ? { cursor: 'wait', opacity: 0.6 } : undefined}
            onClick={() => !pending && onToggleEnabled(record)}
          >
            {enabled ? 'Active' : 'Inactive'}
          </StatusToggleTag>
        )
      },
    },
    {
      title: 'Tools',
      key: 'tools',
      // One link per group, so a user in several groups opens each group's permissions independently.
      render: (_, record) =>
        record.group_ids.length > 0 ? (
          <Space orientation="vertical" size={0}>
            {record.group_ids.map((groupId, index) => (
              <Button
                key={groupId}
                type="link"
                size="small"
                style={{ padding: 0 }}
                onClick={() => onOpenGroupPermissions(groupId)}
                aria-label={`View permissions of group ${record.group_names[index]}`}
              >
                Permissions ({record.group_permission_counts[index]})
              </Button>
            ))}
          </Space>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space size={0}>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: token.colorPrimary }} />}
              onClick={() => onEdit(record)}
              aria-label={`Edit user ${record.username}`}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <Table<User>
      rowKey="user_uuid"
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
        showTotal: (count) => `${count} users`,
        onChange: onPageChange,
        onShowSizeChange: (_current, size) => onPageSizeChange(size),
      }}
      scroll={{ x: 700 }}
      onRow={onRow}
    />
  )
}

export default UserTable
