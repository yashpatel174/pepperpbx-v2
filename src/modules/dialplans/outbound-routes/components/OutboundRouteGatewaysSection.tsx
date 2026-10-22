import React, { useState } from "react";
import { Button, Card, Col, Form, Row, Select, Space, Tooltip, Typography, theme } from "antd";
import { DeleteOutlined, HolderOutlined, PlusOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import type { OutboundRouteGatewayOption } from "../outbound-route.types";

interface OutboundRouteGatewaysSectionProps {
  options: OutboundRouteGatewayOption[];
  optionsLoading?: boolean;
}

/**
 * Ordered, domain-scoped gateway list.
 *
 * Gateways can be reordered using native HTML5 drag-and-drop.
 * The Form.List `move()` helper keeps the form values in the same
 * ordered array while changing only their position.
 *
 * No additional drag-and-drop dependency is required.
 */
const OutboundRouteGatewaysSection = ({ options, optionsLoading }: OutboundRouteGatewaysSectionProps) => {
  const { token } = theme.useToken();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  return (
    <Form.List
      name="gateways"
      rules={[
        {
          validator: async (_, gateways?: string[]) => {
            if (!gateways || gateways.filter(Boolean).length < 1) {
              throw new Error("At least one gateway is required.");
            }
          },
        },
      ]}
    >
      {(fields, { add, remove, move }, { errors }) => {
        const handleDragStart = (event: React.DragEvent<HTMLDivElement>, index: number) => {
          setDraggedIndex(index);
          setDragOverIndex(index);

          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", String(index));
        };

        const handleDragOver = (event: React.DragEvent<HTMLDivElement>, index: number) => {
          event.preventDefault();

          if (draggedIndex === null || draggedIndex === index) {
            return;
          }

          event.dataTransfer.dropEffect = "move";
          setDragOverIndex(index);
        };

        const handleDrop = (event: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
          event.preventDefault();

          if (draggedIndex === null || draggedIndex === targetIndex) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
          }

          move(draggedIndex, targetIndex);

          setDraggedIndex(null);
          setDragOverIndex(null);
        };

        const handleDragEnd = () => {
          setDraggedIndex(null);
          setDragOverIndex(null);
        };

        return (
          <Card
            title={
              <Space size={4} align="center">
                <span>Gateways</span>

                <span style={{ color: token.colorError }}>*</span>

                <Tooltip title="At least one gateway is required. Drag and drop to reorder — dial attempts follow this order.">
                  <QuestionCircleOutlined
                    style={{
                      color: token.colorTextTertiary,
                      cursor: "help",
                    }}
                    aria-label="Gateways information"
                  />
                </Tooltip>
              </Space>
            }
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={() => add("")}>
                Add
              </Button>
            }
          >
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              {fields.map((field, index) => {
                const isDragging = draggedIndex === index;
                const isDragOver = dragOverIndex === index && draggedIndex !== index;

                return (
                  <div
                    key={field.key}
                    onDragOver={(event) => handleDragOver(event, index)}
                    onDrop={(event) => handleDrop(event, index)}
                    style={{
                      width: "100%",
                      borderRadius: token.borderRadius,
                      border: isDragOver ? `2px dashed ${token.colorPrimary}` : "2px solid transparent",
                      backgroundColor: isDragOver ? token.colorFillSecondary : "transparent",
                      padding: isDragOver ? 4 : 0,
                      transition: "border-color 0.15s ease, background-color 0.15s ease, opacity 0.15s ease",
                      opacity: isDragging ? 0.45 : 1,
                    }}
                  >
                    <Row gutter={8} align="top" wrap={false}>
                      <Col flex="none">
                        <Space
                          align="center"
                          style={{
                            height: 32,
                            userSelect: "none",
                          }}
                        >
                          <div
                            draggable
                            onDragStart={(event) => handleDragStart(event, index)}
                            onDragEnd={handleDragEnd}
                            role="button"
                            tabIndex={0}
                            aria-label={`Drag gateway ${index + 1} to reorder`}
                            title="Drag to reorder"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 24,
                              height: 32,
                              cursor: "grab",
                              color: token.colorTextTertiary,
                            }}
                            onMouseDown={(event) => {
                              event.currentTarget.style.cursor = "grabbing";
                            }}
                            onMouseUp={(event) => {
                              event.currentTarget.style.cursor = "grab";
                            }}
                          >
                            <HolderOutlined />
                          </div>

                          <Typography.Text>{index + 1}</Typography.Text>
                        </Space>
                      </Col>

                      <Col flex="auto">
                        <Form.Item
                          {...field}
                          style={{ marginBottom: 0 }}
                          rules={[
                            {
                              required: true,
                              message: "Gateway is required",
                            },
                          ]}
                        >
                          <Select
                            showSearch
                            optionFilterProp="label"
                            placeholder="Select gateway"
                            options={options}
                            loading={optionsLoading}
                            aria-label={`Gateway ${index + 1}`}
                          />
                        </Form.Item>
                      </Col>

                      <Col flex="none">
                        <Space size={4} align="center" style={{ height: 32 }}>
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            disabled={index === 0}
                            onClick={() => remove(field.name)}
                            aria-label={`Remove gateway ${index + 1}`}
                          />
                        </Space>
                      </Col>
                    </Row>
                  </div>
                );
              })}
            </Space>

            <Form.ErrorList errors={errors} />

            <div style={{ marginTop: 8 }}>
              <Typography.Text type="secondary">
                Drag the handle to reorder — dial attempts follow this order.
              </Typography.Text>
            </div>
          </Card>
        );
      }}
    </Form.List>
  );
};

export default OutboundRouteGatewaysSection;
