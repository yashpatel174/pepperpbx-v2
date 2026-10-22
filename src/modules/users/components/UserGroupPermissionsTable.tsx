import { useMemo } from 'react'
import { Table, Typography, theme } from 'antd'
import type { TableColumnsType } from 'antd'
import type { PermissionDefinition } from '../../group-manager/group-manager.types'

type PermissionRow = { key: string; kind: 'category'; label: string } | { key: string; kind: 'permission'; label: string }

interface UserGroupPermissionsTableProps {
  /** Only the permissions assigned to the group — the page filters these before passing them in. */
  permissions: PermissionDefinition[]
  loading?: boolean
}

/** Read-only counterpart of Group Manager's permissions table: category headings with plain permission names, no checkboxes. */
const UserGroupPermissionsTable = ({ permissions, loading }: UserGroupPermissionsTableProps) => {
  const { token } = theme.useToken()

  const rows = useMemo<PermissionRow[]>(() => {
    const byCategory = new Map<string, string[]>()
    permissions.forEach((p) => byCategory.set(p.category, [...(byCategory.get(p.category) ?? []), p.permission_name]))
    return [...byCategory.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([category, names]) => [
        { key: `category:${category}`, kind: 'category' as const, label: category },
        ...[...names].sort((a, b) => a.localeCompare(b)).map((name) => ({ key: name, kind: 'permission' as const, label: name })),
      ])
  }, [permissions])

  const columns: TableColumnsType<PermissionRow> = [
    {
      title: 'Permission Name',
      key: 'name',
      render: (_, row) => (row.kind === 'category' ? <Typography.Text strong>{row.label}</Typography.Text> : <Typography.Text>{row.label}</Typography.Text>),
    },
  ]

  return (
    <Table<PermissionRow>
      rowKey="key"
      size="small"
      columns={columns}
      dataSource={rows}
      loading={loading}
      pagination={false}
      scroll={{ x: 320 }}
      onRow={(row) => (row.kind === 'category' ? { style: { backgroundColor: token.colorFillTertiary } } : {})}
    />
  )
}

export default UserGroupPermissionsTable
