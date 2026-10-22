import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { App, Button, Space } from "antd";
import ModuleHeader from "../../../components/common/ModuleHeader";
import FormPageToolbar from "../../../components/common/FormPageToolbar";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import ExtensionForm from "../components/ExtensionForm";
import { createExtension, getHiveUserDetails } from "../extension.service";
import { getDefaultExtensionFormValues } from "../extension.constants";
import useExtensionPermissions from "../useExtensionPermissions";
import type { ExtensionFormValues, HiveUserDetails } from "../extension.types";
import { getApiErrorMessage } from "../../../services/api/apiError";

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
      const created = await createExtension(values);
      message.success(`Extension "${created.extension}" created successfully.`);
      // Follow the post-submit convention: users who can edit an extension continue on to
      // the newly created record's Edit page; otherwise they land back on the list.
      if (canEditBasic) {
        navigate(`/account/extensions/${created.extension_uuid}/edit`);
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
    return <ErrorState message={error} onRetry={() => navigate("/account/extensions")} />;
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
              <Button type="primary" htmlType="submit" form={ADD_EXTENSION_FORM_ID} loading={submitting}>
                Save
              </Button>
            )}
          </FormPageToolbar>
        }
      />
      <ExtensionForm
        formId={ADD_EXTENSION_FORM_ID}
        mode="create"
        initialValues={getDefaultExtensionFormValues(hive)}
        hive={hive}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </Space>
  );
};

export default AddExtensionPage;
