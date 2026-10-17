import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { Table, Card, Input, Button, Select, Modal, Form, Space, Tag, Popconfirm, message, Typography, Row, Col, } from 'antd';
import { UserAddOutlined, SearchOutlined, EditOutlined, PoweroffOutlined, CheckCircleOutlined, } from '@ant-design/icons';
import { axiosInstance } from '../../api/axiosConfig';
const { Title, Text } = Typography;
const { Option } = Select;
export const UserListPage = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    // Filters
    const [searchText, setSearchText] = useState('');
    const [roleFilter, setRoleFilter] = useState(undefined);
    const [statusFilter, setStatusFilter] = useState(undefined);
    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [form] = Form.useForm();
    const fetchRoles = async () => {
        try {
            const response = await axiosInstance.get('/api/users/roles');
            if (response.data.success) {
                setRoles(response.data.data);
            }
        }
        catch (error) {
            message.error('Failed to load user roles.');
        }
    };
    const fetchUsers = async (page = currentPage) => {
        setLoading(true);
        try {
            const params = {
                page,
                pageSize,
            };
            if (searchText)
                params.search = searchText;
            if (roleFilter)
                params.role = roleFilter;
            if (statusFilter)
                params.status = statusFilter;
            const response = await axiosInstance.get('/api/users', { params });
            if (response.data.success) {
                setUsers(response.data.data.items);
                setTotalCount(response.data.data.totalCount);
                setCurrentPage(response.data.data.page);
            }
        }
        catch (error) {
            message.error('Failed to retrieve user directory.');
        }
        finally {
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
    const handleOpenEditModal = (record) => {
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
            }
            else {
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
        }
        catch (error) {
            const errorMsg = error.response?.data?.error || 'Form validation/submission failed.';
            message.error(errorMsg);
        }
    };
    const handleDeactivate = async (id) => {
        try {
            const response = await axiosInstance.delete(`/api/users/${id}`);
            if (response.data.success) {
                message.success('User account deactivated successfully.');
                fetchUsers();
            }
        }
        catch (error) {
            const errorMsg = error.response?.data?.error || 'Failed to toggle account status.';
            message.error(errorMsg);
        }
    };
    const columns = [
        {
            title: 'Full Name',
            dataIndex: 'fullName',
            key: 'fullName',
            render: (text) => _jsx(Text, { strong: true, children: text }),
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
            render: (text) => text || '-',
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role) => {
                let color = 'blue';
                if (role === 'PlatformOwner')
                    color = 'purple';
                if (role === 'CompanyAdmin')
                    color = 'cyan';
                return _jsx(Tag, { color: color, children: role });
            },
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'green';
                if (status === 'Inactive')
                    color = 'default';
                if (status === 'Suspended')
                    color = 'red';
                return _jsx(Tag, { color: color, children: status });
            },
        },
        {
            title: 'Last Login',
            dataIndex: 'lastLoginAt',
            key: 'lastLoginAt',
            render: (date) => date ? new Date(date).toLocaleString() : 'Never',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (_jsxs(Space, { size: "middle", children: [_jsx(Button, { icon: _jsx(EditOutlined, {}), onClick: () => handleOpenEditModal(record), children: "Edit" }), record.status === 'Active' ? (_jsx(Popconfirm, { title: "Deactivate Account?", description: "Are you sure you want to deactivate this user account?", onConfirm: () => handleDeactivate(record.id), okText: "Yes, Deactivate", cancelText: "No", okButtonProps: { danger: true }, children: _jsx(Button, { danger: true, icon: _jsx(PoweroffOutlined, {}), children: "Deactivate" }) })) : (_jsx(Button, { type: "dashed", icon: _jsx(CheckCircleOutlined, {}), onClick: () => {
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
                        }, children: "Reactivate" }))] })),
        },
    ];
    return (_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }, children: [_jsxs("div", { children: [_jsx(Title, { level: 2, style: { margin: 0 }, children: "\uD83D\uDC64 User Accounts Directory" }), _jsx(Text, { type: "secondary", children: "Admin panel to add, edit, and deactivate BTN platform users." })] }), _jsx(Button, { type: "primary", size: "large", icon: _jsx(UserAddOutlined, {}), onClick: handleOpenAddModal, children: "Add User" })] }), _jsx(Card, { style: { borderRadius: '12px', boxShadow: 'var(--card-shadow)', marginBottom: '24px' }, children: _jsxs(Row, { gutter: [16, 16], children: [_jsx(Col, { xs: 24, md: 10, children: _jsx(Input, { placeholder: "Search by name or email...", prefix: _jsx(SearchOutlined, {}), value: searchText, onChange: (e) => setSearchText(e.target.value), allowClear: true, size: "large" }) }), _jsx(Col, { xs: 12, md: 7, children: _jsx(Select, { placeholder: "Filter by role", style: { width: '100%' }, value: roleFilter, onChange: setRoleFilter, allowClear: true, size: "large", children: roles.map((r) => (_jsx(Option, { value: r.name, children: r.name }, r.name))) }) }), _jsx(Col, { xs: 12, md: 7, children: _jsxs(Select, { placeholder: "Filter by status", style: { width: '100%' }, value: statusFilter, onChange: setStatusFilter, allowClear: true, size: "large", children: [_jsx(Option, { value: "Active", children: "Active" }), _jsx(Option, { value: "Inactive", children: "Inactive" }), _jsx(Option, { value: "Suspended", children: "Suspended" })] }) })] }) }), _jsx(Table, { dataSource: users, columns: columns, rowKey: "id", loading: loading, pagination: {
                    current: currentPage,
                    pageSize: pageSize,
                    total: totalCount,
                    showSizeChanger: true,
                    onChange: (page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                        fetchUsers(page);
                    },
                }, style: {
                    boxShadow: 'var(--card-shadow)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: 'var(--container-bg)',
                } }), _jsx(Modal, { title: editingUser ? '✏️ Edit User Profile' : '➕ Create New User Account', open: modalVisible, onOk: handleFormSubmit, onCancel: () => setModalVisible(false), okText: editingUser ? 'Save Changes' : 'Create Account', destroyOnClose: true, width: 600, children: _jsxs(Form, { form: form, layout: "vertical", style: { marginTop: '16px' }, children: [_jsx(Form.Item, { name: "fullName", label: "Full Name", rules: [{ required: true, message: 'Please enter full name!' }], children: _jsx(Input, { placeholder: "Enter full name" }) }), !editingUser && (_jsx(Form.Item, { name: "email", label: "Email Address", rules: [
                                { required: true, message: 'Please enter email address!' },
                                { type: 'email', message: 'Please enter a valid email!' },
                            ], children: _jsx(Input, { placeholder: "Enter login email" }) })), _jsx(Form.Item, { name: "phone", label: "Phone Number", rules: [{ pattern: /^\+?[0-9]{10,15}$/, message: 'Please enter a valid phone number (10-15 digits)!' }], children: _jsx(Input, { placeholder: "Enter contact number" }) }), !editingUser && (_jsx(Form.Item, { name: "password", label: "Password", rules: [
                                { required: true, message: 'Please enter password!' },
                                { min: 6, message: 'Password must be at least 6 characters!' },
                            ], children: _jsx(Input.Password, { placeholder: "Enter secure password" }) })), _jsx(Form.Item, { name: "roleId", label: "User Role", rules: [{ required: true, message: 'Please select a user role!' }], children: _jsx(Select, { placeholder: "Assign a role", children: roles.map((r) => (_jsxs(Option, { value: r.id, children: [r.name, " - ", r.description] }, r.id))) }) }), editingUser && (_jsx(Form.Item, { name: "status", label: "Account Status", rules: [{ required: true, message: 'Please select account status!' }], children: _jsxs(Select, { placeholder: "Modify status", children: [_jsx(Option, { value: "Active", children: "Active" }), _jsx(Option, { value: "Inactive", children: "Inactive" }), _jsx(Option, { value: "Suspended", children: "Suspended" })] }) }))] }) })] }));
};
