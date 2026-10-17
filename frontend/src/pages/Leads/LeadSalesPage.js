import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, InputNumber, Modal, Popconfirm, Select, Space, Table, Tabs, Tag, Typography, } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { axiosInstance } from '../../api/axiosConfig';
import { useFeedback } from '../../context/FeedbackContext';
import { getApiErrorMessage } from '../../utils/apiError';
const { Text, Title } = Typography;
export const LeadSalesPage = () => {
    const [leads, setLeads] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusTab, setStatusTab] = useState('Pending');
    const [priceLeadId, setPriceLeadId] = useState(null);
    const [priceValue, setPriceValue] = useState(500);
    const [assignLeadId, setAssignLeadId] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState();
    const [actionLoading, setActionLoading] = useState(false);
    const feedback = useFeedback();
    const navigate = useNavigate();
    const load = async (status = statusTab) => {
        setLoading(true);
        try {
            const params = { pageSize: 100 };
            if (status !== 'all')
                params.status = status;
            const [leadRes, empRes] = await Promise.all([
                axiosInstance.get('/api/leads', { params }),
                axiosInstance.get('/api/employees', { params: { pageSize: 100 } }),
            ]);
            setLeads(leadRes.data.data.items || []);
            setEmployees((empRes.data.data.items || [])
                .filter((e) => e.isActive !== false)
                .map((e) => ({ id: e.id, fullName: e.fullName })));
        }
        catch (e) {
            feedback.error('Failed to load lead sales', getApiErrorMessage(e, 'Check API connection.'));
            setLeads([]);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        void load(statusTab);
    }, [statusTab]);
    const createTestPendingLead = async () => {
        setActionLoading(true);
        try {
            const phone = `9${Date.now().toString().slice(-9)}`;
            const createRes = await axiosInstance.post('/api/leads', {
                customerName: `API Lead ${phone.slice(-4)}`,
                phone,
                email: `lead.${phone}@example.com`,
                city: 'Pune',
                state: 'Maharashtra',
                pincode: '411001',
                source: 'GoogleAds',
                productInterest: 'Solar 5kW rooftop',
                rawData: { formType: 'sales-test', campaign: 'Lead Sales Pending Test' },
            });
            await axiosInstance.put(`/api/leads/${createRes.data.data.id}`, {
                inquiryType: 'Quote request',
                productInterest: 'Solar 5kW rooftop',
                inquiryDetails: 'Need rooftop solar for home',
                budgetAmount: 250000,
                timeline: '1 month',
            });
            feedback.success('Pending test lead created', 'Assign an employee — they will verify the call.');
            setStatusTab('Pending');
            await load('Pending');
        }
        catch (e) {
            feedback.error('Could not create test lead', getApiErrorMessage(e, 'Ensure API is running.'));
        }
        finally {
            setActionLoading(false);
        }
    };
    const assign = async () => {
        if (!assignLeadId || !selectedEmployee) {
            feedback.info('Select an employee first');
            return;
        }
        setActionLoading(true);
        try {
            await axiosInstance.post(`/api/leads/${assignLeadId}/assign`, {
                employeeId: selectedEmployee,
                reason: 'Assigned from Lead Sales for pending call',
            });
            feedback.success('Lead assigned', 'Still Pending Call — employee will verify.');
            setAssignLeadId(null);
            setSelectedEmployee(undefined);
            await load(statusTab);
        }
        catch (e) {
            feedback.error('Assign failed', getApiErrorMessage(e));
        }
        finally {
            setActionLoading(false);
        }
    };
    const setPrice = async () => {
        if (!priceLeadId)
            return;
        if (!priceValue || priceValue < 1) {
            feedback.info('Enter a valid price');
            return;
        }
        setActionLoading(true);
        try {
            await axiosInstance.patch(`/api/leads/${priceLeadId}/price`, priceValue, {
                headers: { 'Content-Type': 'application/json' },
            });
            feedback.success('Price saved', 'Click Publish to list on customer marketplace.');
            setPriceLeadId(null);
            await load(statusTab);
        }
        catch (e) {
            feedback.error('Set price failed', getApiErrorMessage(e));
        }
        finally {
            setActionLoading(false);
        }
    };
    const publish = async (leadId) => {
        setActionLoading(true);
        try {
            await axiosInstance.patch(`/api/leads/${leadId}/sale-status`, JSON.stringify('Available'), {
                headers: { 'Content-Type': 'application/json' },
            });
            feedback.success('Published', 'Lead is now on the customer Marketplace.');
            await load(statusTab);
        }
        catch (e) {
            feedback.error('Publish failed', getApiErrorMessage(e));
        }
        finally {
            setActionLoading(false);
        }
    };
    const deleteLead = async (leadId) => {
        setActionLoading(true);
        try {
            await axiosInstance.delete(`/api/leads/${leadId}`);
            feedback.success('Lead deleted', 'Removed as suspicious / unwanted.');
            await load(statusTab);
        }
        catch (e) {
            feedback.error('Delete failed', getApiErrorMessage(e));
        }
        finally {
            setActionLoading(false);
        }
    };
    const saleTag = (status) => {
        if (status === 'Available')
            return _jsx(Tag, { color: "success", children: "Available" });
        if (status === 'Sold')
            return _jsx(Tag, { color: "purple", children: "Sold" });
        if (status === 'Reserved')
            return _jsx(Tag, { color: "orange", children: "Reserved" });
        return _jsx(Tag, { children: "Not for sale" });
    };
    const verifyTag = (status) => {
        if (status === 'Verified')
            return _jsx(Tag, { color: "green", children: "Verified" });
        if (status === 'Rejected')
            return _jsx(Tag, { color: "red", children: "Rejected" });
        return _jsx(Tag, { color: "gold", children: "Pending Call" });
    };
    return (_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }, children: [_jsxs("div", { children: [_jsx(Title, { level: 3, style: { marginTop: 0, marginBottom: 4 }, children: "Lead sales" }), _jsxs(Text, { type: "secondary", children: ["API / ad leads arrive as ", _jsx("strong", { children: "Pending" }), " \u2192 Assign employee \u2192 they verify \u2192 then Set price & Publish."] })] }), _jsxs(Space, { wrap: true, children: [_jsx(Button, { onClick: () => navigate('/leads/advertise'), children: "Advertise form" }), _jsx(Button, { type: "primary", loading: actionLoading, onClick: () => void createTestPendingLead(), children: "Create test pending lead" }), _jsx(Button, { onClick: () => void load(statusTab), loading: loading, children: "Refresh" })] })] }), _jsx(Alert, { type: "info", showIcon: true, style: { marginBottom: 16 }, message: "Assign \u00B7 Publish \u00B7 Delete", description: _jsxs("ul", { style: { margin: '8px 0 0', paddingLeft: 18 }, children: [_jsxs("li", { children: [_jsx("strong", { children: "Assign" }), " \u2014 send a Pending lead to an employee for calling. Status stays Pending until they verify."] }), _jsxs("li", { children: [_jsx("strong", { children: "Publish" }), " \u2014 after Verified + price, puts the lead on the customer Marketplace (wallet buy)."] }), _jsxs("li", { children: [_jsx("strong", { children: "Delete" }), " \u2014 remove suspicious / fake leads (cannot delete sold leads)."] })] }) }), employees.length === 0 && (_jsx(Alert, { type: "warning", showIcon: true, style: { marginBottom: 16 }, message: "No employees yet", description: _jsxs("span", { children: ["Create one under ", _jsx(Link, { to: "/employees", children: "Employees" }), " before Assign works."] }) })), _jsx(Tabs, { activeKey: statusTab, onChange: (k) => setStatusTab(k), items: [
                    { key: 'Pending', label: 'Pending Call (assign)' },
                    { key: 'Verified', label: 'Verified (price & publish)' },
                    { key: 'all', label: 'All' },
                ], style: { marginBottom: 12 } }), _jsx(Card, { bordered: false, style: { borderRadius: 12, boxShadow: 'var(--card-shadow)' }, children: _jsx(Table, { rowKey: "id", loading: loading, dataSource: leads, scroll: { x: true }, locale: { emptyText: 'No leads in this tab' }, columns: [
                        {
                            title: 'Customer',
                            dataIndex: 'customerName',
                            render: (name) => _jsx(Text, { strong: true, children: name }),
                        },
                        { title: 'City', dataIndex: 'city' },
                        { title: 'Interest', dataIndex: 'productInterest', ellipsis: true },
                        {
                            title: 'Verification',
                            render: (_, r) => verifyTag(r.verificationStatus),
                        },
                        {
                            title: 'Assigned to',
                            render: (_, r) => r.assignedEmployeeName ? _jsx(Tag, { color: "blue", children: r.assignedEmployeeName }) : _jsx(Text, { type: "secondary", children: "\u2014" }),
                        },
                        { title: 'Sale', render: (_, r) => saleTag(r.saleStatus) },
                        {
                            title: 'Price',
                            render: (_, r) => (r.listPrice ? _jsxs(Text, { strong: true, children: ["\u20B9", r.listPrice] }) : '—'),
                        },
                        {
                            title: 'Actions',
                            render: (_, r) => {
                                const isPending = r.verificationStatus === 'Pending';
                                const isVerified = r.verificationStatus === 'Verified';
                                return (_jsxs(Space, { wrap: true, children: [isPending && (_jsx(Button, { size: "small", disabled: employees.length === 0, onClick: () => {
                                                setAssignLeadId(r.id);
                                                setSelectedEmployee(undefined);
                                            }, children: r.assignedEmployeeId ? 'Reassign' : 'Assign' })), isVerified && (_jsxs(_Fragment, { children: [_jsx(Button, { size: "small", onClick: () => {
                                                        setPriceLeadId(r.id);
                                                        setPriceValue(r.listPrice || 500);
                                                    }, children: "Set price" }), _jsx(Button, { size: "small", type: "primary", disabled: !r.listPrice || r.saleStatus === 'Available' || r.saleStatus === 'Sold', loading: actionLoading, onClick: () => void publish(r.id), children: r.saleStatus === 'Available' ? 'Published' : 'Publish' })] })), _jsx(Popconfirm, { title: "Delete this lead?", description: "Use for suspicious / fake leads. This cannot be undone.", okText: "Delete", okButtonProps: { danger: true }, disabled: r.saleStatus === 'Sold', onConfirm: () => void deleteLead(r.id), children: _jsx(Button, { size: "small", danger: true, disabled: r.saleStatus === 'Sold', loading: actionLoading, children: "Delete" }) })] }));
                            },
                        },
                    ] }) }), _jsxs(Modal, { title: "Assign lead to employee", open: !!assignLeadId, confirmLoading: actionLoading, onOk: () => void assign(), onCancel: () => {
                    setAssignLeadId(null);
                    setSelectedEmployee(undefined);
                }, okText: "Assign", children: [_jsxs("p", { style: { marginBottom: 12, color: 'var(--text-secondary)' }, children: ["Lead stays ", _jsx("strong", { children: "Pending Call" }), ". The employee verifies after the call."] }), _jsx(Select, { style: { width: '100%' }, placeholder: "Select employee", value: selectedEmployee, onChange: setSelectedEmployee, options: employees.map((e) => ({ value: e.id, label: e.fullName })) })] }), _jsxs(Modal, { title: "Set list price (INR)", open: !!priceLeadId, confirmLoading: actionLoading, onOk: () => void setPrice(), onCancel: () => setPriceLeadId(null), okText: "Save price", children: [_jsxs("p", { style: { marginBottom: 12, color: 'var(--text-secondary)' }, children: ["After saving, click ", _jsx("strong", { children: "Publish" }), " to show on Marketplace."] }), _jsx(InputNumber, { min: 1, style: { width: '100%' }, value: priceValue, onChange: (v) => setPriceValue(v || 0) })] })] }));
};
