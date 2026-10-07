import { Button, Table, theme, Tooltip, Typography } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { conferenceControlStatusLabels, pageSizeOptions } from "../conference-control.constants";
import type { ConferenceControl } from "../conference-control.types";
import useStripedTableRow from "../../../components/common/useStripedTableRow";
import StatusToggleTag from "../../../components/common/StatusToggleTag";

const { Text } = Typography;

interface ConferenceControlTableProps {
  data: ConferenceControl[];
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
  onEdit: (control: ConferenceControl) => void;
  onToggleStatus: (control: ConferenceControl) => void;
  selectedRowKeys: string[];
  onSelectionChange: (selectedRowKeys: string[]) => void;
}

const renderTruncated = (value?: string) =>
  value ? (
    <Tooltip title={value}>
      <span
        style={{
          display: "block",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
    </Tooltip>
  ) : (
    <Text type="secondary">—</Text>
  );

/**
 * Columns per conference-controls.md §5: Name, Status (inline toggle),
 * Description, Actions (Edit only — the module has no Delete or Copy).
 * No Domain column: this module has no Show All (§15).
 * Only Name is sortable, client-side on the loaded page, as in Axion.
 */
const ConferenceControlTable = ({
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
}: ConferenceControlTableProps) => {
  const onRow = useStripedTableRow();
  const { token } = theme.useToken();

  const rowSelection: TableProps<ConferenceControl>["rowSelection"] = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: (keys) => onSelectionChange(keys as string[]),
  };

  const columns: TableColumnsType<ConferenceControl> = [
    {
      title: "Name",
      dataIndex: "control_name",
      key: "control_name",
      width: 220,
      ellipsis: true,
      render: renderTruncated,
      sorter: (a, b) => a.control_name.localeCompare(b.control_name),
    },
    {
      title: "Status",
      key: "control_enabled",
      width: 140,
      render: (_, record) => {
        const isEnabled = record.control_enabled;
        const clickable = canToggleRow && !pendingToggles.has(record.conference_control_uuid);

        const toggle = () => {
          if (clickable) {
            onToggleStatus(record);
          }
        };

        return (
          // TODO: wrap with <PermissionGuard permission="conference.edit">
          // once RBAC is populated.
          <StatusToggleTag
            enabled={isEnabled}
            tooltip={canToggleRow ? `Click to ${isEnabled ? "disable" : "enable"}` : undefined}
            role="button"
            tabIndex={canToggleRow ? 0 : -1}
            aria-disabled={!clickable}
            aria-label={`${record.control_name} is ${
              isEnabled ? "enabled" : "disabled"
            }${canToggleRow ? ", click to toggle" : ""}`}
            onClick={toggle}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle();
              }
            }}
          >
            {conferenceControlStatusLabels[isEnabled ? "enabled" : "disabled"]}
          </StatusToggleTag>
        );
      },
    },
    {
      title: "Description",
      dataIndex: "control_description",
      key: "control_description",
      width: 400,
      ellipsis: true,
      render: (value?: string) =>
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
        ),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 80,
      render: (_, record) => (
        // TODO: wrap with <PermissionGuard permission="conference.edit">
        // once RBAC is populated.
        <Tooltip title="Edit">
          <Button
            type="text"
            size="small"
            icon={
              <EditOutlined
                style={{
                  color: canEditRow ? token.colorPrimary : undefined,
                }}
              />
            }
            disabled={!canEditRow}
            onClick={() => onEdit(record)}
            aria-label={`Edit conference control ${record.control_name}`}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <Table<ConferenceControl>
      rowKey="conference_control_uuid"
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
        showTotal: (count) => `${count} conference controls`,
        onChange: (nextPage, nextSize) => (nextSize !== pageSize ? onPageSizeChange(nextSize) : onPageChange(nextPage)),
        responsive: true,
      }}
      scroll={{ x: 700 }}
      onRow={onRow}
    />
  );
};

export default ConferenceControlTable;
