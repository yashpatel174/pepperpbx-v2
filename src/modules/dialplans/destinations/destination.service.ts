import {
  defaultPageSize,
  destinationCsvFieldKeys,
  exportFieldOptions,
  searchableDestinationFields,
} from "./destination.constants";
import {
  mockActionOptionsByDomain,
  mockDestinations as seedDestinations,
  mockFaxOptionsByDomain,
  mockHiveDestinationDetails,
  mockHoldMusicOptionsByDomain,
} from "./destination.mock";
import useDomainStore from "../../../store/domain";
import { request } from "../../../services/api/apiClient";
import { isMockMode } from "../../../services/auth/auth.mock";
import type {
  ActionOptionGroup,
  ActionOptionsResponse,
  Destination,
  DestinationDetails,
  DestinationFieldsResponse,
  DestinationFormValues,
  DestinationListQuery,
  DestinationListResponse,
  DestinationType,
  ExportFieldOption,
  HiveDestinationDetails,
  HoldMusicGroup,
  HoldMusicResponse,
  ImportDestinationOptions,
  ImportDestinationResult,
  ImportMatchResult,
  SelectOption,
} from "./destination.types";

/**
 * The service's own working copy of the mock dataset, stored in the rich create/update shape
 * (DestinationDetails) so create/update persist every form field. Kept private to this module
 * so destination.service.ts is the single mutation point for the mock "backend" — pages and
 * components never import destination.mock.ts directly. Resets on a real page reload since
 * it's just a re-evaluated module; no fake persistence across refresh.
 */
let destinations: DestinationDetails[] = seedDestinations.map((destination) => ({ ...destination }));

/** Projects the rich stored record back into the lean list/table entity. */
const toListDestination = (details: DestinationDetails): Destination => ({
  id: details.destination_uuid,
  domain: details.domain_name,
  type: details.destination_type,
  prefix: details.destination_prefix,
  destination: details.destination_number,
  destinationActions: details.destinationActionDisplay ?? details.destination_action,
  context: details.destination_context,
  description: details.destination_description,
  enabled: details.destination_enabled,
});

/**
 * The domain the list should default to when no explicit domain scope is requested. Reads the
 * global current-domain store (PepperPBX's multi-tenancy placeholder — reused as-is, never
 * modified by this module) and falls back to the mock's default domain until
 * getHiveDestinationDetails() has populated the store.
 */
const getCurrentDomainName = (): string =>
  useDomainStore.getState().currentDomain?.name ?? mockHiveDestinationDetails.defaultDomain;

const cloneDetails = (details: DestinationDetails): DestinationDetails => ({ ...details });

/**
 * Shared filter/scope logic behind both the paginated list (fetchDestinations) and the
 * unpaginated export (exportDestinations) — search narrows first, then the type filter, then
 * the domain scope (all domains when showAll, else only the current domain).
 */
const filterDestinations = (query: DestinationListQuery): Destination[] => {
  const { showAll = false, search = "", destinationType } = query;
  const currentDomain = getCurrentDomainName();
  const list = destinations.map(toListDestination);

  const needle = search.trim().toLowerCase();

  const searchFiltered = needle
    ? list.filter((destination) =>
        searchableDestinationFields.some((field) => {
          const value = destination[field];
          return typeof value === "string" && value.toLowerCase().includes(needle);
        }),
      )
    : list;

  const typeFiltered = destinationType
    ? searchFiltered.filter((destination) => destination.type === destinationType)
    : searchFiltered;

  return showAll ? typeFiltered : typeFiltered.filter((destination) => destination.domain === currentDomain);
};

/**
 * Mock implementation of the future destinations API boundary — swap for a real call through
 * services/api/apiClient.ts once the backend endpoints are confirmed.
 *
 * BACKEND CONTRACT REQUIRED. The real `GET /api/destinations/list` needs a domain scope, a
 * `show_all` flag, server-side `search`, a `destinationType` filter, and server-side
 * `page`/`pageSize` paging — the mock emulates all of that here.
 */
