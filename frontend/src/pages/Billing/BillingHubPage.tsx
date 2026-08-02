import React, { useEffect, useState } from 'react';
import { Button, Card, Form, Input, InputNumber, List, Modal, Space, Tag, message } from 'antd';
import { axiosInstance } from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';

export const BillingHubPage: React.FC = () => {
  const [, setOrg] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [billingCustomers, setBillingCustomers] = useState<any[]>([]);
  const [customerModal, setCustomerModal] = useState(false);
  const [productModal, setProductModal] = useState(false);
  const [payModal, setPayModal] = useState<{ id: string; due: number } | null>(null);
  const [customerForm] = Form.useForm();
  const [productForm] = Form.useForm();
  const [payForm] = Form.useForm();
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const load = async () => {
    const [o, i, bc, p, q] = await Promise.all([
      axiosInstance.get('/api/billing/organization'),
      axiosInstance.get('/api/billing/invoices'),
      axiosInstance.get('/api/billing/customers'),
      axiosInstance.get('/api/billing/products'),
      axiosInstance.get('/api/billing/quotations'),
    ]);
    setOrg(o.data.data);
    setInvoices(i.data.data || []);
    setBillingCustomers(bc.data.data || []);
    setProducts(p.data.data || []);
    setQuotations(q.data.data || []);
    if (o.data.data) form.setFieldsValue(o.data.data);
  };

  useEffect(() => {
    load();
  }, []);

  const saveOrg = async () => {
    const values = await form.validateFields();
    await axiosInstance.put('/api/billing/organization', values);
    message.success('Organization saved');
    load();
  };

  const createBillingCustomer = async () => {
    const values = await customerForm.validateFields();
    await axiosInstance.post('/api/billing/customers', values);
    message.success('Billing customer added');
    setCustomerModal(false);
    customerForm.resetFields();
    load();
  };

  const createProduct = async () => {
    const values = await productForm.validateFields();
    await axiosInstance.post('/api/billing/products', values);
    message.success('Product added');
    setProductModal(false);
    productForm.resetFields();
    load();
  };

  const recordPayment = async () => {
    if (!payModal) return;
    const values = await payForm.validateFields();
    await axiosInstance.post(`/api/billing/invoices/${payModal.id}/payments`, values);
    message.success('Payment recorded');
    setPayModal(null);
    payForm.resetFields();
    load();
  };

  const convertQuotation = async (id: string) => {
    const res = await axiosInstance.post(`/api/billing/quotations/${id}/convert`);
    message.success(`Invoice ${res.data.data.invoiceNumber} created`);
    load();
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="Billing Branding">
        <Form form={form} layout="vertical" onFinish={() => void saveOrg()}>
          <Form.Item name="legalName" label="Company Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="logoUrl" label="Logo URL">
            <Input />
          </Form.Item>
          <Form.Item name="invoicePrefix" label="Invoice Prefix">
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Save
          </Button>
        </Form>
      </Card>

      <Card title="Your clients (bill-to)" extra={<Button onClick={() => setCustomerModal(true)}>Add client</Button>}>
        <List
          dataSource={billingCustomers}
          renderItem={(c) => (
            <List.Item>
              {c.name} — {c.email || c.phone || '—'}
            </List.Item>
          )}
        />
      </Card>

      <Card title="Products / services" extra={<Button onClick={() => setProductModal(true)}>Add product</Button>}>
        <List
          dataSource={products}
          renderItem={(p) => (
            <List.Item>
              {p.name} — ₹{p.unitPrice} {p.isActive === false && <Tag>Inactive</Tag>}
            </List.Item>
          )}
        />
      </Card>

      <Card
        title="Quotations"
        extra={<Button type="primary" onClick={() => navigate('/customer/billing/quotations/new')}>New quotation</Button>}
      >
        <List
          dataSource={quotations}
          renderItem={(q) => (
            <List.Item
              actions={[
                <Button key="p" size="small" onClick={() => navigate(`/customer/billing/quotations/${q.id}/print`)}>
                  Print
                </Button>,
                <Button key="c" size="small" type="link" onClick={() => void convertQuotation(q.id)}>
                  Convert to invoice
                </Button>,
              ]}
            >
              {q.quotationNumber} — ₹{q.totalAmount} — {q.customer?.name || '—'}
            </List.Item>
          )}
        />
      </Card>

      <Card title="Invoices" extra={<Button onClick={() => navigate('/customer/billing/invoices/new')}>New Invoice</Button>}>
        <List
          dataSource={invoices}
          renderItem={(inv) => (
            <List.Item
              actions={[
                <Button key="p" onClick={() => navigate(`/customer/billing/invoices/${inv.id}/print`)}>
                  Print
                </Button>,
                inv.status !== 'Paid' ? (
                  <Button
                    key="pay"
                    type="link"
                    onClick={() => {
                      setPayModal({ id: inv.id, due: Math.max(0, (inv.totalAmount || 0) - (inv.amountPaid || 0)) });
                      payForm.setFieldsValue({ amount: Math.max(0, (inv.totalAmount || 0) - (inv.amountPaid || 0)) });
                    }}
                  >
                    Record payment
                  </Button>
                ) : null,
              ]}
            >
              {inv.invoiceNumber} — ₹{inv.totalAmount} — <Tag>{inv.status}</Tag>
              {inv.amountPaid > 0 && ` (paid ₹${inv.amountPaid})`}
            </List.Item>
          )}
        />
      </Card>

      <Modal title="Billing client" open={customerModal} onOk={() => void createBillingCustomer()} onCancel={() => setCustomerModal(false)}>
        <Form form={customerForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Product / service" open={productModal} onOk={() => void createProduct()} onCancel={() => setProductModal(false)}>
        <Form form={productForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="unitPrice" label="Unit price (₹)" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Record payment" open={!!payModal} onOk={() => void recordPayment()} onCancel={() => setPayModal(null)}>
        <Form form={payForm} layout="vertical">
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="method" label="Method">
            <Input placeholder="UPI / Bank / Cash" />
          </Form.Item>
          <Form.Item name="reference" label="Reference">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};
