import { Button, Form, Input, Modal } from "antd";
import { useEffect, useState } from "react";

import { validateGatewayName } from "../gateway.validation";

interface CopyFormValues {
  new_gateway: string;
}

interface CopyGatewayModalProps {
  open: boolean;
  onCancel: () => void;
  onCopy: (values: CopyFormValues) => Promise<void>;
}

const CopyGatewayModal = ({
  open,
  onCancel,
  onCopy,
}: CopyGatewayModalProps) => {
  const [form] = Form.useForm<CopyFormValues>();
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleCopy = async () => {
    if (copying) return;

    try {
      const values = await form.validateFields();

      setCopying(true);

      await onCopy(values);

      // message.success(`Gateway "${gateway}" copied successfully.`);

      form.resetFields();
      onCancel();
    } finally {
      setCopying(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Copy Gateway"
      onCancel={copying ? undefined : onCancel}
      destroyOnHidden
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button disabled={copying} onClick={onCancel}>
            Close
          </Button>

          <Button type="primary" loading={copying} onClick={handleCopy}>
            Copy
          </Button>
        </div>
      }
      width={440}
    >
      <Form<CopyFormValues> form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="new_gateway"
          label="Gateway"
          tooltip="Pre-filled with the next suggested extension for this domain"
          validateFirst
          rules={validateGatewayName()}
        >
          <Input
            placeholder="Enter extension"
            aria-label="New extension number"
            disabled={copying}
            inputMode="numeric"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CopyGatewayModal;
