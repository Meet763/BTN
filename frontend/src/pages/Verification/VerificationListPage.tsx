import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Tabs,
  Input,
  Select,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Typography,
  Row,
  Col,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  ImportOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';
import { isEmployeeRole, isPlatformOwner } from '../../utils/roles';
import { LeadFormModal } from '../../components/Leads/LeadFormModal';
import { useFeedback } from '../../context/FeedbackContext';
import { getApiErrorMessage } from '../../utils/apiError';

const { Title, Text } = Typography;
const { Option } = Select;

interface LeadRecord {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  pincode?: string;
  source: string;
  productInterest?: string;
  verificationStatus: string;
  saleStatus?: string;
  listPrice?: number;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  isDuplicate: boolean;
  duplicateOfLeadId?: string;
  createdAt: string;
}

interface EmployeeOption {
  id: string;
  fullName: string;
}

export const VerificationListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const feedback = useFeedback();

  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [statusTab, setStatusTab] = useState('Pending');
  const [searchText, setSearchText] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string | undefined>(undefined);
  const [isDuplicateFilter, setIsDuplicateFilter] = useState<boolean | undefined>(undefined);

  const [leadModalVisible, setLeadModalVisible] = useState(false);
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [bulkForm] = Form.useForm();

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [assignLeadId, setAssignLeadId] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>();
  const [assignLoading, setAssignLoading] = useState(false);

  const fetchLeads = async (page = currentPage) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        pageSize,
        status: statusTab,
      };
      if (searchText) params.search = searchText;
      if (sourceFilter) params.source = sourceFilter;
      if (isDuplicateFilter !== undefined) params.isDuplicate = isDuplicateFilter;
      if (isEmployeeRole(user?.role)) params.mineOnly = true;

      const response = await axiosInstance.get('/api/leads', { params });
      if (response.data.success) {
        setLeads(response.data.data.items);
        setTotalCount(response.data.data.totalCount);
        setCurrentPage(response.data.data.page);
      }
    } catch (error) {
      feedback.error('Failed to load lead list', getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    if (!isPlatformOwner(user?.role)) return;
    try {
      const res = await axiosInstance.get('/api/employees', { params: { pageSize: 100 } });
      setEmployees(
        (res.data.data.items || [])
          .filter((e: { isActive?: boolean }) => e.isActive !== false)
          .map((e: { id: string; fullName: string }) => ({ id: e.id, fullName: e.fullName })),
      );
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchLeads(1);
  }, [statusTab, searchText, sourceFilter, isDuplicateFilter, pageSize, user?.role]);

  useEffect(() => {
    void loadEmployees();
  }, [user?.role]);

  const handleBulkImport = async () => {
    try {
      const values = await bulkForm.validateFields();
      const parsedLeads = JSON.parse(values.jsonLeads);

      const response = await axiosInstance.post('/api/leads/bulk', {
        leads: Array.isArray(parsedLeads) ? parsedLeads : [parsedLeads],
      });

      if (response.data.success) {
        feedback.success(response.data.message || 'Leads imported successfully.');
        setBulkModalVisible(false);
        fetchLeads();
      }
    } catch (error: any) {
      if (error?.errorFields) return;
      feedback.error('Bulk import failed', getApiErrorMessage(error, 'Invalid JSON structure.'));
    }
  };

  const openAssign = (e: React.MouseEvent, leadId: string) => {
    e.stopPropagation();
    setAssignLeadId(leadId);
    setSelectedEmployee(undefined);
  };

  const confirmAssign = async () => {
    if (!assignLeadId || !selectedEmployee) {
      feedback.info('Select an employee first');
      return;
    }
    setAssignLoading(true);
    try {
      await axiosInstance.post(`/api/leads/${assignLeadId}/assign`, {
        employeeId: selectedEmployee,
        reason: 'Assigned from Verification for pending call',
      });
      feedback.success('Lead assigned', 'Still Pending — employee will call and verify.');
      setAssignLeadId(null);
      setSelectedEmployee(undefined);
      fetchLeads();
    } catch (error) {
      feedback.error('Assign failed', getApiErrorMessage(error));
    } finally {
      setAssignLoading(false);
    }
  };

  const columns: any[] = [
    {
      title: 'Customer Name',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (text: string, record: LeadRecord) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ cursor: 'pointer', color: 'var(--primary-color)' }} onClick={() => navigate(`/verification/${record.id}`)}>
            {text}
          </Text>
          {record.isDuplicate && (
            <Tag color="red" icon={<WarningOutlined />}>
              Duplicate
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => <Text copyable>{phone}</Text>,
    },
    {
      title: 'City / State',
      key: 'location',
      render: (_: any, record: LeadRecord) => (
        <span>
          {record.city || '-'}
          {record.state ? `, ${record.state}` : ''}
        </span>
      ),
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      render: (source: string) => {
        let color = 'blue';
        if (source === 'GoogleAds') color = 'geekblue';
        if (source === 'MetaAds') color = 'purple';
        if (source === 'WhatsApp') color = 'green';
        if (source === 'Instagram') color = 'magenta';
        if (source === 'Twitter') color = 'blue';
        return <Tag color={color}>{source}</Tag>;
      },
    },
    {
      title: 'Interest',
      dataIndex: 'productInterest',
      key: 'productInterest',
      render: (text?: string) => text || '-',
    },
    {
      title: 'Date Added',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    ...(isPlatformOwner(user?.role)
      ? [
          {
            title: 'Assigned to',
            key: 'assigned',
            render: (_: unknown, record: LeadRecord) =>
              record.assignedEmployeeName || record.assignedEmployeeId ? (
                <Tag color="blue">{record.assignedEmployeeName || 'Assigned'}</Tag>
              ) : (
                <Text type="secondary">Unassigned</Text>
              ),
          },
        ]
      : []),
    {
      title: 'Status',
      dataIndex: 'verificationStatus',
      key: 'verificationStatus',
      render: (status: string) => {
        let color = 'gold';
        let icon = <ClockCircleOutlined />;
        if (status === 'Verified') {
          color = 'green';
          icon = <CheckCircleOutlined />;
        } else if (status === 'Rejected') {
          color = 'red';
          icon = <CloseCircleOutlined />;
        }
        return (
          <Tag color={color} icon={icon}>
            {status === 'Pending' ? 'Pending Call' : status}
          </Tag>
        );
      },
    },
    ...(isPlatformOwner(user?.role)
      ? [
          {
            title: 'Actions',
            key: 'actions',
            render: (_: unknown, record: LeadRecord) => (
              <Space wrap onClick={(e) => e.stopPropagation()}>
                {record.verificationStatus === 'Pending' && (
                  <Button size="small" icon={<UserAddOutlined />} onClick={(e) => openAssign(e, record.id)}>
                    {record.assignedEmployeeId ? 'Reassign' : 'Assign'}
                  </Button>
                )}
                <Button size="small" type="link" onClick={() => navigate(`/verification/${record.id}`)}>
                  Open
                </Button>
              </Space>
            ),
          },
        ]
      : []),
  ];

  const tabItems = [
    { key: 'Pending', label: '⏳ Pending Call' },
    { key: 'Verified', label: '✅ Verified Leads' },
    { key: 'Rejected', label: '❌ Rejected Leads' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            {isEmployeeRole(user?.role) ? '📋 My assigned leads' : '📱 Lead Verification Center'}
          </Title>
          <Text type="secondary">
            {isEmployeeRole(user?.role)
              ? 'Leads assigned to you for calling and verification.'
              : 'Assign pending leads to employees for calling. Verify stays Pending until the call is done.'}
          </Text>
        </div>
        {user?.role === 'PlatformOwner' && (
          <Space wrap>
            <Button icon={<ImportOutlined />} size="large" onClick={() => setBulkModalVisible(true)}>
              Bulk Import
            </Button>
            <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setLeadModalVisible(true)}>
              Add Lead
            </Button>
          </Space>
        )}
      </div>

      <Tabs activeKey={statusTab} onChange={setStatusTab} items={tabItems} size="large" style={{ marginBottom: '16px' }} />

      <Card style={{ borderRadius: '12px', boxShadow: 'var(--card-shadow)', marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={10}>
            <Input
              placeholder="Search by name or phone..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size="large"
            />
          </Col>
          <Col xs={12} md={7}>
            <Select
              placeholder="Filter by source"
              style={{ width: '100%' }}
              value={sourceFilter}
              onChange={setSourceFilter}
              allowClear
              size="large"
            >
              <Option value="GoogleAds">Google Ads</Option>
              <Option value="MetaAds">Meta Ads</Option>
              <Option value="Website">Website</Option>
              <Option value="WhatsApp">WhatsApp</Option>
              <Option value="Instagram">Instagram</Option>
              <Option value="Twitter">X / Twitter</Option>
              <Option value="LinkedIn">LinkedIn</Option>
              <Option value="YouTube">YouTube</Option>
              <Option value="Referral">Referral</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Col>
          <Col xs={12} md={7}>
            <Select
              placeholder="Duplicate filter"
              style={{ width: '100%' }}
              value={isDuplicateFilter}
              onChange={setIsDuplicateFilter}
              allowClear
              size="large"
            >
              <Option value={false}>Originals Only</Option>
              <Option value={true}>Duplicates Only</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      <Table
        dataSource={leads}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalCount,
          showSizeChanger: true,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
            fetchLeads(page);
          },
        }}
        onRow={(record) => ({
          onClick: () => navigate(`/verification/${record.id}`),
          style: { cursor: 'pointer' },
        })}
        style={{
          boxShadow: 'var(--card-shadow)',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: 'var(--container-bg)',
        }}
      />

      <LeadFormModal open={leadModalVisible} onClose={() => setLeadModalVisible(false)} onSuccess={() => fetchLeads()} />

      <Modal
        title="Assign lead to employee"
        open={!!assignLeadId}
        confirmLoading={assignLoading}
        onOk={() => void confirmAssign()}
        onCancel={() => {
          setAssignLeadId(null);
          setSelectedEmployee(undefined);
        }}
        okText="Assign"
      >
        <p style={{ marginBottom: 12, color: 'var(--text-secondary)' }}>
          Lead stays in <strong>Pending Call</strong>. The employee will call and verify it.
        </p>
        <Select
          style={{ width: '100%' }}
          placeholder="Select employee"
          value={selectedEmployee}
          onChange={setSelectedEmployee}
          options={employees.map((e) => ({ value: e.id, label: e.fullName }))}
          notFoundContent="Create an employee under Employees first"
        />
      </Modal>

      <Modal
        title="📥 Bulk Ingest Leads (JSON format)"
        open={bulkModalVisible}
        onOk={handleBulkImport}
        onCancel={() => setBulkModalVisible(false)}
        okText="Import Leads"
        destroyOnClose
        width={600}
      >
        <Form form={bulkForm} layout="vertical" style={{ marginTop: '16px' }}>
          <Form.Item name="jsonLeads" label="JSON Array of Leads" rules={[{ required: true, message: 'Please input JSON leads!' }]}>
            <Input.TextArea
              rows={10}
              placeholder={`[
  {
    "customerName": "Rahul Verma",
    "phone": "9876543211",
    "city": "Jaipur",
    "source": "GoogleAds",
    "productInterest": "Solar Panels 3kW"
  }
]`}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
