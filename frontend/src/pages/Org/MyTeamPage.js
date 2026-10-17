import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Card, Empty, Table, Tag } from 'antd';
import { axiosInstance } from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';
export const MyTeamPage = () => {
    const { user } = useAuth();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await axiosInstance.get('/api/hierarchy/under-me');
                setMembers(res.data.data || []);
            }
            finally {
                setLoading(false);
            }
        };
        void load();
    }, []);
    return (_jsx(Card, { title: "My Team", loading: loading, extra: user?.jobTitle ? _jsx(Tag, { children: user.jobTitle }) : null, children: members.length === 0 && !loading ? (_jsx(Empty, { description: "No direct reports or team members in your scope" })) : (_jsx(Table, { rowKey: "employeeId", dataSource: members, scroll: { x: true }, columns: [
                { title: 'Name', dataIndex: 'fullName' },
                { title: 'Email', dataIndex: 'email' },
                { title: 'Job title', dataIndex: 'jobTitle', render: (t) => _jsx(Tag, { children: t }) },
                {
                    title: 'Product',
                    render: (_, r) => r.orgUnitCode ? _jsx(Tag, { color: "blue", children: `${r.orgUnitName || ''} (${r.orgUnitCode})` }) : '—',
                },
                { title: 'Reports to', dataIndex: 'reportsToName', render: (v) => v || '—' },
                { title: 'Open leads', dataIndex: 'openLeadCount' },
                {
                    title: 'Status',
                    dataIndex: 'isActive',
                    render: (v) => _jsx(Tag, { color: v ? 'green' : 'red', children: v ? 'Active' : 'Inactive' }),
                },
            ] })) }));
};
