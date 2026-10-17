import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Button, Card, Form, Input, InputNumber, List, Modal, Space, Tag, message } from 'antd';
import { axiosInstance } from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
export const BillingHubPage = () => {
    const [, setOrg] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [quotations, setQuotations] = useState([]);
    const [products, setProducts] = useState([]);
    const [billingCustomers, setBillingCustomers] = useState([]);
    const [customerModal, setCustomerModal] = useState(false);
    const [productModal, setProductModal] = useState(false);
    const [payModal, setPayModal] = useState(null);
    const [customerForm] = Form.useForm();
    const [productForm] = Form.useForm();
    const [payForm] = Form.useForm();
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const load = async () => {
        const [o, i, bc, p, q] = await Promise.all([
            axiosInstance.get('/api/billing/organization'),
            axiosInstance.get('/api/billing/invoices'),
            axiosInstance.get('/api/billing/customers'),
            axiosInstance.get('/api/billing/products'),
            axiosInstance.get('/api/billing/quotations'),
        ]);
        setOrg(o.data.data);
        setInvoices(i.data.data || []);
        setBillingCustomers(bc.data.data || []);
        setProducts(p.data.data || []);
        setQuotations(q.data.data || []);
        if (o.data.data)
            form.setFieldsValue(o.data.data);
    };
    useEffect(() => {
        load();
    }, []);
    const saveOrg = async () => {
        const values = await form.validateFields();
        await axiosInstance.put('/api/billing/organization', values);
        message.success('Organization saved');
        load();
    };
    const createBillingCustomer = async () => {
        const values = await customerForm.validateFields();
        await axiosInstance.post('/api/billing/customers', values);
        message.success('Billing customer added');
        setCustomerModal(false);
        customerForm.resetFields();
        load();
    };
    const createProduct = async () => {
        const values = await productForm.validateFields();
        await axiosInstance.post('/api/billing/products', values);
        message.success('Product added');
        setProductModal(false);
        productForm.resetFields();
        load();
    };
    const recordPayment = async () => {
        if (!payModal)
            return;
        const values = await payForm.validateFields();
        await axiosInstance.post(`/api/billing/invoices/${payModal.id}/payments`, values);
        message.success('Payment recorded');
        setPayModal(null);
        payForm.resetFields();
        load();
    };
    const convertQuotation = async (id) => {
        const res = await axiosInstance.post(`/api/billing/quotations/${id}/convert`);
        message.success(`Invoice ${res.data.data.invoiceNumber} created`);
        load();
    };
    return (_jsxs(Space, { direction: "vertical", size: "large", style: { width: '100%' }, children: [_jsx(Card, { title: "Billing Branding", children: _jsxs(Form, { form: form, layout: "vertical", onFinish: () => void saveOrg(), children: [_jsx(Form.Item, { name: "legalName", label: "Company Name", rules: [{ required: true }], children: _jsx(Input, {}) }), _jsx(Form.Item, { name: "address", label: "Address", children: _jsx(Input.TextArea, { rows: 2 }) }), _jsx(Form.Item, { name: "logoUrl", label: "Logo URL", children: _jsx(Input, {}) }), _jsx(Form.Item, { name: "invoicePrefix", label: "Invoice Prefix", children: _jsx(Input, {}) }), _jsx(Button, { type: "primary", htmlType: "submit", children: "Save" })] }) }), _jsx(Card, { title: "Your clients (bill-to)", extra: _jsx(Button, { onClick: () => setCustomerModal(true), children: "Add client" }), children: _jsx(List, { dataSource: billingCustomers, renderItem: (c) => (_jsxs(List.Item, { children: [c.name, " \u2014 ", c.email || c.phone || '—'] })) }) }), _jsx(Card, { title: "Products / services", extra: _jsx(Button, { onClick: () => setProductModal(true), children: "Add product" }), children: _jsx(List, { dataSource: products, renderItem: (p) => (_jsxs(List.Item, { children: [p.name, " \u2014 \u20B9", p.unitPrice, " ", p.isActive === false && _jsx(Tag, { children: "Inactive" })] })) }) }), _jsx(Card, { title: "Quotations", extra: _jsx(Button, { type: "primary", onClick: () => navigate('/customer/billing/quotations/new'), children: "New quotation" }), children: _jsx(List, { dataSource: quotations, renderItem: (q) => (_jsxs(List.Item, { actions: [
                            _jsx(Button, { size: "small", onClick: () => navigate(`/customer/billing/quotations/${q.id}/print`), children: "Print" }, "p"),
                            _jsx(Button, { size: "small", type: "link", onClick: () => void convertQuotation(q.id), children: "Convert to invoice" }, "c"),
                        ], children: [q.quotationNumber, " \u2014 \u20B9", q.totalAmount, " \u2014 ", q.customer?.name || '—'] })) }) }), _jsx(Card, { title: "Invoices", extra: _jsx(Button, { onClick: () => navigate('/customer/billing/invoices/new'), children: "New Invoice" }), children: _jsx(List, { dataSource: invoices, renderItem: (inv) => (_jsxs(List.Item, { actions: [
                            _jsx(Button, { onClick: () => navigate(`/customer/billing/invoices/${inv.id}/print`), children: "Print" }, "p"),
                            inv.status !== 'Paid' ? (_jsx(Button, { type: "link", onClick: () => {
                                    setPayModal({ id: inv.id, due: Math.max(0, (inv.totalAmount || 0) - (inv.amountPaid || 0)) });
                                    payForm.setFieldsValue({ amount: Math.max(0, (inv.totalAmount || 0) - (inv.amountPaid || 0)) });
                                }, children: "Record payment" }, "pay")) : null,
                        ], children: [inv.invoiceNumber, " \u2014 \u20B9", inv.totalAmount, " \u2014 ", _jsx(Tag, { children: inv.status }), inv.amountPaid > 0 && ` (paid ₹${inv.amountPaid})`] })) }) }), _jsx(Modal, { title: "Billing client", open: customerModal, onOk: () => void createBillingCustomer(), onCancel: () => setCustomerModal(false), children: _jsxs(Form, { form: customerForm, layout: "vertical", children: [_jsx(Form.Item, { name: "name", label: "Name", rules: [{ required: true }], children: _jsx(Input, {}) }), _jsx(Form.Item, { name: "email", label: "Email", children: _jsx(Input, {}) }), _jsx(Form.Item, { name: "phone", label: "Phone", children: _jsx(Input, {}) }), _jsx(Form.Item, { name: "address", label: "Address", children: _jsx(Input.TextArea, { rows: 2 }) })] }) }), _jsx(Modal, { title: "Product / service", open: productModal, onOk: () => void createProduct(), onCancel: () => setProductModal(false), children: _jsxs(Form, { form: productForm, layout: "vertical", children: [_jsx(Form.Item, { name: "name", label: "Name", rules: [{ required: true }], children: _jsx(Input, {}) }), _jsx(Form.Item, { name: "description", label: "Description", children: _jsx(Input.TextArea, { rows: 2 }) }), _jsx(Form.Item, { name: "unitPrice", label: "Unit price (\u20B9)", rules: [{ required: true }], children: _jsx(InputNumber, { min: 0, style: { width: '100%' } }) })] }) }), _jsx(Modal, { title: "Record payment", open: !!payModal, onOk: () => void recordPayment(), onCancel: () => setPayModal(null), children: _jsxs(Form, { form: payForm, layout: "vertical", children: [_jsx(Form.Item, { name: "amount", label: "Amount", rules: [{ required: true }], children: _jsx(InputNumber, { min: 1, style: { width: '100%' } }) }), _jsx(Form.Item, { name: "method", label: "Method", children: _jsx(Input, { placeholder: "UPI / Bank / Cash" }) }), _jsx(Form.Item, { name: "reference", label: "Reference", children: _jsx(Input, {}) })] }) })] }));
};
