import { Input } from 'antd'

interface OutboundRouteFiltersProps {
  /** Uncommitted draft text — the page owns this, distinct from the committed/fetched search term. */
  value: string
  onChange: (value: string) => void
  /** Fires on Enter or the search-icon click — matches the audit's commit-on-Enter search (outbound-routes.md §6). */
  onSearch: (value: string) => void
}

/**
 * `Input.Search` is the right primitive here: typing (`onChange`) stays immediately responsive,
 * Enter/the search icon (`onSearch`) commits instantly per the audit, and useOutboundRoutes.ts
 * debounces a plain typed value into an automatic commit ~400ms after typing stops — this
 * component itself has no debounce logic.
 */
const OutboundRouteFilters = ({ value, onChange, onSearch }: OutboundRouteFiltersProps) => (
  <Input.Search
    allowClear
    placeholder="Search outbound routes"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onSearch={onSearch}
     style={{
      width: "100%",
      maxWidth: 200,
    }}
    aria-label="Search outbound routes"
  />
)

export default OutboundRouteFilters
