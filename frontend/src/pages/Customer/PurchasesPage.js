import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Card, Table } from 'antd';
import { axiosInstance } from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
export const PurchasesPage = () => {
    const [items, setItems] = useState([]);
    const navigate = useNavigate();
    useEffect(() => {
        axiosInstance.get('/api/purchases').then((res) => setItems(res.data.data.items));
    }, []);
    return (_jsx(Card, { title: "Purchased Leads", children: _jsx(Table, { rowKey: "id", dataSource: items, scroll: { x: true }, columns: [
                { title: 'Lead', dataIndex: 'leadId' },
                { title: 'Price', render: (_, r) => `₹${r.price}` },
                { title: 'Date', render: (_, r) => new Date(r.purchasedAt).toLocaleString() },
                { title: '', render: (_, r) => _jsx("a", { onClick: () => navigate(`/customer/leads/${r.leadId}`), children: "Details" }) },
            ] }) }));
};
