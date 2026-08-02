import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  InputNumber,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CreditCardOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { axiosInstance } from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';
import { isRazorpayCheckoutEnabled, openRazorpayCheckout } from '../../utils/razorpay';

const { Title, Text, Paragraph } = Typography;

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

interface WalletData {
  id: string;
  balance: number;
  currency: string;
}

interface WalletTxn {
  id: string;
  type: string;
  amountMinor: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
}

interface TopUpOrder {
  paymentOrderId: string;
  provider: string;
  providerOrderId?: string;
  razorpayKeyId?: string;
  amountMinor: number;
  currency: string;
}

export const WalletPage: React.FC = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [txns, setTxns] = useState<WalletTxn[]>([]);
  const [amount, setAmount] = useState(500);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [w, t] = await Promise.all([
        axiosInstance.get('/api/wallet'),
        axiosInstance.get('/api/wallet/transactions', { params: { pageSize: 50 } }),
      ]);
      setWallet(w.data.data);
      setTxns(t.data.data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const confirmTopUp = async (order: TopUpOrder, providerPaymentId: string) => {
    await axiosInstance.post('/api/wallet/confirm-top-up', {
      paymentOrderId: order.paymentOrderId,
      providerPaymentId,
      idempotencyKey: providerPaymentId,
    });
    message.success('Wallet credited successfully');
    await load();
  };

  const simulateTestPayment = async () => {
    if (amount < 100) {
      message.warning('Minimum top-up is ₹100');
      return;
    }
    setPaying(true);
    try {
      const orderRes = await axiosInstance.post('/api/wallet/top-up', { amount });
      const order: TopUpOrder = orderRes.data.data;
      await confirmTopUp(order, `test_pay_${Date.now()}`);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      message.error(err.response?.data?.error || 'Top-up failed');
    } finally {
      setPaying(false);
    }
  };

  const payWithRazorpay = async () => {
    if (amount < 100) {
      message.warning('Minimum top-up is ₹100');
      return;
    }
    setPaying(true);
    try {
      const orderRes = await axiosInstance.post('/api/wallet/top-up', { amount });
      const order: TopUpOrder = orderRes.data.data;
      const keyId = order.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!isRazorpayCheckoutEnabled(keyId)) {
        message.info('Razorpay keys not configured — using sandbox simulation.');
        await confirmTopUp(order, `sim_${Date.now()}`);
        return;
      }

      await openRazorpayCheckout({
        keyId: keyId!,
        amountMinor: order.amountMinor,
        currency: order.currency,
        providerOrderId: order.providerOrderId,
        customerName: user?.fullName,
        email: user?.email,
        onSuccess: async (paymentId) => {
          try {
            await confirmTopUp(order, paymentId);
          } catch {
            message.error('Payment received but wallet confirm failed. Contact support with payment ID.');
          } finally {
            setPaying(false);
          }
        },
        onDismiss: () => setPaying(false),
      });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      message.error(err.response?.data?.error || err.message || 'Could not start payment');
      setPaying(false);
    }
  };

  const razorpayReady = isRazorpayCheckoutEnabled(import.meta.env.VITE_RAZORPAY_KEY_ID);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3} style={{ margin: 0 }}>
          <WalletOutlined /> eWallet
        </Title>
        <Text type="secondary">Add money via Razorpay (test/live). Purchases deduct from this balance.</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={10}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: 'var(--card-shadow)' }}>
            <Statistic
              title="Available balance"
              prefix="₹"
              value={wallet?.balance ?? 0}
              precision={2}
              valueStyle={{ color: 'var(--primary-color)', fontSize: 36 }}
            />
            <Text type="secondary">Currency: {wallet?.currency || 'INR'}</Text>
          </Card>
        </Col>
        <Col xs={24} md={14}>
          <Card title="Add money" bordered={false} style={{ borderRadius: 12, boxShadow: 'var(--card-shadow)' }}>
            <Paragraph type="secondary" style={{ marginBottom: 12 }}>
              Choose amount, then pay with Razorpay Checkout or use dev simulation when keys are placeholders.
            </Paragraph>
            <Space wrap style={{ marginBottom: 16 }}>
              {QUICK_AMOUNTS.map((a) => (
                <Button key={a} type={amount === a ? 'primary' : 'default'} onClick={() => setAmount(a)}>
                  ₹{a}
                </Button>
              ))}
            </Space>
            <Space wrap align="center">
              <InputNumber
                min={100}
                step={100}
                value={amount}
                onChange={(v) => setAmount(v || 100)}
                addonBefore="₹"
                style={{ width: 160 }}
              />
              <Button
                type="primary"
                icon={<CreditCardOutlined />}
                loading={paying}
                onClick={() => void payWithRazorpay()}
              >
                Pay with Razorpay
              </Button>
              <Button loading={paying} onClick={() => void simulateTestPayment()}>
                Simulate (dev)
              </Button>
            </Space>
            {!razorpayReady && (
              <Alert
                style={{ marginTop: 16 }}
                type="info"
                showIcon
                message="Test mode"
                description="Set Razorpay:KeyId in API appsettings or VITE_RAZORPAY_KEY_ID for real checkout. Until then, use Simulate."
              />
            )}
          </Card>
        </Col>
      </Row>

      <Card title="Transaction history" loading={loading}>
        <Table
          rowKey="id"
          dataSource={txns}
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
          columns={[
            {
              title: 'Type',
              dataIndex: 'type',
              render: (type: string) =>
                type === 'Credit' ? (
                  <Tag icon={<ArrowDownOutlined />} color="success">
                    Credit
                  </Tag>
                ) : (
                  <Tag icon={<ArrowUpOutlined />} color="error">
                    Debit
                  </Tag>
                ),
            },
            {
              title: 'Amount',
              render: (_, r) => (
                <Text strong style={{ color: r.type === 'Credit' ? '#389e0d' : '#cf1322' }}>
                  {r.type === 'Credit' ? '+' : '-'}₹{(r.amountMinor / 100).toFixed(2)}
                </Text>
              ),
            },
            {
              title: 'Balance after',
              render: (_, r) => `₹${(r.balanceAfter / 100).toFixed(2)}`,
            },
            { title: 'Description', dataIndex: 'description', ellipsis: true },
            {
              title: 'Date',
              dataIndex: 'createdAt',
              render: (d: string) => new Date(d).toLocaleString(),
            },
          ]}
        />
      </Card>
    </Space>
  );
};
