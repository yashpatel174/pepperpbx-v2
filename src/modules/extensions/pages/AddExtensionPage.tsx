import { App, Button, Space } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FormPageToolbar from "../../../components/common/FormPageToolbar";
import ModuleHeader from "../../../components/common/ModuleHeader";
import ErrorState from "../../../components/feedback/ErrorState";
import LoadingState from "../../../components/feedback/LoadingState";
import { getApiErrorMessage } from "../../../services/api/apiError";
import ExtensionForm from "../components/ExtensionForm";
import { createExtension, getHiveUserDetails } from "../extension.service";
import type {
  ExtensionDetails,
  ExtensionFormValues,
  HiveUserDetails,
} from "../extension.types";
import useExtensionPermissions from "../useExtensionPermissions";

const ADD_EXTENSION_FORM_ID = "add-extension-form";

const AddExtensionPage = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { canEditBasic, canAdd } = useExtensionPermissions();

  const [hive, setHive] = useState<HiveUserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    getHiveUserDetails()
      .then((details) => {
        if (active) setHive(details);
      })
      .catch(() => {
        if (active) setError("Failed to load account details.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCancel = () => navigate("/account/extensions");

  const handleSubmit = async (values: ExtensionFormValues) => {
    setSubmitting(true);
    try {
      const response = await createExtension(values);
      const created: ExtensionDetails[] = response.data;
      message.success(
        `Extension "${created[0].extension}" created successfully.`,
      );

      if (canEditBasic) {
        navigate(`/account/extensions/${created[0].extension_uuid}/edit`);
      } else {
        navigate("/account/extensions");
      }
    } catch (err) {
      message.error(getApiErrorMessage(err, "Failed to create extension."));
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => navigate("/account/extensions")}
      />
    );
  }

  if (loading || !hive) {
    return <LoadingState rows={10} />;
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <ModuleHeader
        title="Add Extension"
        toolbar={
          <FormPageToolbar onBack={handleCancel}>
            <Button onClick={handleCancel} disabled={submitting}>
              Cancel
            </Button>

            {canAdd && (
              <Button
                type="primary"
                htmlType="submit"
                form={ADD_EXTENSION_FORM_ID}
                disabled={submitting}
                loading={submitting}
              >
                Save
              </Button>
            )}
          </FormPageToolbar>
        }
      />
      <ExtensionForm
        formId={ADD_EXTENSION_FORM_ID}
        mode="create"
        // initialValues={getDefaultExtensionFormValues(hive)}
        initialValues={{
          range: 1,
          extension: hive.autoExt,
          accountcode: hive.accountNumber,
          limit_max: "",
          limit_destination: "",
          missed_call_app: "",
          call_timeout: "",
          user_record: "",
          user_context: hive.newDomainName || hive.defaultDomain,
          sip_force_contact: "",
          sip_bypass_media: "",
          voicemail_file: "",
          call_screen_enabled: false,
          force_ping: false,
          directory_visible: false,
          directory_exten_visible: false,
          voicemail_transcription_enabled: false,
          voicemail_local_after_email: false,
          voicemail_enabled: false,
          enabled: false,
          voicemail_password: "",
        }}
        hive={hive}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </Space>
  );
};

export default AddExtensionPage;
