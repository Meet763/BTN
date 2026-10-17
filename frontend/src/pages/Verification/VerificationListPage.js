import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { Table, Card, Tabs, Input, Select, Button, Tag, Space, Modal, Form, Typography, Row, Col, } from 'antd';
import { SearchOutlined, PlusOutlined, ImportOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, WarningOutlined, UserAddOutlined, } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';
import { isEmployeeRole, isPlatformOwner } from '../../utils/roles';
import { LeadFormModal } from '../../components/Leads/LeadFormModal';
import { useFeedback } from '../../context/FeedbackContext';
import { getApiErrorMessage } from '../../utils/apiError';
const { Title, Text } = Typography;
const { Option } = Select;
export const VerificationListPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const feedback = useFeedback();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [statusTab, setStatusTab] = useState('Pending');
    const [searchText, setSearchText] = useState('');
    const [sourceFilter, setSourceFilter] = useState(undefined);
    const [isDuplicateFilter, setIsDuplicateFilter] = useState(undefined);
    const [leadModalVisible, setLeadModalVisible] = useState(false);
    const [bulkModalVisible, setBulkModalVisible] = useState(false);
    const [bulkForm] = Form.useForm();
    const [employees, setEmployees] = useState([]);
    const [assignLeadId, setAssignLeadId] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState();
    const [assignLoading, setAssignLoading] = useState(false);
    const fetchLeads = async (page = currentPage) => {
        setLoading(true);
        try {
            const params = {
                page,
                pageSize,
                status: statusTab,
            };
            if (searchText)
                params.search = searchText;
            if (sourceFilter)
                params.source = sourceFilter;
            if (isDuplicateFilter !== undefined)
                params.isDuplicate = isDuplicateFilter;
            if (isEmployeeRole(user?.role))
                params.mineOnly = true;
            const response = await axiosInstance.get('/api/leads', { params });
            if (response.data.success) {
                setLeads(response.data.data.items);
                setTotalCount(response.data.data.totalCount);
                setCurrentPage(response.data.data.page);
            }
        }
        catch (error) {
            feedback.error('Failed to load lead list', getApiErrorMessage(error));
        }
        finally {
            setLoading(false);
        }
    };
    const loadEmployees = async () => {
        if (!isPlatformOwner(user?.role))
            return;
        try {
            const res = await axiosInstance.get('/api/employees', { params: { pageSize: 100 } });
            setEmployees((res.data.data.items || [])
                .filter((e) => e.isActive !== false)
                .map((e) => ({ id: e.id, fullName: e.fullName })));
        }
        catch {
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
        }
        catch (error) {
            if (error?.errorFields)
                return;
            feedback.error('Bulk import failed', getApiErrorMessage(error, 'Invalid JSON structure.'));
        }
    };
    const openAssign = (e, leadId) => {
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
        }
        catch (error) {
            feedback.error('Assign failed', getApiErrorMessage(error));
        }
        finally {
            setAssignLoading(false);
        }
    };
    const columns = [
        {
            title: 'Customer Name',
            dataIndex: 'customerName',
            key: 'customerName',
            render: (text, record) => (_jsxs(Space, { direction: "vertical", size: 0, children: [_jsx(Text, { strong: true, style: { cursor: 'pointer', color: 'var(--primary-color)' }, onClick: () => navigate(`/verification/${record.id}`), children: text }), record.isDuplicate && (_jsx(Tag, { color: "red", icon: _jsx(WarningOutlined, {}), children: "Duplicate" }))] })),
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
            render: (phone) => _jsx(Text, { copyable: true, children: phone }),
        },
        {
            title: 'City / State',
            key: 'location',
            render: (_, record) => (_jsxs("span", { children: [record.city || '-', record.state ? `, ${record.state}` : ''] })),
        },
        {
            title: 'Source',
            dataIndex: 'source',
            key: 'source',
            render: (source) => {
                let color = 'blue';
                if (source === 'GoogleAds')
                    color = 'geekblue';
                if (source === 'MetaAds')
                    color = 'purple';
                if (source === 'WhatsApp')
                    color = 'green';
                if (source === 'Instagram')
                    color = 'magenta';
                if (source === 'Twitter')
                    color = 'blue';
                return _jsx(Tag, { color: color, children: source });
            },
        },
        {
            title: 'Interest',
            dataIndex: 'productInterest',
            key: 'productInterest',
            render: (text) => text || '-',
        },
        {
            title: 'Date Added',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleString(),
        },
        ...(isPlatformOwner(user?.role)
            ? [
                {
                    title: 'Assigned to',
                    key: 'assigned',
                    render: (_, record) => record.assignedEmployeeName || record.assignedEmployeeId ? (_jsx(Tag, { color: "blue", children: record.assignedEmployeeName || 'Assigned' })) : (_jsx(Text, { type: "secondary", children: "Unassigned" })),
                },
            ]
            : []),
        {
            title: 'Status',
            dataIndex: 'verificationStatus',
            key: 'verificationStatus',
            render: (status) => {
                let color = 'gold';
                let icon = _jsx(ClockCircleOutlined, {});
                if (status === 'Verified') {
                    color = 'green';
                    icon = _jsx(CheckCircleOutlined, {});
                }
                else if (status === 'Rejected') {
                    color = 'red';
                    icon = _jsx(CloseCircleOutlined, {});
                }
                return (_jsx(Tag, { color: color, icon: icon, children: status === 'Pending' ? 'Pending Call' : status }));
            },
        },
        ...(isPlatformOwner(user?.role)
            ? [
                {
                    title: 'Actions',
                    key: 'actions',
                    render: (_, record) => (_jsxs(Space, { wrap: true, onClick: (e) => e.stopPropagation(), children: [record.verificationStatus === 'Pending' && (_jsx(Button, { size: "small", icon: _jsx(UserAddOutlined, {}), onClick: (e) => openAssign(e, record.id), children: record.assignedEmployeeId ? 'Reassign' : 'Assign' })), _jsx(Button, { size: "small", type: "link", onClick: () => navigate(`/verification/${record.id}`), children: "Open" })] })),
                },
            ]
            : []),
    ];
    const tabItems = [
        { key: 'Pending', label: '⏳ Pending Call' },
        { key: 'Verified', label: '✅ Verified Leads' },
        { key: 'Rejected', label: '❌ Rejected Leads' },
    ];
    return (_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: 12 }, children: [_jsxs("div", { children: [_jsx(Title, { level: 2, style: { margin: 0 }, children: isEmployeeRole(user?.role) ? '📋 My assigned leads' : '📱 Lead Verification Center' }), _jsx(Text, { type: "secondary", children: isEmployeeRole(user?.role)
                                    ? 'Leads assigned to you for calling and verification.'
                                    : 'Assign pending leads to employees for calling. Verify stays Pending until the call is done.' })] }), user?.role === 'PlatformOwner' && (_jsxs(Space, { wrap: true, children: [_jsx(Button, { icon: _jsx(ImportOutlined, {}), size: "large", onClick: () => setBulkModalVisible(true), children: "Bulk Import" }), _jsx(Button, { type: "primary", icon: _jsx(PlusOutlined, {}), size: "large", onClick: () => setLeadModalVisible(true), children: "Add Lead" })] }))] }), _jsx(Tabs, { activeKey: statusTab, onChange: setStatusTab, items: tabItems, size: "large", style: { marginBottom: '16px' } }), _jsx(Card, { style: { borderRadius: '12px', boxShadow: 'var(--card-shadow)', marginBottom: '24px' }, children: _jsxs(Row, { gutter: [16, 16], children: [_jsx(Col, { xs: 24, md: 10, children: _jsx(Input, { placeholder: "Search by name or phone...", prefix: _jsx(SearchOutlined, {}), value: searchText, onChange: (e) => setSearchText(e.target.value), allowClear: true, size: "large" }) }), _jsx(Col, { xs: 12, md: 7, children: _jsxs(Select, { placeholder: "Filter by source", style: { width: '100%' }, value: sourceFilter, onChange: setSourceFilter, allowClear: true, size: "large", children: [_jsx(Option, { value: "GoogleAds", children: "Google Ads" }), _jsx(Option, { value: "MetaAds", children: "Meta Ads" }), _jsx(Option, { value: "Website", children: "Website" }), _jsx(Option, { value: "WhatsApp", children: "WhatsApp" }), _jsx(Option, { value: "Instagram", children: "Instagram" }), _jsx(Option, { value: "Twitter", children: "X / Twitter" }), _jsx(Option, { value: "LinkedIn", children: "LinkedIn" }), _jsx(Option, { value: "YouTube", children: "YouTube" }), _jsx(Option, { value: "Referral", children: "Referral" }), _jsx(Option, { value: "Other", children: "Other" })] }) }), _jsx(Col, { xs: 12, md: 7, children: _jsxs(Select, { placeholder: "Duplicate filter", style: { width: '100%' }, value: isDuplicateFilter, onChange: setIsDuplicateFilter, allowClear: true, size: "large", children: [_jsx(Option, { value: false, children: "Originals Only" }), _jsx(Option, { value: true, children: "Duplicates Only" })] }) })] }) }), _jsx(Table, { dataSource: leads, columns: columns, rowKey: "id", loading: loading, pagination: {
                    current: currentPage,
                    pageSize: pageSize,
                    total: totalCount,
                    showSizeChanger: true,
                    onChange: (page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                        fetchLeads(page);
                    },
                }, onRow: (record) => ({
                    onClick: () => navigate(`/verification/${record.id}`),
                    style: { cursor: 'pointer' },
                }), style: {
                    boxShadow: 'var(--card-shadow)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: 'var(--container-bg)',
                } }), _jsx(LeadFormModal, { open: leadModalVisible, onClose: () => setLeadModalVisible(false), onSuccess: () => fetchLeads() }), _jsxs(Modal, { title: "Assign lead to employee", open: !!assignLeadId, confirmLoading: assignLoading, onOk: () => void confirmAssign(), onCancel: () => {
                    setAssignLeadId(null);
                    setSelectedEmployee(undefined);
                }, okText: "Assign", children: [_jsxs("p", { style: { marginBottom: 12, color: 'var(--text-secondary)' }, children: ["Lead stays in ", _jsx("strong", { children: "Pending Call" }), ". The employee will call and verify it."] }), _jsx(Select, { style: { width: '100%' }, placeholder: "Select employee", value: selectedEmployee, onChange: setSelectedEmployee, options: employees.map((e) => ({ value: e.id, label: e.fullName })), notFoundContent: "Create an employee under Employees first" })] }), _jsx(Modal, { title: "\uD83D\uDCE5 Bulk Ingest Leads (JSON format)", open: bulkModalVisible, onOk: handleBulkImport, onCancel: () => setBulkModalVisible(false), okText: "Import Leads", destroyOnClose: true, width: 600, children: _jsx(Form, { form: bulkForm, layout: "vertical", style: { marginTop: '16px' }, children: _jsx(Form.Item, { name: "jsonLeads", label: "JSON Array of Leads", rules: [{ required: true, message: 'Please input JSON leads!' }], children: _jsx(Input.TextArea, { rows: 10, placeholder: `[
  {
    "customerName": "Rahul Verma",
    "phone": "9876543211",
    "city": "Jaipur",
    "source": "GoogleAds",
    "productInterest": "Solar Panels 3kW"
  }
]` }) }) }) })] }));
};