export const fetchDestinations = (query: DestinationListQuery = {}): Promise<DestinationListResponse> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const { page = 1, pageSize = defaultPageSize } = query;
      const filtered = filterDestinations(query);

      const total_records = filtered.length;
      const total_pages = Math.max(1, Math.ceil(total_records / pageSize));
      const safePage = Math.min(Math.max(1, page), total_pages);

      const data = filtered
        .slice((safePage - 1) * pageSize, safePage * pageSize)
        .map((destination) => ({ ...destination }));

      resolve({
        data,
        page: safePage,
        pageSize,
        total_records,
        total_pages,
      });
    }, 300);
  });

/** GET /api/destinations/details/${uuid} */
export const getDestinationDetails = (destinationUuid: string): Promise<DestinationDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const details = destinations.find((record) => record.destination_uuid === destinationUuid);

      if (!details) {
        reject(new Error(`Destination ${destinationUuid} not found.`));
        return;
      }

      resolve({
        ...cloneDetails(details),
        destination_description: details.destination_description?.trim(),
      });
    }, 300);
  });

export const isDestinationNumberTaken = (destinationNumber: string, excludeUuid?: string): Promise<boolean> =>
  Promise.resolve(
    destinations.some(
      (record) => record.destination_number === destinationNumber && record.destination_uuid !== excludeUuid,
    ),
  );

/**
 * GET /api/hiveuser/details?module=Destination&domain_name=... — Add/Edit bootstrap
 * (domain options, account code, suggested next destination number), and the place
 * where the mock feeds the global domain store.
 *
 * BACKEND CONTRACT REQUIRED. A real Get Hive User Details call must expose the caller's
 * accessible domains so the list's Show All scope can be derived from them.
 */
export const getHiveDestinationDetails = (domainName?: string): Promise<HiveDestinationDetails> =>
  new Promise((resolve) => {
    setTimeout(() => {
      void domainName;

      const { currentDomain, setCurrentDomain, setAvailableDomains } = useDomainStore.getState();

      const domains = mockHiveDestinationDetails.domainOptions.map((name) => ({
        id: name,
        name,
      }));

      setAvailableDomains(domains);

      if (!currentDomain) {
        setCurrentDomain({
          id: mockHiveDestinationDetails.defaultDomain,
          name: mockHiveDestinationDetails.defaultDomain,
        });
      }

      resolve({
        ...mockHiveDestinationDetails,
        domainOptions: [...mockHiveDestinationDetails.domainOptions],
      });
    }, 300);
  });

/**
 * GET api/destinations/list/actions?domain_name=... — domain-scoped Actions groups (category ->
 * options), also reused as-is for Alternate Actions — both fields bind to the same fetched
 * groups, just different form fields. Mirrors getMusicOnHoldOptions' isMockMode() gate.
 */
export const getActionOptions = (domainName?: string): Promise<ActionOptionGroup[]> => {
  if (isMockMode()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          ...(mockActionOptionsByDomain[domainName ?? ""] ??
            mockActionOptionsByDomain[mockHiveDestinationDetails.defaultDomain]),
        ]);
      }, 250);
    });
  }

  return request
    .get<ActionOptionsResponse>("/destinations/list/actions", {
      params: { domain_name: domainName },
    })
    .then((response) => response.data);
};

/**
 * GET api/destinations/list/fax?domain_name=... — domain-scoped fax-detection options,
 * only relevant when destination_type === 'inbound'. BACKEND CONTRACT REQUIRED.
 */
export const getFaxOptions = (domainName?: string): Promise<SelectOption[]> =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        ...(mockFaxOptionsByDomain[domainName ?? ""] ??
          mockFaxOptionsByDomain[mockHiveDestinationDetails.defaultDomain]),
      ]);
    }, 250);
  });

