import { Input } from 'antd'

interface ActiveCallFiltersProps {
  /** Uncommitted draft text — distinct from the committed search that actually filters the table. */
  value: string
  onChange: (value: string) => void
  /** Enter or the search icon — commits immediately, skipping the debounce (active-calls.md §6). */
  onSearch: (value: string) => void
}

/**
 * The clear icon fires onChange('') and then onSearch(''). Its onSearch is skipped so clearing goes
 * through the same debounce + loading path as typing, instead of committing instantly.
 */
const ActiveCallFilters = ({ value, onChange, onSearch }: ActiveCallFiltersProps) => (
  <Input.Search
    allowClear
    placeholder="Search Active Calls"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onSearch={(searchValue, _event, info) => {
      if (info?.source === 'clear') return
      onSearch(searchValue)
    }}
    style={{ width: '100%', maxWidth: 220 }}
    aria-label="Search active calls"
  />
)

export default ActiveCallFilters
