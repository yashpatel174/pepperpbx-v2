import { useState } from "react";
import { Alert, App, Button, Form, Modal, Select, Typography, Upload } from "antd";
import { DownloadOutlined, InboxOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd";
import {
  csvFileNameRule,
  delimiterOptions,
  enclosureOptions,
  fromRowOptions,
  maximumCsvFileSizeBytes,
} from "../destination.constants";
import type { ImportDelimiter, ImportEnclosure } from "../destination.types";

const { Dragger } = Upload;
const { Text } = Typography;

interface ImportDestinationModalProps {
  open: boolean;
  submitting: boolean;
  onSubmit: (
    file: File,
    options: {
      fromRow: number;
      delimiter: ImportDelimiter;
      enclosure: ImportEnclosure;
    },
  ) => void | Promise<void>;
  onCancel: () => void;
}

interface ImportFormValues {
  from_row: string;
  delimiter: ImportDelimiter;
  enclosure: ImportEnclosure;
}

const CSV_MIME_TYPES = ["text/csv", "application/vnd.ms-excel"];

const ImportDestinationModal = ({ open, submitting, onSubmit, onCancel }: ImportDestinationModalProps) => {
  const [form] = Form.useForm<ImportFormValues>();
  const { message } = App.useApp();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    const isCsvType = CSV_MIME_TYPES.includes(file.type) || file.name.toLowerCase().endsWith(".csv");

    if (!isCsvType) return "Only CSV files are allowed.";

    if (file.size > maximumCsvFileSizeBytes) {
      return "The file size should be a maximum of 10MB.";
    }

    const nameWithoutExtension = file.name.replace(/\.csv$/i, "");

    if (!csvFileNameRule.test(nameWithoutExtension)) {
      return "The file name can only contain letters, numbers, dashes (-), and underscores (_).";
    }

    return null;
  };

  const handleDownloadSampleFile = () => {
    const link = document.createElement("a");
    link.href = "/assets/csv/destination_sample.csv";
    link.download = "destination_sample.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOk = () => {
    const uploaded = fileList[0]?.originFileObj as File | undefined;

    if (!uploaded) {
      setFileError("File required.");
      return;
    }

    const error = validateFile(uploaded);

    if (error) {
      setFileError(error);
      return;
    }

    form
      .validateFields()
      .then((values) =>
        onSubmit(uploaded, {
          fromRow: Number(values.from_row),
          delimiter: values.delimiter,
          enclosure: values.enclosure,
        }),
      )
      .catch(() => message.error("Please fix the highlighted fields."));
  };

  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    setFileError(null);
    onCancel();
  };

  return (
    <Modal
      open={open}
      title="Import Destinations"
      onCancel={submitting ? undefined : handleCancel}
      onOk={handleOk}
      okText="Import"
      confirmLoading={submitting}
      destroyOnHidden
      width={560}
    >
      <Form<ImportFormValues>
        form={form}
        layout="vertical"
        initialValues={{
          from_row: "2",
          delimiter: ",",
          enclosure: '"',
        }}
      >
        <Form.Item
          name="from_row"
          label="From Row"
          tooltip="First row to read data from (rows before it are treated as header)"
        >
          <Select options={fromRowOptions} showSearch optionFilterProp="label" />
        </Form.Item>

        <Form.Item name="delimiter" label="Delimiter" rules={[{ required: true }]}>
          <Select options={delimiterOptions} />
        </Form.Item>

        <Form.Item name="enclosure" label="Enclosure" rules={[{ required: true }]}>
          <Select options={enclosureOptions} />
        </Form.Item>

        <Form.Item label="File to Upload" required>
          <Dragger
            multiple={false}
            maxCount={1}
            accept=".csv,text/csv"
            fileList={fileList}
            beforeUpload={() => false}
            onChange={({ fileList: nextList }) => {
              setFileList(nextList.slice(-1));
              setFileError(null);
            }}
            onRemove={() => {
              setFileList([]);
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag a CSV file to this area</p>
          </Dragger>

          {fileError && <Alert type="error" showIcon title={fileError} style={{ marginTop: 8 }} />}
        </Form.Item>

        <Form.Item label="Download Sample">
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadSampleFile}>
            Sample CSV File
          </Button>
        </Form.Item>

        <Text type="secondary">
          Note: Upload a CSV with all required inputs. Ensure there is no duplicate or inappropriate data, as such
          records will not be imported. For better results, use the provided Sample CSV.
        </Text>
      </Form>
    </Modal>
  );
};

export default ImportDestinationModal;