/**
 * GET /api/destinations/list/holdMusic?domain_name=... — domain-scoped hold music groups
 * (Music on Hold / Recordings / Streams). Mirrors getExportFields' isMockMode() gate: mock mode
 * keeps returning mockHoldMusicOptionsByDomain unchanged, real mode calls through apiClient.
 */
export const getMusicOnHoldOptions = (domainName?: string): Promise<HoldMusicGroup[]> => {
  if (isMockMode()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          ...(mockHoldMusicOptionsByDomain[domainName ?? ""] ??
            mockHoldMusicOptionsByDomain[mockHiveDestinationDetails.defaultDomain]),
        ]);
      }, 250);
    });
  }

  return request
    .get<HoldMusicResponse>("/destinations/list/holdMusic", {
      params: { domain_name: domainName },
    })
    .then((response) => response.data);
};

/** Maps form values into the stored/API details shape — a straight passthrough plus trimming. */
const toDetails = (values: DestinationFormValues, destinationUuid: string): DestinationDetails => ({
  ...values,
  destination_uuid: destinationUuid,
  destination_prefix: values.destination_prefix || undefined,
  destination_trunk_prefix: values.destination_trunk_prefix || undefined,
  destination_area_code: values.destination_area_code || undefined,
  destination_cid_name_prefix: values.destination_cid_name_prefix || undefined,
  destination_caller_id_name: values.destination_caller_id_name || undefined,
  destination_caller_id_number: values.destination_caller_id_number || undefined,
  destination_distinctive_ring: values.destination_distinctive_ring || undefined,
  // Kept for outbound too: Axion hides the Actions field for outbound but never clears its value,
  // so it stays in the submitted payload. BACKEND CONTRACT REQUIRED: whether the backend ignores it.
  destination_action: values.destination_action || undefined,
  destination_alternate_action: values.destination_alternate_action || undefined,
  fax_uuid: values.destination_type === "inbound" ? values.fax_uuid || undefined : undefined,
  destination_hold_music: values.destination_hold_music || undefined,
  destination_description: values.destination_description?.trim() || undefined,
});

/** POST /api/destinations/create */
export const createDestination = (values: DestinationFormValues): Promise<DestinationDetails> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const created = toDetails(values, `dest-${values.destination_number}-${Date.now()}`);

      destinations = [...destinations, created];

      resolve(cloneDetails(created));
    }, 300);
  });

/** PATCH /api/destinations/update/${id} */
export const updateDestination = (
  destinationUuid: string,
  values: DestinationFormValues,
): Promise<DestinationDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = destinations.findIndex((record) => record.destination_uuid === destinationUuid);

      if (index === -1) {
        reject(new Error(`Destination ${destinationUuid} not found.`));
        return;
      }

      const updated = toDetails(values, destinationUuid);

      destinations = [...destinations.slice(0, index), updated, ...destinations.slice(index + 1)];

      resolve(cloneDetails(updated));
    }, 300);
  });

/** DELETE /api/destinations/delete — { destination_uuids: string[] }. */
export const deleteDestinations = (destinationUuids: string[]): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => {
      destinations = destinations.filter((record) => !destinationUuids.includes(record.destination_uuid));

      resolve();
    }, 300);
  });

/**
 * PATCH /api/destinations/update/${id} — flips the `destination_enabled` flag for the list's
 * clickable Status tag (DestinationTable.tsx). Mirrors Extensions' setExtensionEnabled
 * (extension.service.ts) exactly — a dedicated single-field update, not a full form submit
 * through updateDestination — and, like that reference implementation, has no isMockMode()
 * branch: there is no confirmed backend contract for a dedicated toggle endpoint, so this stays
 * mock-only rather than inventing one (see CLAUDE.md's "don't invent a backend contract" rule).
 *
 * INTENTIONAL PEPPERPBX ENHANCEMENT: destinations.md (§5/§17/§26/§33) documents Axion's
 * Destination Status column as display-only, changeable only via the Edit form's
 * `destination_enabled` switch. PepperPBX deliberately makes Status clickable here instead,
 * matching the pattern Extensions already ships (extension.service.ts's setExtensionEnabled +
 * ExtensionTable.tsx's Status column) — a known, intentional product decision, not a missed
 * Axion requirement. The Edit form's switch remains available as an alternate path either way.
 *
 * BACKEND CONTRACT REQUIRED. The real update endpoint must accept `destination_enabled`
 * alongside (or instead of) the other changed fields; the mock applies the flag directly to the
 * stored record so a subsequent fetch reflects the new status.
 */
