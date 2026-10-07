import { defaultPageSize, searchableOutboundRouteFields } from './outbound-route.constants'
import {
  mockDialplanXmlFallback,
  mockGatewayOptionsByDomain,
  mockHiveOutboundRouteDetails,
  mockOutboundRoutes as seedOutboundRoutes,
  mockSbcDomains,
} from './outbound-route.mock'
import useDomainStore from '../../../store/domain'
import type { ApiError } from '../../../services/api/apiError'
import type {
  HiveOutboundRouteDetails,
  OutboundRoute,
  OutboundRouteDetails,
  OutboundRouteFormValues,
  OutboundRouteGatewayOption,
  OutboundRouteListQuery,
  OutboundRouteListResponse,
  OutboundRouteXml,
  SbcDomainOption,
} from './outbound-route.types'

/**
 * The service's own working copy of the mock dataset, stored in the rich create/update shape
 * (OutboundRouteDetails) so create/update persist every form field. Kept private to this module
 * so outbound-route.service.ts is the single mutation point for the mock "backend" — pages,
 * components, and the hook never import outbound-route.mock.ts directly (CLAUDE.md's "a
 * module's mock data lives behind its service layer" rule). Resets on a real page reload since
 * it's just a re-evaluated module; no fake persistence across refresh.
 */
let outboundRoutes: OutboundRouteDetails[] = seedOutboundRoutes.map((route) => ({ ...route }))

/** Raw XML per route — a separate mock store, matching the audit's dedicated XML get/save endpoints. */
const xmlByRoute = new Map<string, string>()

/** Projects the rich stored record back into the lean list/table entity. */
const toListOutboundRoute = (details: OutboundRouteDetails): OutboundRoute => {
  const rawDomain = details.domain_name || details.dialplan_context || ''
  return {
    id: details.dialplan_uuid,
    domain: !rawDomain || rawDomain.toLowerCase() === 'global' ? 'Global' : rawDomain,
    name: details.outbound_route_name,
    number: details.dialplan_number,
    context: details.dialplan_context,
    order: details.dialplan_order,
    enabled: details.dialplan_enabled,
    description: details.dialplan_description,
  }
}

/**
 * The domain the list should default to when no explicit domain scope is requested. Reads the
 * global current-domain store (PepperPBX's multi-tenancy placeholder — reused as-is, never
 * modified by this module) and falls back to the mock's default domain until
 * getHiveOutboundRouteDetails() has populated the store.
 */
const getCurrentDomainName = (): string => useDomainStore.getState().currentDomain?.name ?? mockHiveOutboundRouteDetails.defaultDomain

const cloneDetails = (details: OutboundRouteDetails): OutboundRouteDetails => ({ ...details, gateways: [...details.gateways] })

/**
 * Mock implementation of the future outbound-routes API boundary — swap for real calls through
 * services/api/apiClient.ts once the backend endpoints are confirmed.
 *
 * BACKEND CONTRACT REQUIRED. The real `GET /api/outboundRoutes/list` needs a domain scope, a
 * `show_all` flag, server-side `search`, and server-side `pageNumber`/`pageSize` paging — the
 * mock emulates that here. Unlike the Axion reference's documented trailing `&` in the query
 * string (outbound-routes.md §3/§28, harmless but a confirmed inconsistency), this mock's future
 * real-request builder should not reproduce it.
 */
