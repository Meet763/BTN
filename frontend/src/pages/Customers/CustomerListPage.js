import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Button, Card, Form, Input, Modal, Table } from 'antd';
import { axiosInstance } from '../../api/axiosConfig';
import { useFeedback } from '../../context/FeedbackContext';
export const CustomerListPage = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [form] = Form.useForm();
    const feedback = useFeedback();
    const load = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/api/customers', { params: { pageSize: 100 } });
            setCustomers(res.data.data.items);
        }
        catch {
            feedback.error('Failed to load customers');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        load();
    }, []);
    const onCreate = async () => {
        try {
            const values = await form.validateFields();
            await axiosInstance.post('/api/customers', values);
            feedback.success('Customer account created', 'They can log in and use Wallet / Marketplace.');
            setOpen(false);
            form.resetFields();
            load();
        }
        catch (e) {
            const err = e;
            if (err.errorFields)
                return;
            feedback.error('Could not create customer', err.response?.data?.error);
        }
    };
    return (_jsxs(Card, { title: "Customer accounts (lead buyers)", extra: _jsx(Button, { type: "primary", onClick: () => setOpen(true), children: "Add customer" }), children: [_jsx("p", { style: { marginBottom: 16, color: 'var(--text-secondary)' }, children: "Create customer logins for wallet top-up, marketplace purchases, and billing." }), _jsx(Table, { rowKey: "id", loading: loading, dataSource: customers, scroll: { x: true }, columns: [
                    { title: 'Name', dataIndex: 'fullName' },
                    { title: 'Email', dataIndex: 'email' },
                    { title: 'Phone', dataIndex: 'phone' },
                    { title: 'Company', dataIndex: 'companyName' },
                    { title: 'Created', render: (_, r) => new Date(r.createdAt).toLocaleDateString() },
                ] }), _jsx(Modal, { title: "New customer", open: open, onCancel: () => setOpen(false), onOk: onCreate, okText: "Create", children: _jsxs(Form, { form: form, layout: "vertical", children: [_jsx(Form.Item, { name: "fullName", label: "Full name", rules: [{ required: true }], children: _jsx(Input, {}) }), _jsx(Form.Item, { name: "email", label: "Email", rules: [{ required: true, type: 'email' }], children: _jsx(Input, {}) }), _jsx(Form.Item, { name: "password", label: "Password", rules: [{ required: true, min: 6 }], children: _jsx(Input.Password, {}) }), _jsx(Form.Item, { name: "phone", label: "Phone", children: _jsx(Input, {}) }), _jsx(Form.Item, { name: "companyName", label: "Company", children: _jsx(Input, {}) })] }) })] }));
};
