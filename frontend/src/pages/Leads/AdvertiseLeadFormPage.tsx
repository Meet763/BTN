import React, { useState } from 'react';
import { Button, Col, Form, Input, InputNumber, Row, Select, Typography, Space } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../../api/axiosConfig';
import { useFeedback } from '../../context/FeedbackContext';
import { getApiErrorMessage } from '../../utils/apiError';

const { Text } = Typography;
const { Option } = Select;

/**
 * Simulates an advertising lead form (Google / Meta style).
 * Submits into POST /api/leads so the lead appears in Verification → Lead sales.
 */
export const AdvertiseLeadFormPage: React.FC = () => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const feedback = useFeedback();
  const navigate = useNavigate();

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const rawData = {
        formType: 'advertise',
        campaign: values.campaign || 'BTN Test Campaign',
        utm_source: values.source,
        utm_medium: 'cpc',
        landing_page: '/leads/advertise',
        submittedAt: new Date().toISOString(),
      };

      const createRes = await axiosInstance.post('/api/leads', {
        customerName: values.customerName.trim(),
        phone: String(values.phone).trim(),
        email: values.email?.trim() || null,
        city: values.city?.trim() || null,
        state: values.state?.trim() || null,
        pincode: values.pincode?.trim() || null,
        source: values.source,
        productInterest: values.productInterest?.trim() || null,
        rawData,
      });

      const leadId = createRes.data.data?.id as string | undefined;

      if (leadId && (values.inquiryDetails || values.budgetAmount || values.customerRequirements || values.timeline)) {
        await axiosInstance.put(`/api/leads/${leadId}`, {
          inquiryType: values.inquiryType || 'Product inquiry',
          productInterest: values.productInterest?.trim() || null,
          inquiryDetails: values.inquiryDetails || null,
          customerRequirements: values.customerRequirements || null,
          budgetAmount: values.budgetAmount != null ? Number(values.budgetAmount) : null,
          timeline: values.timeline || null,
        });
      }

      feedback.success('Lead captured from advertise form', 'Open Verification to call & verify, then use Lead sales.');
      form.resetFields();
      form.setFieldsValue({ source: 'GoogleAds' });
    } catch (e: unknown) {
      const err = e as { errorFields?: unknown };
      if (err.errorFields) {
        feedback.error('Missing required fields', 'Fill Full name, Phone, and Ad channel.');
        return;
      }
      feedback.error('Could not submit lead', getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Button onClick={() => navigate('/verification')}>Go to Verification</Button>
        <Button type="primary" onClick={() => navigate('/leads/sales')}>
          Go to Lead sales
        </Button>
      </Space>

      <div className="advertise-form-shell">
        <div className="advertise-form-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <ThunderboltOutlined />
            <Text style={{ color: '#fff', opacity: 0.9 }}>BTN advertise lead form (test)</Text>
          </div>
          <h2>Get a free quote</h2>
          <p>Same fields a Google/Meta lead ad would send into BTN. Submit creates a real Pending lead.</p>
        </div>
        <div className="advertise-form-body">
          <Form form={form} layout="vertical" initialValues={{ source: 'GoogleAds' }} requiredMark="optional">
            <Form.Item name="customerName" label="Full name" rules={[{ required: true, message: 'Name required' }]}>
              <Input placeholder="e.g. Priya Sharma" size="large" />
            </Form.Item>
            <Form.Item name="phone" label="Phone" rules={[{ required: true, message: 'Phone required' }]}>
              <Input placeholder="10-digit mobile" size="large" />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}>
              <Input placeholder="optional" size="large" />
            </Form.Item>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="city" label="City">
                  <Input placeholder="Pune" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="state" label="State">
                  <Input placeholder="Maharashtra" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="pincode" label="Pincode">
              <Input />
            </Form.Item>
            <Form.Item name="source" label="Ad channel" rules={[{ required: true }]}>
              <Select size="large">
                <Option value="GoogleAds">Google Ads</Option>
                <Option value="MetaAds">Meta Ads</Option>
                <Option value="Website">Website</Option>
                <Option value="WhatsApp">WhatsApp</Option>
                <Option value="Referral">Referral</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
            <Form.Item name="campaign" label="Campaign name">
              <Input placeholder="Summer Solar 2026" />
            </Form.Item>
            <Form.Item name="productInterest" label="Product / service of interest">
              <Input placeholder="Solar 5kW rooftop" size="large" />
            </Form.Item>
            <Form.Item name="inquiryType" label="Inquiry type">
              <Select allowClear placeholder="Optional">
                <Option value="Product inquiry">Product inquiry</Option>
                <Option value="Quote request">Quote request</Option>
                <Option value="Service request">Service request</Option>
              </Select>
            </Form.Item>
            <Form.Item name="inquiryDetails" label="What do you need?">
              <Input.TextArea rows={3} placeholder="Tell us about your requirement…" />
            </Form.Item>
            <Form.Item name="customerRequirements" label="Requirements">
              <Input.TextArea rows={2} />
            </Form.Item>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="budgetAmount" label="Budget (₹)">
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="e.g. 250000" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="timeline" label="Timeline">
                  <Input placeholder="Within 2 weeks" />
                </Form.Item>
              </Col>
            </Row>
            <Button type="primary" size="large" block loading={saving} onClick={() => void onSubmit()}>
              Submit lead
            </Button>
            <Text type="secondary" style={{ display: 'block', marginTop: 12, textAlign: 'center' }}>
              After submit → Verification (verify) → Lead sales (price & publish)
            </Text>
          </Form>
        </div>
      </div>
    </div>
  );
};
