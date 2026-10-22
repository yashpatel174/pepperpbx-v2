import { useRef } from "react";
import { App, Col, Form, Row, Space } from "antd";
import { domainChangeMessage, domainChangeTitle } from "../../../../components/common/domainChangeMessage";
import type {
  HiveOutboundRouteDetails,
  OutboundRouteFormValues,
  OutboundRouteGatewayOption,
  SbcDomainOption,
} from "../outbound-route.types";
import OutboundRouteBasicSection from "./OutboundRouteBasicSection";
import OutboundRouteExpressionSection from "./OutboundRouteExpressionSection";
import OutboundRouteGatewaysSection from "./OutboundRouteGatewaysSection";

export interface OutboundRouteFormProps {
  mode: "create" | "edit";
  /** The page owns loading — OutboundRouteForm only ever mounts once real values are ready. */
  initialValues: OutboundRouteFormValues;
  /** Current record's uuid, so the duplicate-name check excludes itself in edit mode. */
  excludeUuid?: string;
  hive: HiveOutboundRouteDetails;
  sbcDomains: SbcDomainOption[];
  gatewayOptions: OutboundRouteGatewayOption[];
  /** True while domain-dependent options are being re-fetched after a confirmed domain change. */
  optionsLoading?: boolean;
  canManage: boolean;
  submitting: boolean;
  /** Create mode only — called once the domain-change confirmation is accepted, so the page can
   * re-fetch domain-dependent options (hive/SBC domains/gateway options) for the new domain. */
  onDomainConfirmed?: (domainName: string) => void;
  onSubmit: (values: OutboundRouteFormValues) => void;
  /** HTML form id — the page renders Cancel/Save in its ModuleHeader toolbar; Save targets this
   * id via `htmlType="submit"` + `form={formId}`, matching Extensions/Gateways/Destinations. */
  formId: string;
}

/**
 * Shared by AddOutboundRoutePage and EditOutboundRoutePage — ONE form component, not two
 * duplicated per-mode components (CLAUDE.md's "one shared form per module" rule), unlike the
 * audit's OutboundRoutesForm/EditDialplanForm split (outbound-routes.md §2/§8). Owns fields
 * (via its section components), the domain-change confirmation, and validation; pages own data
 * loading, defaults, and the create/update service call.
 *
 * The Dialplan Expression card renders only in create mode — matching the audit (Edit never
 * exposes the raw expression directly; it's only reachable, in Axion, via the raw XML screen —
 * outbound-routes.md §2/§3/§8/§25). Gateway selection, unlike the audit, is available in both
 * modes — see outbound-route.types.ts's `gateways` doc comment.
 */
const OutboundRouteForm = ({
  mode,
  initialValues,
  excludeUuid,
  hive,
  sbcDomains,
  gatewayOptions,
  optionsLoading,
  canManage,
  submitting,
  onDomainConfirmed,
  onSubmit,
  formId,
}: OutboundRouteFormProps) => {
  const [form] = Form.useForm<OutboundRouteFormValues>();
  const { modal } = App.useApp();
  const currentDomainRef = useRef(initialValues.domain_name);

  /**
   * INTENTIONAL FIX vs the Axion reference: the audit documents a domain-change popup whose copy
   * promises "any pre-selected values will be reset" but whose code never actually performs that
   * reset (outbound-routes.md §9/§20/§28/§33 — a confirmed inconsistency). PepperPBX makes the
   * warning true: confirming the domain change really does clear the domain-dependent fields
   * (SBC Domain, the ordered Gateways list) before the page re-fetches fresh options for the new
   * domain via onDomainConfirmed.
   */
  const handleDomainChange = (value: string) => {
    if (mode !== "create" || value === currentDomainRef.current) {
      currentDomainRef.current = value;
      return;
    }

    modal.confirm({
      title: domainChangeTitle,
      content: domainChangeMessage(),
      okText: "Continue",
      cancelText: "Cancel",
      onOk: () => {
        currentDomainRef.current = value;

        form.setFieldsValue({
          domain_name: value,
          sbcDomainIp: undefined,
          gateways: [""],
        });

        onDomainConfirmed?.(value);
      },
      onCancel: () => {
        form.setFieldsValue({ domain_name: currentDomainRef.current });
      },
    });
  };

  const disabled = !canManage;

  return (
    <Form<OutboundRouteFormValues>
      id={formId}
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onSubmit}
      disabled={submitting || disabled}
    >
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        <OutboundRouteBasicSection
          mode={mode}
          excludeUuid={excludeUuid}
          hive={hive}
          sbcDomains={sbcDomains}
          optionsLoading={optionsLoading}
          onDomainChange={handleDomainChange}
        />

        {mode === "create" && (
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <OutboundRouteExpressionSection />
            </Col>
            <Col xs={24} md={12}>
              <OutboundRouteGatewaysSection options={gatewayOptions} optionsLoading={optionsLoading} />
            </Col>
          </Row>
        )}

        {/* Gateway selection is also available in Edit — the Dialplan Expression card stays
            create-only (Edit only reaches it via the raw XML screen, per the audit), but Gateway
            is edited the same way in both modes, reusing the exact same section component. */}
        {mode === "edit" && (
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <OutboundRouteGatewaysSection options={gatewayOptions} optionsLoading={optionsLoading} />
            </Col>
          </Row>
        )}
      </Space>
    </Form>
  );
};

export default OutboundRouteForm;
