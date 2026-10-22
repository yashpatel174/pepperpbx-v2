import { Button, Space, Table, theme, Tooltip, Typography } from 'antd'
import type { TableColumnsType, TableProps } from 'antd'
import { CopyOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import useStripedTableRow from '../../../components/common/useStripedTableRow'
import StatusToggleTag from '../../../components/common/StatusToggleTag'
import { pageSizeOptions } from '../ivr-menu.constants'
import type { IVRMenu } from '../ivr-menu.types'

const { Text } = Typography

interface IVRMenuTableProps {
  data: IVRMenu[]
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
  onEdit: (menu: IVRMenu) => void
  onCopy: (menu: IVRMenu) => void
  onDelete: (menu: IVRMenu) => void
  onToggle: (menu: IVRMenu) => void
  selectedRowKeys: string[]
  onSelectionChange: (selectedRowKeys: string[]) => void
}

/** One-line text with an ellipsis and the full value in a tooltip (§5 Description). */
const renderTruncated = (value?: string) =>
  value ? (
    <Tooltip title={value}>
      <div  style={{
          width: "100%",
          maxWidth: "100%",
          overflowX: "auto",
          overflowY: "hidden",
          whiteSpace: "nowrap",
        }}  >{value}</div>
    </Tooltip>
  ) : (
    <Text type="secondary">—</Text>
  )

const compareOptional = (a?: string, b?: string) => (a ?? '').localeCompare(b ?? '')

/**
 * Columns per ivr-menus.md §5: Domain (Show All only), Name, Extension, Status (click-to-toggle
 * pill, no confirmation), Description, Actions (Edit / Copy / Delete). Text columns sort
 * client-side on the loaded page only, as in Axion (§3 step 8).
 */
const IVRMenuTable = ({
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
}: IVRMenuTableProps) => {
  const onRow = useStripedTableRow()
  const { token } = theme.useToken()

  const rowSelection: TableProps<IVRMenu>['rowSelection'] = {
    selectedRowKeys,
    // Selection is keyed by ivr_menu_uuid and spans pages.
    preserveSelectedRowKeys: true,
    onChange: (keys) => onSelectionChange(keys as string[]),
  }

  /** Axion's green "Enabled" / yellow "Disabled" pill (§5), from the theme's status tokens. */
  const renderStatus = (record: IVRMenu) => {
    const isEnabled = record.ivr_menu_enabled
    const pending = pendingToggles.has(record.ivr_menu_uuid)
    const clickable = canToggleRow && !pending

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
        aria-label={`IVR menu ${record.ivr_menu_name} is ${isEnabled ? 'enabled' : 'disabled'}${canToggleRow ? ', click to toggle' : ''}`}
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

  const columns: TableColumnsType<IVRMenu> = [
    ...(showAll
      ? [
          {
            title: 'Domain',
            dataIndex: 'domain_name',
            key: 'domain_name',
            width: 200,
            render: renderTruncated,
            sorter: (a: IVRMenu, b: IVRMenu) => a.domain_name.localeCompare(b.domain_name),
          },
        ]
      : []),
    {
      title: 'Name',
      dataIndex: 'ivr_menu_name',
      key: 'ivr_menu_name',
      width: 200,
      render: renderTruncated,
      sorter: (a, b) => a.ivr_menu_name.localeCompare(b.ivr_menu_name),
    },
    {
      title: 'Extension',
      dataIndex: 'ivr_menu_extension',
      key: 'ivr_menu_extension',
      width: 120,
      sorter: (a, b) => compareOptional(a.ivr_menu_extension, b.ivr_menu_extension),
    },
    {
      title: 'Status',
      key: 'ivr_menu_enabled',
      width: 130,
      render: (_, record) => renderStatus(record),
    },
    {
      title: 'Description',
      dataIndex: 'ivr_menu_description',
      key: 'ivr_menu_description',
      width: 260,
      render: renderTruncated,
      sorter: (a, b) => compareOptional(a.ivr_menu_description, b.ivr_menu_description),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          {/* TODO: gate with <PermissionGuard> (pbx_ivrmenus_all|edit|view) once RBAC is populated. */}
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: canEditRow ? token.colorPrimary : undefined }} />}
              disabled={!canEditRow}
              onClick={() => onEdit(record)}
              aria-label={`Edit IVR menu ${record.ivr_menu_name}`}
            />
          </Tooltip>
          {/* TODO: gate with <PermissionGuard> (pbx_ivrmenus_add|all, pbx_admin, pbx_axiontech) once RBAC is populated. */}
          <Tooltip title="Copy">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ color: canCopyRow ? token.colorSuccess : undefined }} />}
              disabled={!canCopyRow}
              onClick={() => onCopy(record)}
              aria-label={`Copy IVR menu ${record.ivr_menu_name}`}
            />
          </Tooltip>
          {/* TODO: gate with <PermissionGuard> (pbx_ivrmenus_all) once RBAC is populated. */}
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={!canDeleteRow}
              onClick={() => onDelete(record)}
              aria-label={`Delete IVR menu ${record.ivr_menu_name}`}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <Table<IVRMenu>
      rowKey="ivr_menu_uuid"
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
        showTotal: (count) => `${count} IVR menus`,
        onChange: (nextPage, nextSize) => (nextSize !== pageSize ? onPageSizeChange(nextSize) : onPageChange(nextPage)),
      }}
      scroll={{ x: showAll ? 1080 : 880 }}
      onRow={onRow}
    />
  )
}

export default IVRMenuTable
