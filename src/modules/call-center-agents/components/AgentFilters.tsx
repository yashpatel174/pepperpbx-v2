import { Input } from 'antd'

interface AgentFiltersProps {
  /** Uncommitted draft text — the page owns this, distinct from the committed/fetched search term. */
  value: string
  onChange: (value: string) => void
  /** Fires on Enter or the search-icon click — matches the audit's commit-on-Enter search (call-center.md §6). */
  onSearch: (value: string) => void
}

/**
 * `Input.Search` is the right primitive here: typing (`onChange`) stays immediately responsive,
 * Enter/the search icon (`onSearch`) commits instantly per the audit, and useCallCenterAgents.ts
 * debounces a plain typed value into an automatic commit ~400ms after typing stops — this
 * component itself has no debounce logic.
 */
const AgentFilters = ({ value, onChange, onSearch }: AgentFiltersProps) => (
  <Input.Search
    allowClear
    placeholder="Search call center agents"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onSearch={onSearch}
    style={{
      width: "100%",
      maxWidth: 200,
    }}
    aria-label="Search call center agents"
  />
)

export default AgentFilters