export const fetchOutboundRoutes = (query: OutboundRouteListQuery = {}): Promise<OutboundRouteListResponse> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const { page = 1, pageSize = defaultPageSize, showAll = false, search = '' } = query

      const currentDomain = getCurrentDomainName()
      const list = outboundRoutes.map(toListOutboundRoute)

      const needle = search.trim().toLowerCase()
      const searchFiltered = needle
        ? list.filter((route) =>
            searchableOutboundRouteFields.some((field) => {
              const value = route[field]
              return typeof value === 'string' && value.toLowerCase().includes(needle)
            })
          )
        : list

      const domainFiltered = showAll ? searchFiltered : searchFiltered.filter((route) => route.domain === currentDomain)

      const total_records = domainFiltered.length
      const total_pages = Math.max(1, Math.ceil(total_records / pageSize))
      const safePage = Math.min(Math.max(1, page), total_pages)

      const data = domainFiltered.slice((safePage - 1) * pageSize, safePage * pageSize).map((route) => ({ ...route }))

      resolve({ data, page: safePage, pageSize, total_records, total_pages })
    }, 300)
  })

/** GET /api/outboundRoutes/details/${uuid} (the audit's DIALPLAN_DETAILS endpoint — see outbound-routes.md §12). */
export const getOutboundRouteDetails = (dialplanUuid: string): Promise<OutboundRouteDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const details = outboundRoutes.find((record) => record.dialplan_uuid === dialplanUuid)

      if (!details) {
        const notFound: ApiError = { status: 404, message: `Outbound route ${dialplanUuid} not found.` }
        reject(notFound)
        return
      }

      resolve({
        ...cloneDetails(details),
        dialplan_description: details.dialplan_description?.trim(),
      })
    }, 300)
  })

export const isOutboundRouteNameTaken = (routeName: string, excludeUuid?: string): Promise<boolean> =>
  Promise.resolve(
    outboundRoutes.some((record) => record.outbound_route_name === routeName && record.dialplan_uuid !== excludeUuid)
  )

/**
 * GET /api/hiveuser/details?module=OutboundRoutes&domain_name=... — Add/Edit bootstrap (domain
 * options, account code, default SBC domain), and the place where the mock feeds the global
 * domain store (PepperPBX's multi-tenancy placeholder): availableDomains come from the hive's
 * domainOptions, and currentDomain is seeded from the default domain the first time — never
 * overwriting a choice the user persisted.
 *
 * IMPORTANT: always call this with the relevant domain name once one is known (the current
 * domain on Add, the loaded record's domain on Edit) — matches Gateways' documented fix of the
 * Axion reference's confirmed Edit-screen bug of calling this with no domain at all.
 *
 * BACKEND CONTRACT REQUIRED. A real Get Hive User Details call must expose the caller's
 * accessible domains so the list's Show All scope can be derived from them.
 */
export const getHiveOutboundRouteDetails = (domainName?: string): Promise<HiveOutboundRouteDetails> =>
  new Promise((resolve) => {
    setTimeout(() => {
      void domainName // the mock returns one shared option list regardless of domain
      const { currentDomain, setCurrentDomain, setAvailableDomains } = useDomainStore.getState()
      const domains = mockHiveOutboundRouteDetails.domainOptions.map((name) => ({ id: name, name }))
      setAvailableDomains(domains)
      if (!currentDomain) {
        setCurrentDomain({ id: mockHiveOutboundRouteDetails.defaultDomain, name: mockHiveOutboundRouteDetails.defaultDomain })
      }
      resolve({ ...mockHiveOutboundRouteDetails, domainOptions: [...mockHiveOutboundRouteDetails.domainOptions] })
    }, 300)
  })

/** GET /api/sbcDomain/list?show_all=true — fetched once, independent of the hive bootstrap call. */
export const getSbcDomains = (): Promise<SbcDomainOption[]> =>
  new Promise((resolve) => {
    setTimeout(() => resolve([...mockSbcDomains]), 250)
  })

/**
 * GET .../outboundRoutes/gateways?domain_name=... — domain-scoped ordered-gateway select options
 * (outbound-routes.md §9/§12/§21). A dedicated endpoint per the audit, distinct from the Gateways
 * module's own CRUD list — see outbound-route.mock.ts.
 */
export const getOutboundRouteGatewayOptions = (domainName?: string): Promise<OutboundRouteGatewayOption[]> =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve([...(mockGatewayOptionsByDomain[domainName ?? ''] ?? mockGatewayOptionsByDomain[mockHiveOutboundRouteDetails.defaultDomain])])
    }, 250)
  })

