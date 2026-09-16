import type { ActionOptionGroup, DestinationDetails, HiveDestinationDetails, HoldMusicGroup, SelectOption } from './destination.types'

/**
 * Matches Extensions' own DEFAULT_DOMAIN (extension.mock.ts) and the Axion-compatible sample
 * dataset's `domain_name` — deliberately the same string, not a coincidence: the domain store
 * (store/domain.ts) is shared app-wide, so once any module (e.g. Extensions) has seeded
 * `currentDomain`, every other module's `showAll=false` scope must resolve to that same
 * domain or its own records will never match. Using a different literal here was the actual
 * cause of the Destinations list rendering 0 records with `showAll=false` — see
 * destination.service.ts's getCurrentDomainName.
 */
const DEFAULT_DOMAIN = 'sip.axionhq.hivepbx.com'
const BRANCH_DOMAIN = 'branch.pepperpbx.local'
const REMOTE_DOMAIN = 'remote.pepperpbx.local'

export const mockHiveDestinationDetails: HiveDestinationDetails = {
  defaultDomain: DEFAULT_DOMAIN,
  domainOptions: [DEFAULT_DOMAIN, BRANCH_DOMAIN, REMOTE_DOMAIN],
  accountNumber: '193123969430',
  autoDestinationNumber: '1000',
}

/**
 * Grouped Actions options, matching GET /api/destinations/list/actions' real response shape (an
 * array of { label, options } category groups) — reused as-is for Alternate Actions, exactly like
 * the real API. Same option values as before, just organized under category groups instead of one
 * flat list.
 */
export const mockActionOptionsByDomain: Record<string, ActionOptionGroup[]> = {
  [DEFAULT_DOMAIN]: [
    {
      label: "Extensions",
      options: [
        {
          label: "Extension - 101",
          value: "transfer:101 XML sip.axionhq.hivepbx.com",
        },
        {
          label: "Extension - 102",
          value: "transfer:102 XML sip.axionhq.hivepbx.com",
        },
      ],
    },
    {
      label: "Ring Groups",
      options: [
        {
          label: "Ring Group - Sales (**8000)",
          value: "transfer:**8000 XML sip.axionhq.hivepbx.com",
        },
        {
          label: "Ring Group - Support (**8001)",
          value: "transfer:**8001 XML sip.axionhq.hivepbx.com",
        },
      ],
    },
    {
      label: "Voicemail",
      options: [
        {
          label: "Voicemail - 101",
          value: "transfer:*99101 XML sip.axionhq.hivepbx.com",
        },
        {
          label: "Voicemail - 102",
          value: "transfer:*99102 XML sip.axionhq.hivepbx.com",
        },
      ],
    },
    {
      label: "IVR",
      options: [
        {
          label: "IVR - Main Menu (**5000)",
          value: "transfer:**5000 XML sip.axionhq.hivepbx.com",
        },
      ],
    },
    {
      label: "Announcements",
      options: [
        {
          label: "Announcement - Welcome",
          value: "phrase:welcome-announcement",
        },
        {
          label: "Announcement - Sales",
          value: "phrase:sales-announcement",
        },
      ],
    },
    {
      label: "Recordings",
      options: [
        {
          label: "Recording - Welcome",
          value:
            "lua streamfile.lua https://cloud-drive.hivepbx.com/fsstorage-ivrfiles/default/Welcome.wav",
        },
        {
          label: "Recording - SALES",
          value:
            "lua streamfile.lua https://cloud-drive.hivepbx.com/fsstorage-ivrfiles/default/Sales.wav",
        },
      ],
    },
    {
      label: "Other",
      options: [
        {
          label: "Check Voicemail",
          value: "transfer:*98 XML sip.axionhq.hivepbx.com",
        },
        {
          label: "Company Directory",
          value: "transfer:*411 XML sip.axionhq.hivepbx.com",
        },
        {
          label: "Hangup",
          value: "hangup",
        },
      ],
    },
  ],

  [BRANCH_DOMAIN]: [
    {
      label: "Extensions",
      options: [
        {
          label: "Extension - 201",
          value: "transfer:201 XML sip.axionhq.hivepbx.com",
        },
        {
          label: "Extension - 202",
          value: "transfer:202 XML sip.axionhq.hivepbx.com",
        },
      ],
    },
    {
      label: "Ring Groups",
      options: [
        {
          label: "Ring Group - Branch Support (**8000)",
          value: "transfer:**8000 XML sip.axionhq.hivepbx.com",
        },
      ],
    },
    {
      label: "Voicemail",
      options: [
        {
          label: "Voicemail - 201",
          value: "transfer:*99201 XML sip.axionhq.hivepbx.com",
        },
      ],
    },
    {
      label: "IVR",
      options: [
        {
          label: "IVR - Branch Main Menu (**5000)",
          value: "transfer:**5000 XML sip.axionhq.hivepbx.com",
        },
      ],
    },
  ],

  [REMOTE_DOMAIN]: [
    {
      label: "Extensions",
      options: [
        {
          label: "Extension - 301",
          value: "transfer:301 XML sip.axionhq.hivepbx.com",
        },
        {
          label: "Extension - 302",
          value: "transfer:302 XML sip.axionhq.hivepbx.com",
        },
      ],
    },
    {
      label: "Voicemail",
      options: [
        {
          label: "Voicemail - 301",
          value: "transfer:*99301 XML sip.axionhq.hivepbx.com",
        },
      ],
    },
    {
      label: "Ring Groups",
      options: [
        {
          label: "Ring Group - Remote Support (**8000)",
          value: "transfer:**8000 XML sip.axionhq.hivepbx.com",
        },
      ],
    },
    {
      label: "Recordings",
      options: [
        {
          label: "Recording - Remote Welcome",
          value:
            "lua streamfile.lua https://cloud-drive.hivepbx.com/fsstorage-ivrfiles/remote/Welcome.wav",
        },
      ],
    },
  ],
};

