import { useEffect, useState } from "react";
import { App, Checkbox, Col, Modal, Row, Space } from "antd";
import type { CheckboxChangeEvent } from "antd/es/checkbox";
import { getExportFields } from "../destination.service";
import type { ExportFieldOption } from "../destination.types";

interface ExportDestinationModalProps {
  open: boolean;
  submitting: boolean;
  onSubmit: (fields: string[]) => void | Promise<void>;
  onCancel: () => void;
}

/**
 * Export popup — Select All + per-field checkboxes.
 * No fields are selected by default.
 */
const ExportDestinationModal = ({ open, submitting, onSubmit, onCancel }: ExportDestinationModalProps) => {
  const { message } = App.useApp();
  const [fields, setFields] = useState<ExportFieldOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setSelected([]);
      return;
    }

    let active = true;
    setLoading(true);

    getExportFields()
      .then((options) => {
        if (!active) return;

        setFields(options);

        // Do not select any field by default.
        setSelected([]);
      })
      .catch(() => {
        if (active) {
          message.error("Failed to load export fields.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [open, message]);

  const allSelected = fields.length > 0 && selected.length === fields.length;
  const indeterminate = selected.length > 0 && selected.length < fields.length;

  const handleSelectAll = (e: CheckboxChangeEvent) => {
    setSelected(e.target.checked ? fields.map((field) => field.key) : []);
  };

  const handleToggleField = (key: string, checked: boolean) => {
    setSelected((prev) => {
      if (checked) {
        return prev.includes(key) ? prev : [...prev, key];
      }

      return prev.filter((item) => item !== key);
    });
  };

  const handleOk = () => {
    if (selected.length === 0) {
      message.warning("Select at least one field to export.");
      return;
    }

    onSubmit(selected);
  };

  return (
    <Modal
      open={open}
      title="Export Destination"
      onCancel={submitting ? undefined : onCancel}
      onOk={handleOk}
      okText="Export"
      okButtonProps={{
        disabled: selected.length === 0,
        loading: submitting,
      }}
      confirmLoading={submitting}
      destroyOnHidden
      width={750}
    >
      {loading ? (
        <p>Loading fields…</p>
      ) : (
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          {/* Note */}
          <div
            style={{
              color: "#ff4d4f",
              fontSize: 16,
              marginBottom: 4,
            }}
          >
            Note: Select at least one checkbox to export.
          </div>

          {/* Select All */}
          <Checkbox indeterminate={indeterminate} checked={allSelected} onChange={handleSelectAll}>
            Select All
          </Checkbox>

          <div
            style={{
              borderTop: "1px solid #d9d9d9",
              paddingTop: 16,
            }}
          >
            {/* Fields in two columns */}
            <Row gutter={[24, 16]}>
              {fields.map((field) => (
                <Col key={field.key} xs={24} sm={12}>
                  <Checkbox
                    checked={selected.includes(field.key)}
                    onChange={(e) => handleToggleField(field.key, e.target.checked)}
                  >
                    {field.label}
                  </Checkbox>
                </Col>
              ))}
            </Row>
          </div>
        </Space>
      )}
    </Modal>
  );
};

export default ExportDestinationModal;
