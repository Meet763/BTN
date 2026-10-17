import React, { useEffect, useState } from 'react';
import { Card, Col, Descriptions, Row, Statistic, Table, Tag } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { axiosInstance } from '../../api/axiosConfig';

interface Summary {
  id: string;
  name: string;
  code: string;
  headEmployeeName?: string;
  memberCount: number;
  openLeadCount: number;
  totalLeadCount: number;
  purchasedLeadCount: number;
  customerPurchaseCount: number;
}

interface Member {
  employeeId: string;
  fullName: string;
  email: string;
  jobTitle?: string;
  reportsToName?: string;
  isActive: boolean;
  openLeadCount: number;
}

export const OrgUnitDetailPage: React.FC = () => {
  const { id } = useParams();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const [s, m] = await Promise.all([
          axiosInstance.get(`/api/org-units/${id}/summary`),
          axiosInstance.get(`/api/org-units/${id}/members`),
        ]);
        setSummary(s.data.data);
        setMembers(m.data.data || []);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  return (
    <Card
      loading={loading}
      title={summary ? `${summary.name} (${summary.code})` : 'Org unit'}
      extra={<Link to="/admin/org-units">Back to products</Link>}
    >
      {summary && (
        <>
          <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Head">{summary.headEmployeeName || '—'}</Descriptions.Item>
            <Descriptions.Item label="Code">
              <Tag>{summary.code}</Tag>
            </Descriptions.Item>
          </Descriptions>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={12} md={6}>
              <Statistic title="Members" value={summary.memberCount} />
            </Col>
            <Col xs={12} md={6}>
              <Statistic title="Open leads" value={summary.openLeadCount} />
            </Col>
            <Col xs={12} md={6}>
              <Statistic title="Total leads" value={summary.totalLeadCount} />
            </Col>
            <Col xs={12} md={6}>
              <Statistic title="Customer purchases" value={summary.customerPurchaseCount} />
            </Col>
          </Row>
        </>
      )}

      <Table
        rowKey="employeeId"
        dataSource={members}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: 'Name', dataIndex: 'fullName' },
          { title: 'Email', dataIndex: 'email' },
          { title: 'Job title', dataIndex: 'jobTitle', render: (t) => <Tag>{t}</Tag> },
          { title: 'Reports to', dataIndex: 'reportsToName', render: (v) => v || '—' },
          {
            title: 'Status',
            dataIndex: 'isActive',
            render: (v) => <Tag color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</Tag>,
          },
          { title: 'Open leads', dataIndex: 'openLeadCount' },
        ]}
      />
    </Card>
  );
};
