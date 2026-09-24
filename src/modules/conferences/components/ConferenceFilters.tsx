import { Input } from 'antd'

interface ConferenceFiltersProps {
  /** Uncommitted draft text — the page owns this, distinct from the committed/fetched search term. */
  value: string
  onChange: (value: string) => void
  /** Fires on Enter or the search-icon click — matches the audit's commit-on-Enter search (conferences.md §6). */
  onSearch: (value: string) => void
}

/**
 * `Input.Search` is the right primitive here: typing (`onChange`) stays immediately responsive,
 * Enter/the search icon (`onSearch`) commits instantly per the audit, and useConferences.ts
 * debounces a plain typed value into an automatic commit ~400ms after typing stops — this
 * component itself has no debounce logic.
 */
const ConferenceFilters = ({ value, onChange, onSearch }: ConferenceFiltersProps) => (
  <Input.Search
    allowClear
    placeholder="Search conferences"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onSearch={onSearch}
    style={{
      width: '100%',
      maxWidth: 200,
    }}
    aria-label="Search conferences"
  />
)

export default ConferenceFilters
