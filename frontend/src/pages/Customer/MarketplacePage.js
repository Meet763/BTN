import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Button, Card, Input, Space, Table, Tag, message, Alert } from 'antd';
import { axiosInstance } from '../../api/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
export const MarketplacePage = () => {
    const [leads, setLeads] = useState([]);
    const [search, setSearch] = useState('');
    const [city, setCity] = useState('');
    const [loading, setLoading] = useState(false);
    const [balance, setBalance] = useState(null);
    const navigate = useNavigate();
    const load = async () => {
        setLoading(true);
        try {
            const [res, w] = await Promise.all([
                axiosInstance.get('/api/leads/available', {
                    params: { search: search || undefined, city: city || undefined, pageSize: 50 },
                }),
                axiosInstance.get('/api/wallet'),
            ]);
            setLeads(res.data.data.items);
            setBalance(w.data.data?.balance ?? 0);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        load();
    }, []);
    const purchase = async (leadId) => {
        try {
            await axiosInstance.post('/api/purchases', { leadId });
            message.success('Lead purchased — amount deducted from wallet');
            navigate('/customer/purchases');
        }
        catch (e) {
            message.error(e.response?.data?.error || 'Purchase failed');
        }
    };
    return (_jsxs(Card, { title: "Verified Lead Marketplace", children: [_jsxs("p", { style: { marginBottom: 16, color: 'var(--text-secondary)' }, children: ["Leads appear here after an admin verifies them, sets a price, and clicks Publish on Lead sales.", balance != null && (_jsxs(_Fragment, { children: [' ', "Your wallet: ", _jsxs("strong", { children: ["\u20B9", balance.toFixed(2)] }), " \u2014 ", _jsx(Link, { to: "/customer/wallet", children: "Add money" })] }))] }), balance != null && balance < 100 && (_jsx(Alert, { type: "warning", showIcon: true, message: "Low balance", description: "Top up your eWallet before purchasing leads.", style: { marginBottom: 16 } })), _jsxs(Space, { style: { marginBottom: 16 }, wrap: true, children: [_jsx(Input.Search, { placeholder: "Search interest / details", value: search, onChange: (e) => setSearch(e.target.value), onSearch: () => void load(), style: { width: 240 } }), _jsx(Input, { placeholder: "Filter by city", value: city, onChange: (e) => setCity(e.target.value), onPressEnter: () => void load(), style: { width: 160 }, allowClear: true }), _jsx(Button, { type: "primary", onClick: () => void load(), children: "Apply filters" }), _jsx(Button, { onClick: () => void load(), children: "Refresh" })] }), _jsx(Table, { rowKey: "id", loading: loading, dataSource: leads, scroll: { x: true }, columns: [
                    { title: 'Interest', dataIndex: 'productInterest' },
                    { title: 'City', dataIndex: 'city' },
                    { title: 'Price', render: (_, r) => (r.listPrice ? `₹${r.listPrice}` : '-') },
                    { title: 'Status', render: (_, r) => _jsx(Tag, { children: r.saleStatus }) },
                    {
                        title: 'Action',
                        render: (_, r) => (_jsxs(Space, { children: [_jsx(Button, { size: "small", onClick: () => navigate(`/customer/leads/${r.id}`), children: "View" }), _jsx(Button, { size: "small", type: "primary", onClick: () => void purchase(r.id), disabled: r.saleStatus !== 'Available', children: "Buy with wallet" })] })),
                    },
                ] })] }));
};
