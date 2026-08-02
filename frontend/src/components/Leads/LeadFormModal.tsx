import React, { useState } from 'react';
import {
  Button,
  Col,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Typography,
} from 'antd';
import { UserOutlined, EnvironmentOutlined, FundProjectionScreenOutlined, FileTextOutlined } from '@ant-design/icons';
import { axiosInstance } from '../../api/axiosConfig';
import { useFeedback } from '../../context/FeedbackContext';

const { Text } = Typography;
const { Option } = Select;

const SOURCE_OPTIONS = [
  { value: 'GoogleAds', label: 'Google Ads' },
  { value: 'MetaAds', label: 'Meta Ads' },
  { value: 'Website', label: 'Website' },
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Other', label: 'Other' },
];

const INQUIRY_TYPES = ['Product inquiry', 'Service request', 'Quote request', 'Support', 'Partnership', 'Other'];

interface LeadFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LeadFormModal: React.FC<LeadFormModalProps> = ({ open, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const feedback = useFeedback();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      let rawData: unknown = null;
      if (values.rawData?.trim()) {
        rawData = JSON.parse(values.rawData);
      }

      const createRes = await axiosInstance.post('/api/leads', {
        customerName: values.customerName,
        phone: values.phone,
        email: values.email,
        city: values.city,
        state: values.state,
        pincode: values.pincode,
        source: values.source,
        productInterest: values.productInterest,
        rawData,
      });

      const leadId = createRes.data.data?.id;
      const hasExtended =
        values.inquiryType ||
        values.inquiryDetails ||
        values.customerRequirements ||
        values.budgetAmount ||
        values.timeline ||
        values.internalNotes;

      if (leadId && hasExtended) {
        await axiosInstance.put(`/api/leads/${leadId}`, {
          inquiryType: values.inquiryType,
          productInterest: values.productInterest,
          inquiryDetails: values.inquiryDetails,
          customerRequirements: values.customerRequirements,
          budgetAmount: values.budgetAmount,
          timeline: values.timeline,
          internalNotes: values.internalNotes,
        });
      }

      feedback.success('Lead created successfully');
      form.resetFields();
      onClose();
      onSuccess();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } }; errorFields?: unknown };
      if (err.errorFields) return;
      feedback.error('Could not save lead', err.response?.data?.error || 'Check required fields and JSON.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title="Add new lead"
      width={Math.min(720, window.innerWidth)}
      open={open}
      onClose={onClose}
      destroyOnClose
      extra={
        <Space>
          <Text type="secondary">Fields match BTN lead + CRM profile APIs</Text>
        </Space>
      }
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={saving} onClick={() => void handleSubmit()}>
            Create lead
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Divider titlePlacement="start" plain>
          <UserOutlined /> Contact
        </Divider>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="customerName" label="Customer name" rules={[{ required: true }]}>
              <Input placeholder="Full name" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
              <Input placeholder="10-digit mobile" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}>
              <Input placeholder="optional" />
            </Form.Item>
          </Col>
        </Row>

        <Divider titlePlacement="start" plain>
          <EnvironmentOutlined /> Location
        </Divider>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name="city" label="City">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="state" label="State">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="pincode" label="Pincode">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Divider titlePlacement="start" plain>
          <FundProjectionScreenOutlined /> Campaign & interest
        </Divider>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="source" label="Lead source" rules={[{ required: true }]}>
              <Select placeholder="Channel">
                {SOURCE_OPTIONS.map((s) => (
                  <Option key={s.value} value={s.value}>
                    {s.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="productInterest" label="Product / service interest">
              <Input placeholder="e.g. Solar 5kW" />
            </Form.Item>
          </Col>
        </Row>

        <Divider titlePlacement="start" plain>
          <FileTextOutlined /> Inquiry details (saved to lead profile)
        </Divider>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="inquiryType" label="Inquiry type">
              <Select allowClear placeholder="Select type">
                {INQUIRY_TYPES.map((t) => (
                  <Option key={t} value={t}>
                    {t}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="budgetAmount" label="Budget (INR)">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="Estimated budget" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="inquiryDetails" label="Inquiry details">
          <Input.TextArea rows={2} placeholder="What did the customer ask for?" />
        </Form.Item>
        <Form.Item name="customerRequirements" label="Customer requirements">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="timeline" label="Timeline">
          <Input placeholder="e.g. Within 2 weeks" />
        </Form.Item>
        <Form.Item name="internalNotes" label="Internal notes (staff only)">
          <Input.TextArea rows={2} />
        </Form.Item>

        <Form.Item name="rawData" label="UTM / ad metadata (JSON)">
          <Input.TextArea rows={3} placeholder='{"utm_source":"google","campaign":"summer"}' />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
