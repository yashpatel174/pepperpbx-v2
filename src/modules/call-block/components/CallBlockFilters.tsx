import { Input } from "antd";

interface CallBlockFiltersProps {
  /** Uncommitted draft text — the page owns this, distinct from the committed/fetched search term. */
  value: string;
  onChange: (value: string) => void;
  /** Fires on Enter or the search-icon click — matches the audit's commit-on-Enter search (call-block.md §6). */
  onSearch: (value: string) => void;
}

/**
 * `Input.Search` is the right primitive here: typing (`onChange`) stays immediately responsive,
 * Enter/the search icon (`onSearch`) commits instantly per the audit, and useCallBlocks.ts
 * debounces a plain typed value into an automatic commit ~400ms after typing stops — this
 * component itself has no debounce logic.
 */
const CallBlockFilters = ({ value, onChange, onSearch }: CallBlockFiltersProps) => (
  <Input.Search
    allowClear
    placeholder="Search call blocks"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onSearch={onSearch}
    style={{
      width: "100%",
      maxWidth: 200,
    }}
    aria-label="Search call blocks"
  />
);

export default CallBlockFilters;
