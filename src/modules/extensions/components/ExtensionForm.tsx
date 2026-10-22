import { useRef } from "react";
import { App, Form, Row, Col } from "antd";
import { domainChangeMessage, domainChangeTitle } from "../../../components/common/domainChangeMessage";
import type { ExtensionFormValues, HiveUserDetails } from "../extension.types";
import useExtensionPermissions from "../useExtensionPermissions";
import ExtensionFormBasicSection from "./ExtensionFormBasicSection";
import ExtensionFormAdvancedSection from "./ExtensionFormAdvancedSection";
import ExtensionFormOptionsSection from "./ExtensionFormOptionsSection";
import ExtensionFormVoicemailSection from "./ExtensionFormVoicemailSection";

export interface ExtensionFormProps {
  mode: "create" | "edit";
  /** The page owns loading — ExtensionForm only ever mounts once real values are ready. */
  initialValues: ExtensionFormValues;
  /** Current record's uuid, so the duplicate-number check excludes itself in edit mode. */
  excludeUuid?: string;
  hive: HiveUserDetails;
  submitting: boolean;
  onSubmit: (values: ExtensionFormValues) => void;
  /** HTML form id — the page renders Cancel/Save in its ModuleHeader toolbar; Save targets
   * this id via `htmlType="submit"` + `form={formId}` so it stays outside this JSX tree but
   * still submits through the real Ant Design Form/validation below. */
  formId: string;
}

/**
 * Shared by AddExtensionPage and EditExtensionPage. Owns fields, layout, conditional
 * behavior (range in Add, password in Edit, missed-call data when email, voicemail section
 * when enabled), section-level permission gating, and validation. Pages own data loading,
 * defaults, and the create/update service call.
 */
const ExtensionForm = ({
  mode,
  initialValues,
  excludeUuid,
  hive,
  submitting,
  onSubmit,
  formId,
}: ExtensionFormProps) => {
  const [form] = Form.useForm<ExtensionFormValues>();
  const { modal } = App.useApp();
  const { canEditBasic, canEditAdvanced, showAdvancedSection } = useExtensionPermissions();

  const voicemailEnabled = Form.useWatch("voicemail_enabled", form);

  const currentContextRef = useRef(initialValues.user_context);

  const handleUserContextChange = (value: string) => {
    if (mode !== "create" || value === currentContextRef.current) {
      currentContextRef.current = value;
      return;
    }
    modal.confirm({
      title: domainChangeTitle,
      content: domainChangeMessage(),
      okText: "Continue",
      cancelText: "Cancel",
      onOk: () => {
        currentContextRef.current = value;
        form.setFieldsValue({ user_context: value, hold_music: undefined });
      },
      onCancel: () => {
        form.setFieldsValue({ user_context: currentContextRef.current });
      },
    });
  };

  const basicDisabled = !canEditBasic;
  const advancedDisabled = !canEditAdvanced;

  return (
    <Form<ExtensionFormValues>
      id={formId}
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onSubmit}
      disabled={submitting}
    >
      <ExtensionFormBasicSection mode={mode} excludeUuid={excludeUuid} hive={hive} disabled={basicDisabled} />

        {showAdvancedSection && (
          <ExtensionFormAdvancedSection
            mode={mode}
            hive={hive}
            disabled={advancedDisabled}
            defaultUserContext={initialValues.user_context}
            onUserContextChange={handleUserContextChange}
          />
        )}
        <div style={{ marginTop: 24 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <ExtensionFormOptionsSection disabled={basicDisabled} />
            </Col>

            {voicemailEnabled && (
              <Col xs={24} lg={12}>
                <ExtensionFormVoicemailSection mode={mode} disabled={basicDisabled} />
              </Col>
            )}
          </Row>
        </div>
    </Form>
  );
};

export default ExtensionForm;
