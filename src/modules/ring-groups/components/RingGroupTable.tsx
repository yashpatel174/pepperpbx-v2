import { Button, Space, Table, Tag, theme, Tooltip, Typography } from 'antd'
import type { TableColumnsType, TableProps } from 'antd'
import { CheckCircleOutlined, CopyOutlined, DeleteOutlined, EditOutlined, MinusCircleOutlined } from '@ant-design/icons'
import { formatStrategy, pageSizeOptions, ringGroupStatusLabels } from '../ring-group.constants'
import type { RingGroup } from '../ring-group.types'
import useStripedTableRow from '../../../components/common/useStripedTableRow'

const { Text } = Typography

interface RingGroupTableProps {
  data: RingGroup[]
  loading: boolean
  page: number
  pageSize: number
  total: number
  showAll: boolean
  canEditRow: boolean
  canCopyRow: boolean
  canDeleteRow: boolean
  canToggleRow: boolean
  /** uuids whose Status toggle is still in flight — that pill ignores clicks until it settles. */
  pendingToggles: ReadonlySet<string>
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onEdit: (group: RingGroup) => void
  onCopy: (group: RingGroup) => void
  onDelete: (group: RingGroup) => void
  onToggle: (group: RingGroup) => void
  selectedRowKeys: string[]
  onSelectionChange: (selectedRowKeys: string[]) => void
}

const dash = <Text type="secondary">—</Text>

const renderOptional = (value?: string) => (value ? value : dash)

/** One-line text with an ellipsis and the full value in a tooltip (§5 Description, max ~150px). */
const renderTruncated = (value?: string) =>
  value ? (
    <Tooltip title={value}>
      <div  style={{
          width: "100%",
          maxWidth: "100%",
          overflowX: "auto",
          overflowY: "hidden",
          whiteSpace: "nowrap",
        }}>{value}</div>
    </Tooltip>
  ) : (
    dash
  )

const compareOptional = (a?: string, b?: string) => (a ?? '').localeCompare(b ?? '')

/** Forwarding column: the destination while forwarding is on, otherwise a dash (§5). */
const forwardingText = (group: RingGroup) => (group.ring_group_forward_enabled ? group.ring_group_forward_destination : undefined)

/**
 * Columns per ring-groups.md §5: Domain (Show All only), Name, Extension, Strategy (title-cased),
 * Forwarding, Status (click-to-toggle pill), Description, Actions (Edit / Copy / Delete). Text
 * columns sort client-side on the loaded page, as in Axion; Status and Actions don't sort.
 */
const RingGroupTable = ({
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
  pendingToggles,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onCopy,
  onDelete,
  onToggle,
  selectedRowKeys,
  onSelectionChange,
}: RingGroupTableProps) => {
  const onRow = useStripedTableRow()
  const { token } = theme.useToken()

  const rowSelection: TableProps<RingGroup>['rowSelection'] = {
    selectedRowKeys,
    // Keep keys from other pages: selection is keyed by ring_group_uuid and spans pages.
    preserveSelectedRowKeys: true,
    onChange: (keys) => onSelectionChange(keys as string[]),
  }

  /** Direct click-to-toggle Status pill — no confirmation (§3/§11/§33). Same pill as every module. */
  const renderStatus = (record: RingGroup) => {
    const isEnabled = record.ring_group_enabled
    const clickable = canToggleRow && !pendingToggles.has(record.ring_group_uuid)
    const toggle = () => {
      if (clickable) onToggle(record)
    }
    const label = isEnabled ? ringGroupStatusLabels.enabled : ringGroupStatusLabels.disabled

    return (
      <Tooltip title={canToggleRow ? `Click to ${isEnabled ? 'disable' : 'enable'}` : undefined}>
        <Tag
          role="button"
          tabIndex={canToggleRow ? 0 : -1}
          aria-disabled={!clickable}
          aria-label={`Ring group ${record.ring_group_name} is ${label.toLowerCase()}${canToggleRow ? ', click to toggle' : ''}`}
          icon={isEnabled ? <CheckCircleOutlined /> : <MinusCircleOutlined />}
          onClick={toggle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              toggle()
            }
          }}
          style={{
            cursor: canToggleRow ? 'pointer' : 'default',
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
          {label}
        </Tag>
      </Tooltip>
    )
  }

  const columns: TableColumnsType<RingGroup> = [
    ...(showAll
      ? [
          {
            title: 'Domain',
            dataIndex: 'domain_name',
            key: 'domain_name',
            width: 200,
            render: renderTruncated,
            sorter: (a: RingGroup, b: RingGroup) => a.domain_name.localeCompare(b.domain_name),
          },
        ]
      : []),
    {
      title: 'Name',
      dataIndex: 'ring_group_name',
      key: 'ring_group_name',
      width: 180,
      render: renderTruncated,
      sorter: (a, b) => a.ring_group_name.localeCompare(b.ring_group_name),
    },
    {
      title: 'Extension',
      dataIndex: 'ring_group_extension',
      key: 'ring_group_extension',
      width: 120,
      render: renderOptional,
      sorter: (a, b) => compareOptional(a.ring_group_extension, b.ring_group_extension),
    },
    {
      title: 'Strategy',
      dataIndex: 'ring_group_strategy',
      key: 'ring_group_strategy',
      width: 140,
      render: (value: string) => renderOptional(formatStrategy(value)),
      sorter: (a, b) => a.ring_group_strategy.localeCompare(b.ring_group_strategy),
    },
    {
      title: 'Forwarding',
      key: 'forwarding',
      width: 150,
      render: (_, record) => renderOptional(forwardingText(record)),
      sorter: (a, b) => compareOptional(forwardingText(a), forwardingText(b)),
    },
    {
      title: 'Status',
      key: 'ring_group_enabled',
      width: 130,
      render: (_, record) => renderStatus(record),
    },
    {
      title: 'Description',
      dataIndex: 'ring_group_description',
      key: 'ring_group_description',
      width: 180,
      render: (value?: string) => <div style={{ maxWidth: 150 }}>{renderTruncated(value)}</div>,
      sorter: (a, b) => compareOptional(a.ring_group_description, b.ring_group_description),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          {/* TODO: PermissionGuard once backend permission contract is confirmed — ring-group.edit|view (pbx_ringgroups_edit|view). */}
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: canEditRow ? token.colorPrimary : undefined }} />}
              disabled={!canEditRow}
              onClick={() => onEdit(record)}
              aria-label={`Edit ring group ${record.ring_group_name}`}
            />
          </Tooltip>
          {/* TODO: PermissionGuard once backend permission contract is confirmed — ring-group.add (pbx_ringgroups_add). */}
          <Tooltip title="Copy">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ color: canCopyRow ? token.colorSuccess : undefined }} />}
              disabled={!canCopyRow}
              onClick={() => onCopy(record)}
              aria-label={`Copy ring group ${record.ring_group_name}`}
            />
          </Tooltip>
          {/* TODO: PermissionGuard once backend permission contract is confirmed — ring-group.manage (pbx_ringgroups_all). */}
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={!canDeleteRow}
              onClick={() => onDelete(record)}
              aria-label={`Delete ring group ${record.ring_group_name}`}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <Table<RingGroup>
      rowKey="ring_group_uuid"
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
        showTotal: (count) => `${count} ring group${count === 1 ? '' : 's'}`,
        onChange: (nextPage, nextSize) => (nextSize !== pageSize ? onPageSizeChange(nextSize) : onPageChange(nextPage)),
      }}
      scroll={{ x: showAll ? 1260 : 1060 }}
      onRow={onRow}
    />
  )
}

export default RingGroupTable
