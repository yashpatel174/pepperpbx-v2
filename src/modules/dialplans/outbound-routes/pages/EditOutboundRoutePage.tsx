import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { App, Button, Space } from "antd";
import { CodeOutlined } from "@ant-design/icons";
import ModuleHeader from "../../../../components/common/ModuleHeader";
import FormPageToolbar from "../../../../components/common/FormPageToolbar";
import { getApiErrorMessage, isNotFoundError } from "../../../../services/api/apiError";
import LoadingState from "../../../../components/feedback/LoadingState";
import EmptyState from "../../../../components/feedback/EmptyState";
import ErrorState from "../../../../components/feedback/ErrorState";
import OutboundRouteForm from "../components/OutboundRouteForm";
import {
  getHiveOutboundRouteDetails,
  getOutboundRouteDetails,
  getOutboundRouteGatewayOptions,
  getSbcDomains,
  updateOutboundRoute,
} from "../outbound-route.service";
import useOutboundRoutePermissions from "../useOutboundRoutePermissions";
import type {
  HiveOutboundRouteDetails,
  OutboundRouteDetails,
  OutboundRouteFormValues,
  OutboundRouteGatewayOption,
  SbcDomainOption,
} from "../outbound-route.types";

const EDIT_OUTBOUND_ROUTE_FORM_ID = "edit-outbound-route-form";

/** Maps the stored/API details back into the form model — a straight passthrough (one shared shape). */
const toFormValues = (details: OutboundRouteDetails): OutboundRouteFormValues => ({ ...details });

const EditOutboundRoutePage = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { canManage } = useOutboundRoutePermissions();
  const { routeId } = useParams<{ routeId: string }>();

  const [hive, setHive] = useState<HiveOutboundRouteDetails | null>(null);
  const [sbcDomains, setSbcDomains] = useState<SbcDomainOption[]>([]);
  const [gatewayOptions, setGatewayOptions] = useState<OutboundRouteGatewayOption[]>([]);
  const [details, setDetails] = useState<OutboundRouteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const load = useCallback(
    async (withSpinner: boolean) => {
      if (!routeId) return;
      if (withSpinner) setLoading(true);
      setError(null);
      setNotFound(false);
      try {
        const routeDetails = await getOutboundRouteDetails(routeId);
        // Always supply the route's own domain here — matches Gateways'/Destinations' documented
        // fix of the Axion reference's confirmed Edit-screen bug of calling this with no domain.
        // Gateway options are fetched the same way Add fetches them (domain-scoped), so the
        // existing Gateway section works identically in both modes.
        const [hiveDetails, sbc, gateways] = await Promise.all([
          getHiveOutboundRouteDetails(routeDetails.domain_name),
          getSbcDomains(),
          getOutboundRouteGatewayOptions(routeDetails.domain_name),
        ]);
        setDetails(routeDetails);
        setHive(hiveDetails);
        setSbcDomains(sbc);
        setGatewayOptions(gateways);
        setFormKey((key) => key + 1);
      } catch (err) {
        // An unknown id gets a record-scoped EmptyState; retrying it can't help.
        if (isNotFoundError(err)) {
          setNotFound(true);
        } else {
          setError("Failed to load this outbound route.");
        }
      } finally {
        if (withSpinner) setLoading(false);
      }
    },
    [routeId],
  );

  useEffect(() => {
    // Matches the audit: a missing route id redirects straight back to the List
    // (outbound-routes.md §3's Edit flow, step 1).
    if (!routeId) {
      navigate("/dialplans/outbound-routes");
      return;
    }
    load(true);
  }, [load, routeId, navigate]);

  const handleCancel = () => navigate("/dialplans/outbound-routes");

  const handleSubmit = async (values: OutboundRouteFormValues) => {
    if (!details) return;
    setSubmitting(true);
    try {
      const updated = await updateOutboundRoute(details.dialplan_uuid, values);
      message.success(`Outbound route "${updated.outbound_route_name}" updated successfully.`);
      // Matches the audit: Update success navigates back to the List (outbound-routes.md §3/§19).
      navigate("/dialplans/outbound-routes");
    } catch (err) {
      message.error(getApiErrorMessage(err, "Failed to update outbound route."));
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

  if (notFound || !details || !hive) {
    return (
      <EmptyState
        description="Outbound route not found."
        action={<Button onClick={handleCancel}>Back to Outbound Routes</Button>}
      />
    );
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <ModuleHeader
        title="Edit Outbound Route"
        toolbar={
          <FormPageToolbar onBack={handleCancel}>
            {/* Reaches the raw dialplan-XML screen. The audit gates this button (and the whole
                XML screen) to Axion-only users (`pbx_axiontech`) — outbound-routes.md §3/§25/§34.
                RBAC is foundation-only here (see CLAUDE.md's RBAC section), so this stays
                reachable by any canManage user for now.
                TODO: wrap with <PermissionGuard permission="outboundRoute.xmlEdit"> once RBAC
                permissions are populated from the backend and an Axion-only-equivalent concept
                is confirmed. */}

            <Button onClick={handleCancel} disabled={submitting}>
              Cancel
            </Button>
            {canManage && (
              <Button type="primary" htmlType="submit" form={EDIT_OUTBOUND_ROUTE_FORM_ID} loading={submitting}>
                Save
              </Button>
            )}
            {canManage && (
              <Button type="primary"
                icon={<CodeOutlined />}
                onClick={() => navigate(`/dialplans/outbound-routes/${details.dialplan_uuid}/xml`)}
              >
                XML
              </Button>
            )}
          </FormPageToolbar>
        }
      />
      <OutboundRouteForm
        key={formKey}
        formId={EDIT_OUTBOUND_ROUTE_FORM_ID}
        mode="edit"
        initialValues={toFormValues(details)}
        excludeUuid={details.dialplan_uuid}
        hive={hive}
        sbcDomains={sbcDomains}
        gatewayOptions={gatewayOptions}
        canManage={canManage}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </Space>
  );
};

export default EditOutboundRoutePage;
