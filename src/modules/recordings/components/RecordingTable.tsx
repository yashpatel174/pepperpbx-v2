import { Button, Space, Table, theme, Tooltip, Typography } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import { CaretRightOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { defaultPageSize, pageSizeOptions } from "../recordings.constants";
import type { Recording } from "../recordings.types";
import useStripedTableRow from "../../../components/common/useStripedTableRow";

const { Text } = Typography;

interface RecordingTableProps {
  data: Recording[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  /** The Domain column is shown in Show All mode only (see the note on the column below). */
  showAll: boolean;
  canPlayRow: boolean;
  canEditRow: boolean;
  canDeleteRow: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onPlay: (recording: Recording) => void;
  onEdit: (recording: Recording) => void;
  onDelete: (recording: Recording) => void;
  selectedRowKeys: string[];
  onSelectionChange: (selectedRowKeys: string[]) => void;
}

const compareText = (a?: string, b?: string) => (a ?? "").localeCompare(b ?? "");

const SIZE_UNITS: Record<string, number> = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
/** `size` is a raw backend string (e.g. "312.4 KB"); sorting parses it, display never does. */
const sizeToBytes = (size: string): number => {
  const match = /^\s*([\d.]+)\s*([a-z]+)?/i.exec(size);
  if (!match) return 0;
  return Number(match[1]) * (SIZE_UNITS[(match[2] ?? "B").toUpperCase()] ?? 1);
};

const renderTruncated = (value?: string) =>
  value ? <Tooltip title={value}>{value}</Tooltip> : <Text type="secondary">—</Text>;

const RecordingTable = ({
  data,
  loading,
  page,
  pageSize,
  total,
  showAll,
  canPlayRow,
  canEditRow,
  canDeleteRow,
  onPageChange,
  onPageSizeChange,
  onPlay,
  onEdit,
  onDelete,
  selectedRowKeys,
  onSelectionChange,
}: RecordingTableProps) => {
  const onRow = useStripedTableRow();
  const { token } = theme.useToken();

  // System (default) recordings are not selectable (recordings.md §5/§26).
  const rowSelection: TableProps<Recording>["rowSelection"] = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: (keys) => onSelectionChange(keys as string[]),
    getCheckboxProps: (record) => ({ disabled: record.default }),
  };

  const columns: TableColumnsType<Recording> = [
    ...(showAll
      ? [
          {
            // Axion's Show All reveals no Domain column (recordings.md §15) — a gap its own notes
            // (§33) say to close, so rows from other domains are identifiable here.
            title: "Domain",
            dataIndex: "domain_name",
            key: "domain_name",
            sorter: (a: Recording, b: Recording) => compareText(a.domain_name, b.domain_name),
          },
        ]
      : []),
    {
      title: "Recording Name",
      dataIndex: "recording_name",
      key: "recording_name",
      width: 180,
      ellipsis: true,
      render: renderTruncated,
      sorter: (a, b) => compareText(a.recording_name, b.recording_name),
    },
    {
      title: "File Name",
      dataIndex: "recording_filename",
      key: "recording_filename",
      width: 180,
      ellipsis: true,
      render: renderTruncated,
      sorter: (a, b) => compareText(a.recording_filename, b.recording_filename),
    },
    {
      title: "File Size",
      dataIndex: "size",
      key: "size",
      render: (value?: string) => value ?? <Text type="secondary">—</Text>,
      sorter: (a, b) => sizeToBytes(a.size) - sizeToBytes(b.size),
    },
    {
      title: "Uploaded",
      dataIndex: "time",
      key: "time",
      render: (value?: string) => value ?? <Text type="secondary">—</Text>,
      sorter: (a, b) => compareText(a.time, b.time),
    },
    {
      title: "Description",
      dataIndex: "recording_description",
      key: "recording_description",
      width: 200,
      ellipsis: true,
      render: renderTruncated,
      sorter: (a, b) => compareText(a.recording_description, b.recording_description),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_, record) => {
        // System recordings render no actions at all, not disabled ones (recordings.md §3/§26).
        if (record.default) return null;
        return (
          <Space size="small">
            {/* TODO: wrap with <PermissionGuard permission="recordings.view"> once RBAC permissions are populated from the backend. */}
            <Tooltip title="Play">
              <Button
                type="text"
                size="large"
                icon={<CaretRightOutlined style={{ color: token.colorSuccess, fontSize: 20 }} />}
                disabled={!canPlayRow}
                onClick={() => onPlay(record)}
                aria-label={`Play recording ${record.recording_name}`}
              />
            </Tooltip>
            {/* TODO: wrap with <PermissionGuard permission="recordings.edit"> once RBAC permissions are populated from the backend. */}
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined style={{ color: token.colorPrimary }} />}
                disabled={!canEditRow}
                onClick={() => onEdit(record)}
                aria-label={`Edit recording ${record.recording_name}`}
              />
            </Tooltip>
            {/* TODO: wrap with <PermissionGuard permission="recordings.manage"> once RBAC permissions are populated from the backend. */}
            <Tooltip title="Delete">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={!canDeleteRow}
                onClick={() => onDelete(record)}
                aria-label={`Delete recording ${record.recording_name}`}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <Table<Recording>
      rowKey="recording_uuid"
      showSorterTooltip={false}
      columns={columns}
      dataSource={data}
      loading={loading}
      rowSelection={rowSelection}
      onRow={onRow}
      pagination={{
        current: page,
        pageSize,
        total,
        defaultPageSize,
        showSizeChanger: true,
        pageSizeOptions: pageSizeOptions.map(String),
        locale: { items_per_page: "per page" },
        showTotal: (count) => `${count} recordings`,
        onChange: (nextPage, nextSize) => {
          if (nextSize !== pageSize) onPageSizeChange(nextSize);
          else onPageChange(nextPage);
        },
      }}
      scroll={{ x: "max-content" }}
    />
  );
};

export default RecordingTable;
