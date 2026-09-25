import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { App, Button, Space } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import ModuleHeader from "../../../../components/common/ModuleHeader";
import LoadingState from "../../../../components/feedback/LoadingState";
import EmptyState from "../../../../components/feedback/EmptyState";
import ErrorState from "../../../../components/feedback/ErrorState";
import DestinationForm from "../components/DestinationForm";
import {
  getActionOptions,
  getDestinationDetails,
  getFaxOptions,
  getHiveDestinationDetails,
  getMusicOnHoldOptions,
  updateDestination,
} from "../destination.service";
import useDestinationPermissions from "../useDestinationPermissions";
import type {
  ActionOptionGroup,
  DestinationDetails,
  DestinationFormValues,
  HiveDestinationDetails,
  HoldMusicGroup,
  SelectOption,
} from "../destination.types";

const EDIT_DESTINATION_FORM_ID = "edit-destination-form";

/** Maps the stored/API details back into the form model — a straight passthrough. */
const toFormValues = (details: DestinationDetails): DestinationFormValues => ({ ...details });

const EditDestinationPage = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { canManage, canUseFreeText } = useDestinationPermissions();
  const { destinationId } = useParams<{ destinationId: string }>();

  const [hive, setHive] = useState<HiveDestinationDetails | null>(null);
  const [actionOptions, setActionOptions] = useState<ActionOptionGroup[]>([]);
  const [faxOptions, setFaxOptions] = useState<SelectOption[]>([]);
  const [holdMusicOptions, setHoldMusicOptions] = useState<HoldMusicGroup[]>([]);
  const [details, setDetails] = useState<DestinationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const load = useCallback(
    async (withSpinner: boolean) => {
      if (!destinationId) return;
      if (withSpinner) setLoading(true);
      setError(null);
      try {
        const destinationDetails = await getDestinationDetails(destinationId);
        const [hiveDetails, actions, fax, holdMusic] = await Promise.all([
          getHiveDestinationDetails(destinationDetails.domain_name),
          getActionOptions(destinationDetails.domain_name),
          getFaxOptions(destinationDetails.domain_name),
          getMusicOnHoldOptions(destinationDetails.domain_name),
        ]);
        setDetails(destinationDetails);
        setHive(hiveDetails);
        setActionOptions(actions);
        setFaxOptions(fax);
        setHoldMusicOptions(holdMusic);
        setFormKey((key) => key + 1);
      } catch(err) {
        console.error("Failed to load destination:", err);
        setError("Failed to load this destination.");
      } finally {
        if (withSpinner) setLoading(false);
      }
    },
    [destinationId],
  );

  useEffect(() => {
    if (!destinationId) {
      navigate("/dialplans/destinations");
      return;
    }
    load(true);
  }, [load, destinationId, navigate]);

  const handleCancel = () => navigate("/dialplans/destinations");

  const handleSubmit = async (values: DestinationFormValues) => {
    if (!details) return;
    setSubmitting(true);
    try {
      const updated = await updateDestination(details.destination_uuid, values);
      message.success(`Destination ${updated.destination_number} updated successfully.`);
      // Stay on the Edit page: re-fetch details and re-populate, matching the Axion reference
      // (destinations.md §3's Edit flow — no navigation on save).
      await load(false);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to update destination.");
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
        description="Destination not found."
        action={<Button onClick={handleCancel}>Back to Destinations</Button>}
      />
    );
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <ModuleHeader
        title="Edit Destination"
        toolbar={
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={handleCancel}>
              Back
            </Button>
            <Space>
              <Button onClick={handleCancel} disabled={submitting}>
                Cancel
              </Button>
              {canManage && (
                <Button type="primary" htmlType="submit" form={EDIT_DESTINATION_FORM_ID} loading={submitting}>
                  Save
                </Button>
              )}
            </Space>
          </div>
        }
      />
      <DestinationForm
        key={formKey}
        formId={EDIT_DESTINATION_FORM_ID}
        mode="edit"
        initialValues={toFormValues(details)}
        excludeUuid={details.destination_uuid}
        hive={hive}
        actionOptions={actionOptions}
        faxOptions={faxOptions}
        holdMusicOptions={holdMusicOptions}
        canManage={canManage}
        canUseFreeText={canUseFreeText}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </Space>
  );
};

export default EditDestinationPage;
