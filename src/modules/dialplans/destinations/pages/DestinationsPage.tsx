import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { App, Alert, Button, Select, Space, Switch, Tooltip, Typography } from "antd";
import { DownloadOutlined, PlusOutlined, UndoOutlined, UploadOutlined } from "@ant-design/icons";
import ErrorState from "../../../../components/feedback/ErrorState";
import LoadingState from "../../../../components/feedback/LoadingState";
import EmptyState from "../../../../components/feedback/EmptyState";
import PermissionDenied from "../../../../components/feedback/PermissionDenied";
import ModuleHeader from "../../../../components/common/ModuleHeader";
import DestinationFilters from "../components/DestinationFilters";
import DestinationTable from "../components/DestinationTable";
import DeleteDestinationModal from "../components/DeleteDestinationModal";
import type { DeleteTarget } from "../components/DeleteDestinationModal";
import CopyDestinationModal from "../components/CopyDestinationModal";
import ImportDestinationModal from "../components/ImportDestinationModal";
import ExportDestinationModal from "../components/ExportDestinationModal";
import { destinationStatusLabels, typeOptions } from "../destination.constants";
import {
  copyDestination,
  exportDestinations,
  getHiveDestinationDetails,
  importDestinations,
} from "../destination.service";
import { useDestinations } from "../useDestinations";
import useDestinationPermissions from "../useDestinationPermissions";
import type {
  Destination,
  DestinationType,
  ImportDestinationOptions,
  ImportDestinationResult,
} from "../destination.types";
import { getApiErrorMessage } from "../../../../services/api/apiError";

type BulkAction = "delete";

interface ImportSummaryState {
  imported: number;
  skipped: number;
}

const escapeCsvValue = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

const typeLabelByValue = Object.fromEntries(typeOptions.map((option) => [option.value, option.label])) as Record<
  DestinationType,
  string
>;

/**
 * Maps GET /api/destinations/fields' backend key names to this module's own Destination entity
 * fields, for the export field keys that have a direct correspondent — the mock exportDestinations()
 * still returns the lean Destination shape (see destination.service.ts), not the full backend
 * record, so a backend field with no equivalent here (e.g. fax_uuid, destination_app) is left
 * unmapped and silently dropped from the CSV, same as any other unrecognized key.
 */
const backendExportFieldAliases: Record<string, string> = {
  domain_uuid: "domain",
  destination_type: "type",
  destination_prefix: "prefix",
  destination_number: "destination",
  destination_context: "context",
  destination_description: "description",
  destination_enabled: "enabled",
};

