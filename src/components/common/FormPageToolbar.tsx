import type { ReactNode } from 'react'
import { Button, Space } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'

export interface FormPageToolbarProps {
  /** The primary Back button's action — every Add/Edit page navigates back to its list. */
  onBack: () => void
  /** Right-hand actions in display order (e.g. Cancel, Save, plus any page-specific buttons). */
  children?: ReactNode
}

/**
 * The Add/Edit page toolbar rendered in `ModuleHeader`'s `toolbar` slot: Back on the left, the
 * page's actions on the right. Both groups wrap onto additional lines (with an 8px gap) when the
 * row is too narrow, instead of overflowing horizontally — the same layout the wrapping Add/Edit
 * toolbars already use, centralized here.
 */
const FormPageToolbar = ({ onBack, children }: FormPageToolbarProps) => (
  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
    <Button type="primary" icon={<ArrowLeftOutlined />} onClick={onBack}>
      Back
    </Button>
    <Space wrap>{children}</Space>
  </div>
)

export default FormPageToolbar
