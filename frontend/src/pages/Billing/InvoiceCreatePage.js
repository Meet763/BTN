import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Button, Card, DatePicker, Form, Input, InputNumber, Select, Space, message } from 'antd';
import { axiosInstance } from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
export const InvoiceCreatePage = () => {
    const [billingCustomers, setBillingCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    useEffect(() => {
        Promise.all([
            axiosInstance.get('/api/billing/customers'),
            axiosInstance.get('/api/billing/products'),
        ]).then(([c, p]) => {
            setBillingCustomers((c.data.data || []).map((x) => ({ id: x.id, name: x.name })));
            setProducts((p.data.data || []).map((x) => ({
                id: x.id,
                name: x.name,
                unitPrice: x.unitPrice,
            })));
        });
    }, []);
    const onFinish = async (values) => {
        await axiosInstance.post('/api/billing/invoices', {
            billingCustomerId: values.billingCustomerId,
            dueAt: values.dueAt ? values.dueAt.toISOString() : null,
            lines: [
                {
                    description: values.description,
                    quantity: values.quantity,
                    unitPrice: values.unitPrice,
                },
            ],
        });
        message.success('Invoice created');
        navigate('/customer/billing');
    };
    return (_jsx(Card, { title: "New invoice", children: _jsxs(Form, { form: form, layout: "vertical", onFinish: (v) => void onFinish(v), initialValues: { quantity: 1, unitPrice: 1000 }, children: [_jsx(Form.Item, { name: "billingCustomerId", label: "Bill to", rules: [{ required: true }], children: _jsx(Select, { placeholder: "Select billing customer", options: billingCustomers.map((c) => ({ value: c.id, label: c.name })), notFoundContent: _jsx("span", { children: "Add a billing customer from Billing hub first." }) }) }), _jsx(Form.Item, { name: "dueAt", label: "Due date", children: _jsx(DatePicker, { style: { width: '100%' } }) }), products.length > 0 && (_jsx(Form.Item, { label: "Fill from product", children: _jsx(Select, { allowClear: true, placeholder: "Select product", options: products.map((p) => ({ value: p.id, label: `${p.name} (₹${p.unitPrice})` })), onChange: (id) => {
                            const p = products.find((x) => x.id === id);
                            if (p)
                                form.setFieldsValue({ description: p.name, unitPrice: p.unitPrice });
                        } }) })), _jsx(Form.Item, { name: "description", label: "Line description", rules: [{ required: true }], children: _jsx(Input, {}) }), _jsxs(Space, { children: [_jsx(Form.Item, { name: "quantity", label: "Qty", rules: [{ required: true }], children: _jsx(InputNumber, { min: 1 }) }), _jsx(Form.Item, { name: "unitPrice", label: "Unit price (\u20B9)", rules: [{ required: true }], children: _jsx(InputNumber, { min: 1 }) })] }), _jsxs(Space, { children: [_jsx(Button, { type: "primary", htmlType: "submit", children: "Create" }), _jsx(Button, { onClick: () => navigate('/customer/billing'), children: "Cancel" })] })] }) }));
};
