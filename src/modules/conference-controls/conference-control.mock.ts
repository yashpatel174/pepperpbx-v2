import type { ConferenceControlRecord } from './conference-control.types'

/**
 * Seed data for the service's in-memory working copy. Deliberately wire-shaped: some records carry
 * `control_enabled` / `control_detail_enabled` / `control_digits` as strings so the service's
 * normalization path is exercised, since the audit can't confirm the backend's types (§28).
 * Not domain-scoped — the module has no domain concept in the frontend (§15).
 */
export const mockConferenceControls: ConferenceControlRecord[] = [
  {
    conference_control_uuid: 'ctl-101',
    control_name: 'default',
    control_description: 'Default moderator keypad controls.',
    control_enabled: true,
    conference_control_details: [
      { control_digits: 0, control_action: 'mute', control_data: '', control_detail_enabled: true },
      { control_digits: 1, control_action: 'deaf mute', control_detail_enabled: true },
      { control_digits: 4, control_action: 'energy dn', control_detail_enabled: true },
      { control_digits: 6, control_action: 'energy up', control_detail_enabled: 'true' },
      { control_digits: '9', control_action: 'vol talk up', control_detail_enabled: 'false' },
    ],
  },
  {
    conference_control_uuid: 'ctl-102',
    control_name: 'moderator',
    control_description: 'Extended controls for conference moderators, including kick and lock.',
    control_enabled: 'true',
    conference_control_details: [
      { control_digits: 2, control_action: 'kick', control_data: 'last', control_detail_enabled: true },
      { control_digits: 3, control_action: 'lock', control_detail_enabled: true },
    ],
  },
  {
    conference_control_uuid: 'ctl-103',
    control_name: 'silent',
    control_enabled: 'false',
    conference_control_details: [],
  },
  {
    conference_control_uuid: 'ctl-104',
    control_name: 'Training Room Controls',
    control_description:
      'A deliberately long description used to check that the list truncates text with an scroll and shows the full value in a tooltip.',
    control_enabled: true,
  },
  {
    conference_control_uuid: 'ctl-105',
    control_name: 'Sales Bridge',
    control_description: 'Sales team bridge keypad.',
    control_enabled: false,
    conference_control_details: [{ control_digits: 100, control_action: 'transfer', control_data: 'sales', control_detail_enabled: true }],
  },
  ...Array.from({ length: 8 }, (_, index): ConferenceControlRecord => ({
    conference_control_uuid: `ctl-2${String(index).padStart(2, '0')}`,
    control_name: `Control ${index + 1}`,
    control_enabled: index % 3 !== 0,
    conference_control_details: [{ control_digits: index, control_action: 'mute', control_detail_enabled: true }],
  })),
]
