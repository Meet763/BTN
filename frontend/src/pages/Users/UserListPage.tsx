import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Input,
  Button,
  Select,
  Modal,
  Form,
  Space,
  Tag,
  Popconfirm,
  message,
  Typography,
  Row,
  Col,
} from 'antd';
import {
  UserAddOutlined,
  SearchOutlined,
  EditOutlined,
  PoweroffOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { axiosInstance } from '../../api/axiosConfig';

const { Title, Text } = Typography;
const { Option } = Select;

interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  roleId: string;
  role: string;
  status: string;
  lastLoginAt?: string;
  createdBy?: string;
  createdAt: string;
}

interface RoleRecord {
  id: string;
  name: string;
  description?: string;
}

export const UserListPage: React.FC = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Filters
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [form] = Form.useForm();

  const fetchRoles = async () => {
    try {
      const response = await axiosInstance.get('/api/users/roles');
      if (response.data.success) {
        setRoles(response.data.data);
      }
    } catch (error) {
      message.error('Failed to load user roles.');
    }
  };

  const fetchUsers = async (page = currentPage) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        pageSize,
      };
      if (searchText) params.search = searchText;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await axiosInstance.get('/api/users', { params });
      if (response.data.success) {
        setUsers(response.data.data.items);
        setTotalCount(response.data.data.totalCount);
        setCurrentPage(response.data.data.page);
      }
    } catch (error) {
      message.error('Failed to retrieve user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchUsers(1);
  }, [searchText, roleFilter, statusFilter, pageSize]);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleOpenEditModal = (record: UserRecord) => {
    setEditingUser(record);
    form.setFieldsValue({
      fullName: record.fullName,
      phone: record.phone,
      roleId: record.roleId,
      status: record.status,
    });
    setModalVisible(true);
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        // Update user
        const response = await axiosInstance.put(`/api/users/${editingUser.id}`, {
          fullName: values.fullName,
          phone: values.phone,
          roleId: values.roleId,
          status: values.status,
        });
        if (response.data.success) {
          message.success('User profile updated successfully.');
          setModalVisible(false);
          fetchUsers();
        }
      } else {
        // Create user
        const response = await axiosInstance.post('/api/users', {
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          password: values.password,
          roleId: values.roleId,
        });
        if (response.data.success) {
          message.success('User account created successfully.');
          setModalVisible(false);
          fetchUsers();
        }
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Form validation/submission failed.';
      message.error(errorMsg);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      const response = await axiosInstance.delete(`/api/users/${id}`);
      if (response.data.success) {
        message.success('User account deactivated successfully.');
        fetchUsers();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to toggle account status.';
      message.error(errorMsg);
    }
  };

  const columns = [
    {
      title: 'Full Name',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (text?: string) => text || '-',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        let color = 'blue';
        if (role === 'PlatformOwner') color = 'purple';
        if (role === 'CompanyAdmin') color = 'cyan';
        return <Tag color={color}>{role}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'green';
        if (status === 'Inactive') color = 'default';
        if (status === 'Suspended') color = 'red';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (date?: string) => date ? new Date(date).toLocaleString() : 'Never',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: UserRecord) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleOpenEditModal(record)}>
            Edit
          </Button>
          {record.status === 'Active' ? (
            <Popconfirm
              title="Deactivate Account?"
              description="Are you sure you want to deactivate this user account?"
              onConfirm={() => handleDeactivate(record.id)}
              okText="Yes, Deactivate"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<PoweroffOutlined />}>
                Deactivate
              </Button>
            </Popconfirm>
          ) : (
            <Button 
              type="dashed" 
              icon={<CheckCircleOutlined />} 
              onClick={() => {
                // To activate, we can call PUT /api/users/{id} with status = Active
                axiosInstance.put(`/api/users/${record.id}`, {
                  fullName: record.fullName,
                  phone: record.phone,
                  roleId: record.roleId,
                  status: 'Active'
                }).then(() => {
                  message.success('Account reactivated.');
                  fetchUsers();
                });
              }}
            >
              Reactivate
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>👤 User Accounts Directory</Title>
          <Text type="secondary">Admin panel to add, edit, and deactivate BTN platform users.</Text>
        </div>
        <Button type="primary" size="large" icon={<UserAddOutlined />} onClick={handleOpenAddModal}>
          Add User
        </Button>
      </div>

      <Card style={{ borderRadius: '12px', boxShadow: 'var(--card-shadow)', marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={10}>
            <Input
              placeholder="Search by name or email..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size="large"
            />
          </Col>
          <Col xs={12} md={7}>
            <Select
              placeholder="Filter by role"
              style={{ width: '100%' }}
              value={roleFilter}
              onChange={setRoleFilter}
              allowClear
              size="large"
            >
              {roles.map((r) => (
                <Option key={r.name} value={r.name}>{r.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} md={7}>
            <Select
              placeholder="Filter by status"
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              size="large"
            >
              <Option value="Active">Active</Option>
              <Option value="Inactive">Inactive</Option>
              <Option value="Suspended">Suspended</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      <Table
        dataSource={users}
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
            fetchUsers(page);
          },
        }}
        style={{
          boxShadow: 'var(--card-shadow)',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: 'var(--container-bg)',
        }}
      />

      <Modal
        title={editingUser ? '✏️ Edit User Profile' : '➕ Create New User Account'}
        open={modalVisible}
        onOk={handleFormSubmit}
        onCancel={() => setModalVisible(false)}
        okText={editingUser ? 'Save Changes' : 'Create Account'}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: '16px' }}>
          <Form.Item
            name="fullName"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter full name!' }]}
          >
            <Input placeholder="Enter full name" />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { required: true, message: 'Please enter email address!' },
                { type: 'email', message: 'Please enter a valid email!' },
              ]}
            >
              <Input placeholder="Enter login email" />
            </Form.Item>
          )}

          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[{ pattern: /^\+?[0-9]{10,15}$/, message: 'Please enter a valid phone number (10-15 digits)!' }]}
          >
            <Input placeholder="Enter contact number" />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Please enter password!' },
                { min: 6, message: 'Password must be at least 6 characters!' },
              ]}
            >
              <Input.Password placeholder="Enter secure password" />
            </Form.Item>
          )}

          <Form.Item
            name="roleId"
            label="User Role"
            rules={[{ required: true, message: 'Please select a user role!' }]}
          >
            <Select placeholder="Assign a role">
              {roles.map((r) => (
                <Option key={r.id} value={r.id}>{r.name} - {r.description}</Option>
              ))}
            </Select>
          </Form.Item>

          {editingUser && (
            <Form.Item
              name="status"
              label="Account Status"
              rules={[{ required: true, message: 'Please select account status!' }]}
            >
              <Select placeholder="Modify status">
                <Option value="Active">Active</Option>
                <Option value="Inactive">Inactive</Option>
                <Option value="Suspended">Suspended</Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};
