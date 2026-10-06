import { useMemo, useState } from 'react'
import { Select } from 'antd'
import type { RingGroupOption } from '../ring-group.types'

interface RingBackSelectProps {
  /** Injected by `Form.Item`. */
  value?: string
  /** Receives `undefined` when cleared, as the plain Select did. */
  onChange?: (value?: string) => void
  options: RingGroupOption[]
  placeholder?: string
  loading?: boolean
  disabled?: boolean
  'aria-label'?: string
}

const optionValues = (options: RingGroupOption[]): string[] =>
  options.flatMap((option) => ('options' in option ? option.options.map((item) => item.value) : [option.value]))

/**
 * Ring Back — Axion's `SelectWithTag` (ring-groups.md §8): pick a listed sound or type any value.
 * Same searchable, clearable Select as before; while the typed text matches no option's value it is
 * offered as an extra option, and a stored value missing from the list (a custom one, on Edit) is
 * kept as an option so it still displays. Nothing is created server-side — the value is just text.
 */
const RingBackSelect = ({ value, onChange, options, placeholder, loading, disabled, 'aria-label': ariaLabel }: RingBackSelectProps) => {
  const [search, setSearch] = useState('')

  const selectOptions = useMemo(() => {
    const known = new Set(optionValues(options))
    const typed = search.trim()
    const extra = [value, typed].filter((item, index, list): item is string => !!item && !known.has(item) && list.indexOf(item) === index)
    return [...options, ...extra.map((item) => ({ label: item, value: item }))]
  }, [options, search, value])

  return (
    <Select
      allowClear
      showSearch
      optionFilterProp="label"
      searchValue={search}
      onSearch={setSearch}
      value={value || undefined}
      onChange={(next?: string) => {
        setSearch('')
        onChange?.(next)
      }}
      options={selectOptions}
      placeholder={placeholder}
      loading={loading}
      disabled={disabled}
      aria-label={ariaLabel}
    />
  )
}

export default RingBackSelect
