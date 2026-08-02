import React, { useEffect } from 'react';
import { Button, Col, Collapse, DatePicker, Form, Input, InputNumber, Row, message } from 'antd';
import { axiosInstance } from '../../api/axiosConfig';

interface LeadProfile {
  id: string;
  inquiryType?: string;
  productInterest?: string;
  inquiryDetails?: string;
  customerRequirements?: string;
  budgetAmount?: number;
  timeline?: string;
  contactOutcome?: string;
  followUpAt?: string;
  remarks?: string;
  internalNotes?: string;
}

interface LeadProfileEditorProps {
  lead: LeadProfile;
  onUpdated: () => void;
}

export const LeadProfileEditor: React.FC<LeadProfileEditorProps> = ({ lead, onUpdated }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      ...lead,
      followUpAt: lead.followUpAt ? new Date(lead.followUpAt) : undefined,
    });
  }, [lead, form]);

  const save = async () => {
    const values = await form.validateFields();
    await axiosInstance.put(`/api/leads/${lead.id}`, {
      inquiryType: values.inquiryType,
      productInterest: values.productInterest,
      inquiryDetails: values.inquiryDetails,
      customerRequirements: values.customerRequirements,
      budgetAmount: values.budgetAmount,
      timeline: values.timeline,
      contactOutcome: values.contactOutcome,
      followUpAt: values.followUpAt ? new Date(values.followUpAt).toISOString() : null,
      remarks: values.remarks,
      internalNotes: values.internalNotes,
    });
    message.success('Lead profile updated');
    onUpdated();
  };

  return (
    <Collapse
      style={{ marginTop: 16 }}
      items={[
        {
          key: 'profile',
          label: 'Edit lead CRM profile (before / after verification)',
          children: (
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="inquiryType" label="Inquiry type">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="productInterest" label="Product / service">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="inquiryDetails" label="Inquiry details">
                <Input.TextArea rows={2} />
              </Form.Item>
              <Form.Item name="customerRequirements" label="Customer requirements">
                <Input.TextArea rows={2} />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="budgetAmount" label="Budget (INR)">
                    <InputNumber style={{ width: '100%' }} min={0} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="timeline" label="Timeline">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="followUpAt" label="Follow-up date">
                <DatePicker style={{ width: '100%' }} showTime />
              </Form.Item>
              <Form.Item name="internalNotes" label="Internal notes">
                <Input.TextArea rows={2} />
              </Form.Item>
              <Button type="primary" onClick={() => void save()}>
                Save profile
              </Button>
            </Form>
          ),
        },
      ]}
    />
  );
};
