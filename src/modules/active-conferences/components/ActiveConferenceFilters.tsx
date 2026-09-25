import { Input } from 'antd'

interface ActiveConferenceFiltersProps {
  /** Uncommitted draft text — distinct from the committed search that actually filters the table. */
  value: string
  onChange: (value: string) => void
  /** Enter or the search icon — commits immediately, skipping the debounce (active-conferences.md §6). */
  onSearch: (value: string) => void
}

/**
 * The clear icon fires onChange('') and then onSearch(''). Its onSearch is skipped so clearing goes
 * through the same debounce + loading path as typing, instead of committing instantly.
 */
const ActiveConferenceFilters = ({ value, onChange, onSearch }: ActiveConferenceFiltersProps) => (
  <Input.Search
    allowClear
    placeholder="Search Active Conferences"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onSearch={(searchValue, _event, info) => {
      if (info?.source === 'clear') return
      onSearch(searchValue)
    }}
    style={{ width: '100%', maxWidth: 200 }}
    aria-label="Search active conferences"
  />
)

export default ActiveConferenceFilters