/**
 * Maps form values into the stored/API details shape. `dialplan_number` has no Add-form
 * equivalent in the Axion reference (outbound-routes.md §8) — when the form didn't collect one
 * at all (create mode, where OutboundRouteBasicSection never renders the field so `values.dialplan_number`
 * is `undefined`), this derives a reasonable default from the caller ID number so the list's
 * Number column and Edit's Number field always have something meaningful to show, rather than
 * inventing a fake required Add field. In edit mode the field IS rendered, so an intentionally
 * cleared value (`''`, not `undefined`) must be respected rather than falling back to the caller
 * ID number — otherwise the field could never actually be cleared once set. `dialplan_context` is
 * likewise server-derived from the domain on creation and never user-supplied.
 */
const toDetails = (values: OutboundRouteFormValues, dialplanUuid: string, existingContext?: string): OutboundRouteDetails => ({
  ...values,
  dialplan_uuid: dialplanUuid,
  dialplan_context: existingContext ?? values.domain_name,
  dialplan_number: values.dialplan_number === undefined ? values.outbound_caller_id_number : values.dialplan_number || undefined,
  outbound_caller_id_name: values.outbound_caller_id_name || undefined,
  prefix_number: values.prefix_number || undefined,
  limit: values.limit || undefined,
  toll_allow: values.toll_allow || undefined,
  hostname: values.hostname || undefined,
  dialplan_description: values.dialplan_description?.trim() || undefined,
  gateways: (values.gateways ?? []).filter((gateway) => !!gateway),
})

/** POST /api/outboundRoutes/create */
export const createOutboundRoute = (values: OutboundRouteFormValues): Promise<OutboundRouteDetails> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const created = toDetails(values, `or-${values.outbound_route_name}-${Date.now()}`)
      outboundRoutes = [...outboundRoutes, created]
      resolve(cloneDetails(created))
    }, 300)
  })

/**
 * PATCH /api/outboundRoutes/update/${id} (the audit's DIALPLAN_UPDATE endpoint, outbound-routes.md
 * §12/§28 — NOT the dead/broken `updateOutboundRoutes` helper that references the non-existent
 * `API_URL.OUTBOUNDROUTES.EDIT`; that latent bug is deliberately not reproduced here).
 */
export const updateOutboundRoute = (dialplanUuid: string, values: OutboundRouteFormValues): Promise<OutboundRouteDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = outboundRoutes.findIndex((record) => record.dialplan_uuid === dialplanUuid)

      if (index === -1) {
        reject(new Error(`Outbound route ${dialplanUuid} not found.`))
        return
      }

      const updated = toDetails(values, dialplanUuid, outboundRoutes[index].dialplan_context)

      outboundRoutes = [...outboundRoutes.slice(0, index), updated, ...outboundRoutes.slice(index + 1)]

      resolve(cloneDetails(updated))
    }, 300)
  })

/** DELETE /api/outboundRoutes/delete — { dialplan_uuids: string[] }. Used by both single-row and bulk delete. */
export const deleteOutboundRoutes = (dialplanUuids: string[]): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => {
      outboundRoutes = outboundRoutes.filter((record) => !dialplanUuids.includes(record.dialplan_uuid))
      dialplanUuids.forEach((id) => xmlByRoute.delete(id))
      resolve()
    }, 300)
  })

/**
 * PATCH /api/outboundRoutes/toggle — { dialplan_uuids: string[] }, no explicit status field per
 * the audit (outbound-routes.md §12/§21) — flips each targeted record's own current
 * `dialplan_enabled` state. Used identically for the inline row Status pill (one-element array,
 * no confirmation — outbound-routes.md §3/§26) and the bulk Toggle popup (many, confirmed).
 */