export const mockFaxOptionsByDomain: Record<string, SelectOption[]> = {
  [DEFAULT_DOMAIN]: [
    { label: 'Fax to Email: sales@acme.test', value: 'fax-101' },
    { label: 'Fax to Email: support@acme.test', value: 'fax-102' },
  ],
  [BRANCH_DOMAIN]: [{ label: 'Fax to Email: branch@acme.test', value: 'fax-201' }],
  [REMOTE_DOMAIN]: [{ label: 'Fax to Email: remote@acme.test', value: 'fax-301' }],
}

/**
 * Grouped Hold Music options, matching GET /api/destinations/list/holdMusic's real response
 * shape (an array of { label, options } groups) so the mock fallback and the real API resolve to
 * the exact same HoldMusicGroup[] shape for DestinationForm. DEFAULT_DOMAIN mirrors the
 * documented real API sample verbatim; BRANCH/REMOTE keep their previous flat values, just
 * regrouped under a single "Music on Hold" group.
 */
export const mockHoldMusicOptionsByDomain: Record<string, HoldMusicGroup[]> = {
  [DEFAULT_DOMAIN]: [
    {
      label: 'Music on Hold',
      options: [
        { label: 'default', value: 'local_stream://default' },
        { label: 'TestUpload', value: 'local_stream://TestUpload' },
      ],
    },
    {
      label: 'Recordings',
      options: [
        {
          id: '831f7e1e-50d9-467d-8b97-de2131dc7847',
          label: 'SALES',
          value:
            'https://cloud-drive.hivepbx.com/fsstorage-ivrfiles/sip.axionhq.hivepbx.com/1766123215812-SadEmotionm.wav',
        },
        {
          id: 'ac15f12c-b159-4243-b2b4-a9db29ae0df1',
          label: 'Kayam',
          value:
            'https://cloud-drive.hivepbx.com/fsstorage-ivrfiles/sip.axionhq.hivepbx.com/1774944312724-Welcome.wav',
        },
      ],
    },
    {
      label: 'Streams',
      options: [
        { label: 'KayamS', value: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
        { label: 'sample stream', value: 'file' },
      ],
    },
  ],
  [BRANCH_DOMAIN]: [
    {
      label: 'Music on Hold',
      options: [
        { label: 'default', value: 'default' },
        { label: 'branch_hold.wav', value: 'branch_hold.wav' },
      ],
    },
  ],
  [REMOTE_DOMAIN]: [
    {
      label: 'Music on Hold',
      options: [
        { label: 'default', value: 'default' },
        { label: 'silent_hold.wav', value: 'silent_hold.wav' },
      ],
    },
  ],
}

/**
 * Seed data for destination.service.ts's in-memory working copy — replace with a real API
 * response once the backend endpoints are available. Records are stored in the rich
 * create/update shape (DestinationDetails); the list is projected from these by the service.
 * Not mutated directly — the service owns a copy.
 */
const seed = (uuid: string, number: string, fields: Partial<DestinationDetails>): DestinationDetails => ({
  destination_uuid: uuid,
  destination_type: 'inbound',
  destination_number: number,
  destination_context: 'public',
  destination_accountcode: '4100',
  domain_name: DEFAULT_DOMAIN,
  destination_order: 100,
  destination_type_voice: true,
  destination_type_fax: false,
  destination_type_text: false,
  destination_type_emergency: false,
  destination_record: false,
  sms_enabled: false,
  destination_enabled: true,
  ...fields,
})

/**
 * Raw shape of the Axion-compatible sample list response used to seed this module — kept local
 * and unexported; `toSeedFields` below maps it onto DestinationDetails. Only the fields this
 * module's list/table/form actually use are carried over (see CLAUDE.md/README's "lean list
 * entity" convention) — the many Axion permission-flag and cross-module `action_name_*` keys in
 * the raw sample are not modeled, since nothing in this UI reads them.
 */
interface RawSampleDestination {
  destination_uuid: string
  destination_context: string
  destination_number: string
  destination_prefix: string | null
  destination_type: 'inbound' | 'outbound' | 'local'
  destination_accountcode: string
  destination_caller_id_name: string | null
  destination_caller_id_number: string | null
  /** Axion's real backend returns this as the string "true"/"false", not a boolean — normalized below (matches the same documented ambiguity as Gateways' `enabled`). */
  destination_enabled: string
  destination_description: string | null
  domain_name: string
  destinationAction: string | null
}

const rawSampleDestinations: RawSampleDestination[] = [
  {
    destination_uuid: 'aa99029b-615b-4bf8-8db2-5052102c9b62',
    destination_context: 'sip.axionhq.hivepbx.com',
    destination_number: '10884404',
    destination_prefix: '91',
    destination_type: 'outbound',
    destination_accountcode: '233000000000',
    destination_caller_id_name: 'test',
    destination_caller_id_number: '1001',
    destination_enabled: 'true',
    destination_description: 'test',
    domain_name: 'sip.axionhq.hivepbx.com',
    destinationAction: 'busy-au-tone (Tones)',
  },
  {
    destination_uuid: 'ec13f7fb-d6e3-4674-8ad9-b2f93f43934a',
    destination_context: 'public',
    destination_number: '1561651',
    destination_prefix: '1',
    destination_type: 'inbound',
    destination_accountcode: '193123969430',
    destination_caller_id_name: 'Hemant',
    destination_caller_id_number: '18053223591',
    destination_enabled: 'true',
    destination_description: null,
    domain_name: 'sip.axionhq.hivepbx.com',
    destinationAction: 'phrase:fa2c7f77-f777-4995-9582-2e7e86d8d2c5',
  },
  {
    destination_uuid: 'c63296cd-8395-49c7-818a-19c822ca71d0',
    destination_context: 'public',
    destination_number: '156165123',
    destination_prefix: null,
    destination_type: 'inbound',
    destination_accountcode: '193123969430',
    destination_caller_id_name: 'Hemant',
    destination_caller_id_number: null,
    destination_enabled: 'true',
    destination_description: null,
    domain_name: 'sip.axionhq.hivepbx.com',
    destinationAction: null,
  },
  {
    destination_uuid: '4e31ad8a-82d1-4b8a-9703-48e1aa7b0bc5',
    destination_context: 'sip.axionhq.hivepbx.com',
    destination_number: '167788004',
    destination_prefix: '91',
    destination_type: 'inbound',
    destination_accountcode: '233000000000',
    destination_caller_id_name: 'test',
    destination_caller_id_number: '1001',
    destination_enabled: 'true',
    destination_description: 'test',
    domain_name: 'sip.axionhq.hivepbx.com',
    destinationAction: 'busy-au-tone (Tones)',
  },
  {
    destination_uuid: '0b5405fe-eb67-4a90-9dfe-b6b3545d7f4a',
    destination_context: 'public',
    destination_number: '18054350074',
    destination_prefix: null,
    destination_type: 'inbound',
    destination_accountcode: '193123969430',
    destination_caller_id_name: null,
    destination_caller_id_number: null,
    destination_enabled: 'true',
    destination_description: null,
    domain_name: 'sip.axionhq.hivepbx.com',
    destinationAction: 'phrase:f96597b4-dd1f-46d3-bce4-53f367b4b39e',
  },
  {
    destination_uuid: 'db57dade-0d3c-4797-b954-feeb9f37487c',
    destination_context: 'public',
    destination_number: '514145',
    destination_prefix: null,
    destination_type: 'inbound',
    destination_accountcode: '193123969430',
    destination_caller_id_name: null,
    destination_caller_id_number: null,
    destination_enabled: 'true',
    destination_description: null,
    domain_name: 'sip.axionhq.hivepbx.com',
    destinationAction: '111 RB check (Voicemail)',
  },
  {
    destination_uuid: '2dbf0665-5bcb-4588-8b16-02178833d3a6',
    destination_context: 'sip.axionhq.hivepbx.com',
    destination_number: '534555566',
    destination_prefix: '91',
    destination_type: 'local',
    destination_accountcode: '233000000000',
    destination_caller_id_name: 'test',
    destination_caller_id_number: '1001',
    destination_enabled: 'true',
    destination_description: 'test',
    domain_name: 'sip.axionhq.hivepbx.com',
    destinationAction: '112 check rb (Voicemail)',
  },
  {
    destination_uuid: '3776b60b-29f5-43fb-8141-4dec9ff2088d',
    destination_context: 'public',
    destination_number: '63595640611',
    destination_prefix: null,
    destination_type: 'inbound',
    destination_accountcode: '193123969430',
    destination_caller_id_name: null,
    destination_caller_id_number: null,
    destination_enabled: 'true',
    destination_description: 'QA Test',
    domain_name: 'sip.axionhq.hivepbx.com',
    destinationAction: '112 check rb (Voicemail)',
  },
  {
    destination_uuid: 'd9970e03-dd51-417f-9230-51082d77fcd8',
    destination_context: 'public',
    destination_number: '77887',
    destination_prefix: null,
    destination_type: 'inbound',
    destination_accountcode: '193123969430',
    destination_caller_id_name: null,
    destination_caller_id_number: null,
    destination_enabled: 'true',
    destination_description: null,
    domain_name: 'sip.axionhq.hivepbx.com',
    destinationAction: 'hangup (Other)',
  },
]

/** Maps one raw sample record onto the module's DestinationDetails shape, filling in the form-only fields the sample doesn't carry. */
const toSeedFields = (raw: RawSampleDestination): DestinationDetails => ({
  destination_uuid: raw.destination_uuid,
  destination_type: raw.destination_type,
  destination_number: raw.destination_number,
  destination_prefix: raw.destination_prefix ?? undefined,
  destination_context: raw.destination_context,
  destination_accountcode: raw.destination_accountcode,
  destination_caller_id_name: raw.destination_caller_id_name ?? undefined,
  destination_caller_id_number: raw.destination_caller_id_number ?? undefined,
  destination_enabled: raw.destination_enabled === 'true',
  destination_description: raw.destination_description ?? undefined,
  domain_name: raw.domain_name,
  destinationActionDisplay: raw.destinationAction ?? undefined,
  destination_order: 100,
  destination_type_voice: true,
  destination_type_fax: false,
  destination_type_text: false,
  destination_type_emergency: false,
  destination_record: false,
  sms_enabled: false,
})

/**
 * The Axion-compatible sample list response (9 records: 7 inbound, 1 outbound, 1 local — all
 * under DEFAULT_DOMAIN) is the primary seed set, so `showAll=false` immediately has real,
 * domain-matching data to return. A few additional Branch/Remote-domain records are appended
 * purely so "Show All" has more than one domain to actually demonstrate scoping across.
 */
export const mockDestinations: DestinationDetails[] = [
  ...rawSampleDestinations.map(toSeedFields),
  seed('dest-2010', '2010', { domain_name: BRANCH_DOMAIN, destination_action: 'extension:201', destination_description: 'Branch reception', destination_caller_id_name: 'Branch Office' }),
  seed('dest-2011', '2011', { domain_name: BRANCH_DOMAIN, destination_type: 'outbound', destination_description: 'Branch outbound trunk', destination_area_code: '212' }),
  seed('dest-2012', '2012', { domain_name: BRANCH_DOMAIN, destination_action: 'ring_group:branch-support', destination_description: 'Branch support queue' }),
  seed('dest-3010', '3010', { domain_name: REMOTE_DOMAIN, destination_action: 'extension:301', destination_description: 'Remote office line', destination_caller_id_name: 'Remote Office' }),
  seed('dest-3011', '3011', { domain_name: REMOTE_DOMAIN, destination_type: 'outbound', destination_description: 'Remote outbound trunk' }),
  seed('dest-3012', '3012', { domain_name: REMOTE_DOMAIN, destination_action: 'voicemail:301', destination_description: 'Remote voicemail', destination_enabled: false }),
]
