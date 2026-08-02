import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
} from 'antd';
import { axiosInstance } from '../../api/axiosConfig';
import { useFeedback } from '../../context/FeedbackContext';

interface Employee {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  employeeCode?: string;
  department?: string;
  isActive: boolean;
}

interface Performance {
  assignedLeads: number;
  verificationsTotal: number;
  verificationsThisMonth: number;
}

interface WorkItem {
  leadId: string;
  customerName: string;
  activityType: string;
  detail?: string;
  at: string;
}

export const EmployeeListPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [perfOpen, setPerfOpen] = useState(false);
  const [perf, setPerf] = useState<Performance | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<WorkItem[]>([]);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const feedback = useFeedback();

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/employees', { params: { pageSize: 100 } });
      setEmployees(res.data.data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async () => {
    try {
      const values = await createForm.validateFields();
      await axiosInstance.post('/api/employees', values);
      feedback.success('Employee created');
      setCreateOpen(false);
      createForm.resetFields();
      load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; errorFields?: unknown };
      if (err.errorFields) return;
      feedback.error('Could not create employee', err.response?.data?.error || 'Use a unique email.');
    }
  };

  const openEdit = (row: Employee) => {
    setEditing(row);
    editForm.setFieldsValue(row);
    setEditOpen(true);
  };

  const onEdit = async () => {
    if (!editing) return;
    try {
      const values = await editForm.validateFields();
      await axiosInstance.put(`/api/employees/${editing.id}`, values);
      feedback.success('Employee updated');
      setEditOpen(false);
      load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; errorFields?: unknown };
      if (err.errorFields) return;
      feedback.error('Update failed', err.response?.data?.error);
    }
  };

  const toggleStatus = async (row: Employee) => {
    await axiosInstance.patch(`/api/employees/${row.id}/status`, !row.isActive, {
      headers: { 'Content-Type': 'application/json' },
    });
    feedback.success(row.isActive ? 'Employee deactivated' : 'Employee activated');
    load();
  };

  const showPerformance = async (id: string) => {
    const res = await axiosInstance.get(`/api/employees/${id}/performance`);
    setPerf(res.data.data);
    setPerfOpen(true);
  };

  const showHistory = async (id: string) => {
    const res = await axiosInstance.get(`/api/employees/${id}/work-history`);
    setHistory(res.data.data || []);
    setHistoryOpen(true);
  };

  return (
    <Card
      title="Employee Management"
      extra={
        <Button type="primary" onClick={() => setCreateOpen(true)}>
          Add Employee
        </Button>
      }
    >
      <Table
        rowKey="id"
        loading={loading}
        dataSource={employees}
        scroll={{ x: true }}
        columns={[
          { title: 'Name', dataIndex: 'fullName' },
          { title: 'Email', dataIndex: 'email' },
          { title: 'Code', dataIndex: 'employeeCode' },
          { title: 'Department', dataIndex: 'department' },
          {
            title: 'Status',
            render: (_, r) => (
              <Space>
                <Tag color={r.isActive ? 'green' : 'red'}>{r.isActive ? 'Active' : 'Inactive'}</Tag>
                <Switch size="small" checked={r.isActive} onChange={() => void toggleStatus(r)} />
              </Space>
            ),
          },
          {
            title: 'Actions',
            render: (_, r) => (
              <Space wrap>
                <Button size="small" onClick={() => openEdit(r)}>
                  Edit
                </Button>
                <Button size="small" onClick={() => void showPerformance(r.id)}>
                  Performance
                </Button>
                <Button size="small" onClick={() => void showHistory(r.id)}>
                  Work history
                </Button>
              </Space>
            ),
          },
        ]}
      />

      <Modal title="New Employee" open={createOpen} onCancel={() => setCreateOpen(false)} onOk={() => void onCreate()} okText="Create">
        <Form form={createForm} layout="vertical">
          <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="employeeCode" label="Employee code">
            <Input />
          </Form.Item>
          <Form.Item name="department" label="Department">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Edit Employee" open={editOpen} onCancel={() => setEditOpen(false)} onOk={() => void onEdit()} okText="Save">
        <Form form={editForm} layout="vertical">
          <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="employeeCode" label="Employee code">
            <Input />
          </Form.Item>
          <Form.Item name="department" label="Department">
            <Input />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Performance" open={perfOpen} onCancel={() => setPerfOpen(false)} footer={null}>
        {perf && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Assigned leads">{perf.assignedLeads}</Descriptions.Item>
            <Descriptions.Item label="Verifications (total)">{perf.verificationsTotal}</Descriptions.Item>
            <Descriptions.Item label="Verifications (this month)">{perf.verificationsThisMonth}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal title="Work history" open={historyOpen} onCancel={() => setHistoryOpen(false)} footer={null} width={720}>
        <Table
          rowKey={(r) => `${r.leadId}-${r.at}-${r.activityType}`}
          dataSource={history}
          pagination={{ pageSize: 8 }}
          columns={[
            { title: 'When', render: (_, r) => new Date(r.at).toLocaleString() },
            { title: 'Type', dataIndex: 'activityType', render: (t) => <Tag>{t}</Tag> },
            { title: 'Customer', dataIndex: 'customerName' },
            { title: 'Detail', dataIndex: 'detail', ellipsis: true },
          ]}
        />
      </Modal>
    </Card>
  );
};
