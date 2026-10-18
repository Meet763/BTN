import React, { useEffect, useState } from 'react';
import { Button, Card, Form, Input, Typography, message } from 'antd';
import { axiosInstance } from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';

const { Title, Paragraph } = Typography;

export const AccountSettingsPage: React.FC = () => {
  const { companyName, setCompanyName } = useAuth();
  const [form] = Form.useForm<{ companyName: string }>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    form.setFieldsValue({ companyName: companyName || '' });
  }, [companyName, form]);

  const save = async (values: { companyName: string }) => {
    setSaving(true);
    try {
      const response = await axiosInstance.put('/api/customer-profile/branding', {
        companyName: values.companyName.trim(),
      });
      const savedName = response.data.data.companyName;
      setCompanyName(savedName);
      form.setFieldsValue({ companyName: savedName });
      message.success('Company name updated');
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Could not update the company name.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={{ maxWidth: 720 }}>
      <Title level={2}>Account settings</Title>
      <Paragraph type="secondary">
        Set the company name shown in your BTN workspace. This change applies to your customer account.
      </Paragraph>
      <Form form={form} layout="vertical" onFinish={save} initialValues={{ companyName: companyName || '' }}>
        <Form.Item
          label="Company name"
          name="companyName"
          rules={[
            { required: true, whitespace: true, message: 'Enter your company name.' },
            { max: 80, message: 'Use 80 characters or fewer.' },
          ]}
        >
          <Input placeholder="Your company name" maxLength={80} showCount />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={saving}>Save changes</Button>
      </Form>
    </Card>
  );
};
