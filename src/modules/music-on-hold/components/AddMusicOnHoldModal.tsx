import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  App,
  Button,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Skeleton,
  Typography,
  Upload,
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd";
import {
  domainChangeMessage,
  domainChangeTitle,
} from "../../../components/common/domainChangeMessage";
import { mohRateOptions } from "../music-on-hold.constants";
import {
  categoryNameRules,
  noEdgeWhitespaceRule,
  validateAudioFile,
} from "../music-on-hold.validation";
import {
  getMohCategoryOptions,
  getMohDomains,
} from "../music-on-hold.service";
import type {
  CreateMohPayload,
  MohCategoryOption,
  MohDomainOptions,
  MohRate,
} from "../music-on-hold.types";

const { Dragger } = Upload;

interface AddMusicOnHoldModalProps {
  open: boolean;
  submitting: boolean;
  /** Upload is a separate gate from opening the popup (music-on-hold.md §14/§33: Axion left it ungated). */
  canUpload: boolean;
  onSubmit: (payload: CreateMohPayload) => void | Promise<void>;
  onCancel: () => void;
}

interface AddMohFormValues {
  domain_name: string;
  music_on_hold_name?: string;
  music_on_hold_rate: MohRate;
}

type CategoryMode = "new" | "existing";

/**
 * Mounted only while open (and only once the domain options arrive), so each open re-fetches them
 * and starts from a clean form.
 */