export const setDestinationEnabled = (destinationUuid: string, enabled: boolean): Promise<DestinationDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = destinations.findIndex((record) => record.destination_uuid === destinationUuid);

      if (index === -1) {
        reject(new Error(`Destination ${destinationUuid} not found.`));
        return;
      }

      const updated = {
        ...destinations[index],
        destination_enabled: enabled,
      };

      destinations = [...destinations.slice(0, index), updated, ...destinations.slice(index + 1)];

      resolve(cloneDetails(updated));
    }, 200);
  });

/**
 * PATCH /api/destinations/copy — { destination_number, destination_uuid }.
 */
export const copyDestination = (destinationUuid: string, newDestinationNumber: string): Promise<DestinationDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const source = destinations.find((record) => record.destination_uuid === destinationUuid);

      if (!source) {
        reject(new Error(`Destination ${destinationUuid} not found.`));
        return;
      }

      const clonedRecord: DestinationDetails = {
        ...cloneDetails(source),
        destination_uuid: `dest-${newDestinationNumber}-${Date.now()}`,
        destination_number: newDestinationNumber,
      };

      destinations = [...destinations, clonedRecord];

      resolve(cloneDetails(clonedRecord));
    }, 300);
  });

/**
 * GET /api/destinations/fields — field list for the Export drawer.
 */
export const getExportFields = (): Promise<ExportFieldOption[]> => {
  if (isMockMode()) {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...exportFieldOptions]), 200);
    });
  }

  return request.get<DestinationFieldsResponse>("/destinations/fields").then((response) => response.data.fields);
};

export interface ExportDestinationsParams {
  showAll: boolean;
  search: string;
  destinationType?: DestinationType;
  fields: string[];
}

/**
 * POST /api/destinations/export — returns every record matching the current list view.
 */
export const exportDestinations = (params: ExportDestinationsParams): Promise<Destination[]> =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        filterDestinations({
          showAll: params.showAll,
          search: params.search,
          destinationType: params.destinationType,
        }),
      );
    }, 300);
  });

// ---------------------------------------------------------------------------------------------
// Import / Import-match
// ---------------------------------------------------------------------------------------------

