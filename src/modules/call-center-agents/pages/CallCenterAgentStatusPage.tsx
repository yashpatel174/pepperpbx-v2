import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { App, Button, Radio, Space, Switch, Table, Tooltip, theme } from "antd";
import type { TableColumnsType } from "antd";
import { ArrowLeftOutlined, ReloadOutlined } from "@ant-design/icons";

import ModuleHeader from "../../../components/common/ModuleHeader";
import LoadingState from "../../../components/feedback/LoadingState";
import EmptyState from "../../../components/feedback/EmptyState";
import ErrorState from "../../../components/feedback/ErrorState";
import PermissionDenied from "../../../components/feedback/PermissionDenied";

import { fetchAgentStatuses, updateAgentStatuses } from "../call-center-agents.service";

import { agentStatusOptions } from "../call-center-agents.constants";
import useCallCenterAgentPermissions from "../useCallCenterAgentPermissions";

import type { AgentStatus, AgentStatusEntry } from "../call-center-agents.types";

const CallCenterAgentStatusPage = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const { canManage } = useCallCenterAgentPermissions();

  const [rows, setRows] = useState<AgentStatusEntry[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const originalByUuidRef = useRef<Map<string, AgentStatus>>(new Map());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const entries = await fetchAgentStatuses(showAll);

      setRows(entries);

      originalByUuidRef.current = new Map(entries.map((entry) => [entry.call_center_agent_uuid, entry.status]));
    } catch {
      setError("Failed to load call center agent statuses.");
    } finally {
      setLoading(false);
    }
  }, [showAll]);

  useEffect(() => {
    load();
  }, [load]);

  const handleBack = () => {
    navigate("/call-center/agents");
  };

  // Matches Extensions' own Refresh pattern (ExtensionsPage.tsx's handleRefresh) — re-fetches
  // through the existing `load()` boundary (respecting the current `showAll`), which already
  // rebuilds `originalByUuidRef` from the freshly-fetched data, so Save's diff logic never
  // compares against stale pre-refresh values. `refreshing` only drives the button's own spinner;
  // it never bypasses or duplicates `load()`'s own loading state.
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const handleStatusChange = (agentUuid: string, status: AgentStatus) => {
    setRows((prev) =>
      prev.map((row) =>
        row.call_center_agent_uuid === agentUuid
          ? {
              ...row,
              status,
            }
          : row,
      ),
    );
  };

  const handleSave = async () => {
    const changed = rows.filter((row) => originalByUuidRef.current.get(row.call_center_agent_uuid) !== row.status);

    if (changed.length === 0) {
      message.info("No status changes to save.");
      return;
    }

    setSaving(true);

    try {
      await updateAgentStatuses(
        changed.map((row) => ({
          call_center_agent_uuid: row.call_center_agent_uuid,
          status: row.status,
        })),
      );

      message.success(`${changed.length} agent status${changed.length === 1 ? "" : "es"} updated.`);

      await load();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to update agent statuses.");
    } finally {
      setSaving(false);
    }
  };

  const columns: TableColumnsType<AgentStatusEntry> = [
    {
      title: "Agent Name",
      dataIndex: "agent_name",
      key: "agent_name",

      // Matches the screenshot: Agent Name takes roughly 31%.
      width: showAll ? "25%" : "31%",

      fixed: "left",
    },

    {
      title: "Status",
      key: "status",

      // Remaining table width.
      width: showAll ? "50%" : "69%",

      render: (_, record) => (
        <Radio.Group
          value={record.status}
          disabled={!canManage || saving}
          onChange={(event) => handleStatusChange(record.call_center_agent_uuid, event.target.value as AgentStatus)}
        >
          <Space
            size={16}
            wrap
            style={{
              rowGap: 6,
            }}
          >
            {agentStatusOptions.map((option) => (
              <Radio key={option.value} value={option.value}>
                {option.label}
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      ),
    },
    ...(showAll
      ? [
          {
            title: "Domain Name",
            dataIndex: "domain",
            key: "domain",
            width: "25%",
          },
        ]
      : []),
  ];

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <ModuleHeader
        title={`Agent Status (${rows.length})`}
        toolbar={
          <div
            style={{
              width: "100%",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Space wrap>
              <Button type="primary" icon={<ArrowLeftOutlined />} onClick={handleBack}>
                Back
              </Button>

              <Tooltip title="Refresh">
                <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={refreshing} aria-label="Refresh call center agent statuses" />
              </Tooltip>

              {canManage && (
                <Tooltip title="Show call center agents across all accessible domains">
                  <Space size="small">
                    <Switch checked={showAll} onChange={setShowAll} size="small" aria-label="Show all call center agents" />
                    <span>Show All</span>
                  </Space>
                </Tooltip>
              )}
            </Space>

            {canManage && (
              <Button type="primary" onClick={handleSave} loading={saving} disabled={loading || rows.length === 0}>
                Save
              </Button>
            )}
          </div>
        }
      />

      {!canManage ? (
        <PermissionDenied />
      ) : loading && rows.length === 0 ? (
        <LoadingState rows={7} />
      ) : rows.length === 0 ? (
        <EmptyState description="No call center agents found." />
      ) : (
        <Table<AgentStatusEntry>
          rowKey="call_center_agent_uuid"
          columns={columns}
          dataSource={rows}
          loading={loading}
          pagination={false}
          size="middle"
          tableLayout="fixed"
          scroll={{
            x: showAll ? 1000 : 800,
          }}
          onRow={(_, index) => ({
            style: {
              height: 56,
              backgroundColor: index !== undefined && index % 2 === 1 ? token.colorFillAlter : undefined,
            },
          })}
        />
      )}
    </Space>
  );
};

export default CallCenterAgentStatusPage;
