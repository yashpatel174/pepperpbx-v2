import { defaultPageSize } from './gateway.constants'
import { mockGateways as seedGateways, mockHiveGatewayDetails, mockSbcDomains, mockSipProfiles } from './gateway.mock'
import useDomainStore from '../../store/domain'
import type { ApiError } from '../../services/api/apiError'
import type {
  Gateway,
  GatewayDetails,
  GatewayFormValues,
  GatewayListQuery,
  GatewayListResponse,
  HiveGatewayDetails,
  SbcDomainOption,
  SipProfileOption,
} from './gateway.types'

/**
 * The service's own working copy of the mock dataset, stored in the rich create/update shape
 * (GatewayDetails) so create/update persist every form field. Kept private to this module so
 * gateway.service.ts is the single mutation point for the mock "backend" — pages and components
 * never import gateway.mock.ts directly. Resets on a real page reload since it's just a
 * re-evaluated module; no fake persistence across refresh.
 */
let gateways: GatewayDetails[] = seedGateways.map((gateway) => ({ ...gateway }))

const searchableFields: (keyof Gateway)[] = ['gateway', 'context', 'hostname', 'description']

/** Projects the rich stored record back into the lean list/table entity. */
const toListGateway = (details: GatewayDetails): Gateway => ({
  id: details.gateway_uuid,
  gateway: details.gateway,
  // Falls back to 'Global' when domain_name is falsy or literally 'global' — matches the Axion
  // reference's documented table-cell behavior.
  domain: !details.domain_name || details.domain_name.toLowerCase() === 'global' ? 'Global' : details.domain_name,
  context: details.context,
  status: details.status,
  register: details.register,
  state: details.state,
  hostname: details.hostname,
  enabled: details.enabled,
  description: details.description,
})

/**
 * The domain the list should default to when no explicit domain scope is requested. Reads the
 * global current-domain store (PepperPBX's multi-tenancy placeholder — reused as-is, never
 * modified by this module) and falls back to the mock's default domain until
 * getHiveGatewayDetails() has populated the store.
 */
const getCurrentDomainName = (): string => useDomainStore.getState().currentDomain?.name ?? mockHiveGatewayDetails.defaultDomain

/**
 * Mock implementation of the future gateways API boundary — swap for a real call through
 * services/api/apiClient.ts once the backend endpoints are confirmed.
 *
 * BACKEND CONTRACT REQUIRED. The real `GET /api/gateways/list` needs a domain scope, a
 * `showAll` flag, server-side `search`, and server-side `page`/`pageSize` paging — the mock
 * emulates that here: search narrows first, then the domain scope is applied (all domains when
 * showAll, else only the current domain), and paging always slices the resulting set.
 */
export const fetchGateways = (query: GatewayListQuery = {}): Promise<GatewayListResponse> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const { page = 1, pageSize = defaultPageSize, showAll = false, search = '' } = query

      const currentDomain = getCurrentDomainName()
      const list = gateways.map(toListGateway)

      const needle = search.trim().toLowerCase()
      const searchFiltered = needle
        ? list.filter((gateway) =>
            searchableFields.some((field) => {
              const value = gateway[field]
              return typeof value === 'string' && value.toLowerCase().includes(needle)
            })
          )
        : list

      const domainFiltered = showAll ? searchFiltered : searchFiltered.filter((gateway) => gateway.domain === currentDomain)

      const total_records = domainFiltered.length
      const total_pages = Math.max(1, Math.ceil(total_records / pageSize))
      const safePage = Math.min(Math.max(1, page), total_pages)

      const data = domainFiltered.slice((safePage - 1) * pageSize, safePage * pageSize).map((gateway) => ({ ...gateway }))

      resolve({ data, page: safePage, pageSize, total_records, total_pages })
    }, 300)
  })

const cloneDetails = (details: GatewayDetails): GatewayDetails => ({ ...details })

/** GET /api/gateways/details/${gateway_uuid} */
export const getGatewayDetails = (gatewayUuid: string): Promise<GatewayDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const details = gateways.find((record) => record.gateway_uuid === gatewayUuid)
      if (!details) {
        const notFound: ApiError = { status: 404, message: `Gateway ${gatewayUuid} not found.` }
        reject(notFound)
        return
      }
      // sbcDomainIp null→'' normalization + description trim, per the Axion reference.
      resolve({ ...cloneDetails(details), sbcDomainIp: details.sbcDomainIp ?? '', description: details.description?.trim() })
    }, 300)
  })

