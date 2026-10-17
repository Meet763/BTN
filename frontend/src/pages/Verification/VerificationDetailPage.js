import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Descriptions, Tag, Button, Form, Select, Checkbox, InputNumber, Input, Modal, Spin, Space, Typography, message, Divider, DatePicker, } from 'antd';
import { ArrowLeftOutlined, PhoneOutlined, CheckOutlined, CloseOutlined, ClockCircleOutlined, UserOutlined, CalendarOutlined, DatabaseOutlined, } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { axiosInstance } from '../../api/axiosConfig';
import { LeadProfileEditor } from '../../components/Leads/LeadProfileEditor';
const { Text, Paragraph } = Typography;
const { Option } = Select;
export const VerificationDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    // Rejection modal
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [methods, setMethods] = useState([]);
    const [history, setHistory] = useState([]);
    const [assignmentHistory, setAssignmentHistory] = useState([]);
    const [statusHistory, setStatusHistory] = useState([]);
    const buildPayload = (values, result, rejectionReason) => ({
        verificationMethodCode: values.verificationMethodCode || 'PhoneCall',
        inquiryType: values.inquiryType,
        productOrService: values.productOrService,
        inquiryDetails: values.inquiryDetails,
        customerRequirements: values.customerRequirements,
        budgetAmount: values.budgetAmount,
        timeline: values.timeline,
        contactOutcome: values.contactOutcome,
        followUpAt: values.followUpAt ? new Date(values.followUpAt).toISOString() : undefined,
        remarks: values.remarks,
        additionalNotes: values.additionalNotes,
        isPhoneValid: values.isPhoneValid === 'true',
        isRequirementReal: values.isRequirementReal === 'true',
        intentLevel: values.intentLevel,
        isLocationServiceable: values.isLocationServiceable === 'true',
        callAttempted: values.callAttempted || false,
        callConnected: values.callConnected || false,
        callDurationSeconds: values.callDurationSeconds || 0,
        callNotes: values.callNotes,
        result,
        rejectionReason,
    });
    const fetchLeadDetail = async () => {
        setLoading(true);
        try {
            const [leadRes, historyRes, methodsRes, assignRes, statusRes] = await Promise.all([
                axiosInstance.get(`/api/leads/${id}`),
                axiosInstance.get(`/api/leads/${id}/verifications`),
                axiosInstance.get('/api/leads/verification-methods'),
                axiosInstance.get(`/api/leads/${id}/assignment-history`),
                axiosInstance.get(`/api/leads/${id}/status-history`),
            ]);
            if (leadRes.data.success)
                setLead(leadRes.data.data);
            if (historyRes.data.success)
                setHistory(historyRes.data.data);
            if (methodsRes.data.success)
                setMethods(methodsRes.data.data);
            if (assignRes.data.success)
                setAssignmentHistory(assignRes.data.data);
            if (statusRes.data.success)
                setStatusHistory(statusRes.data.data);
        }
        catch {
            message.error('Failed to load lead verification workspace.');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchLeadDetail();
    }, [id]);
    const handleVerify = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            const response = await axiosInstance.post(`/api/leads/${id}/verifications`, buildPayload(values, 'Verified'));
            if (response.data.success) {
                message.success('Lead verified successfully.');
                navigate('/verification');
            }
        }
        catch (error) {
            const errorMsg = error.response?.data?.error || 'Failed to submit verification form.';
            message.error(errorMsg);
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleOpenRejectModal = async () => {
        try {
            // Validate fields first before asking for rejection reason
            await form.validateFields();
            setRejectModalVisible(true);
        }
        catch (e) {
            message.error('Please fill out the verification questions before rejecting.');
        }
    };
    const handleRejectSubmit = async () => {
        if (!rejectionReason.trim()) {
            message.error('Please enter a rejection reason.');
            return;
        }
        try {
            const values = form.getFieldsValue();
            setSubmitting(true);
            setRejectModalVisible(false);
            const response = await axiosInstance.post(`/api/leads/${id}/verifications`, buildPayload(values, 'Rejected', rejectionReason));
            if (response.data.success) {
                message.success('Lead rejected successfully.');
                navigate('/verification');
            }
        }
        catch (error) {
            const errorMsg = error.response?.data?.error || 'Failed to reject lead.';
            message.error(errorMsg);
        }
        finally {
            setSubmitting(false);
        }
    };
    if (loading) {
        return (_jsx("div", { style: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }, children: _jsx(Spin, { size: "large", tip: "Loading verification detail..." }) }));
    }
    if (!lead)
        return null;
    const isPending = lead.verificationStatus === 'Pending';
    return (_jsxs("div", { children: [_jsx(Button, { icon: _jsx(ArrowLeftOutlined, {}), onClick: () => navigate('/verification'), style: { marginBottom: '24px' }, children: "Back to Directory" }), _jsxs(Row, { gutter: [24, 24], children: [_jsx(Col, { xs: 24, lg: 12, children: _jsxs(Card, { title: "\uD83D\uDCCB Lead Information Profile", bordered: false, style: { borderRadius: '12px', boxShadow: 'var(--card-shadow)' }, children: [_jsxs(Descriptions, { column: 1, bordered: true, size: "middle", children: [_jsxs(Descriptions.Item, { label: "Customer Name", children: [_jsx(Text, { strong: true, children: lead.customerName }), lead.isDuplicate && _jsx(Tag, { color: "red", style: { marginLeft: 8 }, children: "Duplicate" })] }), _jsx(Descriptions.Item, { label: "Phone Number", children: _jsxs(Space, { children: [_jsx(Text, { copyable: true, strong: true, children: lead.phone }), _jsx(Button, { type: "primary", shape: "circle", icon: _jsx(PhoneOutlined, {}), href: `tel:${lead.phone}`, size: "small" })] }) }), _jsx(Descriptions.Item, { label: "Email Address", children: lead.email || '-' }), _jsx(Descriptions.Item, { label: "Gift / shipping address", span: 2, children: lead.address || '-' }), _jsx(Descriptions.Item, { label: "City", children: lead.city || '-' }), _jsx(Descriptions.Item, { label: "State", children: lead.state || '-' }), _jsx(Descriptions.Item, { label: "Pincode", children: lead.pincode || '-' }), _jsx(Descriptions.Item, { label: "Lead Source", children: _jsx(Tag, { color: "blue", children: lead.source }) }), _jsx(Descriptions.Item, { label: "Product Interest", children: lead.productInterest || '-' }), (lead.inquiryType || lead.inquiryDetails) && (_jsxs(_Fragment, { children: [_jsx(Descriptions.Item, { label: "Inquiry type", children: lead.inquiryType || '-' }), _jsx(Descriptions.Item, { label: "Inquiry details", children: lead.inquiryDetails || '-' }), _jsx(Descriptions.Item, { label: "Requirements", children: lead.customerRequirements || '-' }), _jsx(Descriptions.Item, { label: "Budget", children: lead.budgetAmount != null ? `₹${lead.budgetAmount}` : '-' }), _jsx(Descriptions.Item, { label: "Timeline", children: lead.timeline || '-' })] })), _jsxs(Descriptions.Item, { label: "Workflow", children: [_jsx(Tag, { children: lead.workflowStatus || 'Created' }), lead.saleStatus && _jsx(Tag, { color: "blue", children: lead.saleStatus })] }), _jsx(Descriptions.Item, { label: "Ingestion Date", children: _jsxs(Space, { children: [_jsx(CalendarOutlined, {}), _jsx(Text, { children: new Date(lead.createdAt).toLocaleString() })] }) })] }), lead.rawData && (_jsxs("div", { style: { marginTop: '20px' }, children: [_jsxs(Text, { type: "secondary", style: { display: 'block', marginBottom: '8px' }, children: [_jsx(DatabaseOutlined, {}), " Raw Metadata"] }), _jsx("pre", { style: {
                                                padding: '12px',
                                                borderRadius: '8px',
                                                backgroundColor: 'var(--bg-color)',
                                                border: '1px solid var(--border-color)',
                                                overflowX: 'auto',
                                                maxHeight: '150px',
                                                fontSize: '12px'
                                            }, children: JSON.stringify(lead.rawData, null, 2) })] })), _jsx(LeadProfileEditor, { lead: lead, onUpdated: fetchLeadDetail })] }) }), _jsx(Col, { xs: 24, lg: 12, children: isPending ? (_jsx(Card, { title: "Verification workspace", bordered: false, style: { borderRadius: '12px', boxShadow: 'var(--card-shadow)' }, children: _jsxs(Form, { form: form, layout: "vertical", initialValues: {
                                    verificationMethodCode: 'PhoneCall',
                                    isPhoneValid: 'true',
                                    isRequirementReal: 'true',
                                    isLocationServiceable: 'true',
                                    intentLevel: 'Serious',
                                    callAttempted: true,
                                    callConnected: true,
                                    productOrService: lead.productInterest,
                                    inquiryType: lead.inquiryType,
                                    inquiryDetails: lead.inquiryDetails,
                                    customerRequirements: lead.customerRequirements,
                                    budgetAmount: lead.budgetAmount,
                                    timeline: lead.timeline,
                                }, children: [_jsx(Divider, { titlePlacement: "start", plain: true, children: "Method & inquiry" }), _jsx(Form.Item, { name: "verificationMethodCode", label: "Verification method", rules: [{ required: true }], children: _jsx(Select, { children: methods.map((m) => (_jsx(Option, { value: m.code, children: m.displayName }, m.code))) }) }), _jsxs(Row, { gutter: 16, children: [_jsx(Col, { span: 12, children: _jsx(Form.Item, { name: "inquiryType", label: "Inquiry Type", children: _jsx(Input, {}) }) }), _jsx(Col, { span: 12, children: _jsx(Form.Item, { name: "productOrService", label: "Product/Service", children: _jsx(Input, {}) }) })] }), _jsx(Form.Item, { name: "inquiryDetails", label: "Inquiry Details", children: _jsx(Input.TextArea, { rows: 2 }) }), _jsx(Form.Item, { name: "customerRequirements", label: "Customer Requirements", children: _jsx(Input.TextArea, { rows: 2 }) }), _jsxs(Row, { gutter: 16, children: [_jsx(Col, { span: 12, children: _jsx(Form.Item, { name: "budgetAmount", label: "Budget", children: _jsx(InputNumber, { style: { width: '100%' }, min: 0 }) }) }), _jsx(Col, { span: 12, children: _jsx(Form.Item, { name: "timeline", label: "Timeline", children: _jsx(Input, {}) }) })] }), _jsx(Divider, { titlePlacement: "start", plain: true, children: "Qualification" }), _jsxs(Row, { gutter: 16, children: [_jsx(Col, { span: 12, children: _jsx(Form.Item, { name: "isPhoneValid", label: "Is phone number valid?", rules: [{ required: true }], children: _jsxs(Select, { children: [_jsx(Option, { value: "true", children: "Yes" }), _jsx(Option, { value: "false", children: "No (Fake Number)" })] }) }) }), _jsx(Col, { span: 12, children: _jsx(Form.Item, { name: "isRequirementReal", label: "Is Requirement Genuine?", rules: [{ required: true }], children: _jsxs(Select, { children: [_jsx(Option, { value: "true", children: "Yes" }), _jsx(Option, { value: "false", children: "No (No Requirement)" })] }) }) })] }), _jsxs(Row, { gutter: 16, children: [_jsx(Col, { span: 12, children: _jsx(Form.Item, { name: "intentLevel", label: "Customer Intent Level", rules: [{ required: true }], children: _jsxs(Select, { children: [_jsx(Option, { value: "Serious", children: "\uD83D\uDD25 Serious Buyer" }), _jsx(Option, { value: "Exploring", children: "\uD83D\uDD0D Just Exploring" }), _jsx(Option, { value: "NotInterested", children: "\uD83D\uDCA4 Not Interested" }), _jsx(Option, { value: "Fake", children: "\u26A0\uFE0F Fake Lead" })] }) }) }), _jsx(Col, { span: 12, children: _jsx(Form.Item, { name: "isLocationServiceable", label: "Location Serviceable?", rules: [{ required: true }], children: _jsxs(Select, { children: [_jsx(Option, { value: "true", children: "Yes" }), _jsx(Option, { value: "false", children: "No (Out of Area)" })] }) }) })] }), _jsx(Divider, { titlePlacement: "start", plain: true, children: "Call log" }), _jsxs(Row, { gutter: 16, style: { marginBottom: '16px' }, children: [_jsx(Col, { span: 12, children: _jsx(Form.Item, { name: "callAttempted", valuePropName: "checked", noStyle: true, children: _jsx(Checkbox, { children: "Call Attempted?" }) }) }), _jsx(Col, { span: 12, children: _jsx(Form.Item, { name: "callConnected", valuePropName: "checked", noStyle: true, children: _jsx(Checkbox, { children: "Call Connected?" }) }) })] }), _jsx(Form.Item, { name: "callDurationSeconds", label: "Call Duration (Seconds)", rules: [{ type: 'number', min: 0 }], children: _jsx(InputNumber, { style: { width: '100%' }, placeholder: "E.g., 90" }) }), _jsx(Form.Item, { name: "callNotes", label: "Agent call notes", rules: [{ required: true, message: 'Please write call notes!' }], children: _jsx(Input.TextArea, { rows: 4, placeholder: "Summarize customer requirement, budget, delivery location details..." }) }), _jsx(Divider, { titlePlacement: "start", plain: true, children: "Outcome" }), _jsx(Form.Item, { name: "contactOutcome", label: "Contact outcome", children: _jsx(Input, {}) }), _jsx(Form.Item, { name: "remarks", label: "Remarks", children: _jsx(Input.TextArea, { rows: 2 }) }), _jsx(Form.Item, { name: "additionalNotes", label: "Additional notes", children: _jsx(Input.TextArea, { rows: 2 }) }), _jsx(Form.Item, { name: "followUpAt", label: "Follow-up date", children: _jsx(DatePicker, { showTime: true, style: { width: '100%' } }) }), _jsxs(Space, { size: "large", style: { display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }, children: [_jsx(Button, { danger: true, size: "large", icon: _jsx(CloseOutlined, {}), onClick: handleOpenRejectModal, loading: submitting, children: "Reject Lead" }), _jsx(Button, { type: "primary", size: "large", icon: _jsx(CheckOutlined, {}), onClick: handleVerify, loading: submitting, style: { backgroundColor: 'var(--success-color)' }, children: "Verify & Approve" })] })] }) })) : (_jsx(Card, { title: _jsxs(Space, { children: [_jsx("span", { children: "Verification Results Summary" }), _jsx(Tag, { color: lead.verificationStatus === 'Verified' ? 'green' : 'red', children: lead.verificationStatus })] }), bordered: false, style: { borderRadius: '12px', boxShadow: 'var(--card-shadow)' }, children: lead.verification ? (_jsxs(Descriptions, { column: 1, bordered: true, size: "middle", children: [lead.verification.verificationMethod && (_jsx(Descriptions.Item, { label: "Method", children: lead.verification.verificationMethod })), _jsx(Descriptions.Item, { label: "Processed By", children: _jsxs(Space, { children: [_jsx(UserOutlined, {}), _jsx(Text, { strong: true, children: lead.verification.verifiedByUser })] }) }), _jsx(Descriptions.Item, { label: "Processed On", children: _jsxs(Space, { children: [_jsx(CalendarOutlined, {}), _jsx(Text, { children: new Date(lead.verification.createdAt).toLocaleString() })] }) }), _jsx(Descriptions.Item, { label: "Phone Valid?", children: lead.verification.isPhoneValid ? _jsx(Tag, { color: "green", children: "Yes" }) : _jsx(Tag, { color: "red", children: "No" }) }), _jsx(Descriptions.Item, { label: "Genuine Need?", children: lead.verification.isRequirementReal ? _jsx(Tag, { color: "green", children: "Yes" }) : _jsx(Tag, { color: "red", children: "No" }) }), _jsx(Descriptions.Item, { label: "Customer Intent", children: _jsx(Tag, { color: "orange", children: lead.verification.intentLevel }) }), _jsx(Descriptions.Item, { label: "Location Serviceable?", children: lead.verification.isLocationServiceable ? _jsx(Tag, { color: "green", children: "Yes" }) : _jsx(Tag, { color: "red", children: "No" }) }), _jsx(Descriptions.Item, { label: "Call Connected?", children: lead.verification.callConnected ? _jsx(Tag, { color: "green", children: "Yes" }) : _jsx(Tag, { color: "red", children: "No" }) }), _jsx(Descriptions.Item, { label: "Call Duration", children: _jsxs(Space, { children: [_jsx(ClockCircleOutlined, {}), _jsxs(Text, { children: [lead.verification.callDurationSeconds || 0, " seconds"] })] }) }), lead.verification.rejectionReason && (_jsx(Descriptions.Item, { label: "Rejection Reason", children: _jsx(Text, { type: "danger", strong: true, children: lead.verification.rejectionReason }) })), _jsx(Descriptions.Item, { label: "Agent Work Notes", children: _jsx(Paragraph, { style: { margin: 0, whiteSpace: 'pre-line' }, children: lead.verification.callNotes || '-' }) }), lead.verification.inquiryType && (_jsx(Descriptions.Item, { label: "Inquiry type", children: lead.verification.inquiryType })), lead.verification.budgetAmount != null && (_jsxs(Descriptions.Item, { label: "Budget", children: ["\u20B9", lead.verification.budgetAmount] })), lead.verification.contactOutcome && (_jsx(Descriptions.Item, { label: "Contact outcome", children: lead.verification.contactOutcome })), lead.verification.followUpAt && (_jsx(Descriptions.Item, { label: "Follow-up", children: new Date(lead.verification.followUpAt).toLocaleString() })), lead.verification.remarks && (_jsx(Descriptions.Item, { label: "Remarks", children: lead.verification.remarks }))] })) : (_jsxs(Text, { type: "secondary", children: ["Lead was marked as ", lead.verificationStatus, " directly, no phone call logs found."] })) })) })] }), statusHistory.length > 0 && (_jsx(Card, { title: "Status history", style: { marginTop: 24 }, children: statusHistory.map((s) => (_jsxs("div", { style: { marginBottom: 12 }, children: [_jsxs(Tag, { children: [s.fromStatus, " \u2192 ", s.toStatus] }), new Date(s.changedAt).toLocaleString(), " \u2014 ", s.changedBy, s.note ? ` — ${s.note}` : ''] }, s.changedAt + s.toStatus))) })), assignmentHistory.length > 0 && (_jsx(Card, { title: "Lead assignment history", style: { marginTop: 24 }, children: assignmentHistory.map((a) => (_jsxs("div", { style: { marginBottom: 12 }, children: [_jsx(Tag, { color: "blue", children: a.employeeName }), new Date(a.assignedAt).toLocaleString(), a.reason ? ` — ${a.reason}` : ''] }, a.assignedAt + a.employeeName))) })), history.length > 0 && (_jsx(Card, { title: "Verification History", style: { marginTop: 24 }, children: history.map((h) => (_jsxs("div", { style: { marginBottom: 12 }, children: [_jsx(Tag, { children: h.result }), " ", new Date(h.createdAt).toLocaleString(), " \u2014 ", h.callNotes || 'No notes'] }, h.leadId + h.createdAt))) })), _jsxs(Modal, { title: "\u26A0\uFE0F Reject Lead Verification", open: rejectModalVisible, onOk: handleRejectSubmit, onCancel: () => setRejectModalVisible(false), okText: "Confirm Rejection", okButtonProps: { danger: true }, children: [_jsx("div", { style: { margin: '16px 0' }, children: _jsx(Text, { children: "Please provide a reason for rejecting this lead. This help keep advertisers informed." }) }), _jsx(Form.Item, { label: "Rejection Reason", required: true, children: _jsx(Input, { placeholder: "E.g., Number not reachable after 3 attempts / Wrong number", value: rejectionReason, onChange: (e) => setRejectionReason(e.target.value) }) })] })] }));
};
