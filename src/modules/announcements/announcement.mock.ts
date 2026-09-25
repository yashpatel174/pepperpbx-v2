import { MOCK_DEFAULT_DOMAIN } from '../../store/domain'
import type { ActionOptionGroup, AnnouncementDetails, HiveAnnouncementDetails } from './announcement.types'

/**
 * Shares MOCK_DEFAULT_DOMAIN with Extensions/Gateways/Outbound Routes (store/domain.ts) rather
 * than inventing a separate literal — matching those modules' convention.
 */
const DEFAULT_DOMAIN = MOCK_DEFAULT_DOMAIN
const BRANCH_DOMAIN = 'branch.pepperpbx.local'
const REMOTE_DOMAIN = 'remote.pepperpbx.local'
/**
 * Matches Destinations' own DEFAULT_DOMAIN (destination.mock.ts) and Outbound Routes'
 * AXION_SAMPLE_DOMAIN (outbound-route.mock.ts). A session that has ever bootstrapped Destinations
 * before visiting Announcements will already have this domain persisted as the shared
 * current-domain (store/domain.ts's `currentDomain`, only ever set once via its
 * `if (!currentDomain)` guard) — so `showAll=false` needs seed records under this domain too, or
 * the list renders "No Data Found" despite real seed data existing under DEFAULT_DOMAIN below.
 */
const AXION_SAMPLE_DOMAIN = 'sip.axionhq.hivepbx.com'

export const mockHiveAnnouncementDetails: HiveAnnouncementDetails = {
  defaultDomain: DEFAULT_DOMAIN,
  domainOptions: [DEFAULT_DOMAIN, BRANCH_DOMAIN, REMOTE_DOMAIN],
}

/**
 * GET .../phrases/playActionOptions?domain_name=... — domain-scoped music-on-hold file options
 * for Structure rows whose Function is "Play" (announcements.md §8/§9/§12/§33). Kept as this
 * module's own independent mock, not imported from another module's mock data — matches Outbound
 * Routes'/Destinations' documented precedent of not depending on sibling modules' mock data.
 */
export const mockPlayActionOptionsByDomain: Record<string, ActionOptionGroup[]> = {
  [DEFAULT_DOMAIN]: [
    { label: 'Music on Hold', options: [{ label: 'default', value: 'local_stream://default' }] },
    {
      label: 'Recordings',
      options: [
        { label: 'Welcome Greeting', value: 'https://cloud-drive.hivepbx.com/fsstorage-ivrfiles/default/Welcome.wav' },
        { label: 'Sales Announcement', value: 'https://cloud-drive.hivepbx.com/fsstorage-ivrfiles/default/Sales.wav' },
      ],
    },
  ],
  [BRANCH_DOMAIN]: [
    { label: 'Music on Hold', options: [{ label: 'default', value: 'local_stream://default' }] },
    { label: 'Recordings', options: [{ label: 'Branch Welcome', value: 'https://cloud-drive.hivepbx.com/fsstorage-ivrfiles/branch/Welcome.wav' }] },
  ],
  [REMOTE_DOMAIN]: [
    { label: 'Music on Hold', options: [{ label: 'default', value: 'local_stream://default' }] },
    { label: 'Recordings', options: [{ label: 'Remote Welcome', value: 'https://cloud-drive.hivepbx.com/fsstorage-ivrfiles/remote/Welcome.wav' }] },
  ],
}

/**
 * GET .../phrases/executeActionOptions?domain_name=... — domain-scoped dialplan-hook options for
 * Structure rows whose Function is "Execute" (announcements.md §8/§9/§12/§33). Same
 * self-contained-mock convention as the play options above. The group labels (here and above) are
 * mock-only placeholders — the real backend's groups/values are not confirmed by the audit.
 */
export const mockExecuteActionOptionsByDomain: Record<string, ActionOptionGroup[]> = {
  [DEFAULT_DOMAIN]: [
    {
      label: 'Transfer',
      options: [
        { label: 'Transfer to Voicemail (101)', value: 'transfer:*99101 XML sip.pepperpbx.local' },
        { label: 'Transfer to Operator', value: 'transfer:0 XML sip.pepperpbx.local' },
      ],
    },
    { label: 'Call Control', options: [{ label: 'Hangup', value: 'hangup' }] },
  ],
  [BRANCH_DOMAIN]: [
    { label: 'Transfer', options: [{ label: 'Transfer to Branch Reception', value: 'transfer:201 XML branch.pepperpbx.local' }] },
    { label: 'Call Control', options: [{ label: 'Hangup', value: 'hangup' }] },
  ],
  [REMOTE_DOMAIN]: [
    { label: 'Transfer', options: [{ label: 'Transfer to Remote Office', value: 'transfer:301 XML remote.pepperpbx.local' }] },
    { label: 'Call Control', options: [{ label: 'Hangup', value: 'hangup' }] },
  ],
}

/**
 * Seed data for announcement.service.ts's in-memory working copy — replace with a real API
 * response once the backend endpoints are available. Records are stored in the rich
 * create/update shape (AnnouncementDetails); the list is projected from these by the service.
 * Not mutated directly — the service owns a copy.
 */