/** Splits one CSV line into fields, honoring the chosen delimiter and enclosure character. */
const splitCsvLine = (line: string, delimiter: string, enclosure: string): string[] => {
  const fields: string[] = [];
  let current = "";
  let insideEnclosure = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (enclosure && char === enclosure) {
      if (insideEnclosure && line[i + 1] === enclosure) {
        current += enclosure;
        i += 1;
      } else {
        insideEnclosure = !insideEnclosure;
      }

      continue;
    }

    if (char === delimiter && !insideEnclosure) {
      fields.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  fields.push(current);

  return fields.map((field) => field.trim());
};

const parseCsv = (text: string, delimiter: string, enclosure: string): string[][] =>
  text
    .split(/\r\n|\n/)
    .filter((line) => line.length > 0)
    .map((line) => splitCsvLine(line, delimiter, enclosure));

/** Normalizes a CSV header cell so it can be compared against destinationCsvFieldKeys. */
const normalizeHeader = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

interface PendingImport {
  header: string[];
  dataRows: string[][];
}

/** Parsed-but-not-yet-committed imports, keyed by csvId. */
const pendingImports = new Map<string, PendingImport>();

/**
 * POST /api/destinations/import (multipart) — parses the uploaded CSV client-side.
 */
export const importDestinations = (file: File, options: ImportDestinationOptions): Promise<ImportDestinationResult> =>
  file.text().then(
    (text) =>
      new Promise((resolve, reject) => {
        setTimeout(() => {
          const rows = parseCsv(text, options.delimiter, options.enclosure);

          if (rows.length === 0) {
            reject(new Error("The uploaded CSV file has no rows."));
            return;
          }

          const header = rows[0];
          const dataRows = rows.slice(Math.max(1, options.fromRow - 1));

          const matchedFields: Record<string, string> = {};

          header.forEach((column) => {
            const normalized = normalizeHeader(column);

            if (destinationCsvFieldKeys.includes(normalized) && !matchedFields[normalized]) {
              matchedFields[normalized] = column;
            }
          });

          const unmatchedDbFields = destinationCsvFieldKeys.filter((field) => !(field in matchedFields));

          const csvId = `csv-${Date.now()}`;

          pendingImports.set(csvId, {
            header,
            dataRows,
          });

          resolve({
            csvId,
            csvColumns: header,
            matchedFields,
            unmatchedDbFields,
            rowCount: dataRows.length,
          });
        }, 400);
      }),
  );

/**
 * POST /api/destinations/bulkIn — { CSV_id, mapField }.
 */
export const createImportMatch = (csvId: string, mapField: Record<string, string>): Promise<ImportMatchResult> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const pending = pendingImports.get(csvId);

      if (!pending) {
        reject(new Error("Import data not found. Please import the CSV file again."));
        return;
      }

      const { header, dataRows } = pending;

      const columnIndex = (columnName?: string) => (columnName ? header.indexOf(columnName) : -1);

      let imported = 0;
      let skipped = 0;

      const currentDomain = getCurrentDomainName();
      const created: DestinationDetails[] = [];

      dataRows.forEach((row, rowIndex) => {
        const readField = (dbField: string) => {
          const columnName = mapField[dbField];
          const index = columnIndex(columnName);

          return index >= 0 ? row[index] : undefined;
        };

        const rawType = (readField("destination_type") ?? "").toLowerCase();

        const destinationType: DestinationType | undefined = (["inbound", "outbound", "local"] as const).find(
          (type) => type === rawType,
        );

        const destinationNumber = readField("destination_number");

        if (!destinationType || !destinationNumber || !/^\d{1,20}$/.test(destinationNumber)) {
          skipped += 1;
          return;
        }

        const domainName = readField("domain_name") || currentDomain;

        created.push({
          destination_uuid: `dest-import-${destinationNumber}-${Date.now()}-${rowIndex}`,
          destination_type: destinationType,
          destination_number: destinationNumber,
          destination_prefix: readField("destination_prefix") || undefined,
          destination_trunk_prefix: readField("destination_trunk_prefix") || undefined,
          destination_area_code: readField("destination_area_code") || undefined,
          destination_context: readField("destination_context") || "public",
          destination_description: readField("destination_description") || undefined,
          destination_caller_id_name: readField("destination_caller_id_name") || undefined,
          destination_caller_id_number: readField("destination_caller_id_number") || undefined,
          destination_accountcode: mockHiveDestinationDetails.accountNumber,
          domain_name: domainName,
          destination_order: Number(readField("destination_order")) || 100,
          destination_type_voice: true,
          destination_type_fax: false,
          destination_type_text: false,
          destination_type_emergency: false,
          destination_record: false,
          sms_enabled: false,
          destination_enabled: (readField("destination_enabled") ?? "true").toLowerCase() !== "false",
        });

        imported += 1;
      });

      destinations = [...destinations, ...created];

      pendingImports.delete(csvId);

      resolve({
        imported,
        skipped,
      });
    }, 400);
  });
