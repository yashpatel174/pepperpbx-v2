import { useMemo } from 'react'
import { Checkbox, Table, Typography, theme } from 'antd'
import type { TableColumnsType } from 'antd'
import type { PermissionDefinition } from '../group-manager.types'

type PermissionRow =
  | { key: string; kind: 'category'; category: string; names: string[] }
  | { key: string; kind: 'permission'; name: string }

interface GroupPermissionsTableProps {
  /** The permissions to show — already search/filter-narrowed by the page. */
  permissions: PermissionDefinition[]
  /** Draft assignments: permission name → its Protected flag. Presence = assigned. */
  draft: ReadonlyMap<string, boolean>
  loading?: boolean
  /** Assign (checked) or unassign the given permissions. */
  onAssignChange: (names: string[], checked: boolean) => void
  /** Set the Protected flag on the given permissions (unassigned ones are ignored by the page). */
  onProtectedChange: (names: string[], checked: boolean) => void
}

interface CheckState {
  checked: boolean
  indeterminate: boolean
  none: boolean
}

const checkState = (total: number, selected: number): CheckState => ({
  checked: total > 0 && selected === total,
  indeterminate: selected > 0 && selected < total,
  none: total === 0,
})

/**
 * Permissions grouped by category: a category row (with select-all checkboxes for the permissions
 * currently shown in it) followed by its permission rows. Two independent checkbox columns:
 * the first is "assigned to this group"; Protected is a separate flag that only applies to an
 * assigned permission, so it is disabled until the permission is assigned.
 */
const GroupPermissionsTable = ({ permissions, draft, loading, onAssignChange }: GroupPermissionsTableProps) => {
  const { token } = theme.useToken()

  const rows = useMemo<PermissionRow[]>(() => {
    const byCategory = new Map<string, string[]>()
    permissions.forEach((p) => byCategory.set(p.category, [...(byCategory.get(p.category) ?? []), p.permission_name]))
    return [...byCategory.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([category, names]) => {
        const sorted = [...names].sort((a, b) => a.localeCompare(b))
        return [
          { key: `category:${category}`, kind: 'category' as const, category, names: sorted },
          ...sorted.map((name) => ({ key: name, kind: 'permission' as const, name })),
        ]
      })
  }, [permissions])

  const allNames = useMemo(() => permissions.map((p) => p.permission_name), [permissions])

  const assignState = (names: string[]) => checkState(names.length, names.filter((n) => draft.has(n)).length)
 
  const assignCheckbox = (names: string[], label: string) => {
    const state = assignState(names)
    return (
      <Checkbox
        checked={state.checked}
        indeterminate={state.indeterminate}
        disabled={state.none}
        onChange={(e) => onAssignChange(names, e.target.checked)}
        aria-label={label}
      />
    )
  }


  const columns: TableColumnsType<PermissionRow> = [
    {
      title: assignCheckbox(allNames, 'Select all shown permissions'),
      key: 'assigned',
      width: 56,
      align: 'center',
      render: (_, row) =>
        row.kind === 'category'
          ? assignCheckbox(row.names, `Select all ${row.category} permissions`)
          : assignCheckbox([row.name], `Assign ${row.name}`),
    },
    {
      title: 'Permission Name',
      key: 'name',
      render: (_, row) =>
        row.kind === 'category' ? <Typography.Text strong>{row.category}</Typography.Text> : <Typography.Text>{row.name}</Typography.Text>,
    }
  ]

  return (
    <Table<PermissionRow>
      rowKey="key"
      size="small"
      columns={columns}
      dataSource={rows}
      loading={loading}
      pagination={false}
      scroll={{ x: 520 }}
      onRow={(row) => (row.kind === 'category' ? { style: { backgroundColor: token.colorFillTertiary } } : {})}
    />
  )
}

export default GroupPermissionsTable
