import { Input } from 'antd'

interface ActiveCallCenterFiltersProps {
  /** Uncommitted draft text — the hook owns it, distinct from the committed/fetched search term. */
  value: string
  onChange: (value: string) => void
  /** Fires on Enter or the search-icon click, and when the input is emptied (active-call-center.md §6). */
  onSearch: (value: string) => void
}

/** Search box (active-call-center.md §6): typing edits the draft; Enter / the icon / clearing commits it immediately. */
const ActiveCallCenterFilters = ({ value, onChange, onSearch }: ActiveCallCenterFiltersProps) => (
  <Input.Search
    allowClear
    placeholder="Enter Search..."
    value={value}
    onChange={(e) => {
      const next = e.target.value
      onChange(next)
      if (next === '') onSearch('')
    }}
    onSearch={onSearch}
    style={{ width: '100%', maxWidth: 220 }}
    aria-label="Search active call center queues"
  />
)

export default ActiveCallCenterFilters
