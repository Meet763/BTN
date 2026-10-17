import React, { useEffect, useState } from 'react';
import { Button, Card, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { axiosInstance } from '../../api/axiosConfig';
import { useFeedback } from '../../context/FeedbackContext';
import { emptyForm, slugify, type ManagedFormDraft } from './formCatalog';

const { Title, Paragraph } = Typography;

interface FormRow {
  id: string;
  name: string;
  slug: string;
  isPublished: boolean;
  fieldCount: number;
  submissionCount: number;
  updatedAt: string;
}

export const FormListPage: React.FC = () => {
  const [rows, setRows] = useState<FormRow[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const feedback = useFeedback();

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/forms');
      setRows(res.data?.data ?? []);
    } catch {
      feedback.error('Could not load forms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async () => {
    const draft: ManagedFormDraft = {
      ...emptyForm(),
      name: 'New form',
      slug: `form-${slugify(String(Date.now()).slice(-6))}`,
    };
    try {
      const res = await axiosInstance.post('/api/forms', draft);
      const id = res.data?.data?.id as string;
      feedback.success('Form created');
      navigate(`/forms/${id}`);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error;
      feedback.error(message || 'Could not create the form');
    }
  };

  const remove = async (id: string) => {
    try {
      await axiosInstance.delete(`/api/forms/${id}`);
      feedback.success('Form deleted');
      await load();
    } catch {
      feedback.error('Could not delete the form');
    }
  };

  return (
    <Card>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }} align="start">
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            Forms
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Build a form, choose the fields, set their order, and decide what each answer must look like.
          </Paragraph>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => void create()}>
          New form
        </Button>
      </Space>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        pagination={false}
        columns={[
          {
            title: 'Form',
            dataIndex: 'name',
            render: (name: string, row: FormRow) => (
              <Link to={`/forms/${row.id}`}>
                <strong>{name}</strong>
                <div style={{ color: '#888' }}>/f/{row.slug}</div>
              </Link>
            ),
          },
          {
            title: 'Status',
            dataIndex: 'isPublished',
            render: (published: boolean) => (published ? <Tag color="green">Live</Tag> : <Tag>Draft</Tag>),
          },
          { title: 'Fields', dataIndex: 'fieldCount' },
          { title: 'Replies', dataIndex: 'submissionCount' },
          {
            title: '',
            render: (_: unknown, row: FormRow) => (
              <Space>
                <Link to={`/forms/${row.id}`}>Edit</Link>
                <Popconfirm title="Delete this form and its replies?" onConfirm={() => void remove(row.id)}>
                  <Button type="link" danger>
                    Delete
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
    </Card>
  );
};
