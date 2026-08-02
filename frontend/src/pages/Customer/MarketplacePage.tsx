import React, { useEffect, useState } from 'react';
import { Button, Card, Input, Space, Table, Tag, message, Alert } from 'antd';
import { axiosInstance } from '../../api/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';

export const MarketplacePage: React.FC = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const [res, w] = await Promise.all([
        axiosInstance.get('/api/leads/available', {
          params: { search: search || undefined, city: city || undefined, pageSize: 50 },
        }),
        axiosInstance.get('/api/wallet'),
      ]);
      setLeads(res.data.data.items);
      setBalance(w.data.data?.balance ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const purchase = async (leadId: string) => {
    try {
      await axiosInstance.post('/api/purchases', { leadId });
      message.success('Lead purchased — amount deducted from wallet');
      navigate('/customer/purchases');
    } catch (e: any) {
      message.error(e.response?.data?.error || 'Purchase failed');
    }
  };

  return (
    <Card title="Verified Lead Marketplace">
      <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
        Leads appear here after an admin verifies them, sets a price, and clicks Publish on Lead sales.
        {balance != null && (
          <>
            {' '}
            Your wallet: <strong>₹{balance.toFixed(2)}</strong> — <Link to="/customer/wallet">Add money</Link>
          </>
        )}
      </p>
      {balance != null && balance < 100 && (
        <Alert
          type="warning"
          showIcon
          message="Low balance"
          description="Top up your eWallet before purchasing leads."
          style={{ marginBottom: 16 }}
        />
      )}
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="Search interest / details"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onSearch={() => void load()}
          style={{ width: 240 }}
        />
        <Input
          placeholder="Filter by city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onPressEnter={() => void load()}
          style={{ width: 160 }}
          allowClear
        />
        <Button type="primary" onClick={() => void load()}>
          Apply filters
        </Button>
        <Button onClick={() => void load()}>Refresh</Button>
      </Space>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={leads}
        scroll={{ x: true }}
        columns={[
          { title: 'Interest', dataIndex: 'productInterest' },
          { title: 'City', dataIndex: 'city' },
          { title: 'Price', render: (_, r) => (r.listPrice ? `₹${r.listPrice}` : '-') },
          { title: 'Status', render: (_, r) => <Tag>{r.saleStatus}</Tag> },
          {
            title: 'Action',
            render: (_, r) => (
              <Space>
                <Button size="small" onClick={() => navigate(`/customer/leads/${r.id}`)}>
                  View
                </Button>
                <Button
                  size="small"
                  type="primary"
                  onClick={() => void purchase(r.id)}
                  disabled={r.saleStatus !== 'Available'}
                >
                  Buy with wallet
                </Button>
              </Space>
            ),
          },
        ]}
      />
    </Card>
  );
};
