import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Button, Card, Form, Input, Modal, Select, Space, Switch, Table, Tag } from 'antd';
import { Link } from 'react-router-dom';
import { axiosInstance } from '../../api/axiosConfig';
import { useFeedback } from '../../context/FeedbackContext';
export const OrgUnitListPage = () => {
    const [units, setUnits] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
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
            setEmployees((empRes.data.data.items || []).map((e) => ({
                id: e.id,
                fullName: e.fullName,
            })));
        }
        finally {
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
    const openEdit = (row) => {
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
            }
            else {
                await axiosInstance.post('/api/org-units', values);
                feedback.success('Org product created');
            }
            setOpen(false);
            load();
        }
        catch (e) {
            const err = e;
            if (err.errorFields)
                return;
            feedback.error('Save failed', err.response?.data?.error);
        }
    };
    const onDelete = async (id) => {
        try {
            await axiosInstance.delete(`/api/org-units/${id}`);
            feedback.success('Org product deleted');
            load();
        }
        catch (e) {
            const err = e;
            feedback.error('Delete failed', err.response?.data?.error);
        }
    };
    return (_jsxs(Card, { title: "Org Products", extra: _jsx(Button, { type: "primary", onClick: openCreate, children: "Add product unit" }), children: [_jsx(Table, { rowKey: "id", loading: loading, dataSource: units, scroll: { x: true }, columns: [
                    { title: 'Name', dataIndex: 'name' },
                    { title: 'Code', dataIndex: 'code', render: (c) => _jsx(Tag, { children: c }) },
                    { title: 'Head', dataIndex: 'headEmployeeName', render: (v) => v || '—' },
                    { title: 'Members', dataIndex: 'memberCount' },
                    {
                        title: 'Status',
                        dataIndex: 'isActive',
                        render: (v) => _jsx(Tag, { color: v ? 'green' : 'red', children: v ? 'Active' : 'Inactive' }),
                    },
                    {
                        title: 'Actions',
                        render: (_, r) => (_jsxs(Space, { wrap: true, children: [_jsx(Link, { to: `/admin/org-units/${r.id}`, children: "Detail" }), _jsx(Button, { size: "small", onClick: () => openEdit(r), children: "Edit" }), _jsx(Button, { size: "small", danger: true, onClick: () => void onDelete(r.id), children: "Delete" })] })),
                    },
                ] }), _jsx(Modal, { title: editing ? 'Edit org product' : 'New org product', open: open, onCancel: () => setOpen(false), onOk: () => void onSave(), okText: "Save", children: _jsxs(Form, { form: form, layout: "vertical", children: [_jsx(Form.Item, { name: "name", label: "Name", rules: [{ required: true }], children: _jsx(Input, { placeholder: "Air Conditioners" }) }), _jsx(Form.Item, { name: "code", label: "Code", rules: [{ required: true }], children: _jsx(Input, { placeholder: "HVAC" }) }), _jsx(Form.Item, { name: "parentOrgUnitId", label: "Parent unit", children: _jsx(Select, { allowClear: true, options: units
                                    .filter((u) => u.id !== editing?.id)
                                    .map((u) => ({ value: u.id, label: `${u.name} (${u.code})` })) }) }), _jsx(Form.Item, { name: "headEmployeeId", label: "Head / SubAdmin", children: _jsx(Select, { allowClear: true, showSearch: true, optionFilterProp: "label", options: employees.map((e) => ({ value: e.id, label: e.fullName })) }) }), _jsx(Form.Item, { name: "isActive", label: "Active", valuePropName: "checked", children: _jsx(Switch, {}) })] }) })] }));
};
