import React, { useEffect, useState } from 'react';
import { Button, Card, Descriptions, Drawer, Input, Select, Space, Table, Tag, Typography } from 'antd';
import { GiftOutlined, SearchOutlined } from '@ant-design/icons';
import { axiosInstance } from '../../api/axiosConfig';
import { useFeedback } from '../../context/FeedbackContext';
import { Link } from 'react-router-dom';

const { Title, Paragraph } = Typography;

type GiftStatus = 'Processing' | 'InProgress' | 'InTransit' | 'Arrived';

interface CampaignSubmission {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  productInterest?: string;
  jobInterest?: string;
  jobRole?: string;
  platform: string;
  campaign: string;
  giftStatus: GiftStatus;
  statusUpdatedAt?: string;
  createdAt: string;
}

const PLATFORM_OPTIONS = [
  { value: 'all', label: 'All platforms' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'twitter', label: 'X / Twitter' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'google', label: 'Google' },
  { value: 'website', label: 'Website' },
  { value: 'other', label: 'Other' },
];

const JOB_ROLE_OPTIONS = [
  { value: 'all', label: 'All roles' },
  { value: 'Social Media Manager', label: 'Social Media Manager' },
  { value: 'Content Creator', label: 'Content Creator' },
  { value: 'Graphic Designer', label: 'Graphic Designer' },
  { value: 'Video Editor', label: 'Video Editor' },
  { value: 'Digital Marketing', label: 'Digital Marketing' },
  { value: 'Performance Marketing', label: 'Performance Marketing' },
  { value: 'SEO Specialist', label: 'SEO Specialist' },
  { value: 'Software Developer', label: 'Software Developer' },
  { value: 'Full Stack Developer', label: 'Full Stack Developer' },
  { value: 'Frontend Developer', label: 'Frontend Developer' },
  { value: 'Backend Developer', label: 'Backend Developer' },
  { value: 'Mobile App Developer', label: 'Mobile App Developer' },
  { value: 'UI / UX Designer', label: 'UI / UX Designer' },
  { value: 'Product Manager', label: 'Product Manager' },
  { value: 'Sales Executive', label: 'Sales Executive' },
  { value: 'Business Development', label: 'Business Development' },
  { value: 'Telecaller', label: 'Telecaller' },
  { value: 'Lead Verification Agent', label: 'Lead Verification Agent' },
  { value: 'Customer Support', label: 'Customer Support' },
  { value: 'Operations', label: 'Operations' },
  { value: 'HR / Recruiter', label: 'HR / Recruiter' },
  { value: 'Partnerships', label: 'Partnerships' },
  { value: 'Data Analyst', label: 'Data Analyst' },
  { value: 'Other', label: 'Other' },
];

const jobInterestLabel = (value?: string) => {
  if (value === 'yes') return 'Yes';
  if (value === 'maybe') return 'Maybe later';
  if (value === 'no') return 'No';
  return '—';
};

const STATUS_OPTIONS: { value: GiftStatus; label: string; color: string }[] = [
  { value: 'Processing', label: 'Processing', color: 'gold' },
  { value: 'InProgress', label: 'In progress', color: 'blue' },
  { value: 'InTransit', label: 'In transit', color: 'purple' },
  { value: 'Arrived', label: 'Gift arrived', color: 'green' },
];

const platformColor = (platform: string) => {
  const map: Record<string, string> = {
    instagram: 'magenta',
    facebook: 'blue',
    twitter: 'default',
    whatsapp: 'green',
    linkedin: 'geekblue',
    youtube: 'red',
    google: 'gold',
    website: 'cyan',
  };
  return map[platform] || 'purple';
};

const readList = (payload: unknown): { items: CampaignSubmission[]; totalCount: number } => {
  const root = payload as Record<string, unknown> | undefined;
  const data = (root?.data ?? root) as Record<string, unknown> | undefined;
  const items = (data?.items ?? data?.Items ?? []) as CampaignSubmission[];
  const totalCount = Number(data?.totalCount ?? data?.TotalCount ?? items.length);
  return { items: Array.isArray(items) ? items : [], totalCount };
};

