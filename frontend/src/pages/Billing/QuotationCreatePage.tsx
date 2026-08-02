import React, { useEffect, useState } from 'react';
import { Button, Card, DatePicker, Form, Input, InputNumber, Select, Space, message } from 'antd';
import { axiosInstance } from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';

export const QuotationCreatePage: React.FC = () => {
  const [billingCustomers, setBillingCustomers] = useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; unitPrice: number }[]>([]);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/api/billing/customers'),
      axiosInstance.get('/api/billing/products'),
    ]).then(([c, p]) => {
      setBillingCustomers((c.data.data || []).map((x: { id: string; name: string }) => ({ id: x.id, name: x.name })));
      setProducts((p.data.data || []).map((x: { id: string; name: string; unitPrice: number }) => ({
        id: x.id,
        name: x.name,
        unitPrice: x.unitPrice,
      })));
    });
  }, []);

  const onFinish = async (values: {
    billingCustomerId: string;
    validUntil?: { toISOString: () => string };
    description: string;
    quantity: number;
    unitPrice: number;
  }) => {
    await axiosInstance.post('/api/billing/quotations', {
      billingCustomerId: values.billingCustomerId,
      validUntil: values.validUntil ? values.validUntil.toISOString() : null,
      lines: [
        {
          description: values.description,
          quantity: values.quantity,
          unitPrice: values.unitPrice,
        },
      ],
    });
    message.success('Quotation created');
    navigate('/customer/billing');
  };

  return (
    <Card title="New quotation">
      <Form form={form} layout="vertical" onFinish={(v) => void onFinish(v)} initialValues={{ quantity: 1, unitPrice: 1000 }}>
        <Form.Item name="billingCustomerId" label="Bill to" rules={[{ required: true }]}>
          <Select options={billingCustomers.map((c) => ({ value: c.id, label: c.name }))} />
        </Form.Item>
        <Form.Item name="validUntil" label="Valid until">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        {products.length > 0 && (
          <Form.Item label="Fill from product">
            <Select
              allowClear
              placeholder="Select product"
              options={products.map((p) => ({ value: p.id, label: `${p.name} (₹${p.unitPrice})` }))}
              onChange={(id) => {
                const p = products.find((x) => x.id === id);
                if (p) form.setFieldsValue({ description: p.name, unitPrice: p.unitPrice });
              }}
            />
          </Form.Item>
        )}
        <Form.Item name="description" label="Line description" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Space>
          <Form.Item name="quantity" label="Qty" rules={[{ required: true }]}>
            <InputNumber min={1} />
          </Form.Item>
          <Form.Item name="unitPrice" label="Unit price (₹)" rules={[{ required: true }]}>
            <InputNumber min={1} />
          </Form.Item>
        </Space>
        <Space>
          <Button type="primary" htmlType="submit">
            Create
          </Button>
          <Button onClick={() => navigate('/customer/billing')}>Cancel</Button>
        </Space>
      </Form>
    </Card>
  );
};
