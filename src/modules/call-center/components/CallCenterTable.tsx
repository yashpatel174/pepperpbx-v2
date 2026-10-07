import { Button, Space, Table, theme, Tooltip, Typography } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import { CopyOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { defaultPageSize, pageSizeOptions, queueStrategyLabel } from "../call-center.constants";
import type { CallCenter } from "../call-center.types";
import useStripedTableRow from "../../../components/common/useStripedTableRow";
import StatusToggleTag from "../../../components/common/StatusToggleTag";

const { Text } = Typography;

interface CallCenterTableProps {
  data: CallCenter[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  showAll: boolean;
  /** Gates Edit — broadest tier (view-only users can still open the read-only form). */
  canEditRow: boolean;
  /** Gates Copy — matches the audit's "disabled unless pbx_admin/pbx_axiontech/pbx_callcenter_add" (call-center.md §14). */
  canCopyRow: boolean;
  /** Gates Delete — module-admin tier only, per the audit (call-center.md §14). */
  canDeleteRow: boolean;
  /** Gates the inline Tier Rules Apply toggle — same edit tier as Call Block/Announcements' Status pill. */
  canToggleRow: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (callCenter: CallCenter) => void;
  onCopy: (callCenter: CallCenter) => void;
  onDelete: (callCenter: CallCenter) => void;
  onToggleTierRulesApply: (callCenter: CallCenter) => void;
  selectedRowKeys: string[];
  onSelectionChange: (selectedRowKeys: string[]) => void;
}

const renderOptionalText = (value?: string) => value || <Text type="secondary">—</Text>;

const compareOptional = (a?: string, b?: string) => (a ?? "").localeCompare(b ?? "");

const CallCenterTable = ({
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
  onPageChange,
  onPageSizeChange,
  onEdit,
  onCopy,
  onDelete,
  onToggleTierRulesApply,
  selectedRowKeys,
  onSelectionChange,
}: CallCenterTableProps) => {
  const onRow = useStripedTableRow();
  const { token } = theme.useToken();

  const rowSelection: TableProps<CallCenter>["rowSelection"] = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: (selectedKeys) => {
      onSelectionChange(selectedKeys as string[]);
    },
  };

  const columns: TableColumnsType<CallCenter> = [
    ...(showAll
      ? [
          {
            title: "Domain",
            dataIndex: "domain",
            key: "domain",
            render: renderOptionalText,
            sorter: (a: CallCenter, b: CallCenter) => compareOptional(a.domain, b.domain),
          },
        ]
      : []),

    {
      title: "Queue Name",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
      render: (value: string) => <Tooltip title={value}>{value}</Tooltip>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },

    {
      title: "Extension",
      dataIndex: "extension",
      key: "extension",
      render: renderOptionalText,
      sorter: (a, b) => compareOptional(a.extension, b.extension),
    },

    {
      title: "Strategy",
      dataIndex: "strategy",
      key: "strategy",
      render: (value: CallCenter["strategy"]) => queueStrategyLabel(value),
      sorter: (a, b) => compareOptional(a.strategy, b.strategy),
    },

    {
      title: "Description",
      dataIndex: "description",
      key: "description",
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
      title: "Tier Rules Apply",
      key: "tierRulesApply",
      sorter: (a, b) => Number(a.tierRulesApply) - Number(b.tierRulesApply),
      render: (_, record) => {
        const isEnabled = record.tierRulesApply;

        return (
          <StatusToggleTag
            enabled={isEnabled}
            tooltip={canToggleRow ? `Click to ${isEnabled ? "disable" : "enable"}` : undefined}
            style={{ cursor: canToggleRow ? "pointer" : "not-allowed", opacity: canToggleRow ? 1 : 0.6 }}
            onClick={() => canToggleRow && onToggleTierRulesApply(record)}
          >
            {isEnabled ? "Enabled" : "Disabled"}
          </StatusToggleTag>
        );
      },
    },

    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          {/* TODO: wrap with <PermissionGuard permission="callCenter.edit"> once RBAC
              permissions are populated from the backend. */}
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: token.colorPrimary }} />}
              disabled={!canEditRow}
              onClick={() => onEdit(record)}
              aria-label={`Edit call center queue ${record.name}`}
            />
          </Tooltip>

          <Tooltip title="Copy">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ color: token.colorSuccess }} />}
              disabled={!canCopyRow}
              onClick={() => onCopy(record)}
              aria-label={`Copy call center queue ${record.name}`}
            />
          </Tooltip>

          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={!canDeleteRow}
              onClick={() => onDelete(record)}
              aria-label={`Delete call center queue ${record.name}`}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table<CallCenter>
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
        showTotal: (totalCount) => `${totalCount} call center queues`,
        onChange: onPageChange,
        onShowSizeChange: (_current, size) => onPageSizeChange(size),
      }}
      scroll={{ x: 1200 }}
      onRow={onRow}
    />
  );
};

export default CallCenterTable;
