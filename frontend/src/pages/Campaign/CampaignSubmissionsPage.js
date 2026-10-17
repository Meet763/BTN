import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Button, Card, Descriptions, Drawer, Input, Select, Space, Table, Tag, Typography } from 'antd';
import { GiftOutlined, SearchOutlined } from '@ant-design/icons';
import { axiosInstance } from '../../api/axiosConfig';
import { useFeedback } from '../../context/FeedbackContext';
import { Link } from 'react-router-dom';
const { Title, Paragraph } = Typography;
const PLATFORM_OPTIONS = [
    { value: 'all', label: 'All platforms' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'twitter', label: 'X / Twitter' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'google', label: 'Google' },
    { value: 'website', label: 'Website' },
    { value: 'other', label: 'Other' },
];
const JOB_ROLE_OPTIONS = [
    { value: 'all', label: 'All roles' },
    { value: 'Social Media Manager', label: 'Social Media Manager' },
    { value: 'Content Creator', label: 'Content Creator' },
    { value: 'Graphic Designer', label: 'Graphic Designer' },
    { value: 'Video Editor', label: 'Video Editor' },
    { value: 'Digital Marketing', label: 'Digital Marketing' },
    { value: 'Performance Marketing', label: 'Performance Marketing' },
    { value: 'SEO Specialist', label: 'SEO Specialist' },
    { value: 'Software Developer', label: 'Software Developer' },
    { value: 'Full Stack Developer', label: 'Full Stack Developer' },
    { value: 'Frontend Developer', label: 'Frontend Developer' },
    { value: 'Backend Developer', label: 'Backend Developer' },
    { value: 'Mobile App Developer', label: 'Mobile App Developer' },
    { value: 'UI / UX Designer', label: 'UI / UX Designer' },
    { value: 'Product Manager', label: 'Product Manager' },
    { value: 'Sales Executive', label: 'Sales Executive' },
    { value: 'Business Development', label: 'Business Development' },
    { value: 'Telecaller', label: 'Telecaller' },
    { value: 'Lead Verification Agent', label: 'Lead Verification Agent' },
    { value: 'Customer Support', label: 'Customer Support' },
    { value: 'Operations', label: 'Operations' },
    { value: 'HR / Recruiter', label: 'HR / Recruiter' },
    { value: 'Partnerships', label: 'Partnerships' },
    { value: 'Data Analyst', label: 'Data Analyst' },
    { value: 'Other', label: 'Other' },
];
const jobInterestLabel = (value) => {
    if (value === 'yes')
        return 'Yes';
    if (value === 'maybe')
        return 'Maybe later';
    if (value === 'no')
        return 'No';
    return '—';
};
const STATUS_OPTIONS = [
    { value: 'Processing', label: 'Processing', color: 'gold' },
    { value: 'InProgress', label: 'In progress', color: 'blue' },
    { value: 'InTransit', label: 'In transit', color: 'purple' },
    { value: 'Arrived', label: 'Gift arrived', color: 'green' },
];
const platformColor = (platform) => {
    const map = {
        instagram: 'magenta',
        facebook: 'blue',
        twitter: 'default',
        whatsapp: 'green',
        linkedin: 'geekblue',
        youtube: 'red',
        google: 'gold',
        website: 'cyan',
    };
    return map[platform] || 'purple';
};
const readList = (payload) => {
    const root = payload;
    const data = (root?.data ?? root);
    const items = (data?.items ?? data?.Items ?? []);
    const totalCount = Number(data?.totalCount ?? data?.TotalCount ?? items.length);
    return { items: Array.isArray(items) ? items : [], totalCount };
};
export const CampaignSubmissionsPage = () => {
    const feedback = useFeedback();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [platform, setPlatform] = useState('all');
    const [giftStatus, setGiftStatus] = useState('all');
    const [jobRole, setJobRole] = useState('all');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const load = async (nextPage = page, nextSize = pageSize) => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/api/campaign-submissions', {
                params: {
                    page: nextPage,
                    pageSize: nextSize,
                    platform: platform === 'all' ? undefined : platform,
                    giftStatus: giftStatus === 'all' ? undefined : giftStatus,
                    jobRole: jobRole === 'all' ? undefined : jobRole,
                    search: search.trim() || undefined,
                },
            });
            const parsed = readList(res.data);
            setRows(parsed.items);
            setTotal(parsed.totalCount);
        }
        catch (e) {
            const err = e;
            const detail = err.response?.status === 404
                ? 'API is missing this module. Restart the backend, then refresh.'
                : err.response?.data?.error;
            feedback.error('Could not load gift form submissions', detail);
            setRows([]);
            setTotal(0);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        setPage(1);
        void load(1, pageSize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [platform, giftStatus, jobRole]);
    const changeStatus = async (id, next) => {
        try {
            const res = await axiosInstance.patch(`/api/campaign-submissions/${id}/status`, { giftStatus: next });
            const updated = res.data.data;
            setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...updated } : row)));
            setSelected((prev) => (prev?.id === id ? { ...prev, ...updated } : prev));
            feedback.success('Gift status updated');
        }
        catch (e) {
            const err = e;
            feedback.error('Could not update gift status', err.response?.data?.error);
        }
    };
    const statusSelect = (row) => (_jsx(Select, { value: row.giftStatus, style: { width: 150 }, onClick: (e) => e.stopPropagation(), onChange: (value) => void changeStatus(row.id, value), options: STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label })) }));
    return (_jsxs(Card, { children: [_jsxs(Space, { align: "start", size: 12, style: { marginBottom: 16 }, children: [_jsx(GiftOutlined, { style: { fontSize: 22 } }), _jsxs("div", { children: [_jsx(Title, { level: 4, style: { margin: 0 }, children: "Gift form submissions" }), _jsxs(Paragraph, { type: "secondary", style: { margin: '4px 0 0' }, children: ["Track each gift from processing to arrival. Filter by platform or status.", ' ', _jsx(Link, { to: "/leads/advertise", children: "Copy share links" })] })] })] }), _jsxs(Space, { wrap: true, style: { marginBottom: 16 }, children: [_jsx(Input, { allowClear: true, prefix: _jsx(SearchOutlined, {}), placeholder: "Search name, phone, email, city", style: { width: 280 }, value: search, onChange: (e) => setSearch(e.target.value), onPressEnter: () => {
                            setPage(1);
                            void load(1, pageSize);
                        } }), _jsx(Select, { value: platform, style: { width: 180 }, options: PLATFORM_OPTIONS, onChange: setPlatform }), _jsx(Select, { value: giftStatus, style: { width: 180 }, options: [{ value: 'all', label: 'All statuses' }, ...STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))], onChange: setGiftStatus }), _jsx(Select, { value: jobRole, style: { width: 220 }, options: JOB_ROLE_OPTIONS, onChange: setJobRole }), _jsx(Button, { type: "primary", onClick: () => {
                            setPage(1);
                            void load(1, pageSize);
                        }, children: "Search" })] }), _jsx(Table, { rowKey: "id", loading: loading, dataSource: rows, scroll: { x: true }, pagination: {
                    current: page,
                    pageSize,
                    total,
                    showSizeChanger: true,
                    onChange: (nextPage, nextSize) => {
                        setPage(nextPage);
                        setPageSize(nextSize);
                        void load(nextPage, nextSize);
                    },
                }, columns: [
                    { title: 'Name', dataIndex: 'fullName', ellipsis: true },
                    { title: 'Phone', dataIndex: 'phone' },
                    { title: 'City', dataIndex: 'city' },
                    {
                        title: 'Platform',
                        dataIndex: 'platform',
                        render: (value) => _jsx(Tag, { color: platformColor(value), children: value }),
                    },
                    {
                        title: 'Job interest',
                        dataIndex: 'jobInterest',
                        render: (value) => jobInterestLabel(value),
                    },
                    { title: 'Role', dataIndex: 'jobRole', ellipsis: true, render: (value) => value || '—' },
                    {
                        title: 'Gift status',
                        dataIndex: 'giftStatus',
                        render: (_, row) => statusSelect(row),
                    },
                    {
                        title: 'Submitted',
                        dataIndex: 'createdAt',
                        render: (value) => new Date(value).toLocaleString(),
                    },
                    {
                        title: '',
                        render: (_, row) => (_jsx(Button, { type: "link", onClick: () => setSelected(row), children: "View" })),
                    },
                ] }), _jsx(Drawer, { title: "Submission", width: 440, open: !!selected, onClose: () => setSelected(null), children: selected && (_jsxs(_Fragment, { children: [_jsxs(Descriptions, { column: 1, size: "small", bordered: true, children: [_jsx(Descriptions.Item, { label: "Name", children: selected.fullName }), _jsx(Descriptions.Item, { label: "Phone", children: selected.phone }), _jsx(Descriptions.Item, { label: "Email", children: selected.email }), _jsx(Descriptions.Item, { label: "Address", children: selected.address }), _jsx(Descriptions.Item, { label: "City", children: selected.city }), _jsx(Descriptions.Item, { label: "State", children: selected.state }), _jsx(Descriptions.Item, { label: "Pincode", children: selected.pincode }), _jsx(Descriptions.Item, { label: "Interest", children: selected.productInterest || '—' }), _jsx(Descriptions.Item, { label: "Work with us", children: jobInterestLabel(selected.jobInterest) }), _jsx(Descriptions.Item, { label: "Role", children: selected.jobRole || '—' }), _jsx(Descriptions.Item, { label: "Platform", children: _jsx(Tag, { color: platformColor(selected.platform), children: selected.platform }) }), _jsx(Descriptions.Item, { label: "Campaign", children: selected.campaign }), _jsx(Descriptions.Item, { label: "Submitted", children: new Date(selected.createdAt).toLocaleString() }), _jsx(Descriptions.Item, { label: "Status updated", children: selected.statusUpdatedAt ? new Date(selected.statusUpdatedAt).toLocaleString() : '—' })] }), _jsxs("div", { style: { marginTop: 16 }, children: [_jsx(Paragraph, { type: "secondary", style: { marginBottom: 8 }, children: "Gift delivery status" }), statusSelect(selected)] })] })) })] }));
};
