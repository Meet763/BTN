import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Spin } from 'antd';
import { useParams } from 'react-router-dom';
import { axiosInstance } from '../../api/axiosConfig';

export const CustomerLeadDetailPage: React.FC = () => {
  const { id } = useParams();
  const [lead, setLead] = useState<any>(null);

  useEffect(() => {
    axiosInstance.get(`/api/leads/${id}`).then((res) => setLead(res.data.data));
  }, [id]);

  if (!lead) return <Spin />;

  return (
    <Card title="Lead Details">
      <Descriptions column={1} bordered>
        <Descriptions.Item label="Name">{lead.customerName}</Descriptions.Item>
        <Descriptions.Item label="Phone">{lead.phone}</Descriptions.Item>
        <Descriptions.Item label="Email">{lead.email || '-'}</Descriptions.Item>
        <Descriptions.Item label="City">{lead.city}</Descriptions.Item>
        <Descriptions.Item label="Interest">{lead.productInterest}</Descriptions.Item>
        <Descriptions.Item label="Requirements">{lead.customerRequirements || '-'}</Descriptions.Item>
      </Descriptions>
    </Card>
  );
};
