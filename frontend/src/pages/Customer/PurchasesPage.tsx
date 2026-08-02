import React, { useEffect, useState } from 'react';
import { Card, Table } from 'antd';
import { axiosInstance } from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';

export const PurchasesPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    axiosInstance.get('/api/purchases').then((res) => setItems(res.data.data.items));
  }, []);

  return (
    <Card title="Purchased Leads">
      <Table
        rowKey="id"
        dataSource={items}
        scroll={{ x: true }}
        columns={[
          { title: 'Lead', dataIndex: 'leadId' },
          { title: 'Price', render: (_, r) => `₹${r.price}` },
          { title: 'Date', render: (_, r) => new Date(r.purchasedAt).toLocaleString() },
          { title: '', render: (_, r) => <a onClick={() => navigate(`/customer/leads/${r.leadId}`)}>Details</a> },
        ]}
      />
    </Card>
  );
};
