import { MOCK_DEFAULT_DOMAIN } from "../../../store/domain";
import type {
  HiveOutboundRouteDetails,
  OutboundRouteDetails,
  OutboundRouteGatewayOption,
  SbcDomainOption,
} from "./outbound-route.types";

/**
 * Shares MOCK_DEFAULT_DOMAIN with Extensions/Gateways (store/domain.ts) rather than inventing a
 * separate literal — matching Gateways' own convention (gateway.mock.ts), not Destinations' (which
 * intentionally uses its own literal to match Axion sample data it doesn't have here). Keeping the
 * same default domain as Gateways matters concretely: Outbound Routes' gateway options are seeded
 * with names that echo Gateways' own mock gateways (see mockGatewayOptionsByDomain below), so both
 * modules' `showAll=false` scope must resolve against the same current-domain value.
 */
const DEFAULT_DOMAIN = MOCK_DEFAULT_DOMAIN;
const BRANCH_DOMAIN = "branch.pepperpbx.local";
const REMOTE_DOMAIN = "remote.pepperpbx.local";
/** Matches Destinations' own DEFAULT_DOMAIN (destination.mock.ts) — see the seed comment below. */
const AXION_SAMPLE_DOMAIN = "sip.axionhq.hivepbx.com";

export const mockHiveOutboundRouteDetails: HiveOutboundRouteDetails = {
  defaultDomain: DEFAULT_DOMAIN,
  domainOptions: [DEFAULT_DOMAIN, BRANCH_DOMAIN, REMOTE_DOMAIN],
  accountNumber: "193123969430",
  sbcDomainIp: "sbc1.pepperpbx.local",
};

/**
 * TEMPORARY DUMMY FALLBACK — REMOVE ONCE THE REAL DIALPLAN-XML ENDPOINT IS AVAILABLE.
 *
 * The mock XML store (`xmlByRoute` in outbound-route.service.ts) starts empty, so today every
 * route's raw dialplan XML genuinely has nothing saved for it — `getOutboundRouteXml` would
 * correctly resolve `xml: null` and the XML viewer (DialplanXmlPage.tsx) would correctly render
 * its EmptyState ("No XML Found."). Until a real backend XML endpoint exists, that's not useful
 * for demoing/reviewing the XML viewer, so `getOutboundRouteXml` substitutes this placeholder
 * document instead of `null` for routes with nothing saved yet.
 *
 * Shaped as a FreeSWITCH dialplan `<extension>` block — the real structure this "Dialplan
 * Manager XML" screen edits — rather than a generic placeholder, so it's representative of what
 * a real response should look like. The embedded XML comment makes it visually obvious in the
 * editor that this is placeholder content, not a real saved route.
 *
 * TO REMOVE: in outbound-route.service.ts's getOutboundRouteXml, change
 * `xmlByRoute.get(dialplanUuid) ?? mockDialplanXmlFallback` back to
 * `xmlByRoute.get(dialplanUuid) ?? null`, then delete this constant. Nothing else (the page, the
 * type, the EmptyState handling) needs to change — `OutboundRouteXml.xml` is already `string | null`.
 */
export const mockDialplanXmlFallback = `<?xml version="1.0" encoding="UTF-8"?>
<!-- TEMPORARY placeholder XML — not real backend data (see outbound-route.mock.ts). -->
<extension name="sample_outbound_route" continue="false">
  <condition field="destination_number" expression="^(.*)$">
    <action application="set" data="ringback=\${us-ring}"/>
    <action application="export" data="dialed_extension=$1"/>
    <action application="bridge" data="sofia/gateway/sample-gateway/$1"/>
  </condition>
</extension>
`;

export const mockSbcDomains: SbcDomainOption[] = [
  { value: "global", label: "Global" },
  { label: "sbc1.pepperpbx.local", value: "sbc1.pepperpbx.local" },
  { label: "sbc2.pepperpbx.local", value: "sbc2.pepperpbx.local" },
];

/**
 * GET .../outboundRoutes/gateways?domain_name=... — a dedicated, domain-scoped endpoint per the
 * audit (outbound-routes.md §12), distinct from the Gateways module's own CRUD list endpoint.
 * Kept as this module's own independent mock (not imported from gateway.mock.ts) — matches
 * Destinations' documented precedent of not depending on sibling modules' mock data at the
 * component/service level (destinations.md-derived convention, see CLAUDE.md §11) — but the
 * *names* deliberately echo Gateways' own seed gateways for a realistic cross-reference.
 */
export const mockGatewayOptionsByDomain: Record<string, OutboundRouteGatewayOption[]> = {
  [DEFAULT_DOMAIN]: [
    { label: "acme-voip", value: "acme-voip" },
    { label: "acme-backup", value: "acme-backup" },
    { label: "global-carrier", value: "global-carrier" },
  ],
  [BRANCH_DOMAIN]: [
    { label: "branch-local", value: "branch-local" },
    { label: "branch-fax", value: "branch-fax" },
  ],
  [REMOTE_DOMAIN]: [
    { label: "remote-sip", value: "remote-sip" },
    { label: "remote-overflow", value: "remote-overflow" },
  ],
};

/**
 * Seed data for outbound-route.service.ts's in-memory working copy — replace with a real API
 * response once the backend endpoints are available. Records are stored in the rich
 * create/update shape (OutboundRouteDetails); the list is projected from these by the service.
 * Not mutated directly — the service owns a copy.
 */
