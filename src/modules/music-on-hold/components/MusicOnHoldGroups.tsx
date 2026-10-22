import { Button, Collapse, Flex, Tag, theme, Tooltip, Typography } from 'antd'
import type { CollapseProps } from 'antd'
import { CustomerServiceOutlined, RetweetOutlined } from '@ant-design/icons'
import MusicOnHoldFileTable from './MusicOnHoldFileTable'
import { mohRateLabel } from '../music-on-hold.constants'
import type { MohAudioFile, MohCategory, MohGroup } from '../music-on-hold.types'

interface MusicOnHoldGroupsProps {
  groups: MohGroup[]
  /** Show All mode adds the domain to each group header (music-on-hold.md §5/§15). */
  showAll: boolean
  canEditCategory: boolean
  canViewRow: boolean
  canDeleteRow: boolean
  canShuffle: boolean
  /** Category uuids with a shuffle request in flight. */
  shufflingUuids: string[]
  onEditCategory: (category: MohCategory) => void
  onShuffle: (category: MohCategory) => void
  onView: (category: MohCategory, file: MohAudioFile) => void
  onDelete: (category: MohCategory, file: MohAudioFile) => void
}

/**
 * Accordion of category groups (music-on-hold.md §3/§5): group → category + rate record → audio
 * file table. The hierarchy is kept as the service returns it; nothing is flattened.
 */
const MusicOnHoldGroups = ({
  groups,
  showAll,
  canEditCategory,
  canViewRow,
  canDeleteRow,
  canShuffle,
  shufflingUuids,
  onEditCategory,
  onShuffle,
  onView,
  onDelete,
}: MusicOnHoldGroupsProps) => {
  const { token } = theme.useToken()

  const items: CollapseProps['items'] = groups.map((group) => ({
    key: `${group.domainName}/${group.maintitle}`,
    label: (
      <Flex wrap gap="small" align="center">
        <Typography.Text strong>{group.maintitle}</Typography.Text>
        {showAll && <Tag>{group.domainName}</Tag>}
      </Flex>
    ),
    children: (
      <Flex vertical gap="large">
        {group.child.map((category) => (
          <div key={category.category_uuid}>
            <Flex wrap gap="small" align="center" style={{ marginBottom: token.marginXS }}>
              {/* TODO: wrap with <PermissionGuard permission="music-on-hold.edit"> once RBAC permissions are populated from the backend. */}
              <Button
                type="link"
                disabled={!canEditCategory}
                onClick={() => onEditCategory(category)}
                style={{ padding: 0, fontWeight: 600 }}
                aria-label={`Edit settings of ${category.category_name} at ${mohRateLabel(category.music_on_hold_rate)}`}
              >
                {category.category_name}
              </Button>
              <Tag>{mohRateLabel(category.music_on_hold_rate)}</Tag>
              {category.stereo && (
                // Informational only — Axion renders no action here (music-on-hold.md §3).
                <Tooltip title="Stereo">
                  <CustomerServiceOutlined style={{ color: token.colorTextSecondary }} aria-label="Stereo category" />
                </Tooltip>
              )}
              {category.category_shuffle && (
                // Gated by the Music On Hold edit tier, not Axion's Variables permission (music-on-hold.md §14/§33).
                <Tooltip title="Shuffle">
                  <Button
                    type="text"
                    size="small"
                    icon={<RetweetOutlined style={{ color: token.colorPrimary }} />}
                    disabled={!canShuffle}
                    loading={shufflingUuids.includes(category.category_uuid)}
                    onClick={() => onShuffle(category)}
                    aria-label={`Shuffle ${category.category_name}`}
                  />
                </Tooltip>
              )}
            </Flex>
            <MusicOnHoldFileTable
              files={category.items}
              canViewRow={canViewRow}
              canDeleteRow={canDeleteRow}
              onView={(file) => onView(category, file)}
              onDelete={(file) => onDelete(category, file)}
            />
          </div>
        ))}
      </Flex>
    ),
  }))

  return <Collapse items={items} />
}

export default MusicOnHoldGroups
