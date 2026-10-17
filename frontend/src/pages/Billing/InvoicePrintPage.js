import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Button, Card } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { axiosInstance } from '../../api/axiosConfig';
export const InvoicePrintPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    useEffect(() => {
        axiosInstance.get(`/api/billing/invoices/${id}`).then((res) => setInvoice(res.data.data));
    }, [id]);
    if (!invoice)
        return null;
    return (_jsxs(Card, { children: [_jsxs("div", { className: "invoice-print", children: [invoice.organization?.logoUrl && _jsx("img", { src: invoice.organization.logoUrl, alt: "logo", style: { maxHeight: 64 } }), _jsx("h2", { children: invoice.organization?.legalName }), _jsx("p", { children: invoice.organization?.address }), _jsxs("h3", { children: ["Invoice ", invoice.invoiceNumber] }), _jsxs("p", { children: ["Bill To: ", invoice.customer?.name] }), _jsxs("table", { style: { width: '100%', marginTop: 16 }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { align: "left", children: "Description" }), _jsx("th", { children: "Qty" }), _jsx("th", { children: "Price" }), _jsx("th", { children: "Total" })] }) }), _jsx("tbody", { children: invoice.lines?.map((l, idx) => (_jsxs("tr", { children: [_jsx("td", { children: l.description }), _jsx("td", { align: "center", children: l.quantity }), _jsxs("td", { align: "right", children: ["\u20B9", l.unitPrice] }), _jsxs("td", { align: "right", children: ["\u20B9", l.lineTotal] })] }, idx))) })] }), _jsxs("h3", { style: { textAlign: 'right' }, children: ["Total: \u20B9", invoice.totalAmount] })] }), _jsx(Button, { style: { marginTop: 16 }, onClick: () => window.print(), children: "Print" }), _jsx(Button, { style: { marginTop: 16, marginLeft: 8 }, onClick: () => navigate(-1), children: "Back" })] }));
};
