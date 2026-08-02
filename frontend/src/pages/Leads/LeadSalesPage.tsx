import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { axiosInstance } from '../../api/axiosConfig';
import { useFeedback } from '../../context/FeedbackContext';
import { getApiErrorMessage } from '../../utils/apiError';
import type { EmployeeOption, LeadRow } from './leadSalesTypes';

const { Text, Title } = Typography;

export const LeadSalesPage: React.FC = () => {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusTab, setStatusTab] = useState<'Pending' | 'Verified' | 'all'>('Pending');
  const [priceLeadId, setPriceLeadId] = useState<string | null>(null);
  const [priceValue, setPriceValue] = useState<number>(500);
  const [assignLeadId, setAssignLeadId] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>();
  const [actionLoading, setActionLoading] = useState(false);
  const feedback = useFeedback();
  const navigate = useNavigate();

  const load = async (status = statusTab) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { pageSize: 100 };
      if (status !== 'all') params.status = status;

      const [leadRes, empRes] = await Promise.all([
        axiosInstance.get('/api/leads', { params }),
        axiosInstance.get('/api/employees', { params: { pageSize: 100 } }),
      ]);
      setLeads(leadRes.data.data.items || []);
      setEmployees(
        (empRes.data.data.items || [])
          .filter((e: { isActive?: boolean }) => e.isActive !== false)
          .map((e: { id: string; fullName: string }) => ({ id: e.id, fullName: e.fullName })),
      );
    } catch (e: unknown) {
      feedback.error('Failed to load lead sales', getApiErrorMessage(e, 'Check API connection.'));
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(statusTab);
  }, [statusTab]);

  const createTestPendingLead = async () => {
    setActionLoading(true);
    try {
      const phone = `9${Date.now().toString().slice(-9)}`;
      const createRes = await axiosInstance.post('/api/leads', {
        customerName: `API Lead ${phone.slice(-4)}`,
        phone,
        email: `lead.${phone}@example.com`,
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        source: 'GoogleAds',
        productInterest: 'Solar 5kW rooftop',
        rawData: { formType: 'sales-test', campaign: 'Lead Sales Pending Test' },
      });

      await axiosInstance.put(`/api/leads/${createRes.data.data.id}`, {
        inquiryType: 'Quote request',
        productInterest: 'Solar 5kW rooftop',
        inquiryDetails: 'Need rooftop solar for home',
        budgetAmount: 250000,
        timeline: '1 month',
      });

      feedback.success('Pending test lead created', 'Assign an employee — they will verify the call.');
      setStatusTab('Pending');
      await load('Pending');
    } catch (e: unknown) {
      feedback.error('Could not create test lead', getApiErrorMessage(e, 'Ensure API is running.'));
    } finally {
      setActionLoading(false);
    }
  };

  const assign = async () => {
    if (!assignLeadId || !selectedEmployee) {
      feedback.info('Select an employee first');
      return;
    }
    setActionLoading(true);
    try {
      await axiosInstance.post(`/api/leads/${assignLeadId}/assign`, {
        employeeId: selectedEmployee,
        reason: 'Assigned from Lead Sales for pending call',
      });
      feedback.success('Lead assigned', 'Still Pending Call — employee will verify.');
      setAssignLeadId(null);
      setSelectedEmployee(undefined);
      await load(statusTab);
    } catch (e: unknown) {
      feedback.error('Assign failed', getApiErrorMessage(e));
    } finally {
      setActionLoading(false);
    }
  };

  const setPrice = async () => {
    if (!priceLeadId) return;
    if (!priceValue || priceValue < 1) {
      feedback.info('Enter a valid price');
      return;
    }
    setActionLoading(true);
    try {
      await axiosInstance.patch(`/api/leads/${priceLeadId}/price`, priceValue, {
        headers: { 'Content-Type': 'application/json' },
      });
      feedback.success('Price saved', 'Click Publish to list on customer marketplace.');
      setPriceLeadId(null);
      await load(statusTab);
    } catch (e: unknown) {
      feedback.error('Set price failed', getApiErrorMessage(e));
    } finally {
      setActionLoading(false);
    }
  };

  const publish = async (leadId: string) => {
    setActionLoading(true);
    try {
      await axiosInstance.patch(`/api/leads/${leadId}/sale-status`, JSON.stringify('Available'), {
        headers: { 'Content-Type': 'application/json' },
      });
      feedback.success('Published', 'Lead is now on the customer Marketplace.');
      await load(statusTab);
    } catch (e: unknown) {
      feedback.error('Publish failed', getApiErrorMessage(e));
    } finally {
      setActionLoading(false);
    }
  };

  const deleteLead = async (leadId: string) => {
    setActionLoading(true);
    try {
      await axiosInstance.delete(`/api/leads/${leadId}`);
      feedback.success('Lead deleted', 'Removed as suspicious / unwanted.');
      await load(statusTab);
    } catch (e: unknown) {
      feedback.error('Delete failed', getApiErrorMessage(e));
    } finally {
      setActionLoading(false);
    }
  };

  const saleTag = (status?: string) => {
    if (status === 'Available') return <Tag color="success">Available</Tag>;
    if (status === 'Sold') return <Tag color="purple">Sold</Tag>;
    if (status === 'Reserved') return <Tag color="orange">Reserved</Tag>;
    return <Tag>Not for sale</Tag>;
  };

  const verifyTag = (status: string) => {
    if (status === 'Verified') return <Tag color="green">Verified</Tag>;
    if (status === 'Rejected') return <Tag color="red">Rejected</Tag>;
    return <Tag color="gold">Pending Call</Tag>;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        <div>
          <Title level={3} style={{ marginTop: 0, marginBottom: 4 }}>
            Lead sales
          </Title>
          <Text type="secondary">
            API / ad leads arrive as <strong>Pending</strong> → Assign employee → they verify → then Set price & Publish.
          </Text>
        </div>
        <Space wrap>
          <Button onClick={() => navigate('/leads/advertise')}>Advertise form</Button>
          <Button type="primary" loading={actionLoading} onClick={() => void createTestPendingLead()}>
            Create test pending lead
          </Button>
          <Button onClick={() => void load(statusTab)} loading={loading}>
            Refresh
          </Button>
        </Space>
      </div>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Assign · Publish · Delete"
        description={
          <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
            <li>
              <strong>Assign</strong> — send a Pending lead to an employee for calling. Status stays Pending until they
              verify.
            </li>
            <li>
              <strong>Publish</strong> — after Verified + price, puts the lead on the customer Marketplace (wallet buy).
            </li>
            <li>
              <strong>Delete</strong> — remove suspicious / fake leads (cannot delete sold leads).
            </li>
          </ul>
        }
      />

      {employees.length === 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="No employees yet"
          description={
            <span>
              Create one under <Link to="/employees">Employees</Link> before Assign works.
            </span>
          }
        />
      )}

      <Tabs
        activeKey={statusTab}
        onChange={(k) => setStatusTab(k as 'Pending' | 'Verified' | 'all')}
        items={[
          { key: 'Pending', label: 'Pending Call (assign)' },
          { key: 'Verified', label: 'Verified (price & publish)' },
          { key: 'all', label: 'All' },
        ]}
        style={{ marginBottom: 12 }}
      />

      <Card bordered={false} style={{ borderRadius: 12, boxShadow: 'var(--card-shadow)' }}>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={leads}
          scroll={{ x: true }}
          locale={{ emptyText: 'No leads in this tab' }}
          columns={[
            {
              title: 'Customer',
              dataIndex: 'customerName',
              render: (name: string) => <Text strong>{name}</Text>,
            },
            { title: 'City', dataIndex: 'city' },
            { title: 'Interest', dataIndex: 'productInterest', ellipsis: true },
            {
              title: 'Verification',
              render: (_, r) => verifyTag(r.verificationStatus),
            },
            {
              title: 'Assigned to',
              render: (_, r) =>
                r.assignedEmployeeName ? <Tag color="blue">{r.assignedEmployeeName}</Tag> : <Text type="secondary">—</Text>,
            },
            { title: 'Sale', render: (_, r) => saleTag(r.saleStatus) },
            {
              title: 'Price',
              render: (_, r) => (r.listPrice ? <Text strong>₹{r.listPrice}</Text> : '—'),
            },
            {
              title: 'Actions',
              render: (_, r) => {
                const isPending = r.verificationStatus === 'Pending';
                const isVerified = r.verificationStatus === 'Verified';
                return (
                  <Space wrap>
                    {isPending && (
                      <Button
                        size="small"
                        disabled={employees.length === 0}
                        onClick={() => {
                          setAssignLeadId(r.id);
                          setSelectedEmployee(undefined);
                        }}
                      >
                        {r.assignedEmployeeId ? 'Reassign' : 'Assign'}
                      </Button>
                    )}
                    {isVerified && (
                      <>
                        <Button
                          size="small"
                          onClick={() => {
                            setPriceLeadId(r.id);
                            setPriceValue(r.listPrice || 500);
                          }}
                        >
                          Set price
                        </Button>
                        <Button
                          size="small"
                          type="primary"
                          disabled={!r.listPrice || r.saleStatus === 'Available' || r.saleStatus === 'Sold'}
                          loading={actionLoading}
                          onClick={() => void publish(r.id)}
                        >
                          {r.saleStatus === 'Available' ? 'Published' : 'Publish'}
                        </Button>
                      </>
                    )}
                    <Popconfirm
                      title="Delete this lead?"
                      description="Use for suspicious / fake leads. This cannot be undone."
                      okText="Delete"
                      okButtonProps={{ danger: true }}
                      disabled={r.saleStatus === 'Sold'}
                      onConfirm={() => void deleteLead(r.id)}
                    >
                      <Button size="small" danger disabled={r.saleStatus === 'Sold'} loading={actionLoading}>
                        Delete
                      </Button>
                    </Popconfirm>
                  </Space>
                );
              },
            },
          ]}
        />
      </Card>

      <Modal
        title="Assign lead to employee"
        open={!!assignLeadId}
        confirmLoading={actionLoading}
        onOk={() => void assign()}
        onCancel={() => {
          setAssignLeadId(null);
          setSelectedEmployee(undefined);
        }}
        okText="Assign"
      >
        <p style={{ marginBottom: 12, color: 'var(--text-secondary)' }}>
          Lead stays <strong>Pending Call</strong>. The employee verifies after the call.
        </p>
        <Select
          style={{ width: '100%' }}
          placeholder="Select employee"
          value={selectedEmployee}
          onChange={setSelectedEmployee}
          options={employees.map((e) => ({ value: e.id, label: e.fullName }))}
        />
      </Modal>

      <Modal
        title="Set list price (INR)"
        open={!!priceLeadId}
        confirmLoading={actionLoading}
        onOk={() => void setPrice()}
        onCancel={() => setPriceLeadId(null)}
        okText="Save price"
      >
        <p style={{ marginBottom: 12, color: 'var(--text-secondary)' }}>
          After saving, click <strong>Publish</strong> to show on Marketplace.
        </p>
        <InputNumber min={1} style={{ width: '100%' }} value={priceValue} onChange={(v) => setPriceValue(v || 0)} />
      </Modal>
    </div>
  );
};

