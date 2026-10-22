import type { CallBlock, CallBlockDirection, CallBlockFormValues, HiveCallBlockDetails } from './call-block.types'

export const defaultPageSize = 10

export const pageSizeOptions = [10, 25, 50, 100, 200]

export const recentCallsPageSize = 5

export const callBlockStatusLabels: Record<'enabled' | 'disabled', string> = {
  enabled: 'Enabled',
  disabled: 'Disabled',
}

/** Fields matched by fetchCallBlocks' search filter (see call-block.service.ts). */
export const searchableCallBlockFields: (keyof CallBlock)[] = [
  'call_block_name',
  'call_block_number',
  'extension',
  'call_block_action',
  'call_block_description',
  'domain_name',
]

/** Direction options — Inbound/Outbound (call-block.md §8's `callBlockDirectionOptions`). */
export const callBlockDirectionOptions: { label: string; value: CallBlockDirection }[] = [
  { label: 'Inbound', value: 'inbound' },
  { label: 'Outbound', value: 'outbound' },
]

/**
 * Direction-aware label/message for the Number field (call-block.md §8/§9/§25/§33/§447) — a core
 * business rule, not a cosmetic detail: Inbound blocks describe the caller ("Caller ID Number"),
 * Outbound blocks describe where the call is going ("Destination Number").
 */
export const callBlockNumberLabel = (direction: CallBlockDirection): string =>
  direction === 'outbound' ? 'Destination Number' : 'Caller ID Number'

/**
 * PNG direction icon path (public/assets/call_icon/), replacing the AntD ArrowUp/ArrowDown icons
 * previously used for the Direction column in the Call Block list and the Recent Calls sub-table.
 * Neither dataset carries an answered/unanswered status, so the "_answered" asset variant is used
 * uniformly — matches the only asset available per direction without one.
 */
export const callBlockDirectionIconSrc = (direction: CallBlockDirection): string =>
  `/assets/call_icon/icon_cdr_${direction}_answered.png`

/**
 * Four-key granular permission module (call-block.md §14/§33) — `view`/`add`/`edit` plus an `all`
 * module-admin bypass, matching Announcements' model. Deliberately module-local placeholder
 * strings per CLAUDE.md's `<module>.<action>` naming rule — not a reproduction of Axion's literal
 * `pbx_callblock_*` names.
 *
 * NOT reproduced: the audit's per-row permission flags (`original[perm]` checked against each
 * list row's embedded permission booleans, call-block.md §14/§25/§33/§454) — PepperPBX's
 * `CallBlock` list entity carries no per-record permission data, and no confirmed backend
 * contract exists for one, so row-level checks fall back to module-level booleans only (see
 * useCallBlockPermissions.ts).
 */
export const callBlockPermissions = {
  view: 'callBlock.view',
  add: 'callBlock.add',
  edit: 'callBlock.edit',
  all: 'callBlock.manage',
}

/**
 * Add-mode form defaults. Confirmed Axion defaults (call-block.md §3/§26): `call_block_enabled`
 * true, `call_block_action` 'reject', `call_block_direction` defaults to the first documented
 * option (Inbound) since the audit doesn't specify a default direction beyond "Direction (select),
 * required" — a reasonable UI default, not an invented backend rule.
 */
export const getDefaultCallBlockFormValues = (hive: HiveCallBlockDetails): CallBlockFormValues => ({
  call_block_direction: 'inbound',
  call_block_action: 'reject',
  domain_name: hive.defaultDomain,
  call_block_enabled: true,
})
