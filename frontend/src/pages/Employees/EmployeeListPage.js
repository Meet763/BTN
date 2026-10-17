import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Button, Card, Checkbox, Descriptions, Form, Input, Modal, Select, Space, Switch, Table, Tag, } from 'antd';
import { axiosInstance } from '../../api/axiosConfig';
import { useFeedback } from '../../context/FeedbackContext';
const JOB_TITLES = ['Employee', 'HR', 'Manager', 'Head', 'SubAdmin'];
export const EmployeeListPage = () => {
    const [employees, setEmployees] = useState([]);
    const [orgUnits, setOrgUnits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [perfOpen, setPerfOpen] = useState(false);
    const [perf, setPerf] = useState(null);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [history, setHistory] = useState([]);
    const [createForm] = Form.useForm();
    const [editForm] = Form.useForm();
    const feedback = useFeedback();
    const load = async () => {
        setLoading(true);
        try {
            const [empRes, orgRes] = await Promise.all([
                axiosInstance.get('/api/employees', { params: { pageSize: 100 } }),
                axiosInstance.get('/api/org-units'),
            ]);
            setEmployees(empRes.data.data.items);
            setOrgUnits(orgRes.data.data || []);
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
            const values = await createForm.validateFields();
            await axiosInstance.post('/api/employees', values);
            feedback.success('Employee created');
            setCreateOpen(false);
            createForm.resetFields();
            load();
        }
        catch (e) {
            const err = e;
            if (err.errorFields)
                return;
            feedback.error('Could not create employee', err.response?.data?.error || 'Use a unique email.');
        }
    };
    const openEdit = (row) => {
        setEditing(row);
        editForm.setFieldsValue({
            ...row,
            setAsOrgUnitHead: false,
        });
        setEditOpen(true);
    };
    const onEdit = async () => {
        if (!editing)
            return;
        try {
            const values = await editForm.validateFields();
            await axiosInstance.put(`/api/employees/${editing.id}`, values);
            feedback.success('Employee updated');
            setEditOpen(false);
            load();
        }
        catch (e) {
            const err = e;
            if (err.errorFields)
                return;
            feedback.error('Update failed', err.response?.data?.error);
        }
    };
    const toggleStatus = async (row) => {
        await axiosInstance.patch(`/api/employees/${row.id}/status`, !row.isActive, {
            headers: { 'Content-Type': 'application/json' },
        });
        feedback.success(row.isActive ? 'Employee deactivated' : 'Employee activated');
        load();
    };
    const showPerformance = async (id) => {
        const res = await axiosInstance.get(`/api/employees/${id}/performance`);
        setPerf(res.data.data);
        setPerfOpen(true);
    };
    const showHistory = async (id) => {
        const res = await axiosInstance.get(`/api/employees/${id}/work-history`);
        setHistory(res.data.data || []);
        setHistoryOpen(true);
    };
    const orgOptions = orgUnits.map((u) => ({ value: u.id, label: `${u.name} (${u.code})` }));
    const reportOptions = employees.map((e) => ({ value: e.id, label: e.fullName }));
    const orgFields = (_jsxs(_Fragment, { children: [_jsx(Form.Item, { name: "orgUnitId", label: "Product org unit", children: _jsx(Select, { allowClear: true, options: orgOptions, showSearch: true, optionFilterProp: "label" }) }), _jsx(Form.Item, { name: "jobTitle", label: "Job title", initialValue: "Employee", children: _jsx(Select, { options: JOB_TITLES.map((t) => ({ value: t, label: t })) }) }), _jsx(Form.Item, { name: "reportsToEmployeeId", label: "Reports to", children: _jsx(Select, { allowClear: true, options: reportOptions, showSearch: true, optionFilterProp: "label" }) }), _jsx(Form.Item, { name: "setAsOrgUnitHead", valuePropName: "checked", children: _jsx(Checkbox, { children: "Set as Head of selected org unit" }) }), _jsx(Form.Item, { name: "department", label: "Department (legacy)", children: _jsx(Input, {}) })] }));
    return (_jsxs(Card, { title: "Employee Management", extra: _jsx(Button, { type: "primary", onClick: () => setCreateOpen(true), children: "Add Employee" }), children: [_jsx(Table, { rowKey: "id", loading: loading, dataSource: employees, scroll: { x: true }, columns: [
                    { title: 'Name', dataIndex: 'fullName' },
                    { title: 'Email', dataIndex: 'email' },
                    { title: 'Job title', dataIndex: 'jobTitle', render: (t) => (t ? _jsx(Tag, { children: t }) : '—') },
                    {
                        title: 'Product',
                        render: (_, r) => (r.orgUnitCode ? _jsx(Tag, { color: "blue", children: r.orgUnitCode }) : r.department || '—'),
                    },
                    { title: 'Reports to', dataIndex: 'reportsToName', render: (v) => v || '—' },
                    {
                        title: 'Status',
                        render: (_, r) => (_jsxs(Space, { children: [_jsx(Tag, { color: r.isActive ? 'green' : 'red', children: r.isActive ? 'Active' : 'Inactive' }), _jsx(Switch, { size: "small", checked: r.isActive, onChange: () => void toggleStatus(r) })] })),
                    },
                    {
                        title: 'Actions',
                        render: (_, r) => (_jsxs(Space, { wrap: true, children: [_jsx(Button, { size: "small", onClick: () => openEdit(r), children: "Edit" }), _jsx(Button, { size: "small", onClick: () => void showPerformance(r.id), children: "Performance" }), _jsx(Button, { size: "small", onClick: () => void showHistory(r.id), children: "Work history" })] })),
                    },
                ] }), _jsx(Modal, { title: "New Employee", open: createOpen, onCancel: () => setCreateOpen(false), onOk: () => void onCreate(), okText: "Create", children: _jsxs(Form, { form: createForm, layout: "vertical", initialValues: { jobTitle: 'Employee', setAsOrgUnitHead: false }, children: [_jsx(Form.Item, { name: "fullName", label: "Full Name", rules: [{ required: true }], children: _jsx(Input, {}) }), _jsx(Form.Item, { name: "email", label: "Email", rules: [{ required: true, type: 'email' }], children: _jsx(Input, {}) }), _jsx(Form.Item, { name: "password", label: "Password", rules: [{ required: true, min: 6 }], children: _jsx(Input.Password, {}) }), _jsx(Form.Item, { name: "phone", label: "Phone", children: _jsx(Input, {}) }), _jsx(Form.Item, { name: "employeeCode", label: "Employee code", children: _jsx(Input, {}) }), orgFields] }) }), _jsx(Modal, { title: "Edit Employee", open: editOpen, onCancel: () => setEditOpen(false), onOk: () => void onEdit(), okText: "Save", children: _jsxs(Form, { form: editForm, layout: "vertical", children: [_jsx(Form.Item, { name: "fullName", label: "Full Name", rules: [{ required: true }], children: _jsx(Input, {}) }), _jsx(Form.Item, { name: "phone", label: "Phone", children: _jsx(Input, {}) }), _jsx(Form.Item, { name: "employeeCode", label: "Employee code", children: _jsx(Input, {}) }), orgFields, _jsx(Form.Item, { name: "isActive", label: "Active", valuePropName: "checked", children: _jsx(Switch, {}) })] }) }), _jsx(Modal, { title: "Performance", open: perfOpen, onCancel: () => setPerfOpen(false), footer: null, children: perf && (_jsxs(Descriptions, { column: 1, bordered: true, size: "small", children: [_jsx(Descriptions.Item, { label: "Assigned leads", children: perf.assignedLeads }), _jsx(Descriptions.Item, { label: "Verifications (total)", children: perf.verificationsTotal }), _jsx(Descriptions.Item, { label: "Verifications (this month)", children: perf.verificationsThisMonth })] })) }), _jsx(Modal, { title: "Work history", open: historyOpen, onCancel: () => setHistoryOpen(false), footer: null, width: 720, children: _jsx(Table, { rowKey: (r) => `${r.leadId}-${r.at}-${r.activityType}`, dataSource: history, pagination: { pageSize: 8 }, columns: [
                        { title: 'When', render: (_, r) => new Date(r.at).toLocaleString() },
                        { title: 'Type', dataIndex: 'activityType', render: (t) => _jsx(Tag, { children: t }) },
                        { title: 'Customer', dataIndex: 'customerName' },
                        { title: 'Detail', dataIndex: 'detail', ellipsis: true },
                    ] }) })] }));
};
