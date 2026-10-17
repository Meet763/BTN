import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Button, Card, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { axiosInstance } from '../../api/axiosConfig';
import { useFeedback } from '../../context/FeedbackContext';
import { emptyForm, slugify } from './formCatalog';
const { Title, Paragraph } = Typography;
export const FormListPage = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const feedback = useFeedback();
    const load = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/api/forms');
            setRows(res.data?.data ?? []);
        }
        catch {
            feedback.error('Could not load forms');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        void load();
    }, []);
    const create = async () => {
        const draft = {
            ...emptyForm(),
            name: 'New form',
            slug: `form-${slugify(String(Date.now()).slice(-6))}`,
        };
        try {
            const res = await axiosInstance.post('/api/forms', draft);
            const id = res.data?.data?.id;
            feedback.success('Form created');
            navigate(`/forms/${id}`);
        }
        catch (error) {
            const message = error.response?.data?.error;
            feedback.error(message || 'Could not create the form');
        }
    };
    const remove = async (id) => {
        try {
            await axiosInstance.delete(`/api/forms/${id}`);
            feedback.success('Form deleted');
            await load();
        }
        catch {
            feedback.error('Could not delete the form');
        }
    };
    return (_jsxs(Card, { children: [_jsxs(Space, { style: { width: '100%', justifyContent: 'space-between', marginBottom: 16 }, align: "start", children: [_jsxs("div", { children: [_jsx(Title, { level: 3, style: { marginBottom: 4 }, children: "Forms" }), _jsx(Paragraph, { type: "secondary", style: { marginBottom: 0 }, children: "Build a form, choose the fields, set their order, and decide what each answer must look like." })] }), _jsx(Button, { type: "primary", icon: _jsx(PlusOutlined, {}), onClick: () => void create(), children: "New form" })] }), _jsx(Table, { rowKey: "id", loading: loading, dataSource: rows, pagination: false, columns: [
                    {
                        title: 'Form',
                        dataIndex: 'name',
                        render: (name, row) => (_jsxs(Link, { to: `/forms/${row.id}`, children: [_jsx("strong", { children: name }), _jsxs("div", { style: { color: '#888' }, children: ["/f/", row.slug] })] })),
                    },
                    {
                        title: 'Status',
                        dataIndex: 'isPublished',
                        render: (published) => (published ? _jsx(Tag, { color: "green", children: "Live" }) : _jsx(Tag, { children: "Draft" })),
                    },
                    { title: 'Fields', dataIndex: 'fieldCount' },
                    { title: 'Replies', dataIndex: 'submissionCount' },
                    {
                        title: '',
                        render: (_, row) => (_jsxs(Space, { children: [_jsx(Link, { to: `/forms/${row.id}`, children: "Edit" }), _jsx(Popconfirm, { title: "Delete this form and its replies?", onConfirm: () => void remove(row.id), children: _jsx(Button, { type: "link", danger: true, children: "Delete" }) })] })),
                    },
                ] })] }));
};
