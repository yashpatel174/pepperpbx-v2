import { useState } from "react";
import { App, Button, Card, Col, Form, Row, Select, Tooltip } from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { tierLevelAndPositionOptions } from "../call-center.constants";
import { removeCallCenterTier } from "../call-center.service";
import type { CallCenterFormValues, SelectOption } from "../call-center.types";
import { getApiErrorMessage } from "../../../services/api/apiError";

interface CallCenterTierSectionProps {
  agentOptions: SelectOption[];
  optionsLoading?: boolean;
  disabled?: boolean;
  /** The queue's own uuid — only present in Edit mode (a queue must exist before any of its tier
   * rows can be "existing, persisted" rows). Undefined on Add, where every row is always new. */
  queueUuid?: string;
}

/**
 * Dynamic Agent Tier field array (`callcenter_tier`).
 *
 * Each row contains:
 * - Agent Name
 * - Tier Level
 * - Tier Position
 *
 * Rows can be added or removed using Ant Design's Form.List. The complete tier array is still
 * submitted together with the rest of the Call Center form values on Save (call-center.service.ts's
 * toDetails filters out any row with no agent selected, so a queue can be saved with zero agents).
 *
 * Delete behavior (call-center.md §8/§9/§11/§20/§21/§27/§33) distinguishes two cases:
 * - An existing, persisted row (has its own `call_center_tier_uuid`, loaded from the queue's
 *   details) — Delete calls `removeCallCenterTier` (the Tier-relationship-only removal, never the
 *   Agent entity) first, then removes the row from local form state only on success.
 * - A newly-added, never-saved row (no `call_center_tier_uuid` yet) — Delete removes it from local
 *   form state only; no backend call is made for a row that was never persisted.
 * No confirmation dialog either way, matching the audit's documented immediate-delete behavior.
 */
const CallCenterTierSection = ({
  agentOptions,
  optionsLoading,
  disabled = false,
  queueUuid,
}: CallCenterTierSectionProps) => {
  const form = Form.useFormInstance<CallCenterFormValues>();
  const { message } = App.useApp();
  const domainName = Form.useWatch("domain_name", form);
  const queueExtension = Form.useWatch("queue_extension", form);
  const [removingKey, setRemovingKey] = useState<number | null>(null);

  return (
    <Form.List name="callcenter_tier">
      {(fields, { add, remove }) => {
        const handleRemove = async (field: { key: number; name: number }) => {
          const tierUuid = form.getFieldValue(["callcenter_tier", field.name, "call_center_tier_uuid"]) as
            | string
            | undefined;

          // New, never-saved row — no backend relationship exists yet, so just drop it locally.
          if (!tierUuid || !queueUuid) {
            remove(field.name);
            return;
          }

          setRemovingKey(field.key);
          try {
            await removeCallCenterTier({
              call_center_queue_uuid: queueUuid,
              call_center_tier_uuid: [tierUuid],
              domain_name: domainName ?? "",
              queue_extension: queueExtension ?? "",
            });
            remove(field.name);
          } catch (err) {
            message.error(getApiErrorMessage(err, "Failed to remove agent from queue."));
          } finally {
            setRemovingKey(null);
          }
        };

        return (
          <Card
            title={
              <span>
                Agent{" "}
                <Tooltip title="Attach agents to this queue with a tier level and position (0–9). Lower tier levels are tried first.">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                disabled={disabled}
                onClick={() =>
                  add({
                    tier_level: 0,
                    tier_position: 0,
                  })
                }
              >
                Add
              </Button>
            }
          >
            {fields.map((field) => (
              <Row gutter={[16, 0]} key={field.key} align="middle">
                <Col xs={24} sm={10}>
                  {/* Optional — a queue may have zero agents (call-center.md §8/§10/§27); rows
                      left without an agent are dropped by call-center.service.ts's toDetails. */}
                  <Form.Item
                    name={[field.name, "call_center_agent_uuid"]}
                    label="Agent Name"
                  >
                    <Select
                      showSearch
                      optionFilterProp="label"
                      placeholder="Select agent"
                      options={agentOptions}
                      loading={optionsLoading}
                      disabled={disabled}
                      aria-label="Agent name"
                    />
                  </Form.Item>
                </Col>

                <Col xs={12} sm={6}>
                  <Form.Item
                    name={[field.name, "tier_level"]}
                    label="Tier Level"
                  >
                    <Select
                    showSearch
                      options={tierLevelAndPositionOptions}
                      disabled={disabled}
                      aria-label="Tier level"
                    />
                  </Form.Item>
                </Col>

                <Col xs={12} sm={6}>
                  <Form.Item
                    name={[field.name, "tier_position"]}
                    label="Tier Position"
                  >
                    <Select
                      showSearch
                      options={tierLevelAndPositionOptions}
                      disabled={disabled}
                      aria-label="Tier position"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={2}>
                  <Form.Item label=" ">
                    <Tooltip title="Remove agent from queue">
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        loading={removingKey === field.key}
                        disabled={disabled || (removingKey !== null && removingKey !== field.key)}
                        onClick={() => handleRemove(field)}
                        aria-label="Remove agent from queue"
                      />
                    </Tooltip>
                  </Form.Item>
                </Col>
              </Row>
            ))}
          </Card>
        );
      }}
    </Form.List>
  );
};

export default CallCenterTierSection;
