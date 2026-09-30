import { Button, Space, Table, Tag, theme, Tooltip, Typography } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import {
  CheckCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import { callFlowToggleKeyLabels, pageSizeOptions, pendingToggleKey } from "../call-flows.constants";
import type { CallFlow, CallFlowToggleKey } from "../call-flows.types";
import useStripedTableRow from "../../../components/common/useStripedTableRow";

const { Text } = Typography;

interface CallFlowsTableProps {
  data: CallFlow[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  showAll: boolean;
  canEditRow: boolean;
  canCopyRow: boolean;
  canDeleteRow: boolean;
  canToggleRow: boolean;
  /** `${uuid}:${toggleKey}` of row toggles still in flight — that badge ignores clicks until it settles. */
  pendingToggles: ReadonlySet<string>;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (flow: CallFlow) => void;
  onCopy: (flow: CallFlow) => void;
  onDelete: (flow: CallFlow) => void;
  onToggle: (flow: CallFlow, toggleKey: CallFlowToggleKey) => void;
  selectedRowKeys: string[];
  onSelectionChange: (selectedRowKeys: string[]) => void;
}

const renderOptional = (value?: string) => (value ? value : <Text type="secondary">—</Text>);

/** One-line text with an ellipsis and the full value in a tooltip (§5 Description). */
const renderTruncated = (value?: string) =>
  value ? (
    <Tooltip title={value}>
      <div
        style={{
          width: "100%",
          maxWidth: "100%",
          overflowX: "auto",
          overflowY: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
    </Tooltip>
  ) : (
    <Text type="secondary">—</Text>
  );

const compareOptional = (a?: string, b?: string) => (a ?? "").localeCompare(b ?? "");

/**
 * Columns per call-flows.md §5: Domain (Show All only), Name, Extension, Feature Code, Enable
 * Feature Code (click-to-toggle badge), Context, Status (click-to-toggle badge), Description,
 * Actions (Edit / Copy / Delete). Text columns sort client-side on the loaded page, as in Axion;
 * the badge columns don't sort.
 */
const CallFlowsTable = ({
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
}: CallFlowsTableProps) => {
  const onRow = useStripedTableRow();
  const { token } = theme.useToken();

  const rowSelection: TableProps<CallFlow>["rowSelection"] = {
    selectedRowKeys,
    // Keep keys from other pages: selection is keyed by call_flow_uuid and spans pages.
    preserveSelectedRowKeys: true,
    onChange: (keys) => onSelectionChange(keys as string[]),
  };

  /** Direct click-to-toggle badge — no confirmation (§3/§11). Colors come from the theme tokens. */
  const renderToggleBadge = (record: CallFlow, toggleKey: CallFlowToggleKey) => {
    const isEnabled = record[toggleKey];

    const clickable = canToggleRow && !pendingToggles.has(pendingToggleKey(record.call_flow_uuid, toggleKey));

    const toggle = () => {
      if (clickable) {
        onToggle(record, toggleKey);
      }
    };

    return (
      <Tooltip title={canToggleRow ? `Click to ${isEnabled ? "disable" : "enable"}` : undefined}>
        <Tag
          role="button"
          tabIndex={canToggleRow ? 0 : -1}
          aria-disabled={!clickable}
          aria-label={`${callFlowToggleKeyLabels[toggleKey]} for ${
            record.call_flow_name
          } is ${isEnabled ? "enabled" : "disabled"}${canToggleRow ? ", click to toggle" : ""}`}
          icon={isEnabled ? <CheckCircleOutlined /> : <MinusCircleOutlined />}
          onClick={toggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggle();
            }
          }}
          style={{
            cursor: "pointer",
            backgroundColor: isEnabled ? "#00D27A" : "#f16b3e",
            color: "#fff",
            borderColor: isEnabled ? "#00D27A" : "#f16b3e",
            fontWeight: 500,
            borderRadius: "999px",
            padding: "4px 14px",
            minHeight: "28px",
            lineHeight: "20px",
          }}
        >
          {isEnabled ? "Enabled" : "Disabled"}
        </Tag>
      </Tooltip>
    );
  };

  const columns: TableColumnsType<CallFlow> = [
    ...(showAll
      ? [
          {
            title: "Domain",
            dataIndex: "domain_name",
            key: "domain_name",
            width: 200,
            ellipsis: true,
            render: renderTruncated,
            sorter: (a: CallFlow, b: CallFlow) => a.domain_name.localeCompare(b.domain_name),
          },
        ]
      : []),
    {
      title: "Name",
      dataIndex: "call_flow_name",
      key: "call_flow_name",
      width: 180,
      ellipsis: true,
      render: renderTruncated,
      sorter: (a, b) => a.call_flow_name.localeCompare(b.call_flow_name),
    },
    {
      title: "Extension",
      dataIndex: "call_flow_extension",
      key: "call_flow_extension",
      width: 110,
      render: renderOptional,
      sorter: (a, b) => compareOptional(a.call_flow_extension, b.call_flow_extension),
    },
    {
      title: "Feature Code",
      dataIndex: "call_flow_feature_code",
      key: "call_flow_feature_code",
      width: 140,
      render: renderOptional,
      sorter: (a, b) => compareOptional(a.call_flow_feature_code, b.call_flow_feature_code),
    },
    {
      title: "Enable Feature Code",
      key: "call_flow_status",
      width: 170,
      render: (_, record) => renderToggleBadge(record, "call_flow_status"),
    },
    {
      title: "Context",
      dataIndex: "call_flow_context",
      key: "call_flow_context",
      width: 200,
      ellipsis: true,
      render: renderTruncated,
      sorter: (a, b) => compareOptional(a.call_flow_context, b.call_flow_context),
    },
    {
      title: "Status",
      key: "call_flow_enabled",
      width: 130,
      render: (_, record) => renderToggleBadge(record, "call_flow_enabled"),
    },
    {
      title: "Description",
      dataIndex: "call_flow_description",
      key: "call_flow_description",
      width: 220,
      ellipsis: true,
      render: renderTruncated,
      sorter: (a, b) => compareOptional(a.call_flow_description, b.call_flow_description),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          {/* TODO: gate with <PermissionGuard> (callflow.edit|view / pbx_callflow_edit|view) once RBAC is populated. */}
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: canEditRow ? token.colorPrimary : undefined }} />}
              disabled={!canEditRow}
              onClick={() => onEdit(record)}
              aria-label={`Edit call flow ${record.call_flow_name}`}
            />
          </Tooltip>
          {/* TODO: gate with <PermissionGuard> (callflow.add / pbx_callflow_add) once RBAC is populated. */}
          <Tooltip title="Copy">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined style={{ color: canCopyRow ? token.colorSuccess : undefined }} />}
              disabled={!canCopyRow}
              onClick={() => onCopy(record)}
              aria-label={`Copy call flow ${record.call_flow_name}`}
            />
          </Tooltip>
          {/* TODO: gate with <PermissionGuard> (callflow.manage / pbx_callflow_all) once RBAC is populated. */}
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={!canDeleteRow}
              onClick={() => onDelete(record)}
              aria-label={`Delete call flow ${record.call_flow_name}`}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table<CallFlow>
      rowKey="call_flow_uuid"
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
        showTotal: (count) => `${count} call flows`,
        onChange: (nextPage, nextSize) => (nextSize !== pageSize ? onPageSizeChange(nextSize) : onPageChange(nextPage)),
      }}
      scroll={{ x: showAll ? 1520 : 1320 }}
      onRow={onRow}
    />
  );
};

export default CallFlowsTable;
