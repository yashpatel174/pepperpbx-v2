import { Card, Col, Form, Input, Row, Select, theme } from 'antd'
import { extensionReuseNote } from '../../../components/common/extensionReuseNote'
import { extensionRangeOptions } from '../extension.constants'
import { isExtensionNumberTaken } from '../extension.service'
import type { HiveUserDetails } from '../extension.types'
import { editPasswordRules, extensionNumberRules, noEdgeWhitespaceRule } from '../extension.validation'

interface ExtensionFormBasicSectionProps {
  mode: 'create' | 'edit'
  excludeUuid?: string
  hive: HiveUserDetails
  disabled: boolean
}

/**
 * The "Basic" card section: extension number, create-range (Add only), account code,
 * and password (Edit only). Rendered by ExtensionForm; all fields stay within the
 * parent's form instance so values, validation and submission are shared.
 */
const ExtensionFormBasicSection = ({
  mode,
  excludeUuid,
  hive,
  disabled,
}: ExtensionFormBasicSectionProps) => {
  const { token } = theme.useToken()

  return (
  <Card >
    <Row gutter={16}>
      <Col xs={24} sm={12} lg={8}>
        <Form.Item
          name="extension"
          label="Extension"
          tooltip="Enter the extension number"
          extra={<span style={{ color: token.colorError }}>{extensionReuseNote}</span>}
          validateFirst
          rules={extensionNumberRules({
            additionalExtStart: hive.additionalExtStart,
            additionalExtEnd: hive.additionalExtEnd,
            additionalExtExclude: hive.additionalExtExclude,
            excludeUuid,
            isTaken: isExtensionNumberTaken,
          })}
        >
          <Input type={"number"} min={100} max={999999} placeholder="Enter extension" aria-label="Extension number" disabled={disabled} />
        </Form.Item>
      </Col>

      {mode === 'create' && (
        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="range"
            label="Range"
            tooltip="Enter the number of extensions to create. Increments each extension by 1"
            extra="Creates this many consecutive extensions."
          >
            <Select
              aria-label="Number of extensions to create"
            showSearch
              options={extensionRangeOptions.map((value) => ({
                label: String(value),
                value,
              }))}
            />
          </Form.Item>
        </Col>
      )}

      <Col xs={24} sm={12} lg={8}>
        <Form.Item
          name="accountcode"
          label="Account Code"
          tooltip="Enter the account code here"
          rules={[
            { required: true, message: 'Account code required' },
            noEdgeWhitespaceRule,
          ]}
        >
          <Input type={"number"} placeholder="Enter account code" disabled aria-label="Account code" />
        </Form.Item>
      </Col>

      {mode === 'edit' && (
        <Col xs={24} sm={12} lg={8}>
          <Form.Item
            name="password"
            label="Password"
            tooltip="Enter the password here"
            rules={editPasswordRules}
          >
            <Input.Password
              placeholder="Enter password"
              autoComplete="new-password"
              disabled={disabled}
            />
          </Form.Item>
        </Col>
      )}
    </Row>
  </Card>
  )
}

export default ExtensionFormBasicSection