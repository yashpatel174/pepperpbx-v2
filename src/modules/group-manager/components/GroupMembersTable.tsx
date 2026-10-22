import { Table } from 'antd'
import type { TableColumnsType } from 'antd'
import useStripedTableRow from '../../../components/common/useStripedTableRow'
import { defaultPageSize, pageSizeOptions } from '../group-manager.constants'
import type { GroupMember } from '../group-manager.types'

interface GroupMembersTableProps {
  members: GroupMember[]
  loading?: boolean
}

const GroupMembersTable = ({ members, loading }: GroupMembersTableProps) => {
  const onRow = useStripedTableRow()

  const columns: TableColumnsType<GroupMember> = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      render: (value?: string) => value || '—',
      sorter: (a, b) => a.username.localeCompare(b.username),
    },
    {
      title: 'Domain',
      dataIndex: 'domain_name',
      key: 'domain',
      // Each member's own domain, not the group's; a user with no domain shows a dash.
      render: (value?: string) => value ?? '—',
    },
  ]

  return (
    <Table<GroupMember>
      rowKey="user_uuid"
      showSorterTooltip={false}
      columns={columns}
      dataSource={members}
      loading={loading}
      pagination={{
        defaultPageSize,
        showSizeChanger: true,
        pageSizeOptions: pageSizeOptions.map(String),
        showTotal: (count) => `${count} members`,
      }}
      scroll={{ x: 600 }}
      onRow={onRow}
    />
  )
}

export default GroupMembersTable