const AddMusicOnHoldForm = ({
  domains,
  submitting,
  canUpload,
  onSubmit,
  onCancel,
}: Omit<AddMusicOnHoldModalProps, "open"> & {
  domains: MohDomainOptions;
}) => {
  const { modal } = App.useApp();
  const [form] = Form.useForm<AddMohFormValues>();
  const [mode, setMode] = useState<CategoryMode>("existing");
  /** The domain the category options belong to: updated only once a domain change is confirmed. */
  const [activeDomain, setActiveDomain] = useState(domains.defaultDomain);
  const [categories, setCategories] = useState<MohCategoryOption[]>([]);
  /** The domain `categories` was loaded for; null while a load is pending or after a failure. */
  const [categoriesDomain, setCategoriesDomain] = useState<string | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const categoriesRequestRef = useRef(0);

  const selectedName = Form.useWatch("music_on_hold_name", form);
  const selectedRate = Form.useWatch("music_on_hold_rate", form);

  const loadCategories = useCallback((domainName: string) => {
    const requestId = ++categoriesRequestRef.current;
    // Never leave a previous domain's options available while this domain's load is pending.
    setCategories([]);
    setCategoriesDomain(null);
    setCategoriesLoading(true);
    setCategoriesError(false);

    getMohCategoryOptions(domainName)
      .then((loaded) => {
        // Only the latest request may apply its result, so a late response for a previous domain is dropped.
        if (requestId !== categoriesRequestRef.current) return;
        setCategories(loaded);
        setCategoriesDomain(domainName);
        setCategoriesLoading(false);
      })
      .catch(() => {
        if (requestId !== categoriesRequestRef.current) return;
        setCategories([]);
        setCategoriesError(true);
        setCategoriesLoading(false);
      });
  }, []);

  useEffect(() => {
    loadCategories(activeDomain);
    const requestRef = categoriesRequestRef;

    return () => {
      requestRef.current += 1;
    };
  }, [activeDomain, loadCategories]);

  const selectedCategory =
    mode === "existing"
      ? categories.find((option) => option.categoryName === selectedName)
      : undefined;

  /**
   * Derived, not stored: the existing record matching the chosen category + rate. Its uuid is what
   * makes the upload append to that record (music-on-hold.md §3/§27); deriving it means a mode, domain,
   * category or rate change can never leave a stale uuid behind.
   */
  const existingUuid = selectedCategory?.rates.find(
    (entry) => entry.rate === selectedRate,
  )?.music_on_hold_uuid;

  const clearCategoryFields = () => {
    form.setFields([
      { name: "music_on_hold_name", value: undefined, errors: [] },
      { name: "music_on_hold_rate", value: "default", errors: [] },
    ]);
  };

  const handleModeToggle = () => {
    setMode((current) => (current === "existing" ? "new" : "existing"));
    clearCategoryFields();
  };

  /** Confirming resets everything scoped to the old domain; cancelling restores the previous domain untouched. */
  const handleDomainChange = (value: string) => {
    if (value === activeDomain) return;

    modal.confirm({
      title: domainChangeTitle,
      content: domainChangeMessage(),
      okText: "Continue",
      cancelText: "Cancel",
      onOk: () => {
        // Drop the old domain's options right away; the effect then loads the new domain's.
        setCategories([]);
        setCategoriesDomain(null);
        setCategoriesLoading(true);
        setActiveDomain(value);
        clearCategoryFields();
        setFile(null);
        setFileError(null);
      },
      onCancel: () => form.setFieldsValue({ domain_name: activeDomain }),
    });
  };

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        // A category chosen in existing mode must belong to the selected domain's loaded options.
        if (mode === "existing") {
          const categoryValid =
            categoriesDomain === values.domain_name &&
            categories.some(
              (option) => option.categoryName === values.music_on_hold_name,
            );
          if (!categoryValid) {
            form.setFields([
              {
                name: "music_on_hold_name",
                errors: [
                  categoriesLoading
                    ? "Categories are still loading for this domain"
                    : "Select a category from the selected domain",
                ],
              },
            ]);
            return;
          }
        }

        if (!file) {
          setFileError("Audio file required");
          return;
        }

        const error = validateAudioFile(file);
        if (error) {
          setFileError(error);
          return;
        }

        const payload: CreateMohPayload = existingUuid
          ? {
              domain_name: values.domain_name,
              is_new_category: false,
              music_on_hold_uuid: existingUuid,
              file,
            }
          : {
              domain_name: values.domain_name,
              is_new_category: mode === "new",
              music_on_hold_name: values.music_on_hold_name?.trim(),
              music_on_hold_rate: values.music_on_hold_rate,
              file,
            };

        void onSubmit(payload);
      })
      .catch(() => {
        // Field errors render inline; surface a missing file at the same time.
        if (!file) setFileError("Audio file required");
      });
  };

  const fileList: UploadFile[] = file
    ? [{ uid: file.name, name: file.name, size: file.size, status: "done" }]
    : [];

  const rateOptions = mohRateOptions.map((option) => ({
    value: option.value,
    label: selectedCategory?.rates.some(
      (entry) => entry.rate === option.value,
    )
      ? `${option.label} (existing)`
      : option.label,
  }));

  return (
    <Modal
      open
      title="Add Music On Hold"
      okText="Upload"
      cancelText="Close"
      confirmLoading={submitting}
      okButtonProps={{ disabled: !canUpload }}
      cancelButtonProps={{ disabled: submitting }}
      onOk={handleOk}
      onCancel={submitting ? undefined : onCancel}
      maskClosable={false}
      keyboard={!submitting}
      width={560}
    >
      <Form<AddMohFormValues>
        form={form}
        layout="vertical"
        disabled={submitting}
        initialValues={{
          domain_name: domains.defaultDomain,
          music_on_hold_rate: "default",
        }}
      >
        <Form.Item
          name="domain_name"
          label="Domain"
          required
          rules={[
            { required: true, message: "Domain is required" },
            noEdgeWhitespaceRule,
          ]}
        >
          <Select
            showSearch
            placeholder="Select domain"
            options={domains.domainOptions.map((name) => ({
              label: name,
              value: name,
            }))}
            onChange={handleDomainChange}
            aria-label="Domain"
          />
        </Form.Item>

        {/* Category and Rate displayed side by side */}
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Category" required style={{ marginBottom: 8 }}>
              {mode === "new" ? (
                <Form.Item
                  name="music_on_hold_name"
                  validateFirst
                  rules={categoryNameRules}
                  style={{ marginBottom: 0 }}
                >
                  <Input
                    placeholder="Enter category name"
                    aria-label="Category"
                  />
                </Form.Item>
              ) : (
                <Form.Item
                  name="music_on_hold_name"
                  rules={[{ required: true, message: "Category required" }]}
                  style={{ marginBottom: 0 }}
                >
                  <Select
                    showSearch
                    allowClear
                    loading={categoriesLoading}
                    disabled={categoriesLoading}
                    placeholder="Select existing category"
                    notFoundContent={
                      categoriesError
                        ? "Failed to load categories."
                        : "No categories in this domain yet."
                    }
                    options={categories.map((option) => ({
                      label: option.categoryName,
                      value: option.categoryName,
                    }))}
                    onChange={() =>
                      form.setFieldsValue({ music_on_hold_rate: "default" })
                    }
                    aria-label="Category"
                  />
                </Form.Item>
              )}
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="music_on_hold_rate"
              label="Rate"
              required
              rules={[{ required: true, message: "Rate required" }]}
              extra={
                existingUuid
                  ? "Existing category and rate — the new audio will be added to this record."
                  : undefined
              }
            >
              <Select options={rateOptions} aria-label="Rate" />
            </Form.Item>
          </Col>
        </Row>

        {mode === "existing" && categoriesError && (
          <Alert
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
            title="Failed to load the category options."
            action={
              <Button
                size="small"
                onClick={() => loadCategories(activeDomain)}
              >
                Retry
              </Button>
            }
          />
        )}

        <div style={{ marginBottom: 24 }}>
          <Button
            type="primary"
            onClick={handleModeToggle}
            disabled={submitting}
          >
            {mode === "existing" ? "Add New Category" : "Cancel"}
          </Button>
        </div>

        <Form.Item label="Audio File" required>
          <Dragger
            multiple={false}
            maxCount={1}
            disabled={submitting}
            accept=".mp3,.wav,.ogg,audio/mp3,audio/mpeg,audio/wav,audio/ogg"
            fileList={fileList}
            beforeUpload={(picked) => {
              const error = validateAudioFile(picked);

              if (error) {
                setFile(null);
                setFileError(error);
                return Upload.LIST_IGNORE;
              }

              setFile(picked);
              setFileError(null);
              return false;
            }}
            onRemove={() => {
              setFile(null);
              setFileError(null);
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Click or drag an MP3, WAV or OGG file to this area
            </p>
            <Typography.Text type="secondary">
              Maximum size 80MB
            </Typography.Text>
          </Dragger>

          {fileError && (
            <Alert
              type="error"
              showIcon
              title={fileError}
              style={{ marginTop: 8 }}
            />
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
};

/** Loads the domain options, then mounts the form; a failed load shows a retryable error in the same modal. */
const AddMusicOnHoldBootstrap = (
  props: Omit<AddMusicOnHoldModalProps, "open">,
) => {
  const [domains, setDomains] = useState<MohDomainOptions | null>(null);
  const [domainsError, setDomainsError] = useState(false);
  const domainsRequestRef = useRef(0);

  const loadDomains = useCallback(() => {
    const requestId = ++domainsRequestRef.current;
    setDomains(null);
    setDomainsError(false);

    getMohDomains()
      .then((loaded) => {
        if (requestId === domainsRequestRef.current) setDomains(loaded);
      })
      .catch(() => {
        if (requestId === domainsRequestRef.current) setDomainsError(true);
      });
  }, []);

  useEffect(() => {
    loadDomains();
    const requestRef = domainsRequestRef;

    return () => {
      requestRef.current += 1;
    };
  }, [loadDomains]);

  if (domains) return <AddMusicOnHoldForm domains={domains} {...props} />;

  return (
    <Modal
      open
      title="Add Music On Hold"
      footer={<Button onClick={props.onCancel}>Close</Button>}
      onCancel={props.onCancel}
      width={560}
    >
      {domainsError ? (
        <Alert
          type="error"
          showIcon
          title="Failed to load the domain options."
          action={
            <Button size="small" onClick={loadDomains}>
              Retry
            </Button>
          }
        />
      ) : (
        <Skeleton active paragraph={{ rows: 4 }} />
      )}
    </Modal>
  );
};

/** Add Music On Hold popup (music-on-hold.md §1/§3/§20) — a modal on the list toolbar, not a route. */
const AddMusicOnHoldModal = ({ open, ...rest }: AddMusicOnHoldModalProps) =>
  open ? <AddMusicOnHoldBootstrap {...rest} /> : null;

export default AddMusicOnHoldModal;