const seed = (uuid: string, name: string, fields: Partial<OutboundRouteDetails>): OutboundRouteDetails => ({
  dialplan_uuid: uuid,
  outbound_route_name: name,
  outbound_caller_id_number: "1000",
  accountcode: mockHiveOutboundRouteDetails.accountNumber,
  domain_name: DEFAULT_DOMAIN,
  dialplan_context: DEFAULT_DOMAIN,
  sbcDomainIp: mockSbcDomains[0].value,
  dialplan_order: 100,
  dialplan_description: undefined,
  pin_numbers_enabled: false,
  dialplan_enabled: true,
  dialplan_continue: false,
  dialplan_destination: false,
  dialplan_expression: "^(.*)$",
  gateways: [mockGatewayOptionsByDomain[DEFAULT_DOMAIN][0].value],
  ...fields,
});

export const mockOutboundRoutes: OutboundRouteDetails[] = [
  seed("or-us-local", "US Local", {
    outbound_caller_id_name: "Acme HQ",
    outbound_caller_id_number: "18053223591",
    prefix_number: "1",
    dialplan_number: "10884404",
    dialplan_order: 100,
    dialplan_description: "Local 10-digit US calls",
    dialplan_expression: "^1?(\\d{10})$",
    gateways: ["acme-voip", "acme-backup"],
  }),
  seed("or-us-international", "International", {
    outbound_caller_id_name: "Acme HQ",
    prefix_number: "011",
    toll_allow: "international",
    dialplan_number: "011",
    dialplan_order: 200,
    dialplan_description: "International dialing via primary carrier",
    dialplan_expression: "^011(\\d+)$",
    gateways: ["global-carrier"],
    pin_numbers_enabled: true,
  }),
  seed("or-us-emergency", "Emergency", {
    dialplan_number: "911",
    dialplan_order: 100,
    limit: "5",
    dialplan_description: "Emergency services",
    dialplan_expression: "^911$",
    gateways: ["acme-voip"],
  }),
  seed("or-us-tollfree", "Toll Free", {
    dialplan_number: "8005551234",
    dialplan_order: 300,
    dialplan_description: "Toll-free outbound",
    dialplan_expression: "^1?(8(00|33|44|55|66|77|88)\\d{7})$",
    gateways: ["acme-backup"],
    dialplan_enabled: false,
  }),
  seed("or-branch-local", "Branch Local", {
    domain_name: BRANCH_DOMAIN,
    dialplan_context: BRANCH_DOMAIN,
    dialplan_number: "2010",
    dialplan_order: 100,
    dialplan_description: "Branch office local calls",
    dialplan_expression: "^(\\d{7})$",
    gateways: [mockGatewayOptionsByDomain[BRANCH_DOMAIN][0].value],
  }),
  seed("or-branch-fax", "Branch Fax Route", {
    domain_name: BRANCH_DOMAIN,
    dialplan_context: BRANCH_DOMAIN,
    dialplan_number: "2011",
    dialplan_order: 400,
    dialplan_description: "Outbound fax route",
    dialplan_expression: "^(\\d{10})$",
    gateways: [mockGatewayOptionsByDomain[BRANCH_DOMAIN][1].value],
    dialplan_enabled: false,
  }),
  seed("or-remote-sip", "Remote SIP Route", {
    domain_name: REMOTE_DOMAIN,
    dialplan_context: REMOTE_DOMAIN,
    dialplan_number: "3010",
    dialplan_order: 100,
    dialplan_description: "Remote office outbound",
    dialplan_expression: "^(\\d{10})$",
    gateways: [mockGatewayOptionsByDomain[REMOTE_DOMAIN][0].value],
  }),
  /**
   * Reference-sample records for AXION_SAMPLE_DOMAIN ("sip.axionhq.hivepbx.com") — the same
   * literal Destinations' own mock (destination.mock.ts) seeds as its DEFAULT_DOMAIN. A session
   * that has ever bootstrapped Destinations before visiting Outbound Routes will already have
   * that domain persisted as the shared current-domain (store/domain.ts's `currentDomain`, only
   * ever set once via its `if (!currentDomain)` guard), so `showAll=false` here needs matching
   * domain-scoped records too, or the list renders empty despite real seed data existing under
   * DEFAULT_DOMAIN above. Field values mirror a real captured `GET .../outboundRoutes/list`
   * sample response; fields that response carries but this module's lean OutboundRouteDetails
   * type doesn't model (domain_uuid, the per-record pbx_* permission flags) are intentionally not
   * reproduced — same "lean entity, no unmodeled backend envelope fields" convention documented in
   * destination.mock.ts's RawSampleDestination/toSeedFields.
   */
  seed("8a087dbc-4260-4143-9eaa-90d1b6f702e7", "freetdm.d5", {
    domain_name: AXION_SAMPLE_DOMAIN,
    dialplan_context: AXION_SAMPLE_DOMAIN,
    dialplan_order: 100,
    dialplan_description: "23-07-26 b",
  }),
  seed("f8b7ae72-0be5-4388-ab6a-f29596fa6180", "freetdm.d5", {
    domain_name: AXION_SAMPLE_DOMAIN,
    dialplan_context: AXION_SAMPLE_DOMAIN,
    dialplan_order: 100,
    dialplan_description: "23-07-26 b (Copy)",
  }),
];
