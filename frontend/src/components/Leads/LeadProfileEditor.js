import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect } from 'react';
import { Button, Col, Collapse, DatePicker, Form, Input, InputNumber, Row, message } from 'antd';
import { axiosInstance } from '../../api/axiosConfig';
export const LeadProfileEditor = ({ lead, onUpdated }) => {
    const [form] = Form.useForm();
    useEffect(() => {
        form.setFieldsValue({
            ...lead,
            followUpAt: lead.followUpAt ? new Date(lead.followUpAt) : undefined,
        });
    }, [lead, form]);
    const save = async () => {
        const values = await form.validateFields();
        await axiosInstance.put(`/api/leads/${lead.id}`, {
            inquiryType: values.inquiryType,
            productInterest: values.productInterest,
            inquiryDetails: values.inquiryDetails,
            customerRequirements: values.customerRequirements,
            budgetAmount: values.budgetAmount,
            timeline: values.timeline,
            contactOutcome: values.contactOutcome,
            followUpAt: values.followUpAt ? new Date(values.followUpAt).toISOString() : null,
            remarks: values.remarks,
            internalNotes: values.internalNotes,
        });
        message.success('Lead profile updated');
        onUpdated();
    };
    return (_jsx(Collapse, { style: { marginTop: 16 }, items: [
            {
                key: 'profile',
                label: 'Edit lead CRM profile (before / after verification)',
                children: (_jsxs(Form, { form: form, layout: "vertical", children: [_jsxs(Row, { gutter: 16, children: [_jsx(Col, { span: 12, children: _jsx(Form.Item, { name: "inquiryType", label: "Inquiry type", children: _jsx(Input, {}) }) }), _jsx(Col, { span: 12, children: _jsx(Form.Item, { name: "productInterest", label: "Product / service", children: _jsx(Input, {}) }) })] }), _jsx(Form.Item, { name: "inquiryDetails", label: "Inquiry details", children: _jsx(Input.TextArea, { rows: 2 }) }), _jsx(Form.Item, { name: "customerRequirements", label: "Customer requirements", children: _jsx(Input.TextArea, { rows: 2 }) }), _jsxs(Row, { gutter: 16, children: [_jsx(Col, { span: 12, children: _jsx(Form.Item, { name: "budgetAmount", label: "Budget (INR)", children: _jsx(InputNumber, { style: { width: '100%' }, min: 0 }) }) }), _jsx(Col, { span: 12, children: _jsx(Form.Item, { name: "timeline", label: "Timeline", children: _jsx(Input, {}) }) })] }), _jsx(Form.Item, { name: "followUpAt", label: "Follow-up date", children: _jsx(DatePicker, { style: { width: '100%' }, showTime: true }) }), _jsx(Form.Item, { name: "internalNotes", label: "Internal notes", children: _jsx(Input.TextArea, { rows: 2 }) }), _jsx(Button, { type: "primary", onClick: () => void save(), children: "Save profile" })] })),
            },
        ] }));
};
