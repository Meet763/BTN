import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Card, Col, Descriptions, Row, Statistic, Table, Tag } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { axiosInstance } from '../../api/axiosConfig';
export const OrgUnitDetailPage = () => {
    const { id } = useParams();
    const [summary, setSummary] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (!id)
            return;
        const load = async () => {
            setLoading(true);
            try {
                const [s, m] = await Promise.all([
                    axiosInstance.get(`/api/org-units/${id}/summary`),
                    axiosInstance.get(`/api/org-units/${id}/members`),
                ]);
                setSummary(s.data.data);
                setMembers(m.data.data || []);
            }
            finally {
                setLoading(false);
            }
        };
        void load();
    }, [id]);
    return (_jsxs(Card, { loading: loading, title: summary ? `${summary.name} (${summary.code})` : 'Org unit', extra: _jsx(Link, { to: "/admin/org-units", children: "Back to products" }), children: [summary && (_jsxs(_Fragment, { children: [_jsxs(Descriptions, { bordered: true, size: "small", column: 2, style: { marginBottom: 16 }, children: [_jsx(Descriptions.Item, { label: "Head", children: summary.headEmployeeName || '—' }), _jsx(Descriptions.Item, { label: "Code", children: _jsx(Tag, { children: summary.code }) })] }), _jsxs(Row, { gutter: 16, style: { marginBottom: 24 }, children: [_jsx(Col, { xs: 12, md: 6, children: _jsx(Statistic, { title: "Members", value: summary.memberCount }) }), _jsx(Col, { xs: 12, md: 6, children: _jsx(Statistic, { title: "Open leads", value: summary.openLeadCount }) }), _jsx(Col, { xs: 12, md: 6, children: _jsx(Statistic, { title: "Total leads", value: summary.totalLeadCount }) }), _jsx(Col, { xs: 12, md: 6, children: _jsx(Statistic, { title: "Customer purchases", value: summary.customerPurchaseCount }) })] })] })), _jsx(Table, { rowKey: "employeeId", dataSource: members, pagination: { pageSize: 10 }, columns: [
                    { title: 'Name', dataIndex: 'fullName' },
                    { title: 'Email', dataIndex: 'email' },
                    { title: 'Job title', dataIndex: 'jobTitle', render: (t) => _jsx(Tag, { children: t }) },
                    { title: 'Reports to', dataIndex: 'reportsToName', render: (v) => v || '—' },
                    {
                        title: 'Status',
                        dataIndex: 'isActive',
                        render: (v) => _jsx(Tag, { color: v ? 'green' : 'red', children: v ? 'Active' : 'Inactive' }),
                    },
                    { title: 'Open leads', dataIndex: 'openLeadCount' },
                ] })] }));
};
