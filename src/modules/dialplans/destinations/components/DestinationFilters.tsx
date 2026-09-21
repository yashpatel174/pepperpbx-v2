import { Input } from 'antd'

interface DestinationFiltersProps {
  /** Uncommitted draft text — the page owns this, distinct from the committed/fetched search term. */
  value: string
  onChange: (value: string) => void
  /** Fires on Enter or the search-icon click — matches the Axion reference's commit-on-Enter search. */
  onSearch: (value: string) => void
}

/**
 * `Input.Search` stays the right primitive here: typing (`onChange`) remains immediately
 * responsive, Enter/the search icon (`onSearch`) still commits instantly per the audit
 * (destinations.md §3 item 5), and useDestinations.ts debounces a plain typed value into an
 * automatic commit ~400ms after typing stops — this component itself has no debounce logic.
 */
const DestinationFilters = ({ value, onChange, onSearch }: DestinationFiltersProps) => (
  <Input.Search
    allowClear
    placeholder="Search destinations"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onSearch={onSearch}
     style={{
      width: "100%",
      maxWidth: 200,
    }}
    aria-label="Search destinations"
  />
)

export default DestinationFilters
