import { Button, Table, Tag, theme, Tooltip, Typography } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import { CheckCircleOutlined, EditOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { conferenceProfileStatusLabels, pageSizeOptions } from "../conference-profile.constants";
import type { ConferenceProfile } from "../conference-profile.types";
import useStripedTableRow from "../../../components/common/useStripedTableRow";

const { Text } = Typography;

interface ConferenceProfileTableProps {
  data: ConferenceProfile[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  canEditRow: boolean;
  canToggleRow: boolean;
  /** uuids of inline toggles still in flight — each Status cell ignores clicks until its own request settles. */
  pendingToggles: ReadonlySet<string>;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (profile: ConferenceProfile) => void;
  onToggleStatus: (profile: ConferenceProfile) => void;
  selectedRowKeys: string[];
  onSelectionChange: (selectedRowKeys: string[]) => void;
}

/** One-line text with an ellipsis and the full value in a tooltip (§5 Description render). */
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

/**
 * Columns per conference-profiles.md §5: Name, Status (inline toggle), Description, Actions (Edit
 * only — the module has no Delete or Copy). No Domain column: this module has no Show All (§15).
 * Name and Description are sortable, client-side on the loaded page, as in Axion; Status is not.
 */
const ConferenceProfileTable = ({
  data,
  loading,
  page,
  pageSize,
  total,
  canEditRow,
  canToggleRow,
  pendingToggles,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onToggleStatus,
  selectedRowKeys,
  onSelectionChange,
}: ConferenceProfileTableProps) => {
  const onRow = useStripedTableRow();
  const { token } = theme.useToken();

  const rowSelection: TableProps<ConferenceProfile>["rowSelection"] = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: (keys) => onSelectionChange(keys as string[]),
  };

  const columns: TableColumnsType<ConferenceProfile> = [
    {
      title: "Name",
      dataIndex: "profile_name",
      key: "profile_name",
      width: 220,
      ellipsis: true,
      render: renderTruncated,
      sorter: (a, b) => a.profile_name.localeCompare(b.profile_name),
    },
    {
      title: "Status",
      key: "profile_enabled",
      width: 140,
      render: (_, record) => {
        const isEnabled = record.profile_enabled;
        const clickable = canToggleRow && !pendingToggles.has(record.conference_profile_uuid);

        const toggle = () => {
          if (clickable) onToggleStatus(record);
        };

        return (
          // TODO: wrap with <PermissionGuard permission="conference.edit"> once RBAC is populated.
          <Tooltip title={canToggleRow ? `Click to ${isEnabled ? "disable" : "enable"}` : undefined}>
            <Tag
              role="button"
              tabIndex={canToggleRow ? 0 : -1}
              aria-disabled={!clickable}
              aria-label={`${record.profile_name} is ${isEnabled ? "enabled" : "disabled"}${canToggleRow ? ", click to toggle" : ""}`}
              icon={isEnabled ? <CheckCircleOutlined /> : <MinusCircleOutlined />}
              onClick={toggle}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle();
                }
              }}
              style={{
                cursor: clickable ? "pointer" : "not-allowed",
                opacity: canToggleRow ? 1 : 0.6,
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
              {conferenceProfileStatusLabels[isEnabled ? "enabled" : "disabled"]}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Description",
      dataIndex: "profile_description",
      key: "profile_description",
      width: 400,
      ellipsis: true,
      render: renderTruncated,
      sorter: (a, b) => (a.profile_description ?? "").localeCompare(b.profile_description ?? ""),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 80,
      render: (_, record) => (
        // TODO: wrap with <PermissionGuard permission="conference.edit"> once RBAC is populated.
        <Tooltip title="Edit">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined style={{ color: canEditRow ? token.colorPrimary : undefined }} />}
            disabled={!canEditRow}
            onClick={() => onEdit(record)}
            aria-label={`Edit conference profile ${record.profile_name}`}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <Table<ConferenceProfile>
      rowKey="conference_profile_uuid"
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
        showTotal: (count) => `${count} conference profiles`,
        onChange: (nextPage, nextSize) => (nextSize !== pageSize ? onPageSizeChange(nextSize) : onPageChange(nextPage)),
        responsive: true,
      }}
      scroll={{ x: 700 }}
      onRow={onRow}
    />
  );
};

export default ConferenceProfileTable;
