import React, { useEffect, useState } from 'react';
import { Card, Empty, Table, Tag } from 'antd';
import { axiosInstance } from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';

interface TeamMember {
  employeeId: string;
  fullName: string;
  email: string;
  jobTitle?: string;
  orgUnitName?: string;
  orgUnitCode?: string;
  reportsToName?: string;
  isActive: boolean;
  openLeadCount: number;
}

export const MyTeamPage: React.FC = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get('/api/hierarchy/under-me');
        setMembers(res.data.data || []);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <Card
      title="My Team"
      loading={loading}
      extra={user?.jobTitle ? <Tag>{user.jobTitle}</Tag> : null}
    >
      {members.length === 0 && !loading ? (
        <Empty description="No direct reports or team members in your scope" />
      ) : (
        <Table
          rowKey="employeeId"
          dataSource={members}
          scroll={{ x: true }}
          columns={[
            { title: 'Name', dataIndex: 'fullName' },
            { title: 'Email', dataIndex: 'email' },
            { title: 'Job title', dataIndex: 'jobTitle', render: (t) => <Tag>{t}</Tag> },
            {
              title: 'Product',
              render: (_, r) =>
                r.orgUnitCode ? <Tag color="blue">{`${r.orgUnitName || ''} (${r.orgUnitCode})`}</Tag> : '—',
            },
            { title: 'Reports to', dataIndex: 'reportsToName', render: (v) => v || '—' },
            { title: 'Open leads', dataIndex: 'openLeadCount' },
            {
              title: 'Status',
              dataIndex: 'isActive',
              render: (v) => <Tag color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</Tag>,
            },
          ]}
        />
      )}
    </Card>
  );
};
