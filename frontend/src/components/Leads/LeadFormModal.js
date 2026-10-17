import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { Button, Col, Divider, Drawer, Form, Input, InputNumber, Row, Select, Space, Typography, } from 'antd';
import { UserOutlined, EnvironmentOutlined, FundProjectionScreenOutlined, FileTextOutlined } from '@ant-design/icons';
import { axiosInstance } from '../../api/axiosConfig';
import { useFeedback } from '../../context/FeedbackContext';
const { Text } = Typography;
const { Option } = Select;
const SOURCE_OPTIONS = [
    { value: 'GoogleAds', label: 'Google Ads' },
    { value: 'MetaAds', label: 'Meta Ads' },
    { value: 'Website', label: 'Website' },
    { value: 'WhatsApp', label: 'WhatsApp' },
    { value: 'Referral', label: 'Referral' },
    { value: 'Instagram', label: 'Instagram' },
    { value: 'Twitter', label: 'X / Twitter' },
    { value: 'LinkedIn', label: 'LinkedIn' },
    { value: 'YouTube', label: 'YouTube' },
    { value: 'Other', label: 'Other' },
];
const INQUIRY_TYPES = ['Product inquiry', 'Service request', 'Quote request', 'Support', 'Partnership', 'Other'];
export const LeadFormModal = ({ open, onClose, onSuccess }) => {
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);
    const feedback = useFeedback();
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSaving(true);
            let rawData = null;
            if (values.rawData?.trim()) {
                rawData = JSON.parse(values.rawData);
            }
            const createRes = await axiosInstance.post('/api/leads', {
                customerName: values.customerName,
                phone: values.phone,
                email: values.email,
                city: values.city,
                state: values.state,
                pincode: values.pincode,
                source: values.source,
                productInterest: values.productInterest,
                rawData,
            });
            const leadId = createRes.data.data?.id;
            const hasExtended = values.inquiryType ||
                values.inquiryDetails ||
                values.customerRequirements ||
                values.budgetAmount ||
                values.timeline ||
                values.internalNotes;
            if (leadId && hasExtended) {
                await axiosInstance.put(`/api/leads/${leadId}`, {
                    inquiryType: values.inquiryType,
                    productInterest: values.productInterest,
                    inquiryDetails: values.inquiryDetails,
                    customerRequirements: values.customerRequirements,
                    budgetAmount: values.budgetAmount,
                    timeline: values.timeline,
                    internalNotes: values.internalNotes,
                });
            }
            feedback.success('Lead created successfully');
            form.resetFields();
            onClose();
            onSuccess();
        }
        catch (error) {
            const err = error;
            if (err.errorFields)
                return;
            feedback.error('Could not save lead', err.response?.data?.error || 'Check required fields and JSON.');
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsx(Drawer, { title: "Add new lead", width: Math.min(720, window.innerWidth), open: open, onClose: onClose, destroyOnClose: true, extra: _jsx(Space, { children: _jsx(Text, { type: "secondary", children: "Fields match BTN lead + CRM profile APIs" }) }), footer: _jsxs(Space, { style: { float: 'right' }, children: [_jsx(Button, { onClick: onClose, children: "Cancel" }), _jsx(Button, { type: "primary", loading: saving, onClick: () => void handleSubmit(), children: "Create lead" })] }), children: _jsxs(Form, { form: form, layout: "vertical", requiredMark: "optional", children: [_jsxs(Divider, { titlePlacement: "start", plain: true, children: [_jsx(UserOutlined, {}), " Contact"] }), _jsxs(Row, { gutter: 16, children: [_jsx(Col, { xs: 24, md: 12, children: _jsx(Form.Item, { name: "customerName", label: "Customer name", rules: [{ required: true }], children: _jsx(Input, { placeholder: "Full name" }) }) }), _jsx(Col, { xs: 24, md: 12, children: _jsx(Form.Item, { name: "phone", label: "Phone", rules: [{ required: true }], children: _jsx(Input, { placeholder: "10-digit mobile" }) }) }), _jsx(Col, { xs: 24, md: 12, children: _jsx(Form.Item, { name: "email", label: "Email", rules: [{ type: 'email' }], children: _jsx(Input, { placeholder: "optional" }) }) })] }), _jsxs(Divider, { titlePlacement: "start", plain: true, children: [_jsx(EnvironmentOutlined, {}), " Location"] }), _jsxs(Row, { gutter: 16, children: [_jsx(Col, { xs: 24, md: 8, children: _jsx(Form.Item, { name: "city", label: "City", children: _jsx(Input, {}) }) }), _jsx(Col, { xs: 24, md: 8, children: _jsx(Form.Item, { name: "state", label: "State", children: _jsx(Input, {}) }) }), _jsx(Col, { xs: 24, md: 8, children: _jsx(Form.Item, { name: "pincode", label: "Pincode", children: _jsx(Input, {}) }) })] }), _jsxs(Divider, { titlePlacement: "start", plain: true, children: [_jsx(FundProjectionScreenOutlined, {}), " Campaign & interest"] }), _jsxs(Row, { gutter: 16, children: [_jsx(Col, { xs: 24, md: 12, children: _jsx(Form.Item, { name: "source", label: "Lead source", rules: [{ required: true }], children: _jsx(Select, { placeholder: "Channel", children: SOURCE_OPTIONS.map((s) => (_jsx(Option, { value: s.value, children: s.label }, s.value))) }) }) }), _jsx(Col, { xs: 24, md: 12, children: _jsx(Form.Item, { name: "productInterest", label: "Product / service interest", children: _jsx(Input, { placeholder: "e.g. Solar 5kW" }) }) })] }), _jsxs(Divider, { titlePlacement: "start", plain: true, children: [_jsx(FileTextOutlined, {}), " Inquiry details (saved to lead profile)"] }), _jsxs(Row, { gutter: 16, children: [_jsx(Col, { xs: 24, md: 12, children: _jsx(Form.Item, { name: "inquiryType", label: "Inquiry type", children: _jsx(Select, { allowClear: true, placeholder: "Select type", children: INQUIRY_TYPES.map((t) => (_jsx(Option, { value: t, children: t }, t))) }) }) }), _jsx(Col, { xs: 24, md: 12, children: _jsx(Form.Item, { name: "budgetAmount", label: "Budget (INR)", children: _jsx(InputNumber, { style: { width: '100%' }, min: 0, placeholder: "Estimated budget" }) }) })] }), _jsx(Form.Item, { name: "inquiryDetails", label: "Inquiry details", children: _jsx(Input.TextArea, { rows: 2, placeholder: "What did the customer ask for?" }) }), _jsx(Form.Item, { name: "customerRequirements", label: "Customer requirements", children: _jsx(Input.TextArea, { rows: 2 }) }), _jsx(Form.Item, { name: "timeline", label: "Timeline", children: _jsx(Input, { placeholder: "e.g. Within 2 weeks" }) }), _jsx(Form.Item, { name: "internalNotes", label: "Internal notes (staff only)", children: _jsx(Input.TextArea, { rows: 2 }) }), _jsx(Form.Item, { name: "rawData", label: "UTM / ad metadata (JSON)", children: _jsx(Input.TextArea, { rows: 3, placeholder: '{"utm_source":"google","campaign":"summer"}' }) })] }) }));
};
