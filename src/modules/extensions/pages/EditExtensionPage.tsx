import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { App, Button, Space } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import ModuleHeader from "../../../components/common/ModuleHeader";
import LoadingState from "../../../components/feedback/LoadingState";
import EmptyState from "../../../components/feedback/EmptyState";
import ErrorState from "../../../components/feedback/ErrorState";
import ExtensionForm from "../components/ExtensionForm";
import { getExtensionDetails, getHiveUserDetails, updateExtension } from "../extension.service";
import type { ExtensionDetails, ExtensionFormValues, HiveUserDetails } from "../extension.types";

const EDIT_EXTENSION_FORM_ID = "edit-extension-form";

/** Maps the stored/API details back into the form model — user_context comes from domain_name. */
const toFormValues = (details: ExtensionDetails): ExtensionFormValues => ({
  range: 1,
  extension: details.extension,
  accountcode: details.accountcode,
  password: details.password ?? "",
  directory_first_name: details.directory_first_name,
  directory_last_name: details.directory_last_name,
  user_context: details.domain_name,
  limit_max: String(details.limit_max),
  limit_destination: details.limit_destination,
  missed_call_app: details.missed_call_app,
  missed_call_data: details.missed_call_data,
  call_timeout: String(details.call_timeout),
  call_group: details.call_group,
  user_record: details.user_record,
  hold_music: details.hold_music,
  sip_force_contact: details.sip_force_contact,
  sip_force_expires: details.sip_force_expires === undefined ? "" : String(details.sip_force_expires),
  sip_bypass_media: details.sip_bypass_media,
  voicemail_file: details.voicemail_file,
  effective_caller_id_name: details.effective_caller_id_name,
  effective_caller_id_number: details.effective_caller_id_number,
  outbound_caller_id_name: details.outbound_caller_id_name,
  outbound_caller_id_number: details.outbound_caller_id_number,
  emergency_caller_id_name: details.emergency_caller_id_name,
  emergency_caller_id_number: details.emergency_caller_id_number,
  max_registrations: details.max_registrations,
  toll_allow: details.toll_allow,
  auth_acl: details.auth_acl,
  cidr: details.cidr,
  mwi_account: details.mwi_account,
  absolute_codec_string: details.absolute_codec_string,
  dial_string: details.dial_string,
  description: details.description?.trim(),
  call_screen_enabled: details.call_screen_enabled,
  force_ping: details.force_ping,
  directory_visible: details.directory_visible,
  directory_exten_visible: details.directory_exten_visible,
  voicemail_transcription_enabled: details.voicemail_transcription_enabled,
  voicemail_local_after_email: details.voicemail_local_after_email,
  voicemail_enabled: details.voicemail_enabled,
  enabled: details.enabled,
  voicemail_mail_to: details.voicemail_mail_to,
  voicemail_password: details.voicemail_password ?? "",
});

const EditExtensionPage = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { extensionId: extensionUuid } = useParams<{ extensionId: string }>();

  const [hive, setHive] = useState<HiveUserDetails | null>(null);
  const [details, setDetails] = useState<ExtensionDetails | null>(null);
  const [oldExtNumber, setOldExtNumber] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const load = useCallback(
    async (withSpinner: boolean) => {
      if (!extensionUuid) return;
      if (withSpinner) setLoading(true);
      setError(null);
      try {
        const [hiveDetails, extensionDetails] = await Promise.all([
          getHiveUserDetails(),
          getExtensionDetails(extensionUuid),
        ]);
        setHive(hiveDetails);
        setDetails(extensionDetails);
        setOldExtNumber(extensionDetails.extension);
        setFormKey((key) => key + 1);
      } catch {
        setError("Failed to load this extension.");
      } finally {
        if (withSpinner) setLoading(false);
      }
    },
    [extensionUuid],
  );

  useEffect(() => {
    if (!extensionUuid) {
      setLoading(false);
      return;
    }
    load(true);
  }, [load, extensionUuid]);

  const handleCancel = () => navigate("/account/extensions");

  const handleSubmit = async (values: ExtensionFormValues) => {
    if (!details) return;
    setSubmitting(true);
    try {
      const updated = await updateExtension(details.extension_uuid, values, oldExtNumber);
      message.success(`Extension ${updated.extension} updated successfully.`);
      // Stay on the Edit page: re-fetch details and re-populate so the form reflects the
      // saved state (including a renumbered old_extension boundary for the next change).
      await load(false);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to update extension.");
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return <ErrorState message={error} onRetry={() => load(true)} />;
  }

  if (loading) {
    return <LoadingState rows={10} />;
  }

  if (!details || !hive) {
    return (
      <EmptyState
        description="Extension not found."
        action={<Button onClick={handleCancel}>Back to Extensions</Button>}
      />
    );
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <ModuleHeader
        title="Edit Extension"
        toolbar={
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={handleCancel}>
              Back
            </Button>

            <Space>
              <Button onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>

              <Button type="primary" htmlType="submit" form={EDIT_EXTENSION_FORM_ID} loading={submitting}>
                Save
              </Button>
            </Space>
          </div>
        }
      />
      <ExtensionForm
        key={formKey}
        formId={EDIT_EXTENSION_FORM_ID}
        mode="edit"
        initialValues={toFormValues(details)}
        excludeUuid={details.extension_uuid}
        hive={hive}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </Space>
  );
};

export default EditExtensionPage;