const exportDestinationsToCsv = (destinations: Destination[], fieldKeys: string[]) => {
  const fieldMeta: Record<string, { label: string; get: (d: Destination) => string }> = {
    domain: { label: "Domain", get: (d) => d.domain },
    type: { label: "Type", get: (d) => typeLabelByValue[d.type] ?? d.type },
    prefix: { label: "Country Code", get: (d) => d.prefix ?? "" },
    destination: { label: "Destination", get: (d) => d.destination },
    destinationActions: { label: "Destination Actions", get: (d) => d.destinationActions ?? "" },
    context: { label: "Context", get: (d) => d.context ?? "" },
    description: { label: "Description", get: (d) => d.description ?? "" },
    enabled: { label: "Status", get: (d) => destinationStatusLabels[d.enabled ? "enabled" : "disabled"] },
  };

  const selectedFields = fieldKeys
    .map((key) => backendExportFieldAliases[key] ?? key)
    .filter((key) => key in fieldMeta);
  const headers = selectedFields.map((key) => fieldMeta[key].label);
  const rows = destinations.map((destination) => selectedFields.map((key) => fieldMeta[key].get(destination)));

  const csv = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  // Fixed filename, matching the Axion reference (destinations.md §22).
  link.download = "DestinationData.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const DestinationsPage = () => {
  const {
    data,
    loading,
    error,
    totalRecords,
    page,
    pageSize,
    showAll,
    destinationType,
    searchTerm,
    committedSearch,
    setSearchTerm,
    commitSearch,
    setPage,
    setPageSize,
    setShowAll,
    resetFilters,
    refresh,
    removeDestinations,
    toggleDestinationStatus,
  } = useDestinations();

  const { canManage } = useDestinationPermissions();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedDestinationIds, setSelectedDestinationIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkAction | undefined>(undefined);
  const [deleteTargets, setDeleteTargets] = useState<DeleteTarget[] | null>(null);
  // Whether the open delete modal came from the bulk toolbar (vs a row's Delete button).
  const [deleteIsBulk, setDeleteIsBulk] = useState(false);

  const [copyTarget, setCopyTarget] = useState<Destination | null>(null);
  const [copySuggestedNumber, setCopySuggestedNumber] = useState("");
  const [copySubmitting, setCopySubmitting] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [importSubmitting, setImportSubmitting] = useState(false);

  const [exportOpen, setExportOpen] = useState(false);
  const [exportSubmitting, setExportSubmitting] = useState(false);

  const [importSummary, setImportSummary] = useState<ImportSummaryState | null>(
    (location.state as { importSummary?: ImportSummaryState } | null)?.importSummary ?? null,
  );

  // Clear the navigation state once read, so a refresh/back-navigation doesn't re-show the banner.
  useEffect(() => {
    if (importSummary) {
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasSelection = selectedDestinationIds.length > 0;

  useEffect(() => {
    if (selectedDestinationIds.length === 0) setBulkAction(undefined);
  }, [selectedDestinationIds]);

  // Accumulates destination-number labels across every page this session has fetched (reusing the
  // same `data` the table already renders — no extra request). A row can only ever be selected
  // after appearing in `data` at least once, so by the time a bulk delete is confirmed, every
  // selected id's label is already known here even if that row's page isn't the one currently loaded.
  const destinationLabelByIdRef = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    data.forEach((destination) => {
      destinationLabelByIdRef.current.set(destination.id, destination.destination);
    });
  }, [data]);

  const clearSelection = () => {
    setSelectedDestinationIds([]);
    setBulkAction(undefined);
  };

  const handleAdd = () => navigate("/dialplans/destinations/add");
  const handleEdit = (destination: Destination) => navigate(`/dialplans/destinations/${destination.id}/edit`);

  const handleCopyClick = async (destination: Destination) => {
    setCopyTarget(destination);
    try {
      const hive = await getHiveDestinationDetails(destination.domain);
      setCopySuggestedNumber(hive.autoDestinationNumber);
    } catch {
      setCopySuggestedNumber("");
    }
  };

  const handleCopyConfirm = async (newDestinationNumber: string) => {
    if (!copyTarget) return;
    setCopySubmitting(true);
    try {
      await copyDestination(copyTarget.id, newDestinationNumber);
      message.success(`Destination "${copyTarget.destination}" copied successfully.`);
      setCopyTarget(null);
      await refresh();
      clearSelection();
    } catch (err) {
      message.error(getApiErrorMessage(err, `Failed to copy destination ${copyTarget.destination}.`));
    } finally {
      setCopySubmitting(false);
    }
  };

  const handleDeleteRequest = (destination: Destination) => {
    setDeleteIsBulk(false);
    setDeleteTargets([{ id: destination.id, destination: destination.destination }]);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargets) return;
    const ids = deleteTargets.map((target) => target.id);
    await removeDestinations(ids);
    message.success(ids.length === 1 ? `Destination "${deleteTargets[0].destination}" deleted successfully.` : `${ids.length} destinations deleted.`);
    setDeleteTargets(null);
    // Drop only the deleted ids — a single-row delete keeps the rest of a multi-page selection.
    setSelectedDestinationIds((selected) => selected.filter((id) => !ids.includes(id)));
    setDeleteIsBulk(false);
  };

  const handleDeleteCancel = () => {
    setDeleteTargets(null);
    // Cancelling a bulk delete clears the selection; cancelling a row's Delete leaves it alone.
    if (deleteIsBulk) clearSelection();
    setDeleteIsBulk(false);
  };

  // Inline pill acts immediately, no confirmation — mirrors Extensions' handleToggleStatus
  // (ExtensionsPage.tsx), distinct from the confirmed bulk-action flows below.
  const handleToggleStatus = async (destination: Destination) => {
    const target = !destination.enabled;
    try {
      await toggleDestinationStatus(destination.id, target);
      message.success(`Destination "${destination.destination}" ${target ? "enabled" : "disabled"} successfully.`);
    } catch (err) {
      message.error(getApiErrorMessage(err, `Failed to update destination ${destination.destination}.`));
    }
  };

  const handleApplyBulkAction = () => {
    if (bulkAction !== "delete" || selectedDestinationIds.length === 0) return;
    // Row selection is preserved across pages (preserveSelectedRowKeys), so a selection can span
    // pages the table isn't currently showing. The delete targets must come from the full
    // selectedDestinationIds list, not from `data` (only the current page) — otherwise IDs
    // selected on another page would be silently dropped from the delete. The friendly label comes
    // from destinationLabelByIdRef (accumulated across every page fetched this session, see
    // above), falling back to the raw id only if a selected destination was somehow never fetched.
    setDeleteIsBulk(true);
    setDeleteTargets(
      selectedDestinationIds.map((id) => ({ id, destination: destinationLabelByIdRef.current.get(id) ?? id })),
    );
  };

  const handleImportSubmit = async (file: File, options: ImportDestinationOptions) => {
    setImportSubmitting(true);
    try {
      const result: ImportDestinationResult = await importDestinations(file, options);
      setImportOpen(false);
      navigate("/dialplans/destinations/import-match", { state: { result } });
    } catch (err) {
      message.error(getApiErrorMessage(err, "Failed to import CSV file."));
    } finally {
      setImportSubmitting(false);
    }
  };

  const handleExportSubmit = async (fields: string[]) => {
    setExportSubmitting(true);
    try {
      const rows = await exportDestinations({ showAll, search: committedSearch, destinationType, fields });
      if (rows.length === 0) {
        message.warning("No destinations to export.");
        return;
      }
      exportDestinationsToCsv(rows, fields);
      setExportOpen(false);
    } catch {
      message.error("Failed to export destinations.");
    } finally {
      setExportSubmitting(false);
    }
  };

  const selectionToolbar = (
    <Space size="middle" wrap>
      <Typography.Text>You have selected {selectedDestinationIds.length} rows</Typography.Text>
      <Select<BulkAction>
        placeholder="Select Action"
        style={{ width: 160 }}
        value={bulkAction}
        onChange={setBulkAction}
        options={[{ value: "delete", label: "Delete" }]}
        aria-label="Select action"
      />
      <Button type="primary" disabled={!bulkAction} onClick={handleApplyBulkAction}>
        Apply
      </Button>
    </Space>
  );

  if (error) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  if (loading && data.length === 0) {
    return <LoadingState rows={10} />;
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      {importSummary && (
        <Alert
          type="success"
          showIcon
          closable={{ onClose: () => setImportSummary(null) }}
          title={`Import complete: ${importSummary.imported} destination${importSummary.imported === 1 ? "" : "s"} imported${
            importSummary.skipped
              ? `, ${importSummary.skipped} row${importSummary.skipped === 1 ? "" : "s"} skipped`
              : ""
          }.`}
        />
      )}

      <ModuleHeader
        title="Destinations"
        count={totalRecords}
        // Add/Import/Export/Search/Show All/Reset are only meaningful once the user can actually
        // manage destinations — per destinations.md §14/§25, an unauthorized user sees just the
        // title while the whole toolbar (not only the table) is replaced by PermissionDenied below.
        primaryAction={
          canManage
            ? {
                key: "add",
                // TODO: wrap with <PermissionGuard permission="destination.create"> once RBAC
                // permissions are populated from the backend.
                label: "Add Destination",
                icon: <PlusOutlined />,
                onClick: handleAdd,
              }
            : undefined
        }
        actions={
          canManage
            ? [
                // TODO: wrap with <PermissionGuard permission="destination.import"> once RBAC
                // permissions are populated from the backend.
                { key: "import", label: "Import", icon: <UploadOutlined />, onClick: () => setImportOpen(true) },
                // TODO: wrap with <PermissionGuard permission="destination.export"> once RBAC
                // permissions are populated from the backend.
                { key: "export", label: "Export", icon: <DownloadOutlined />, onClick: () => setExportOpen(true) },
              ]
            : undefined
        }
        filters={
          canManage ? (
            <>
              <Tooltip title="Reset filters">
                <Button icon={<UndoOutlined />} onClick={resetFilters} aria-label="Reset filters" />
              </Tooltip>

              <DestinationFilters value={searchTerm} onChange={setSearchTerm} onSearch={commitSearch} />

              <Tooltip title="Show destinations across all accessible domains">
                <Space size="small">
                  <Switch checked={showAll} onChange={setShowAll} size="small" aria-label="Show all destinations" />
                  <span>Show All</span>
                </Space>
              </Tooltip>
            </>
          ) : undefined
        }
        toolbar={hasSelection ? selectionToolbar : undefined}
      />

      {!canManage ? (
        <PermissionDenied />
      ) : totalRecords === 0 ? (
        <EmptyState description={committedSearch ? "No destinations match your search." : "No destinations found."} />
      ) : (
        <DestinationTable
          data={data}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={totalRecords}
          showAll={showAll}
          canManage={canManage}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={handleEdit}
          onCopy={handleCopyClick}
          onDelete={handleDeleteRequest}
          onToggleStatus={handleToggleStatus}
          selectedRowKeys={selectedDestinationIds}
          onSelectionChange={setSelectedDestinationIds}
        />
      )}

      <DeleteDestinationModal
        open={!!deleteTargets}
        targets={deleteTargets ?? []}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <CopyDestinationModal
        open={!!copyTarget}
        target={copyTarget}
        suggestedNumber={copySuggestedNumber}
        submitting={copySubmitting}
        onSubmit={handleCopyConfirm}
        onCancel={() => setCopyTarget(null)}
      />

      <ImportDestinationModal
        open={importOpen}
        submitting={importSubmitting}
        onSubmit={handleImportSubmit}
        onCancel={() => setImportOpen(false)}
      />

      <ExportDestinationModal
        open={exportOpen}
        submitting={exportSubmitting}
        onSubmit={handleExportSubmit}
        onCancel={() => setExportOpen(false)}
      />
    </Space>
  );
};

export default DestinationsPage;
