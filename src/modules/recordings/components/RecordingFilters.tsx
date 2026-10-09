import { Input } from 'antd'

interface RecordingFiltersProps {
  /** Uncommitted draft text — the hook owns it, distinct from the committed/fetched search term. */
  value: string
  onChange: (value: string) => void
  /** Fires on Enter or the search-icon click, and when the input is emptied (recordings.md §6). */
  onSearch: (value: string) => void
}

/** Search box (recordings.md §6): typing edits the draft; Enter / the icon / clearing commits it. No debounce. */
const RecordingFilters = ({ value, onChange, onSearch }: RecordingFiltersProps) => (
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
    aria-label="Search recordings"
  />
)

export default RecordingFilters
