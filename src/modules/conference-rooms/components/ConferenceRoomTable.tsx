import { Button, Space, Table, theme, Tooltip, Typography } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { conferenceRoomStatusLabels, conferenceRoomToggleFields, pageSizeOptions } from "../conference-room.constants";
import type { ConferenceRoom, ConferenceRoomToggleKey } from "../conference-room.types";
import useStripedTableRow from "../../../components/common/useStripedTableRow";
import StatusToggleTag from "../../../components/common/StatusToggleTag";

const { Text } = Typography;

interface ConferenceRoomTableProps {
  data: ConferenceRoom[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  showAll: boolean;
  canEditRow: boolean;
  canToggleRow: boolean;
  canDeleteRow: boolean;
  /** `${uuid}:${field}` keys of inline toggles still in flight — each cell ignores clicks until its own request settles. */
  pendingToggles: ReadonlySet<string>;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (room: ConferenceRoom) => void;
  onDelete: (room: ConferenceRoom) => void;
  onToggleField: (room: ConferenceRoom, field: ConferenceRoomToggleKey, label: string) => void;
  selectedRowKeys: string[];
  onSelectionChange: (selectedRowKeys: string[]) => void;
}

const compareOptional = (a?: string, b?: string) => (a ?? "").localeCompare(b ?? "");

const renderTruncated = (value?: string) =>
  value ? <Tooltip title={value}>{value}</Tooltip> : <Text type="secondary">—</Text>;

/**
 * Columns per conference-rooms.md §5: Domain (Show All only), Name, Moderator PIN, Participant PIN,
 * the seven inline toggles, Description, Actions (Edit/Delete — no Copy, the module has none).
 * Only the first four are sortable, client-side on the loaded page, as in Axion.
 */
const ConferenceRoomTable = ({
  data,
  loading,
  page,
  pageSize,
  total,
  showAll,
  canEditRow,
  canToggleRow,
  canDeleteRow,
  pendingToggles,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onToggleField,
  selectedRowKeys,
  onSelectionChange,
}: ConferenceRoomTableProps) => {
  const onRow = useStripedTableRow();
  const { token } = theme.useToken();

  const rowSelection: TableProps<ConferenceRoom>["rowSelection"] = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: (keys) => onSelectionChange(keys as string[]),
  };

  /** One click flips the flag — no confirmation (§3/§5). Same status-tag look as every sibling module. */
  const toggleColumns: TableColumnsType<ConferenceRoom> = conferenceRoomToggleFields.map(({ key: field, label }) => ({
    title: label,
    key: field,
    width: field === "announce_recording" ? 170 : 140,
    render: (_: unknown, record: ConferenceRoom) => {
      const isEnabled = record[field];
      const clickable = canToggleRow && !pendingToggles.has(`${record.conference_room_uuid}:${field}`);
      const toggle = () => clickable && onToggleField(record, field, label);

      return (
        // TODO: wrap with <PermissionGuard permission="conference.edit"> once RBAC is populated.
        <StatusToggleTag
          enabled={isEnabled}
          tooltip={canToggleRow ? `Click to ${isEnabled ? "disable" : "enable"}` : undefined}
          role="button"
          tabIndex={canToggleRow ? 0 : -1}
          aria-disabled={!clickable}
          aria-label={`${label} is ${isEnabled ? "enabled" : "disabled"} for ${record.conference_room_name}${canToggleRow ? ", click to toggle" : ""}`}
          onClick={toggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggle();
            }
          }}
          style={{ cursor: canToggleRow ? "pointer" : "not-allowed", opacity: canToggleRow ? 1 : 0.6 }}
        >
          {conferenceRoomStatusLabels[isEnabled ? "enabled" : "disabled"]}
        </StatusToggleTag>
      );
    },
  }));

  const columns: TableColumnsType<ConferenceRoom> = [
    ...(showAll
      ? [
          {
            title: "Domain",
            dataIndex: "domain_name",
            key: "domain_name",
            ellipsis: true,
            render: renderTruncated,
            sorter: (a: ConferenceRoom, b: ConferenceRoom) => a.domain_name.localeCompare(b.domain_name),
          },
        ]
      : []),
    {
      title: "Name",
      dataIndex: "conference_room_name",
      key: "conference_room_name",
      ellipsis: true,
      render: renderTruncated,
      sorter: (a, b) => a.conference_room_name.localeCompare(b.conference_room_name),
    },
    {
      title: "Moderator",
      dataIndex: "moderator_pin",
      key: "moderator_pin",
      // width: 140,
      ellipsis: true,
      render: renderTruncated,
      sorter: (a, b) => compareOptional(a.moderator_pin, b.moderator_pin),
    },
    {
      title: "Participant",
      dataIndex: "participant_pin",
      key: "participant_pin",
      // width: 140,
      ellipsis: true,
      render: renderTruncated,
      sorter: (a, b) => compareOptional(a.participant_pin, b.participant_pin),
    },
    ...toggleColumns,
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: 150,
      render: (value?: string) =>
        value ? (
          <Tooltip title={value}>
            <div
              style={{
                width: "150px",
                maxWidth: "150px",
                maxHeight: "60px",
                overflowX: "auto",
                overflowY: "auto",
                whiteSpace: "nowrap",
                paddingRight: 4,
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
      width: 90,
      render: (_, record) => (
        <Space size="small">
          {/* TODO: wrap with <PermissionGuard permission="conference.edit"> once RBAC is populated. */}
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: token.colorPrimary }} />}
              disabled={!canEditRow}
              onClick={() => onEdit(record)}
              aria-label={`Edit conference room ${record.conference_room_name}`}
            />
          </Tooltip>
          {/* TODO: wrap with <PermissionGuard permission="conference.manage"> once RBAC is populated. */}
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={!canDeleteRow}
              onClick={() => onDelete(record)}
              aria-label={`Delete conference room ${record.conference_room_name}`}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table<ConferenceRoom>
      rowKey="conference_room_uuid"
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
        showTotal: (count) => `${count} conference rooms`,
        // One handler for both: a size change always returns to page 1 (the hook does that).
        onChange: (nextPage, nextSize) => (nextSize !== pageSize ? onPageSizeChange(nextSize) : onPageChange(nextPage)),
      }}
      scroll={{ x: "max-content" }}
      onRow={onRow}
    />
  );
};

export default ConferenceRoomTable;