const seed = (uuid: string, name: string, fields: Partial<AnnouncementDetails>): AnnouncementDetails => ({
  phrase_uuid: uuid,
  phrase_name: name,
  phrase_language: 'en',
  domain_name: DEFAULT_DOMAIN,
  phrase_enabled: true,
  phrase_details: [],
  ...fields,
})

export const mockAnnouncements: AnnouncementDetails[] = [
  seed('ann-welcome', 'Welcome Greeting', {
    phrase_description: 'Main welcome greeting played to all inbound callers',
    phrase_details: [
      { phrase_detail_function: 'play-file', phrase_detail_data: 'https://cloud-drive.hivepbx.com/fsstorage-ivrfiles/default/Welcome.wav', phrase_detail_order: 100 },
      { phrase_detail_function: 'pause-execute', phrase_detail_data: '0.5', phrase_detail_order: 200 },
      { phrase_detail_function: 'execute', phrase_detail_data: 'transfer:0 XML sip.pepperpbx.local', phrase_detail_order: 300 },
    ],
  }),
  seed('ann-sales', 'Sales Announcement', {
    phrase_language: 'es',
    phrase_description: 'Played before routing to the sales queue',
    phrase_details: [
      { phrase_detail_function: 'play-file', phrase_detail_data: 'https://cloud-drive.hivepbx.com/fsstorage-ivrfiles/default/Sales.wav', phrase_detail_order: 100 },
    ],
  }),
  seed('ann-holiday', 'Holiday Closure Notice', {
    phrase_enabled: false,
    phrase_description: 'Enabled seasonally for holiday closures',
  }),
  seed('ann-afterhours', 'After Hours Message', {
    phrase_language: 'fr',
    phrase_details: [
      { phrase_detail_function: 'play-file', phrase_detail_data: 'local_stream://default', phrase_detail_order: 100 },
      { phrase_detail_function: 'execute', phrase_detail_data: 'transfer:*99101 XML sip.pepperpbx.local', phrase_detail_order: 200 },
    ],
  }),
  seed('ann-branch-welcome', 'Branch Welcome', {
    domain_name: BRANCH_DOMAIN,
    phrase_details: [
      { phrase_detail_function: 'play-file', phrase_detail_data: 'https://cloud-drive.hivepbx.com/fsstorage-ivrfiles/branch/Welcome.wav', phrase_detail_order: 100 },
    ],
  }),
  seed('ann-remote-welcome', 'Remote Office Welcome', {
    domain_name: REMOTE_DOMAIN,
    phrase_enabled: false,
  }),
  /**
   * Reference-sample records for AXION_SAMPLE_DOMAIN — see the constant's comment above. Enough
   * records (varied language/status/Structure) to exercise pagination, search, selection, bulk
   * actions, and inline status toggling on their own, independent of the DEFAULT_DOMAIN set above.
   */
  seed('ann-axion-welcome', 'Main Welcome Greeting', {
    domain_name: AXION_SAMPLE_DOMAIN,
    phrase_description: 'Primary greeting for inbound callers',
    phrase_details: [
      { phrase_detail_function: 'play-file', phrase_detail_data: 'https://cloud-drive.hivepbx.com/fsstorage-ivrfiles/default/Welcome.wav', phrase_detail_order: 100 },
      { phrase_detail_function: 'execute', phrase_detail_data: 'transfer:0 XML sip.pepperpbx.local', phrase_detail_order: 200 },
    ],
  }),
  seed('ann-axion-sales', 'Sales Queue Announcement', {
    domain_name: AXION_SAMPLE_DOMAIN,
    phrase_language: 'es',
    phrase_description: 'Played before routing to the sales queue',
    phrase_details: [
      { phrase_detail_function: 'play-file', phrase_detail_data: 'https://cloud-drive.hivepbx.com/fsstorage-ivrfiles/default/Sales.wav', phrase_detail_order: 100 },
    ],
  }),
  seed('ann-axion-support', 'Support Queue Announcement', {
    domain_name: AXION_SAMPLE_DOMAIN,
    phrase_description: 'Played before routing to the support queue',
  }),
  seed('ann-axion-holiday', 'Holiday Closure Notice', {
    domain_name: AXION_SAMPLE_DOMAIN,
    phrase_enabled: false,
    phrase_description: 'Enabled seasonally for holiday closures',
  }),
  seed('ann-axion-afterhours', 'After Hours Message', {
    domain_name: AXION_SAMPLE_DOMAIN,
    phrase_language: 'fr',
    phrase_details: [
      { phrase_detail_function: 'play-file', phrase_detail_data: 'local_stream://default', phrase_detail_order: 100 },
      { phrase_detail_function: 'pause-execute', phrase_detail_data: '1.0', phrase_detail_order: 200 },
    ],
  }),
  seed('ann-axion-emergency', 'Emergency Notice', {
    domain_name: AXION_SAMPLE_DOMAIN,
    phrase_enabled: false,
    phrase_description: 'Reserved for emergency-only broadcast use',
  }),
]
