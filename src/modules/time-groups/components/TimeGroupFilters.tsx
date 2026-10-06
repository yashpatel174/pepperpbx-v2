import { Input } from 'antd'

interface TimeGroupFiltersProps {
  /** Uncommitted draft text. */
  value: string
  onChange: (value: string) => void
  /** Enter, the search icon, or the clear icon — commits the server-side search. */
  onSearch: (value: string) => void
}

/**
 * The single free-text search (time-groups.md §6). Typing commits after a short debounce
 * (useTimeGroups — a PepperPBX addition); Enter or the search icon commits immediately.
 */
const TimeGroupFilters = ({ value, onChange, onSearch }: TimeGroupFiltersProps) => (
  <Input.Search
    allowClear
    placeholder="Search time groups"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onSearch={onSearch}
    style={{ width: '100%', maxWidth: 240 }}
    aria-label="Search time groups"
  />
)

export default TimeGroupFilters
