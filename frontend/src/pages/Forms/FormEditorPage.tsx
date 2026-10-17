import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Input,
  InputNumber,
  Modal,
  Row,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import { HolderOutlined, PlusOutlined } from '@ant-design/icons';
import './FormEditorPage.css';
import { Link, useParams } from 'react-router-dom';
import { axiosInstance } from '../../api/axiosConfig';
import { useFeedback } from '../../context/FeedbackContext.tsx';
import {
  FIELD_CATALOG,
  catalogItem,
  draftFromType,
  slugify,
  type FieldDraft,
  type FormFieldType,
  type ManagedFormDraft,
} from './formCatalog';

const { Title, Paragraph, Text } = Typography;

const textTypes = new Set(['firstName', 'lastName', 'fullName', 'shortText', 'note', 'address', 'city', 'company']);

export const FormEditorPage: React.FC = () => {
  const { id } = useParams();
  const feedback = useFeedback();
  const [form, setForm] = useState<ManagedFormDraft | null>(null);
  const [slugTouched, setSlugTouched] = useState(true);
  const [selected, setSelected] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [replies, setReplies] = useState<{ id: string; createdAt: string; answers: Record<string, string> }[]>([]);
  const [dragFrom, setDragFrom] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    axiosInstance.get(`/api/forms/${id}`).then((res) => {
      const data = res.data?.data;
      setForm({
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description || '',
        introTitle: data.introTitle,
        introBody: data.introBody,
        submitLabel: data.submitLabel,
        isPublished: data.isPublished,
        fields: (data.fields || []).map((field: FieldDraft) => ({
          ...field,
          hint: field.hint || '',
          placeholder: field.placeholder || '',
          options: field.options || [],
          validation: field.validation || {},
          settings: field.settings || {},
        })),
      });
    }).catch(() => feedback.error('Could not open this form'));
    axiosInstance.get(`/api/forms/${id}/submissions`).then((res) => {
      setReplies(res.data?.data?.items ?? []);
    }).catch(() => setReplies([]));
  }, [id]);

  const field = form?.fields[selected];

  const patchField = (patch: Partial<FieldDraft>) => {
    setForm((current) => {
      if (!current) return current;
      const fields = current.fields.map((item, index) => (index === selected ? { ...item, ...patch } : item));
      return { ...current, fields };
    });
  };

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    setForm((current) => {
      if (!current) return current;
      const fields = [...current.fields];
      const [item] = fields.splice(from, 1);
      fields.splice(to, 0, item);
      return { ...current, fields };
    });
    setSelected((current) => {
      if (current === from) return to;
      if (from < current && to >= current) return current - 1;
      if (from > current && to <= current) return current + 1;
      return current;
    });
  };

  const addField = (type: FormFieldType) => {
    setForm((current) => {
      if (!current) return current;
      const fields = [...current.fields, draftFromType(type, current.fields)];
      setSelected(fields.length - 1);
      return { ...current, fields };
    });
    setPickerOpen(false);
  };

  const removeField = () => {
    setForm((current) => {
      if (!current) return current;
      const fields = current.fields.filter((_, index) => index !== selected);
      return { ...current, fields };
    });
    setSelected((index) => Math.max(0, index - 1));
  };

  const save = async () => {
    if (!form || !id) return;
    setSaving(true);
    try {
      const res = await axiosInstance.put(`/api/forms/${id}`, {
        ...form,
        slug: slugify(form.slug || form.name),
        fields: form.fields.map((item) => ({
          ...item,
          options: item.options.map((option) => option.trim()).filter(Boolean),
        })),
      });
      const data = res.data?.data;
      setForm((current) => current && ({
        ...current,
        slug: data.slug,
        fields: data.fields.map((item: FieldDraft) => ({
          ...item,
          hint: item.hint || '',
          placeholder: item.placeholder || '',
          options: item.options || [],
          validation: item.validation || {},
          settings: item.settings || {},
        })),
      }));
      feedback.success(form.isPublished ? 'Form is live' : 'Draft saved');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error;
      feedback.error(message || 'Could not save the form');
    } finally {
      setSaving(false);
    }
  };

  const downloadFile = async (submissionId: string, fieldKey: string) => {
    const res = await axiosInstance.get(`/api/forms/${id}/submissions/${submissionId}/files/${fieldKey}`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'document';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!form) return <Card>Loading form…</Card>;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Space style={{ width: '100%', justifyContent: 'space-between' }} align="start" wrap>
          <div>
            <Link to="/forms">All forms</Link>
            <Title level={3} style={{ margin: '8px 0 0' }}>
              {form.name || 'Untitled form'}
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Public link: /f/{slugify(form.slug || form.name) || '…'}
              {form.isPublished && (
                <>
                  {' '}
                  <a href={`/f/${form.slug}`} target="_blank" rel="noreferrer">
                    Open
                  </a>
                </>
              )}
            </Paragraph>
          </div>
          <Space>
            <Text>Live</Text>
            <Switch checked={form.isPublished} onChange={(isPublished) => setForm({ ...form, isPublished })} />
            <Button type="primary" loading={saving} onClick={() => void save()}>
              Save
            </Button>
          </Space>
        </Space>
        <Row gutter={12} style={{ marginTop: 16 }}>
          <Col xs={24} md={8}>
            <Text>Name</Text>
            <Input
              value={form.name}
              onChange={(event) => {
                const name = event.target.value;
                setForm({ ...form, name, slug: slugTouched ? form.slug : slugify(name) });
              }}
            />
          </Col>
          <Col xs={24} md={8}>
            <Text>Link</Text>
            <Input
              value={form.slug}
              onChange={(event) => {
                setSlugTouched(true);
                setForm({ ...form, slug: event.target.value });
              }}
            />
          </Col>
          <Col xs={24} md={8}>
            <Text>Submit button</Text>
            <Input value={form.submitLabel} onChange={(event) => setForm({ ...form, submitLabel: event.target.value })} />
          </Col>
          <Col xs={24} md={12} style={{ marginTop: 12 }}>
            <Text>Opening title</Text>
            <Input value={form.introTitle} onChange={(event) => setForm({ ...form, introTitle: event.target.value })} />
          </Col>
          <Col xs={24} md={12} style={{ marginTop: 12 }}>
            <Text>Opening note</Text>
            <Input value={form.introBody} onChange={(event) => setForm({ ...form, introBody: event.target.value })} />
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        <Col xs={24} md={10}>
          <Card
            title="Field order"
            extra={
              <Button icon={<PlusOutlined />} onClick={() => setPickerOpen(true)}>
                Add field
              </Button>
            }
          >
            {form.fields.length === 0 && <Paragraph type="secondary">Add the first field to start this form.</Paragraph>}
            {form.fields.length > 0 && <Paragraph type="secondary">Drag a field to change its order.</Paragraph>}
            <div className="field-order-list">
              {form.fields.map((item, index) => (
                <div
                  key={item.fieldKey}
                  className={`field-order-row${index === selected ? ' is-selected' : ''}${dragFrom === index ? ' is-dragging' : ''}`}
                  draggable
                  onDragStart={() => setDragFrom(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (dragFrom != null) reorder(dragFrom, index);
                    setDragFrom(null);
                  }}
                  onDragEnd={() => setDragFrom(null)}
                  onClick={() => setSelected(index)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') setSelected(index);
                  }}
                >
                  <span className="field-order-handle" aria-hidden>
                    <HolderOutlined />
                  </span>
                  <span className="field-order-copy">
                    <strong>{index + 1}. {item.label}</strong>
                    <span>
                      {catalogItem(item.fieldType)?.name || item.fieldType}
                      {item.isRequired ? ' · required' : ''}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} md={14}>
          <Card title="Field settings">
            {!field && <Paragraph type="secondary">Select a field, or add one.</Paragraph>}
            {field && (
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <Space wrap>
                  <Tag>{catalogItem(field.fieldType)?.name}</Tag>
                  <Button danger onClick={removeField}>
                    Remove
                  </Button>
                </Space>
                <div>
                  <Text>Question</Text>
                  <Input value={field.label} onChange={(event) => patchField({ label: event.target.value })} />
                </div>
                <div>
                  <Text>Note for the person filling this in</Text>
                  <Input.TextArea
                    rows={3}
                    value={field.hint}
                    placeholder="Explain what to write. Example: “Home solar for a 2BHK.”"
                    onChange={(event) => patchField({ hint: event.target.value })}
                  />
                </div>
                {field.fieldType !== 'youtube' && field.fieldType !== 'checkbox' && field.fieldType !== 'document' && (
                  <div>
                    <Text>Placeholder</Text>
                    <Input value={field.placeholder} onChange={(event) => patchField({ placeholder: event.target.value })} />
                  </div>
                )}
                {field.fieldType !== 'youtube' && (
                  <Space>
                    <Switch checked={field.isRequired} onChange={(isRequired) => patchField({ isRequired })} />
                    <Text>Required</Text>
                  </Space>
                )}
                {field.fieldType === 'dropdown' && (
                  <div>
                    <Text>Choices, one per line</Text>
                    <Input.TextArea
                      rows={5}
                      value={field.options.join('\n')}
                      onChange={(event) => patchField({ options: event.target.value.split('\n') })}
                    />
                  </div>
                )}
                {field.fieldType === 'youtube' && (
                  <div>
                    <Text>YouTube link</Text>
                    <Input
                      value={field.settings.youtubeUrl || ''}
                      placeholder="https://www.youtube.com/watch?v="
                      onChange={(event) => patchField({ settings: { youtubeUrl: event.target.value } })}
                    />
                  </div>
                )}
                {textTypes.has(field.fieldType) && (
                  <Space>
                    <div>
                      <Text>Min characters</Text>
                      <InputNumber
                        min={0}
                        value={field.validation.minLength ?? undefined}
                        onChange={(minLength) => patchField({ validation: { ...field.validation, minLength: minLength ?? null } })}
                      />
                    </div>
                    <div>
                      <Text>Max characters</Text>
                      <InputNumber
                        min={1}
                        value={field.validation.maxLength ?? undefined}
                        onChange={(maxLength) => patchField({ validation: { ...field.validation, maxLength: maxLength ?? null } })}
                      />
                    </div>
                  </Space>
                )}
                {field.fieldType === 'number' && (
                  <Space>
                    <div>
                      <Text>Minimum</Text>
                      <InputNumber
                        value={field.validation.min ?? undefined}
                        onChange={(min) => patchField({ validation: { ...field.validation, min: min ?? null } })}
                      />
                    </div>
                    <div>
                      <Text>Maximum</Text>
                      <InputNumber
                        value={field.validation.max ?? undefined}
                        onChange={(max) => patchField({ validation: { ...field.validation, max: max ?? null } })}
                      />
                    </div>
                  </Space>
                )}
                {field.fieldType === 'document' && (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text>Max size (MB)</Text>
                      <InputNumber
                        min={1}
                        max={15}
                        value={field.validation.maxFileMb ?? 8}
                        onChange={(maxFileMb) => patchField({ validation: { ...field.validation, maxFileMb: maxFileMb ?? 8 } })}
                      />
                    </div>
                    <div>
                      <Text>Allowed types</Text>
                      <Input
                        value={(field.validation.extensions || []).join(', ')}
                        onChange={(event) =>
                          patchField({
                            validation: {
                              ...field.validation,
                              extensions: event.target.value.split(',').map((item) => item.trim()).filter(Boolean),
                            },
                          })
                        }
                      />
                    </div>
                  </Space>
                )}
                <Text type="secondary">Key: {field.fieldKey}</Text>
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      <Card title="Replies">
        <Table
          rowKey="id"
          dataSource={replies}
          pagination={false}
          locale={{ emptyText: 'No replies yet.' }}
          columns={[
            {
              title: 'When',
              dataIndex: 'createdAt',
              render: (value: string) => new Date(value).toLocaleString(),
            },
            {
              title: 'Answers',
              render: (_: unknown, row: { id: string; answers: Record<string, string> }) => (
                <Space direction="vertical" size={2}>
                  {Object.entries(row.answers).filter(([, value]) => value).map(([key, value]) => {
                    const file = value.includes('\n');
                    const label = form.fields.find((item) => item.fieldKey === key)?.label || key;
                    return (
                      <div key={key}>
                        <Text strong>{label}: </Text>
                        {file ? (
                          <Button type="link" onClick={() => void downloadFile(row.id, key)}>
                            {value.split('\n')[0]}
                          </Button>
                        ) : (
                          value
                        )}
                      </div>
                    );
                  })}
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal title="Add a field" open={pickerOpen} footer={null} onCancel={() => setPickerOpen(false)} width={760}>
        <div className="field-type-grid">
          {FIELD_CATALOG.map((item) => (
            <button key={item.type} type="button" className="field-type-card" onClick={() => addField(item.type)}>
              <strong>{item.name}</strong>
              <span>{item.blurb}</span>
            </button>
          ))}
        </div>
      </Modal>
    </Space>
  );
};
