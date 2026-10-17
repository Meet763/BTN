import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Space, Statistic, Table, Tag, Typography } from 'antd';
import { axiosInstance } from '../../api/axiosConfig';
const { Title, Text } = Typography;
export const EmployeeWorkPage = () => {
    const [perf, setPerf] = useState(null);
    const [history, setHistory] = useState([]);
    useEffect(() => {
        Promise.all([
            axiosInstance.get('/api/employees/me/performance'),
            axiosInstance.get('/api/employees/me/work-history'),
        ]).then(([p, h]) => {
            setPerf(p.data.data);
            setHistory(h.data.data || []);
        });
    }, []);
    return (_jsxs(Space, { direction: "vertical", size: "large", style: { width: '100%' }, children: [_jsxs("div", { children: [_jsx(Title, { level: 3, style: { margin: 0 }, children: "My work" }), _jsx(Text, { type: "secondary", children: "Your assignments, verifications, and performance." })] }), perf && (_jsx(Card, { children: _jsxs(Space, { size: "large", wrap: true, children: [_jsx(Statistic, { title: "Assigned leads", value: perf.assignedLeads }), _jsx(Statistic, { title: "Verifications total", value: perf.verificationsTotal }), _jsx(Statistic, { title: "This month", value: perf.verificationsThisMonth })] }) })), _jsx(Card, { title: "Activity history", children: _jsx(Table, { rowKey: (r) => `${r.leadId}-${r.at}-${r.activityType}`, dataSource: history, scroll: { x: true }, columns: [
                        { title: 'When', render: (_, r) => new Date(r.at).toLocaleString() },
                        { title: 'Type', dataIndex: 'activityType', render: (t) => _jsx(Tag, { color: t === 'Verification' ? 'green' : 'blue', children: t }) },
                        { title: 'Customer', dataIndex: 'customerName' },
                        { title: 'Detail', dataIndex: 'detail', ellipsis: true },
                    ] }) }), !perf && (_jsx(Descriptions, { children: _jsx(Descriptions.Item, { label: "Note", children: "No employee profile linked to this login yet." }) }))] }));
};
