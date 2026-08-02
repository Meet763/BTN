import React, { useEffect, useState } from 'react';
import { Button, Card, Form, Input, Modal, Table } from 'antd';
import { axiosInstance } from '../../api/axiosConfig';
import { useFeedback } from '../../context/FeedbackContext';

interface CustomerRow {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  companyName?: string;
  createdAt: string;
}

export const CustomerListPage: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const feedback = useFeedback();

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/customers', { params: { pageSize: 100 } });
      setCustomers(res.data.data.items);
    } catch {
      feedback.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async () => {
    try {
      const values = await form.validateFields();
      await axiosInstance.post('/api/customers', values);
      feedback.success('Customer account created', 'They can log in and use Wallet / Marketplace.');
      setOpen(false);
      form.resetFields();
      load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; errorFields?: unknown };
      if (err.errorFields) return;
      feedback.error('Could not create customer', err.response?.data?.error);
    }
  };

  return (
    <Card
      title="Customer accounts (lead buyers)"
      extra={
        <Button type="primary" onClick={() => setOpen(true)}>
          Add customer
        </Button>
      }
    >
      <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
        Create customer logins for wallet top-up, marketplace purchases, and billing.
      </p>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={customers}
        scroll={{ x: true }}
        columns={[
          { title: 'Name', dataIndex: 'fullName' },
          { title: 'Email', dataIndex: 'email' },
          { title: 'Phone', dataIndex: 'phone' },
          { title: 'Company', dataIndex: 'companyName' },
          { title: 'Created', render: (_, r) => new Date(r.createdAt).toLocaleDateString() },
        ]}
      />
      <Modal title="New customer" open={open} onCancel={() => setOpen(false)} onOk={onCreate} okText="Create">
        <Form form={form} layout="vertical">
          <Form.Item name="fullName" label="Full name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="companyName" label="Company">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};
