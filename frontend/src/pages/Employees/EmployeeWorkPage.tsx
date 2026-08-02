import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Space, Statistic, Table, Tag, Typography } from 'antd';
import { axiosInstance } from '../../api/axiosConfig';

const { Title, Text } = Typography;

export const EmployeeWorkPage: React.FC = () => {
  const [perf, setPerf] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/api/employees/me/performance'),
      axiosInstance.get('/api/employees/me/work-history'),
    ]).then(([p, h]) => {
      setPerf(p.data.data);
      setHistory(h.data.data || []);
    });
  }, []);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3} style={{ margin: 0 }}>
          My work
        </Title>
        <Text type="secondary">Your assignments, verifications, and performance.</Text>
      </div>
      {perf && (
        <Card>
          <Space size="large" wrap>
            <Statistic title="Assigned leads" value={perf.assignedLeads} />
            <Statistic title="Verifications total" value={perf.verificationsTotal} />
            <Statistic title="This month" value={perf.verificationsThisMonth} />
          </Space>
        </Card>
      )}
      <Card title="Activity history">
        <Table
          rowKey={(r) => `${r.leadId}-${r.at}-${r.activityType}`}
          dataSource={history}
          scroll={{ x: true }}
          columns={[
            { title: 'When', render: (_, r) => new Date(r.at).toLocaleString() },
            { title: 'Type', dataIndex: 'activityType', render: (t: string) => <Tag color={t === 'Verification' ? 'green' : 'blue'}>{t}</Tag> },
            { title: 'Customer', dataIndex: 'customerName' },
            { title: 'Detail', dataIndex: 'detail', ellipsis: true },
          ]}
        />
      </Card>
      {!perf && (
        <Descriptions>
          <Descriptions.Item label="Note">No employee profile linked to this login yet.</Descriptions.Item>
        </Descriptions>
      )}
    </Space>
  );
};
