import { memo, useCallback, useMemo, useState } from 'react'
import type { MouseEvent } from 'react'
import { Button, Card, Checkbox, Skeleton, Tooltip, Typography, theme } from 'antd'
import { CheckOutlined, LockFilled, LockOutlined } from '@ant-design/icons'
import type { PermissionDefinition } from '../group-manager.types'

/** Same props as GroupPermissionsTable, so the page can swap one for the other. */
interface GroupPermissionsCardsProps {
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

const GRID_STYLE = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 } as const

/**
 * Chip label: the category's shared leading underscore-tokens are dropped ("access_control_node_add"
 * → "node add"). A lone permission, or a name that would end up empty, keeps its full name.
 */
const buildLabels = (names: string[]): Map<string, string> => {
  const full = (name: string) => name.replace(/_/g, ' ')
  const labels = new Map(names.map((name) => [name, full(name)]))
  if (names.length < 2) return labels

  const tokenLists = names.map((name) => name.split('_'))
  let prefixLength = 0
  while (tokenLists.every((tokens) => tokens.length > prefixLength && tokens[prefixLength] === tokenLists[0][prefixLength])) {
    prefixLength += 1
  }
  if (prefixLength === 0) return labels

  names.forEach((name, i) => {
    const rest = tokenLists[i].slice(prefixLength).join(' ')
    if (rest) labels.set(name, rest)
  })
  return labels
}

interface ChipProps {
  name: string
  label: string
  assigned: boolean
  isProtected: boolean
  onAssignChange: (names: string[], checked: boolean) => void
  onProtectedChange: (names: string[], checked: boolean) => void
}

const PermissionChip = memo(({ name, label, assigned, isProtected, onAssignChange, onProtectedChange }: ChipProps) => {
  const { token } = theme.useToken()
  const [focused, setFocused] = useState(false)

  const toggle = useCallback(() => onAssignChange([name], !assigned), [onAssignChange, name, assigned])
  const toggleProtected = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()
      onProtectedChange([name], !isProtected)
    },
    [onProtectedChange, name, isProtected]
  )

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: token.marginXXS,
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${assigned ? token.colorPrimaryBorder : token.colorBorder}`,
        background: assigned ? token.colorPrimaryBg : 'transparent',
        color: assigned ? token.colorPrimary : token.colorTextSecondary,
        boxShadow: focused ? `0 0 0 2px ${token.colorPrimary}` : 'none',
        transition: `all ${token.motionDurationMid}`,
      }}
    >
      <Tooltip title={name}>
        <button
          type="button"
          role="checkbox"
          aria-checked={assigned}
          onClick={toggle}
          onFocus={(e) => setFocused(e.currentTarget.matches(':focus-visible'))}
          onBlur={() => setFocused(false)}
          style={{
            all: 'unset',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: token.marginXXS,
            padding: `${token.paddingXXS}px ${token.paddingSM}px`,
            paddingInlineEnd: assigned ? token.paddingXXS : token.paddingSM,
            fontSize: token.fontSizeSM,
          }}
        >
          {assigned && <CheckOutlined style={{ fontSize: token.fontSizeSM }} />}
          {label}
        </button>
      </Tooltip>
      {assigned && (
        <Tooltip title={isProtected ? 'Protected' : 'Not protected'}>
          <button
            type="button"
            aria-label={`${isProtected ? 'Remove protection from' : 'Protect'} ${name}`}
            aria-pressed={isProtected}
            onClick={toggleProtected}
            style={{
              all: 'unset',
              cursor: 'pointer',
              display: 'inline-flex',
              padding: `${token.paddingXXS}px ${token.paddingXS}px`,
              paddingInlineStart: token.paddingXXS,
              color: isProtected ? token.colorWarning : token.colorTextTertiary,
            }}
          >
            {isProtected ? <LockFilled /> : <LockOutlined />}
          </button>
        </Tooltip>
      )}
    </span>
  )
})
PermissionChip.displayName = 'PermissionChip'

interface CategoryCardProps {
  category: string
  names: string[]
  draft: ReadonlyMap<string, boolean>
  onAssignChange: (names: string[], checked: boolean) => void
  onProtectedChange: (names: string[], checked: boolean) => void
}

const CategoryCard = memo(
  ({ category, names, draft, onAssignChange, onProtectedChange }: CategoryCardProps) => {
    const labels = useMemo(() => buildLabels(names), [names])
    const assignedNames = names.filter((name) => draft.has(name))
    const allAssigned = names.length > 0 && assignedNames.length === names.length
    const allProtected = assignedNames.length > 0 && assignedNames.every((name) => draft.get(name) === true)

    return (
      <Card
        size="small"
        title={
          <Typography.Text strong style={{ fontWeight: 500 }}>
            {category}
          </Typography.Text>
        }
        extra={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Typography.Text type="secondary">
              {assignedNames.length} of {names.length}
            </Typography.Text>
            <Button
              type="link"
              size="small"
              disabled={assignedNames.length === 0}
              onClick={() => onProtectedChange(assignedNames, !allProtected)}
              aria-label={`${allProtected ? 'Unprotect' : 'Protect'} all assigned ${category} permissions`}
            >
              Protected
            </Button>
            <Checkbox
              checked={allAssigned}
              indeterminate={assignedNames.length > 0 && !allAssigned}
              onChange={(e) => onAssignChange(names, e.target.checked)}
              aria-label={`Select all ${category} permissions`}
            >
              Select all
            </Checkbox>
          </span>
        }
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {names.map((name) => (
            <PermissionChip
              key={name}
              name={name}
              label={labels.get(name) ?? name}
              assigned={draft.has(name)}
              isProtected={draft.get(name) === true}
              onAssignChange={onAssignChange}
              onProtectedChange={onProtectedChange}
            />
          ))}
        </div>
      </Card>
    )
  },
  // Re-render a card only when its own permissions' state (or its handlers) change, so toggling one
  // chip does not repaint every other card.
  (prev, next) =>
    prev.category === next.category &&
    prev.names.length === next.names.length &&
    prev.names.every((name, i) => name === next.names[i]) &&
    prev.onAssignChange === next.onAssignChange &&
    prev.onProtectedChange === next.onProtectedChange &&
    prev.names.every((name) => prev.draft.get(name) === next.draft.get(name) && prev.draft.has(name) === next.draft.has(name))
)
CategoryCard.displayName = 'CategoryCard'

const GroupPermissionsCards = ({ permissions, draft, loading, onAssignChange, onProtectedChange }: GroupPermissionsCardsProps) => {
  // Cards keep the table's category order (alphabetical), with names sorted inside each.
  const groups = useMemo(() => {
    const byCategory = new Map<string, string[]>()
    permissions.forEach((p) => byCategory.set(p.category, [...(byCategory.get(p.category) ?? []), p.permission_name]))
    return [...byCategory.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, names]) => ({ category, names: [...names].sort((a, b) => a.localeCompare(b)) }))
  }, [permissions])

  if (loading && permissions.length === 0) {
    return (
      <div style={GRID_STYLE} aria-busy="true">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i} size="small">
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div style={{ ...GRID_STYLE, opacity: loading ? 0.5 : 1, pointerEvents: loading ? 'none' : 'auto' }} aria-busy={loading}>
      {groups.map(({ category, names }) => (
        <CategoryCard
          key={category}
          category={category}
          names={names}
          draft={draft}
          onAssignChange={onAssignChange}
          onProtectedChange={onProtectedChange}
        />
      ))}
    </div>
  )
}

export default GroupPermissionsCards
