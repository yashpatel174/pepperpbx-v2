import type { ConferenceProfileRecord } from './conference-profile.types'

/**
 * Seed data for the service's in-memory working copy. Deliberately wire-shaped: some records carry
 * `profile_enabled` / `profile_param_enabled` as strings so the service's normalization path is
 * exercised, since the audit can't confirm the backend's types (§28). Profile names and params are
 * illustrative FreeSWITCH-style values only — the real param semantics are backend-defined (§1).
 * Not domain-scoped — the module has no domain concept in the frontend (§15).
 */
export const mockConferenceProfiles: ConferenceProfileRecord[] = [
  {
    conference_profile_uuid: 'prf-101',
    profile_name: 'default',
    profile_description: 'Default narrowband conference profile.',
    profile_enabled: true,
    conference_profile_params: [
      { profile_param_name: 'rate', profile_param_value: '8000', profile_param_enabled: true },
      { profile_param_name: 'interval', profile_param_value: '20', profile_param_enabled: true },
      { profile_param_name: 'energy-level', profile_param_value: '100', profile_param_description: 'Noise gate threshold.', profile_param_enabled: 'true' },
      { profile_param_name: 'comfort-noise', profile_param_value: 'true', profile_param_enabled: 'false' },
    ],
  },
  {
    conference_profile_uuid: 'prf-102',
    profile_name: 'wideband',
    profile_description: 'Wideband audio at 16 kHz.',
    profile_enabled: 'true',
    conference_profile_params: [
      { profile_param_name: 'rate', profile_param_value: '16000', profile_param_enabled: true },
      { profile_param_name: 'interval', profile_param_value: '20', profile_param_enabled: true },
    ],
  },
  {
    conference_profile_uuid: 'prf-103',
    profile_name: 'ultrawideband',
    profile_enabled: 'false',
    conference_profile_params: [],
  },
  {
    conference_profile_uuid: 'prf-104',
    profile_name: 'cdquality',
    profile_description:
      'A deliberately long description used to check that the list truncates text with an ellipsis and shows the full value in a tooltip.',
    profile_enabled: true,
  },
  {
    conference_profile_uuid: 'prf-105',
    profile_name: 'Sales Bridge',
    profile_description: '  Sales team profile with hold music.  ',
    profile_enabled: false,
    conference_profile_params: [
      { profile_param_name: 'moh-sound', profile_param_value: 'local_stream://moh', profile_param_enabled: true },
    ],
  },
  ...Array.from({ length: 8 }, (_, index): ConferenceProfileRecord => ({
    conference_profile_uuid: `prf-2${String(index).padStart(2, '0')}`,
    profile_name: `Profile ${index + 1}`,
    profile_enabled: index % 3 !== 0,
    conference_profile_params: [{ profile_param_name: 'rate', profile_param_value: '8000', profile_param_enabled: true }],
  })),
]
