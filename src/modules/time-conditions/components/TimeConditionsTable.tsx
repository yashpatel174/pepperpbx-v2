import { Button, Space, Table, theme, Tooltip, Typography } from 'antd'
import type { TableColumnsType, TableProps } from 'antd'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import useStripedTableRow from '../../../components/common/useStripedTableRow'
import StatusToggleTag from '../../../components/common/StatusToggleTag'
import { pageSizeOptions } from '../time-condition.constants'
import type { TimeCondition } from '../time-condition.types'

const { Text } = Typography

interface TimeConditionsTableProps {
  data: TimeCondition[]
  loading: boolean
  page: number
  pageSize: number
  total: number
  showAll: boolean
  canEditRow: boolean
  canDeleteRow: boolean
  canToggleRow: boolean
  /** uuids whose Status toggle is still in flight — that pill ignores clicks until it settles. */
  pendingToggles: ReadonlySet<string>
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onEdit: (item: TimeCondition) => void
  onDelete: (item: TimeCondition) => void
  onToggle: (item: TimeCondition) => void
  selectedRowKeys: string[]
  onSelectionChange: (selectedRowKeys: string[]) => void
}

/** One-line text that scrolls horizontally, with the full value in a tooltip (§5 destination cells). */
const renderScrollable = (value?: string) =>
  value ? (
    <Tooltip title={value}>
      <div style={{ width: '100%', maxWidth: '100%', overflowX: 'auto', overflowY: 'hidden', whiteSpace: 'nowrap' }}>
        {value}
      </div>
    </Tooltip>
  ) : (
    <Text type="secondary">—</Text>
  )

const compareOptional = (a?: string, b?: string) => (a ?? '').localeCompare(b ?? '')

/**
 * Columns per time-conditions.md §5: Name, Extension, Time Group, Preset, Domain (Show All only),
 * Status (click-to-toggle pill, no confirmation), the two destinations, Actions (Edit / Delete).
 * Text columns sort client-side on the loaded page only, as in Axion (§3 step 8).
 *
 * System-default rows (`default === true`) get no actions and can't be selected (§25/§26).
 */
const TimeConditionsTable = ({
  data,
  loading,
  page,
  pageSize,
  total,
  showAll,
  canEditRow,
  canDeleteRow,
  canToggleRow,
  pendingToggles,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onToggle,
  selectedRowKeys,
  onSelectionChange,
}: TimeConditionsTableProps) => {
  const onRow = useStripedTableRow()
  const { token } = theme.useToken()

  const rowSelection: TableProps<TimeCondition>['rowSelection'] = {
    selectedRowKeys,
    // Selection is keyed by time_condition_uuid and spans pages.
    preserveSelectedRowKeys: true,
    onChange: (keys) => onSelectionChange(keys as string[]),
    // Default rows can never be part of a bulk delete (§21).
    getCheckboxProps: (record) => ({ disabled: record.default }),
  }

  /** Axion's "Enabled" / "Disabled" pill (§5), styled like every sibling module's status pill. */
  const renderStatus = (record: TimeCondition) => {
    const isEnabled = record.time_condition_enabled
    const clickable = canToggleRow && !pendingToggles.has(record.time_condition_uuid)

    const toggle = () => {
      if (clickable) onToggle(record)
    }

    return (
      <StatusToggleTag
        enabled={isEnabled}
        tooltip={canToggleRow ? `Click to ${isEnabled ? 'disable' : 'enable'}` : undefined}
        role="button"
        tabIndex={canToggleRow ? 0 : -1}
        aria-disabled={!clickable}
        aria-label={`Time condition ${record.time_condition_name} is ${isEnabled ? 'enabled' : 'disabled'}${canToggleRow ? ', click to toggle' : ''}`}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggle()
          }
        }}
        style={{ cursor: clickable ? 'pointer' : 'not-allowed', opacity: canToggleRow ? 1 : 0.6 }}
      >
        {isEnabled ? 'Enabled' : 'Disabled'}
      </StatusToggleTag>
    )
  }

  const columns: TableColumnsType<TimeCondition> = [
    ...(showAll
      ? [
          {
            title: 'Domain',
            dataIndex: 'domain_name',
            key: 'domain_name',
            width: 200,
            render: renderScrollable,
            sorter: (a: TimeCondition, b: TimeCondition) => a.domain_name.localeCompare(b.domain_name),
          },
        ]
      : []),
    {
      title: 'Name',
      dataIndex: 'time_condition_name',
      key: 'time_condition_name',
      width: 200,
      render: renderScrollable,
      sorter: (a, b) => a.time_condition_name.localeCompare(b.time_condition_name),
    },
    {
      title: 'Extension',
      dataIndex: 'time_condition_extension',
      key: 'time_condition_extension',
      width: 110,
      sorter: (a, b) => compareOptional(a.time_condition_extension, b.time_condition_extension),
    },
    {
      title: 'Time Group',
      dataIndex: 'dialplan_name',
      key: 'dialplan_name',
      width: 160,
      render: renderScrollable,
      sorter: (a, b) => compareOptional(a.dialplan_name, b.dialplan_name),
    },
    {
      title: 'Preset',
      dataIndex: 'name',
      key: 'name',
      width: 160,
      render: renderScrollable,
      sorter: (a, b) => compareOptional(a.name, b.name),
    },
    {
      title: 'Status',
      key: 'time_condition_enabled',
      width: 130,
      render: (_, record) => renderStatus(record),
    },
    {
      title: 'Destination if time does match',
      dataIndex: 'timeMatchAction',
      key: 'timeMatchAction',
      width: 220,
      render: renderScrollable,
      sorter: (a, b) => compareOptional(a.timeMatchAction, b.timeMatchAction),
    },
    {
      title: 'Destination if time does not match',
      dataIndex: 'timeNotMatchAction',
      key: 'timeNotMatchAction',
      width: 220,
      render: renderScrollable,
      sorter: (a, b) => compareOptional(a.timeNotMatchAction, b.timeNotMatchAction),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) =>
        // System-default rows are immutable from the UI (§5/§26).
        record.default ? null : (
          <Space size="small">
            {/* TODO: gate with <PermissionGuard> (pbx_timeconditions_all|edit|view) once RBAC is populated. */}
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined style={{ color: canEditRow ? token.colorPrimary : undefined }} />}
                disabled={!canEditRow}
                onClick={() => onEdit(record)}
                aria-label={`Edit time condition ${record.time_condition_name}`}
              />
            </Tooltip>
            {/* TODO: gate with <PermissionGuard> (pbx_timeconditions_all) once RBAC is populated. */}
            <Tooltip title="Delete">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={!canDeleteRow}
                onClick={() => onDelete(record)}
                aria-label={`Delete time condition ${record.time_condition_name}`}
              />
            </Tooltip>
          </Space>
        ),
    },
  ]

  return (
    <Table<TimeCondition>
      rowKey="time_condition_uuid"
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
        showTotal: (count) => `${count} time conditions`,
        onChange: (nextPage, nextSize) => (nextSize !== pageSize ? onPageSizeChange(nextSize) : onPageChange(nextPage)),
      }}
      scroll={{ x: showAll ? 1550 : 1350 }}
      onRow={onRow}
    />
  )
}

export default TimeConditionsTable
