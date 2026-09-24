import { useEffect, useState } from "react";
import { Alert, Card, Col, Form, Input, Row, Select } from "antd";
import {
  callGroupOptions,
  missedCallAppOptions,
  sipBypassMediaOptions,
  SIPForceContactOptions,
  userRecordOptions,
} from "../extension.constants";
import { getHoldMusicOptions } from "../extension.service";
import type { HiveUserDetails } from "../extension.types";
import {
  callTimeoutRule,
  cidrRule,
  missedCallEmailRules,
  noEdgeWhitespaceRule,
  numericFieldRule,
} from "../extension.validation";

const { TextArea } = Input;

const useHoldMusicOptions = (domain?: string) => {
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setOptions([]);
    setError(false);

    if (!domain) return;

    let active = true;
    setLoading(true);

    getHoldMusicOptions(domain)
      .then((values) => {
        if (active) setOptions(values);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [domain]);

  return { options, loading, error };
};

interface ExtensionFormAdvancedSectionProps {
  mode: "create" | "edit";
  hive: HiveUserDetails;
  disabled: boolean;
  defaultUserContext: string;
  onUserContextChange: (value: string) => void;
}

/**
 * The "Advanced Settings" card section — the full Axion field set in order, including the
 * user-context (domain) selector that the parent owns the change-confirmation flow for.
 * The missed-call "email" row and the hold-music options load are self-contained here.
 *
 * Layout:
 * - Desktop: 3 fields per row
 * - Mobile: 1 field per row
 */
const ExtensionFormAdvancedSection = ({
  mode,
  hive,
  disabled,
  defaultUserContext,
  onUserContextChange,
}: ExtensionFormAdvancedSectionProps) => {
  const form = Form.useFormInstance();
  const missedCallApp = Form.useWatch("missed_call_app", form);
  const watchedContext = Form.useWatch("user_context", form);

  const {
    options: holdMusicOptions,
    loading: holdMusicLoading,
    error: holdMusicError,
  } = useHoldMusicOptions(watchedContext ?? defaultUserContext);

  return (
    <>
      <Card title="Advanced Settings" style={{ marginTop: 24 }}>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              name="effective_caller_id_name"
              label="Effective Caller ID Name"
              tooltip="Enter the internal caller ID name here"
              rules={[noEdgeWhitespaceRule]}
            >
              <Input placeholder="Enter effective caller id name" disabled={disabled} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="effective_caller_id_number"
              label="Effective Caller ID Number"
              tooltip="Enter the internal caller ID number here"
              rules={[numericFieldRule]}
            >
              <Input type={"number"} min={0} placeholder="Enter effective caller id number" disabled={disabled} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="outbound_caller_id_name"
              label="Outbound Caller ID Name"
              tooltip="Enter the external (public) caller ID name here"
              rules={[noEdgeWhitespaceRule]}
            >
              <Input placeholder="Enter outbound caller id name" disabled={disabled} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="outbound_caller_id_number"
              label="Outbound Caller ID Number"
              tooltip="Enter the external (public) caller ID number here"
              rules={[numericFieldRule]}
            >
              <Input type={"number"} min={0} placeholder="Enter outbound caller id number" disabled={disabled} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="emergency_caller_id_name"
              label="Emergency Caller ID Name"
              tooltip="Enter the emergency caller ID name here"
              rules={[noEdgeWhitespaceRule]}
            >
              <Input placeholder="Enter emergency caller id name" disabled={disabled} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="emergency_caller_id_number"
              label="Emergency Caller ID Number"
              tooltip="Enter the emergency caller ID number here"
              rules={[numericFieldRule]}
            >
              <Input type={"number"} min={0} placeholder="Enter emergency caller id number" disabled={disabled} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="directory_first_name"
              label="Directory First Name"
              tooltip="Enter the first name"
              rules={[noEdgeWhitespaceRule]}
            >
              <Input placeholder="Enter directory first name" disabled={disabled} aria-label="Directory first name" />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="directory_last_name"
              label="Directory Last Name"
              tooltip="Enter the last name"
              rules={[noEdgeWhitespaceRule]}
            >
              <Input placeholder="Enter directory last name" disabled={disabled} aria-label="Directory last name" />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="max_registrations"
              label="Max Registrations"
              tooltip="Enter the maximum registration allowed for this user"
              rules={[numericFieldRule]}
            >
              <Input type="number" min={0} placeholder="Enter max registrations" disabled={disabled} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="limit_max"
              label="Limit Max"
              tooltip="Enter the max number of outgoing calls for this user"
              rules={[numericFieldRule]}
            >
              <Input type="number" min={0} placeholder="Enter limit max" disabled={disabled} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item  
              name="limit_destination"
              label="Limit Destination"
              tooltip="Enter the destination to send the calls when the max number of outgoing calls has been reached"
              rules={[noEdgeWhitespaceRule]}
            >
              <Input placeholder="Enter limit destination" disabled={disabled} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="missed_call_app"
              label="Missed Call"
              tooltip="Select the notification type, and enter the appropriate destination"
            >
              <Select
                allowClear
                placeholder="Select missed call app"
                options={missedCallAppOptions}
                disabled={disabled}
              />
            </Form.Item>
          </Col>

          {missedCallApp === "email" && (
            <Col xs={24} md={8}>
              <Form.Item
                name="missed_call_data"
                label="Missed Call Email"
                tooltip="Enter emails with comma separation without spaces, max 5 emails are allowed"
                validateFirst
                rules={missedCallEmailRules}
              >
                <Input placeholder="Enter missed call email" disabled={disabled} />
              </Form.Item>
            </Col>
          )}

          <Col xs={24} md={8}>
            <Form.Item
              name="toll_allow"
              label="Toll Allow"
              tooltip="Enter the toll allow value here. (Examples: domestic,international,local)"
              rules={[noEdgeWhitespaceRule]}
            >
              <Input placeholder="Enter toll allow" disabled={disabled} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="call_timeout"
              label="Call Timeout"
              tooltip="Enter the call timeout"
              rules={[callTimeoutRule]}
            >
              <Input type="number" min={0} placeholder="Enter call timeout" disabled={disabled} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="call_group"
              label="Call Group"
              tooltip="Enter the user call group here. Groups available by default: sales, support, billing"
              rules={[noEdgeWhitespaceRule]}
            >
              <Select
                allowClear
                placeholder="Enter call group"
                options={callGroupOptions.map((group) => ({
                  label: group,
                  value: group,
                }))}
                disabled={disabled}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="user_record"
              label="Record"
              tooltip="Choose whether to record local, inbound, outbound, or all"
            >
              <Select allowClear placeholder="Select record option" options={userRecordOptions} disabled={disabled} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item name="hold_music" label="Hold Music" tooltip="Select the MOH category here">
              <Select
                allowClear
                placeholder="Select hold music"
                loading={holdMusicLoading}
                options={holdMusicOptions.map((value) => ({
                  label: value,
                  value,
                }))}
                disabled={disabled || holdMusicError}
              />
            </Form.Item>

            {holdMusicError && (
              <Alert
                type="warning"
                showIcon
                message="Failed to load hold music options."
                style={{ marginBottom: 24 }}
              />
            )}
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="user_context"
              label="Context"
              tooltip="Select the user context here"
              rules={[
                {
                  required: true,
                  message: "Context required",
                },
              ]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Select user context"
                options={hive.domainOptions.map((domain) => ({
                  label: domain,
                  value: domain,
                }))}
                onChange={onUserContextChange}
                disabled={mode === "edit" || disabled}
                aria-label="User context"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="auth_acl"
              label="Auth ACL"
              tooltip="Enter the auth ACL here"
              rules={[noEdgeWhitespaceRule]}
            >
              <Input placeholder="Enter auth acl" disabled={disabled} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="cidr"
              label="CIDR"
              tooltip="Enter allowed address/ranges in CIDR notation (comma separated)"
              rules={[cidrRule]}
            >
              <Input placeholder="Enter cidr" disabled={disabled} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="sip_force_contact"
              label="SIP Force Contact"
              tooltip="Choose whether to rewrite the contact port, or rewrite both the contact IP and port"
            >
              <Select
                allowClear
                placeholder="Select sip force contact"
                options={SIPForceContactOptions}
                disabled={disabled}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="sip_force_expires"
              label="SIP Force Expires"
              tooltip="To prevent stale registrations SIP force expires can override the client expire"
              rules={[numericFieldRule]}
            >
              <Input type="number" min={0} placeholder="Enter sip force expires" disabled={disabled} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="mwi_account"
              label="MWI Account"
              tooltip="MWI account with user@domain of the voicemail to monitor"
              rules={[noEdgeWhitespaceRule]}
            >
              <Input placeholder="Enter MWI account" disabled={disabled} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="sip_bypass_media"
              label="SIP Bypass Media"
              tooltip="Choose whether to send the media stream point to point or in transparent proxy mode"
            >
              <Select
                allowClear
                placeholder="Select sip bypass media"
                options={sipBypassMediaOptions}
                disabled={disabled}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="absolute_codec_string"
              label="Absolute Codec String"
              tooltip="Absolute codec string for the extension"
              rules={[noEdgeWhitespaceRule]}
            >
              <Input placeholder="Enter absolute codec string" disabled={disabled} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="dial_string"
              label="Dial String"
              tooltip="Location of the endpoint"
              rules={[noEdgeWhitespaceRule]}
            >
              <Input placeholder="Enter dial string" disabled={disabled} />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item
              name="description"
              label="Description"
              tooltip="Enter the description"
              rules={[noEdgeWhitespaceRule]}
            >
              <TextArea rows={2} placeholder="Enter description" disabled={disabled} />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </>
  );
};

export default ExtensionFormAdvancedSection;
