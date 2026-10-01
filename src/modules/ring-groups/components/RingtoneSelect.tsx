import { useMemo, useState } from 'react'
import { App, Button, Select } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import { getApiErrorMessage } from '../../../services/api/apiError'
import { alertInfoDeleteWarning } from '../ring-group.constants'
import useAlertInfoOptions from '../useAlertInfoOptions'
import type { AlertInfoOption } from '../ring-group.types'

interface RingtoneSelectProps {
  /** Injected by `Form.Item`. */
  value?: string
  /** Clearing emits `''` (Axion's field default, §10). */
  onChange?: (value: string) => void
  disabled?: boolean
  placeholder?: string
  'aria-label'?: string
}

/** Marks the synthetic `Add "<text>"` option so it can't collide with a real Alert-Info value. */
const CREATE_PREFIX = '__alert-info-create__:'

/**
 * Ringtone (Alert Info) — Axion's `AlertInfoSelect` (ring-groups.md §34.4) on Ant Design's Select:
 * - grouped options from the Alert-Info list, searchable and clearable;
 * - typing text that matches no option (case-insensitive, by value or label) offers `Add "<text>"`,
 *   which creates a Custom entry, reloads the list and selects the new value;
 * - custom entries (`alert_info_is_default === false`) show a delete icon in the open menu, behind a
 *   "Delete Custom Alert Info" confirmation. Deleting doesn't clear a value already selected — it
 *   then shows as the raw stored value.
 */
const RingtoneSelect = ({ value, onChange, disabled, placeholder, 'aria-label': ariaLabel }: RingtoneSelectProps) => {
  const { modal, message } = App.useApp()
  const { groups, loading, create, remove } = useAlertInfoOptions()
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)

  const optionByValue = useMemo(
    () => new Map<string, AlertInfoOption>(groups.flatMap((group) => group.options.map((option) => [option.value, option]))),
    [groups]
  )

  const typed = search.trim()
  const typedLower = typed.toLowerCase()
  const canCreate =
    typed !== '' &&
    !groups.some((group) =>
      group.options.some((option) => option.value.toLowerCase() === typedLower || option.label.toLowerCase() === typedLower)
    )

  const selectOptions = [
    ...groups.map((group) => ({
      label: group.label,
      options: group.options.map((option) => ({ label: option.label, value: option.value })),
    })),
    ...(canCreate ? [{ label: `Add "${typed}"`, value: `${CREATE_PREFIX}${typed}` }] : []),
  ]

  const handleChange = async (next?: string) => {
    setSearch('')
    if (next?.startsWith(CREATE_PREFIX)) {
      const text = next.slice(CREATE_PREFIX.length)
      setCreating(true)
      try {
        await create(text)
        onChange?.(text)
      } catch (err) {
        message.error(getApiErrorMessage(err, 'Failed to add custom alert info.'))
      } finally {
        setCreating(false)
      }
      return
    }
    onChange?.(next ?? '')
  }

  const confirmDelete = (option: AlertInfoOption) => {
    modal.confirm({
      title: 'Delete Custom Alert Info',
      content: alertInfoDeleteWarning,
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await remove(option.alert_info_uuid)
        } catch (err) {
          message.error(getApiErrorMessage(err, 'Failed to delete custom alert info.'))
        }
      },
    })
  }

  return (
    <Select
      showSearch
      allowClear
      optionFilterProp="label"
      searchValue={search}
      onSearch={setSearch}
      value={value || undefined}
      onChange={handleChange}
      options={selectOptions}
      placeholder={placeholder}
      loading={loading || creating}
      disabled={disabled || creating}
      aria-label={ariaLabel}
      optionRender={(option) => {
        const info = typeof option.value === 'string' ? optionByValue.get(option.value) : undefined
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{option.label}</span>
            {info && !info.alert_info_is_default && !disabled && (
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                aria-label={`Delete custom alert info ${info.label}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  // Don't let the click select the option being deleted.
                  e.stopPropagation()
                  confirmDelete(info)
                }}
              />
            )}
          </div>
        )
      }}
    />
  )
}

export default RingtoneSelect
