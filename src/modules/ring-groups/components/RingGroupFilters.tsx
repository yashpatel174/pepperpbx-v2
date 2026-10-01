import { Input } from 'antd'

interface RingGroupFiltersProps {
  /** Uncommitted draft text. */
  value: string
  onChange: (value: string) => void
  /** Enter, the search icon, or the clear icon — commits the server-side search. */
  onSearch: (value: string) => void
}

/**
 * The single free-text search (ring-groups.md §6). Typing commits after a short debounce
 * (useRingGroups); Enter, the search icon or clearing commit immediately. No debounce logic here.
 */
const RingGroupFilters = ({ value, onChange, onSearch }: RingGroupFiltersProps) => (
  <Input.Search
    allowClear
    placeholder="Search ring groups"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onSearch={onSearch}
    style={{ width: '100%', maxWidth: 240 }}
    aria-label="Search ring groups"
  />
)

export default RingGroupFilters