/**
 * GET /api/hiveuser/details?module=Gateways&domain_name=... — Add/Edit bootstrap (domain
 * options), and the place where the mock feeds the global domain store (PepperPBX's
 * multi-tenancy placeholder): availableDomains come from the hive's domainOptions, and the
 * currentDomain is seeded from the default domain the first time — never overwriting a choice
 * the user persisted.
 *
 * IMPORTANT: always call this with the relevant domain name once one is known (the current
 * domain on Add, the loaded record's domain on Edit). The Axion reference has a confirmed bug
 * where its Edit screen calls this with no domain at all — deliberately not reproduced here;
 * see EditGatewayPage.tsx.
 *
 * BACKEND CONTRACT REQUIRED. A real Get Hive User Details call must expose the caller's
 * accessible domains so the list's Show All scope can be derived from them.
 */
export const getHiveGatewayDetails = (domainName?: string): Promise<HiveGatewayDetails> =>
  new Promise((resolve) => {
    setTimeout(() => {
      void domainName // the mock returns one shared option list regardless of domain
      const { currentDomain, setCurrentDomain, setAvailableDomains } = useDomainStore.getState()
      const domains = mockHiveGatewayDetails.domainOptions.map((name) => ({ id: name, name }))
      setAvailableDomains(domains)
      if (!currentDomain) {
        setCurrentDomain({ id: mockHiveGatewayDetails.defaultDomain, name: mockHiveGatewayDetails.defaultDomain })
      }
      resolve({ ...mockHiveGatewayDetails, domainOptions: [...mockHiveGatewayDetails.domainOptions] })
    }, 300)
  })

/** GET /api/sbcDomain/list?show_all=true — fetched once, independent of the hive bootstrap call. */
export const getSbcDomains = (): Promise<SbcDomainOption[]> =>
  new Promise((resolve) => {
    setTimeout(() => resolve([...mockSbcDomains]), 250)
  })

/** GET /api/gateways/getSipProfiles */
export const getSipProfiles = (): Promise<SipProfileOption[]> =>
  new Promise((resolve) => {
    setTimeout(() => resolve([...mockSipProfiles]), 250)
  })

export const isGatewayNameTaken = (gateway: string, excludeUuid?: string): Promise<boolean> =>
  Promise.resolve(gateways.some((record) => record.gateway === gateway && record.gateway_uuid !== excludeUuid))

/**
 * Maps form values into the stored/API details shape. The numeric form strings are converted to
 * numbers only here — the form itself keeps them as validated strings (see README's "no
 * unintended stringly-typed numeric API fields" rule, applied per the Axion audit's documented
 * `Number()` coercion of expire_seconds/retry_seconds/channels).
 */
const toDetails = (values: GatewayFormValues, gatewayUuid: string, status: string | undefined, state: string | undefined): GatewayDetails => ({
  gateway_uuid: gatewayUuid,
  gateway: values.gateway,
  username: values.username || undefined,
  password: values.password || undefined,
  from_user: values.from_user || undefined,
  domain_name: values.domain_name,
  sbcDomainIp: values.sbcDomainIp,
  proxy: values.proxy,
  realm: values.realm || undefined,
  expire_seconds: Number(values.expire_seconds),
  retry_seconds: Number(values.retry_seconds),
  context: values.context || undefined,
  profile: values.profile || undefined,
  register: values.register,
  enabled: values.enabled,
  description: values.description?.trim() || undefined,
  distinct_to: values.distinct_to,
  caller_id_in_from: values.caller_id_in_from,
  supress_cng: values.supress_cng,
  extension_in_contact: values.extension_in_contact,
  auth_username: values.auth_username || undefined,
  extension: values.extension || undefined,
  register_transport: values.register_transport || undefined,
  register_proxy: values.register_proxy || undefined,
  outbound_proxy: values.outbound_proxy || undefined,
  sip_cid_type: values.sip_cid_type || undefined,
  codec_prefs: values.codec_prefs || undefined,
  ping: values.ping || undefined,
  ping_min: values.ping_min || undefined,
  ping_max: values.ping_max || undefined,
  channels: values.channels ? Number(values.channels) : undefined,
  hostname: values.hostname || undefined,
  status,
  state,
})