export const toggleOutboundRoutes = (dialplanUuids: string[]): Promise<OutboundRouteDetails[]> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const updated: OutboundRouteDetails[] = []
      outboundRoutes = outboundRoutes.map((record) => {
        if (!dialplanUuids.includes(record.dialplan_uuid)) return record
        const next = { ...record, dialplan_enabled: !record.dialplan_enabled }
        updated.push(next)
        return next
      })
      resolve(updated.map(cloneDetails))
    }, 200)
  })

/**
 * PATCH /api/outboundRoutes/copy — { dialplan_uuids: [uuid] }. Confirmation-only clone, no
 * user-provided override fields — matches the audit's documented Copy flow exactly
 * (outbound-routes.md §3/§20/§24: "Do you really want to copy this outbound routes?", no inline
 * form), unlike Destinations' Copy (which collects a new destination number).
 */
export const copyOutboundRoute = (dialplanUuid: string): Promise<OutboundRouteDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const source = outboundRoutes.find((record) => record.dialplan_uuid === dialplanUuid)

      if (!source) {
        reject(new Error(`Outbound route ${dialplanUuid} not found.`))
        return
      }

      const clonedRecord: OutboundRouteDetails = {
        ...cloneDetails(source),
        dialplan_uuid: `or-${source.outbound_route_name}-copy-${Date.now()}`,
        outbound_route_name: `${source.outbound_route_name}-copy`,
      }

      outboundRoutes = [...outboundRoutes, clonedRecord]

      resolve(cloneDetails(clonedRecord))
    }, 300)
  })

/**
 * GET .../outboundRoutes/get/dialplanXml/${uuid} — Axion-only raw dialplan XML (outbound-routes.md
 * §3/§12/§25/§34). RBAC is foundation-only (see useOutboundRoutePermissions.ts) so this stays
 * reachable by any `outboundRoute.manage` holder for now; the intended Axion-only gate
 * (`pbx_axiontech`-equivalent) is a TODO, not an invented, currently-enforced permission string.
 */
export const getOutboundRouteXml = (dialplanUuid: string): Promise<OutboundRouteXml> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const exists = outboundRoutes.some((record) => record.dialplan_uuid === dialplanUuid)

      if (!exists) {
        reject(new Error(`Outbound route ${dialplanUuid} not found.`))
        return
      }

      resolve({
        dialplan_uuid: dialplanUuid,
        // `undefined` (never saved) would normally normalize to `null` — distinct from a
        // saved-but-empty string, which nullish coalescing correctly leaves untouched — and
        // DialplanXmlPage.tsx renders EmptyState for `null` rather than treating it as real
        // editable content.
        //
        // TODO(backend): TEMPORARY — the real dialplan-XML endpoint isn't available yet, so
        // "nothing saved" is backfilled with mockDialplanXmlFallback instead of `null` for now,
        // purely so the XML viewer has something to show instead of "No XML Found." while the
        // real endpoint is pending. This does NOT affect the reject() path above — a route that
        // doesn't exist still correctly errors, it's only the "no XML" case being papered over.
        // To remove: change the line below back to `xmlByRoute.get(dialplanUuid) ?? null` and
        // delete `mockDialplanXmlFallback` from outbound-route.mock.ts.
        xml: xmlByRoute.get(dialplanUuid) ?? mockDialplanXmlFallback,
      })
    }, 300)
  })

/** PATCH .../outboundRoutes/update/dialplanXml/${uuid} — { xml }. */
export const updateOutboundRouteXml = (dialplanUuid: string, xml: string): Promise<OutboundRouteXml> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const exists = outboundRoutes.some((record) => record.dialplan_uuid === dialplanUuid)

      if (!exists) {
        reject(new Error(`Outbound route ${dialplanUuid} not found.`))
        return
      }

      xmlByRoute.set(dialplanUuid, xml)
      resolve({ dialplan_uuid: dialplanUuid, xml })
    }, 300)
  })
