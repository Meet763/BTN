import React, { useEffect, useState } from 'react';
import { Button, Card, Form, Input, Modal, Select, Space, Switch, Table, Tag } from 'antd';
import { Link } from 'react-router-dom';
import { axiosInstance } from '../../api/axiosConfig';
import { useFeedback } from '../../context/FeedbackContext';

interface OrgUnit {
  id: string;
  name: string;
  code: string;
  parentOrgUnitId?: string;
  parentName?: string;
  headEmployeeId?: string;
  headEmployeeName?: string;
  isActive: boolean;
  memberCount: number;
}

interface EmployeeOption {
  id: string;
  fullName: string;
}

export const OrgUnitListPage: React.FC = () => {
  const [units, setUnits] = useState<OrgUnit[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OrgUnit | null>(null);
  const [form] = Form.useForm();
  const feedback = useFeedback();

  const load = async () => {
    setLoading(true);
    try {
      const [unitsRes, empRes] = await Promise.all([
        axiosInstance.get('/api/org-units'),
        axiosInstance.get('/api/employees', { params: { pageSize: 200 } }),
      ]);
      setUnits(unitsRes.data.data || []);
      setEmployees((empRes.data.data.items || []).map((e: EmployeeOption & { fullName: string }) => ({
        id: e.id,
        fullName: e.fullName,
      })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setOpen(true);
  };

  const openEdit = (row: OrgUnit) => {
    setEditing(row);
    form.setFieldsValue(row);
    setOpen(true);
  };

  const onSave = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await axiosInstance.put(`/api/org-units/${editing.id}`, values);
        feedback.success('Org product updated');
      } else {
        await axiosInstance.post('/api/org-units', values);
        feedback.success('Org product created');
      }
      setOpen(false);
      load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; errorFields?: unknown };
      if (err.errorFields) return;
      feedback.error('Save failed', err.response?.data?.error);
    }
  };

  const onDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`/api/org-units/${id}`);
      feedback.success('Org product deleted');
      load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      feedback.error('Delete failed', err.response?.data?.error);
    }
  };

  return (
    <Card
      title="Org Products"
      extra={
        <Button type="primary" onClick={openCreate}>
          Add product unit
        </Button>
      }
    >
      <Table
        rowKey="id"
        loading={loading}
        dataSource={units}
        scroll={{ x: true }}
        columns={[
          { title: 'Name', dataIndex: 'name' },
          { title: 'Code', dataIndex: 'code', render: (c) => <Tag>{c}</Tag> },
          { title: 'Head', dataIndex: 'headEmployeeName', render: (v) => v || '—' },
          { title: 'Members', dataIndex: 'memberCount' },
          {
            title: 'Status',
            dataIndex: 'isActive',
            render: (v) => <Tag color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</Tag>,
          },
          {
            title: 'Actions',
            render: (_, r) => (
              <Space wrap>
                <Link to={`/admin/org-units/${r.id}`}>Detail</Link>
                <Button size="small" onClick={() => openEdit(r)}>
                  Edit
                </Button>
                <Button size="small" danger onClick={() => void onDelete(r.id)}>
                  Delete
                </Button>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? 'Edit org product' : 'New org product'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => void onSave()}
        okText="Save"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Air Conditioners" />
          </Form.Item>
          <Form.Item name="code" label="Code" rules={[{ required: true }]}>
            <Input placeholder="HVAC" />
          </Form.Item>
          <Form.Item name="parentOrgUnitId" label="Parent unit">
            <Select
              allowClear
              options={units
                .filter((u) => u.id !== editing?.id)
                .map((u) => ({ value: u.id, label: `${u.name} (${u.code})` }))}
            />
          </Form.Item>
          <Form.Item name="headEmployeeId" label="Head / SubAdmin">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              options={employees.map((e) => ({ value: e.id, label: e.fullName }))}
            />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};
