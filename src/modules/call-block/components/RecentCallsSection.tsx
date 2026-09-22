import { useCallback, useEffect, useState } from "react";
import { App, Button, Card, Select, Space, Table, Tooltip, Typography } from "antd";
import type { TableColumnsType } from "antd";
import ErrorState from "../../../components/feedback/ErrorState";
import EmptyState from "../../../components/feedback/EmptyState";
import { callBlockDirectionIconSrc, callBlockDirectionOptions, recentCallsPageSize } from "../call-block.constants";
import { blockRecentCalls, fetchRecentCalls } from "../call-block.service";
import type { CallBlockDirection, RecentCall, SelectOption } from "../call-block.types";

const { Text } = Typography;

interface RecentCallsSectionProps {
  domainName: string;
  name?: string;
  number?: string;
  extensionOptions: SelectOption[];
  actionOptions: SelectOption[];
  disabled?: boolean;
}

const renderOptionalText = (value?: string) => value || <Text type="secondary">—</Text>;

/**
 * INTENTIONAL FIX vs the Axion reference: the audit documents the "Called" column showing the
 * raw `start_epoch` value with no date formatting applied (call-block.md §5/§27/§28 — flagged as
 * a "potential issue"). PepperPBX formats it, matching the main list's own Date Added column
 * (same native `Intl` approach, no new date-library dependency).
 */
const dateTimeFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const formatEpochSeconds = (epoch: number): string => dateTimeFormatter.format(new Date(epoch * 1000));

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
};

/**
 * Edit-only "Recent Calls" sub-table (call-block.md §3/§5/§9/§21/§26/§33) — a paginated list of
 * recent call-log entries matching this block's domain + name/number, with a bulk "Block" action
 * (select rows → choose Direction/Extension/Action → Block). Distinct dataset from the Call Block
 * list itself; kept as page-scoped local state here (not a separate reusable hook) since it's a
 * self-contained sub-feature of the Edit screen, not reused elsewhere in the module — matches
 * README's "don't build abstractions ahead of real repetition" rule.
 */
const RecentCallsSection = ({
  domainName,
  name,
  number,
  extensionOptions,
  actionOptions,
  disabled,
}: RecentCallsSectionProps) => {
  const { message } = App.useApp();
  const [data, setData] = useState<RecentCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [blockDirection, setBlockDirection] = useState<CallBlockDirection | undefined>(undefined);
  const [blockExtension, setBlockExtension] = useState<string | undefined>(undefined);
  const [blockAction, setBlockAction] = useState<string | undefined>(undefined);
  const [blocking, setBlocking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRecentCalls({ page, pageSize: recentCallsPageSize, domainName, name, number });
      setData(result.data);
      setTotalRecords(result.total_records);
    } catch {
      setError("Failed to load recent calls.");
    } finally {
      setLoading(false);
    }
  }, [page, domainName, name, number]);

  useEffect(() => {
    load();
  }, [load]);

  const resetBlockSelections = () => {
    setSelectedIds([]);
    setBlockDirection(undefined);
    setBlockExtension(undefined);
    setBlockAction(undefined);
  };

  // The Block action needs a target direction/extension/action to submit, same as the selected
  // rows (call-block.md §3/§21/§33: "select rows → choose direction/extension/action → Block") —
  // requiring all three non-empty before enabling Block is the sensible default the audit implies.
  const canBlock = selectedIds.length > 0 && !!blockDirection && !!blockExtension && !!blockAction;

  const handleBlock = async () => {
    if (!blockDirection || !blockExtension || !blockAction) return;
    setBlocking(true);
    try {
      await blockRecentCalls({ direction: blockDirection, extensionUuid: blockExtension, action: blockAction, uuids: selectedIds });
      message.success(`${selectedIds.length} call${selectedIds.length === 1 ? "" : "s"} blocked.`);
      resetBlockSelections();
      await load();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to block selected calls.");
    } finally {
      setBlocking(false);
    }
  };

  const columns: TableColumnsType<RecentCall> = [
    {
      title: "Direction",
      dataIndex: "direction",
      key: "direction",
      width: 90,
      render: (value: CallBlockDirection) => {
        const label = value === "outbound" ? "Outbound" : "Inbound";
        return (
          <Tooltip title={label}>
            <img src={callBlockDirectionIconSrc(value)} alt={label} style={{ width: 16, height: 16, objectFit: "contain" }} />
          </Tooltip>
        );
      },
    },
    { title: "Name", dataIndex: "callerIdName", key: "callerIdName", render: renderOptionalText },
    { title: "Number", dataIndex: "callerIdNumber", key: "callerIdNumber", render: renderOptionalText },
    { title: "Destination", dataIndex: "destination", key: "destination", render: renderOptionalText },
    {
      title: "Called",
      dataIndex: "startEpoch",
      key: "startEpoch",
      render: (value: number) => formatEpochSeconds(value),
    },
    { title: "Duration", dataIndex: "duration", key: "duration", render: (value: number) => formatDuration(value) },
  ];

  return (
    <Card title="Recent Calls">
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
          {selectedIds.length > 0 && (
            <Space size="middle" wrap>
              <Typography.Text>You have selected {selectedIds.length} calls</Typography.Text>
              <Select<CallBlockDirection>
                placeholder="Direction"
                style={{ width: 140 }}
                value={blockDirection}
                onChange={setBlockDirection}
                options={callBlockDirectionOptions}
                disabled={disabled || blocking}
                aria-label="Block direction"
              />
              <Select<string>
                placeholder="Extension"
                style={{ width: 180 }}
                value={blockExtension}
                onChange={setBlockExtension}
                options={extensionOptions}
                showSearch
                optionFilterProp="label"
                disabled={disabled || blocking}
                aria-label="Block extension"
              />
              <Select<string>
                placeholder="Action"
                style={{ width: 160 }}
                value={blockAction}
                onChange={setBlockAction}
                options={actionOptions}
                showSearch
                optionFilterProp="label"
                disabled={disabled || blocking}
                aria-label="Block action"
              />
              <Button type="primary" disabled={!canBlock || disabled} loading={blocking} onClick={handleBlock}>
                Block
              </Button>
            </Space>
          )}

          {!loading && totalRecords === 0 ? (
            <EmptyState description="No recent calls found." />
          ) : (
            <Table<RecentCall>
              rowKey="id"
              showSorterTooltip={false}
              columns={columns}
              dataSource={data}
              loading={loading}
              rowSelection={{
                selectedRowKeys: selectedIds,
                preserveSelectedRowKeys: true,
                getCheckboxProps: () => ({ disabled }),
                onChange: (keys) => setSelectedIds(keys as string[]),
              }}
              pagination={{
                current: page,
                pageSize: recentCallsPageSize,
                total: totalRecords,
                showSizeChanger: false,
                onChange: setPage,
              }}
              scroll={{ x: 700 }}
            />
          )}
        </Space>
      )}
    </Card>
  );
};

export default RecentCallsSection;
