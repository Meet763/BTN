import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Progress, Spin, List, Typography, Space, message } from 'antd';
import {
  FileProtectOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
  LineChartOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import { axiosInstance } from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';
import { isPlatformOwner } from '../../utils/roles';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

interface LeadStats {
  totalLeads: number;
  pendingVerification: number;
  verifiedToday: number;
  rejectedToday: number;
  duplicatesFound: number;
  verificationRate: number;
  avgCallDurationSeconds: number;
  sourceBreakdown: Record<string, number>;
  rejectionReasons: Record<string, number>;
}

interface AdminExtras {
  verifiedLeads: number;
  totalSales: number;
  totalWalletCredits: number;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [adminExtras, setAdminExtras] = useState<AdminExtras | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get('/api/leads/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
      if (isPlatformOwner(user?.role)) {
        const adminRes = await axiosInstance.get('/api/dashboard/admin');
        if (adminRes.data.success) {
          const d = adminRes.data.data;
          setAdminExtras({
            verifiedLeads: d.verifiedLeads,
            totalSales: d.totalSales,
            totalWalletCredits: d.totalWalletCredits,
          });
        }
      }
    } catch (error) {
      message.error('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user?.role]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="Loading dashboard stats..." />
      </div>
    );
  }

  if (!stats) return null;

  // Calculate colors for progress bars based on index
  const getSourceColor = (source: string) => {
    switch (source) {
      case 'GoogleAds': return '#1890ff';
      case 'MetaAds': return '#3b5998';
      case 'Website': return '#13c2c2';
      case 'WhatsApp': return '#52c41a';
      case 'Referral': return '#722ed1';
      default: return '#fa8c16';
    }
  };

  return (
    <div style={{ padding: '8px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>📊 Performance Dashboard</Title>
        <Text type="secondary">Real-time leads status and verification activity logs.</Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="dashboard-stat-card" bordered={false}>
            <Statistic
              title={<span style={{ color: 'var(--text-secondary)' }}>Total Leads Ingested</span>}
              value={stats.totalLeads}
              prefix={<LineChartOutlined style={{ color: 'var(--primary-color)', marginRight: 8 }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="dashboard-stat-card" bordered={false}>
            <Statistic
              title={<span style={{ color: 'var(--text-secondary)' }}>Pending Verification</span>}
              value={stats.pendingVerification}
              valueStyle={{ color: '#faad14' }}
              prefix={<HistoryOutlined style={{ marginRight: 8 }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="dashboard-stat-card" bordered={false}>
            <Statistic
              title={<span style={{ color: 'var(--text-secondary)' }}>Verified Today</span>}
              value={stats.verifiedToday}
              valueStyle={{ color: 'var(--success-color)' }}
              prefix={<CheckCircleOutlined style={{ marginRight: 8 }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="dashboard-stat-card" bordered={false}>
            <Statistic
              title={<span style={{ color: 'var(--text-secondary)' }}>Rejected Today</span>}
              value={stats.rejectedToday}
              valueStyle={{ color: 'var(--error-color)' }}
              prefix={<CloseCircleOutlined style={{ marginRight: 8 }} />}
            />
          </Card>
        </Col>
      </Row>

      {adminExtras && (
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card bordered={false}>
              <Statistic title="Verified leads (all time)" value={adminExtras.verifiedLeads} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false}>
              <Statistic title="Lead purchases" value={adminExtras.totalSales} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false}>
              <Statistic title="Wallet top-ups (₹)" value={adminExtras.totalWalletCredits} precision={2} />
            </Card>
          </Col>
        </Row>
      )}

      {isPlatformOwner(user?.role) && (
        <Card style={{ marginBottom: 24 }} title="Quick links">
          <Space wrap>
            <Link to="/customers">Customer accounts</Link>
            <Link to="/leads/sales">Assign & publish leads</Link>
            <Link to="/users">User management</Link>
          </Space>
        </Card>
      )}

      <Row gutter={[24, 24]}>
        {/* Source Breakdown */}
        <Col xs={24} lg={12}>
          <Card 
            title={<Space><FileProtectOutlined /><span>Lead Source Breakdown</span></Space>}
            bordered={false}
            style={{ borderRadius: '12px', boxShadow: 'var(--card-shadow)', height: '100%' }}
          >
            <List
              dataSource={Object.entries(stats.sourceBreakdown).sort((a, b) => b[1] - a[1])}
              renderItem={([source, count]) => {
                const percentage = stats.totalLeads > 0 ? Math.round((count / stats.totalLeads) * 100) : 0;
                return (
                  <List.Item style={{ borderBottom: '1px solid var(--border-color)', padding: '12px 0' }}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <Text strong>{source}</Text>
                        <Text type="secondary">{count} leads ({percentage}%)</Text>
                      </div>
                      <Progress 
                        percent={percentage} 
                        strokeColor={getSourceColor(source)} 
                        showInfo={false} 
                        size="small" 
                        status="active"
                      />
                    </div>
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>

        {/* Verification Rate & Calls Stats */}
        <Col xs={24} lg={12}>
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <Card 
                title={<Space><InfoCircleOutlined /><span>Verification Rate</span></Space>}
                bordered={false}
                style={{ borderRadius: '12px', boxShadow: 'var(--card-shadow)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 0' }}>
                  <Progress
                    type="dashboard"
                    percent={stats.verificationRate}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                    gapDegree={30}
                    width={160}
                  />
                </div>
                <div style={{ textAlign: 'center', marginTop: '8px' }}>
                  <Text type="secondary">Percentage of leads successfully verified vs. rejected.</Text>
                </div>
              </Card>
            </Col>

            <Col span={24}>
              <Card bordered={false} style={{ borderRadius: '12px', boxShadow: 'var(--card-shadow)' }}>
                <Row gutter={16}>
                  <Col span={12} style={{ borderRight: '1px solid var(--border-color)' }}>
                    <Statistic
                      title={<span style={{ color: 'var(--text-secondary)' }}>Avg. Call Duration</span>}
                      value={stats.avgCallDurationSeconds}
                      suffix="sec"
                      prefix={<ClockCircleOutlined style={{ color: '#fa8c16', marginRight: 8 }} />}
                    />
                  </Col>
                  <Col span={12} style={{ paddingLeft: '24px' }}>
                    <Statistic
                      title={<span style={{ color: 'var(--text-secondary)' }}>Duplicates Caught</span>}
                      value={stats.duplicatesFound}
                      valueStyle={{ color: 'var(--error-color)' }}
                      prefix={<AlertOutlined style={{ marginRight: 8 }} />}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};
