import { Input } from 'antd'

interface ConferenceRoomFiltersProps {
  /** Uncommitted draft text. */
  value: string
  onChange: (value: string) => void
  /** Enter, the search icon, or the clear icon — commits the server-side search. */
  onSearch: (value: string) => void
}

/** The module's single free-text search (conference-rooms.md §6) — no other filters exist in the audit. */
const ConferenceRoomFilters = ({ value, onChange, onSearch }: ConferenceRoomFiltersProps) => (
  <Input.Search
    allowClear
    placeholder="Search conference rooms"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onSearch={onSearch}
    style={{ width: '100%', maxWidth: 240 }}
    aria-label="Search conference rooms"
  />
)

export default ConferenceRoomFilters