export const CampaignSubmissionsPage: React.FC = () => {
  const feedback = useFeedback();
  const [rows, setRows] = useState<CampaignSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [platform, setPlatform] = useState('all');
  const [giftStatus, setGiftStatus] = useState<GiftStatus | 'all'>('all');
  const [jobRole, setJobRole] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CampaignSubmission | null>(null);

  const load = async (nextPage = page, nextSize = pageSize) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/campaign-submissions', {
        params: {
          page: nextPage,
          pageSize: nextSize,
          platform: platform === 'all' ? undefined : platform,
          giftStatus: giftStatus === 'all' ? undefined : giftStatus,
          jobRole: jobRole === 'all' ? undefined : jobRole,
          search: search.trim() || undefined,
        },
      });
      const parsed = readList(res.data);
      setRows(parsed.items);
      setTotal(parsed.totalCount);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string }; status?: number } };
      const detail =
        err.response?.status === 404
          ? 'API is missing this module. Restart the backend, then refresh.'
          : err.response?.data?.error;
      feedback.error('Could not load gift form submissions', detail);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    void load(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, giftStatus, jobRole]);

  const changeStatus = async (id: string, next: GiftStatus) => {
    try {
      const res = await axiosInstance.patch(`/api/campaign-submissions/${id}/status`, { giftStatus: next });
      const updated = res.data.data as CampaignSubmission;
      setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...updated } : row)));
      setSelected((prev) => (prev?.id === id ? { ...prev, ...updated } : prev));
      feedback.success('Gift status updated');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      feedback.error('Could not update gift status', err.response?.data?.error);
    }
  };

  const statusSelect = (row: CampaignSubmission) => (
    <Select
      value={row.giftStatus}
      style={{ width: 150 }}
      onClick={(e) => e.stopPropagation()}
      onChange={(value) => void changeStatus(row.id, value)}
      options={STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
    />
  );

  return (
    <Card>
      <Space align="start" size={12} style={{ marginBottom: 16 }}>
        <GiftOutlined style={{ fontSize: 22 }} />
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Gift form submissions
          </Title>
          <Paragraph type="secondary" style={{ margin: '4px 0 0' }}>
            Track each gift from processing to arrival. Filter by platform or status.{' '}
            <Link to="/leads/advertise">Copy share links</Link>
          </Paragraph>
        </div>
      </Space>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Search name, phone, email, city"
          style={{ width: 280 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onPressEnter={() => {
            setPage(1);
            void load(1, pageSize);
          }}
        />
        <Select value={platform} style={{ width: 180 }} options={PLATFORM_OPTIONS} onChange={setPlatform} />
        <Select
          value={giftStatus}
          style={{ width: 180 }}
          options={[{ value: 'all', label: 'All statuses' }, ...STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))]}
          onChange={setGiftStatus}
        />
        <Select value={jobRole} style={{ width: 220 }} options={JOB_ROLE_OPTIONS} onChange={setJobRole} />
        <Button
          type="primary"
          onClick={() => {
            setPage(1);
            void load(1, pageSize);
          }}
        >
          Search
        </Button>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        scroll={{ x: true }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (nextPage, nextSize) => {
            setPage(nextPage);
            setPageSize(nextSize);
            void load(nextPage, nextSize);
          },
        }}
        columns={[
          { title: 'Name', dataIndex: 'fullName', ellipsis: true },
          { title: 'Phone', dataIndex: 'phone' },
          { title: 'City', dataIndex: 'city' },
          {
            title: 'Platform',
            dataIndex: 'platform',
            render: (value: string) => <Tag color={platformColor(value)}>{value}</Tag>,
          },
          {
            title: 'Job interest',
            dataIndex: 'jobInterest',
            render: (value: string) => jobInterestLabel(value),
          },
          { title: 'Role', dataIndex: 'jobRole', ellipsis: true, render: (value?: string) => value || '—' },
          {
            title: 'Gift status',
            dataIndex: 'giftStatus',
            render: (_, row) => statusSelect(row),
          },
          {
            title: 'Submitted',
            dataIndex: 'createdAt',
            render: (value: string) => new Date(value).toLocaleString(),
          },
          {
            title: '',
            render: (_, row) => (
              <Button type="link" onClick={() => setSelected(row)}>
                View
              </Button>
            ),
          },
        ]}
      />

      <Drawer title="Submission" width={440} open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Name">{selected.fullName}</Descriptions.Item>
              <Descriptions.Item label="Phone">{selected.phone}</Descriptions.Item>
              <Descriptions.Item label="Email">{selected.email}</Descriptions.Item>
              <Descriptions.Item label="Address">{selected.address}</Descriptions.Item>
              <Descriptions.Item label="City">{selected.city}</Descriptions.Item>
              <Descriptions.Item label="State">{selected.state}</Descriptions.Item>
              <Descriptions.Item label="Pincode">{selected.pincode}</Descriptions.Item>
              <Descriptions.Item label="Interest">{selected.productInterest || '—'}</Descriptions.Item>
              <Descriptions.Item label="Work with us">{jobInterestLabel(selected.jobInterest)}</Descriptions.Item>
              <Descriptions.Item label="Role">{selected.jobRole || '—'}</Descriptions.Item>
              <Descriptions.Item label="Platform">
                <Tag color={platformColor(selected.platform)}>{selected.platform}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Campaign">{selected.campaign}</Descriptions.Item>
              <Descriptions.Item label="Submitted">{new Date(selected.createdAt).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Status updated">
                {selected.statusUpdatedAt ? new Date(selected.statusUpdatedAt).toLocaleString() : '—'}
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16 }}>
              <Paragraph type="secondary" style={{ marginBottom: 8 }}>
                Gift delivery status
              </Paragraph>
              {statusSelect(selected)}
            </div>
          </>
        )}
      </Drawer>
    </Card>
  );
};
