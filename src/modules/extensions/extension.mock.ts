import type { Extension } from './extension.types'

/**
 * Temporary development data — replace with a real API response once the backend
 * extensions endpoint is available (see extension.service.ts).
 */
export const mockExtensions: Extension[] = [
  { id: 'ext-101', extension: '101', effectiveCallerIdName: 'John Carter', outboundCallerIdName: 'Acme Sales', callGroup: 'Sales', context: 'from-internal', description: 'Sales Desk 1', status: 'enabled' },
  { id: 'ext-102', extension: '102', effectiveCallerIdName: 'Emily Chen', outboundCallerIdName: 'Acme Sales', callGroup: 'Sales', context: 'from-internal', description: 'Sales Desk 2', status: 'enabled' },
  { id: 'ext-103', extension: '103', effectiveCallerIdName: 'Front Desk', outboundCallerIdName: 'Acme Reception', callGroup: 'Reception', context: 'from-internal', description: 'Main Reception', status: 'enabled' },
  { id: 'ext-104', extension: '104', effectiveCallerIdName: 'Michael Rivera', outboundCallerIdName: 'Acme Support', callGroup: 'Support', context: 'from-internal', description: 'Support Tier 1', status: 'enabled' },
  { id: 'ext-105', extension: '105', effectiveCallerIdName: 'Sarah Patel', outboundCallerIdName: 'Acme Support', callGroup: 'Support', context: 'from-internal', description: 'Support Tier 1', status: 'enabled' },
  { id: 'ext-106', extension: '106', effectiveCallerIdName: 'David Kim', outboundCallerIdName: 'Acme Support', callGroup: 'Support', context: 'from-internal', description: 'Support Tier 2', status: 'disabled' },
  { id: 'ext-107', extension: '107', effectiveCallerIdName: 'Laura Bianchi', outboundCallerIdName: 'Acme Billing', callGroup: 'Billing', context: 'from-internal', description: 'Billing Desk', status: 'enabled' },
  { id: 'ext-108', extension: '108', effectiveCallerIdName: 'James Wilson', outboundCallerIdName: 'Acme Billing', callGroup: 'Billing', context: 'from-internal', description: 'Billing Desk', status: 'enabled' },
  { id: 'ext-109', extension: '109', effectiveCallerIdName: 'Anna Novak', outboundCallerIdName: 'Acme HR', callGroup: 'HR', context: 'from-internal', description: 'Human Resources', status: 'enabled' },
  { id: 'ext-110', extension: '110', effectiveCallerIdName: 'Robert Singh', outboundCallerIdName: 'Acme Executive', callGroup: 'Executive', context: 'from-internal', description: 'VP Operations', status: 'enabled' },
  { id: 'ext-111', extension: '111', effectiveCallerIdName: 'Maria Gonzalez', outboundCallerIdName: 'Acme Executive', callGroup: 'Executive', context: 'from-internal', description: 'CEO Office', status: 'enabled' },
  { id: 'ext-112', extension: '112', effectiveCallerIdName: 'Tom Becker', outboundCallerIdName: 'Acme IT', callGroup: 'IT', context: 'from-internal', description: 'IT Helpdesk', status: 'enabled' },
  { id: 'ext-113', extension: '113', effectiveCallerIdName: 'Grace Lee', outboundCallerIdName: 'Acme IT', callGroup: 'IT', context: 'from-internal', description: 'IT Helpdesk', status: 'disabled' },
  { id: 'ext-114', extension: '114', effectiveCallerIdName: 'Conference Room A', outboundCallerIdName: 'Acme Office', context: 'from-internal', description: 'Conference Room A Phone', status: 'enabled' },
  { id: 'ext-115', extension: '115', effectiveCallerIdName: 'Conference Room B', outboundCallerIdName: 'Acme Office', context: 'from-internal', description: 'Conference Room B Phone', status: 'enabled' },
  { id: 'ext-116', extension: '116', effectiveCallerIdName: 'Warehouse Line', outboundCallerIdName: 'Acme Logistics', callGroup: 'Logistics', context: 'from-internal', description: 'Warehouse Extension', status: 'enabled' },
  { id: 'ext-117', extension: '117', effectiveCallerIdName: "Kevin O'Brien", outboundCallerIdName: 'Acme Logistics', callGroup: 'Logistics', context: 'from-internal', description: 'Dispatch Desk', status: 'enabled' },
  { id: 'ext-118', extension: '118', effectiveCallerIdName: 'Nina Fischer', outboundCallerIdName: 'Acme Marketing', callGroup: 'Marketing', context: 'from-internal', description: 'Marketing Team', status: 'enabled' },
  { id: 'ext-119', extension: '119', context: 'from-internal', description: 'Unassigned Extension', status: 'disabled' },
  { id: 'ext-120', extension: '120', effectiveCallerIdName: 'Voicemail Test', outboundCallerIdName: 'Acme Office', context: 'test-context', description: 'Testing Line', status: 'disabled' },
]