/** POST /api/gateways/create */
export const createGateway = (values: GatewayFormValues): Promise<GatewayDetails> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const created = toDetails(values, `gw-${values.gateway}-${Date.now()}`, 'Stopped', undefined)
      gateways = [...gateways, created]
      resolve(cloneDetails(created))
    }, 300)
  })

/** PATCH /api/gateways/update */
export const updateGateway = (gatewayUuid: string, values: GatewayFormValues): Promise<GatewayDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = gateways.findIndex((record) => record.gateway_uuid === gatewayUuid)
      if (index === -1) {
        reject(new Error(`Gateway ${gatewayUuid} not found.`))
        return
      }
      const existing = gateways[index]
      const updated: GatewayDetails = {
        ...toDetails(values, gatewayUuid, existing.status, existing.state),
        // Blank password on submit means "keep the current one".
        password: values.password || existing.password || undefined,
      }
      gateways = [...gateways.slice(0, index), updated, ...gateways.slice(index + 1)]
      resolve(cloneDetails(updated))
    }, 300)
  })

/** DELETE /api/gateways/delete — { gateway_uuids: string[] }. Used by both single (one-element array) and bulk delete. */
export const deleteGateways = (gatewayUuids: string[]): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => {
      gateways = gateways.filter((record) => !gatewayUuids.includes(record.gateway_uuid))
      resolve()
    }, 300)
  })

/**
 * PATCH /api/gateways/copy — { gateway_uuids: [gatewayUuid] }. Row action only — a simple
 * UUID-based clone with no user-provided name/extension override, per the Axion reference
 * (deliberately different from a copy-with-inline-form pattern).
 */
export const copyGateway = (gatewayUuid: string): Promise<GatewayDetails> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const source = gateways.find((record) => record.gateway_uuid === gatewayUuid)
      if (!source) {
        reject(new Error(`Gateway ${gatewayUuid} not found.`))
        return
      }
      const clonedRecord: GatewayDetails = {
        ...cloneDetails(source),
        gateway_uuid: `gw-${source.gateway}-copy-${Date.now()}`,
        gateway: `${source.gateway}-copy`,
      }
      gateways = [...gateways, clonedRecord]
      resolve(cloneDetails(clonedRecord))
    }, 300)
  })

/**
 * PATCH /api/gateways/toggle — { gateway_uuids: string[] }, no status field. Flips each
 * targeted record's own current `enabled` state. Used identically for the inline Enabled/
 * Disabled pill (one-element array) and the bulk Toggle action (many), matching the Axion
 * reference exactly — there is no separate "set explicit value" endpoint.
 *
 * BACKEND CONTRACT REQUIRED — endpoint/method/payload assumed from the Axion reference only.
 */
export const toggleGateways = (gatewayUuids: string[]): Promise<GatewayDetails[]> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const updated: GatewayDetails[] = []
      gateways = gateways.map((record) => {
        if (!gatewayUuids.includes(record.gateway_uuid)) return record
        const next = { ...record, enabled: !record.enabled }
        updated.push(next)
        return next
      })
      resolve(updated.map(cloneDetails))
    }, 200)
  })

export type StartStopAction = 'start' | 'stop'

/**
 * PATCH /api/gateways/startStop — { action, gateway_uuids }. Controls SIP registration status
 * (mock: `status` becomes 'Running' on start, 'Stopped' on stop) — semantically distinct from
 * toggleGateways, which controls the `enabled` flag. Used identically for the inline Gateway
 * Action pill (one-element array, only shown when `register === true`) and the bulk Start/Stop
 * action (many). Non-registering records are defensively skipped even if their uuid is passed —
 * a gateway that doesn't register with a SIP server has no start/stop concept, matching the
 * inline pill's own `register === true` gate.
 *
 * BACKEND CONTRACT REQUIRED — endpoint/method/payload assumed from the Axion reference only.
 */
export const startStopGateways = (gatewayUuids: string[], action: StartStopAction): Promise<GatewayDetails[]> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const updated: GatewayDetails[] = []
      gateways = gateways.map((record) => {
        if (!gatewayUuids.includes(record.gateway_uuid) || !record.register) return record
        const next = { ...record, status: action === 'start' ? 'Running' : 'Stopped' }
        updated.push(next)
        return next
      })
      resolve(updated.map(cloneDetails))
    }, 200)
  })
