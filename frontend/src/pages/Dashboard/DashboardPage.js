import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Progress, Spin, List, Typography, Space, message } from 'antd';
import { FileProtectOutlined, HistoryOutlined, ClockCircleOutlined, LineChartOutlined, InfoCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, AlertOutlined, } from '@ant-design/icons';
import { axiosInstance } from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';
import { isPlatformOwner } from '../../utils/roles';
import { Link } from 'react-router-dom';
const { Title, Text } = Typography;
export const DashboardPage = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [adminExtras, setAdminExtras] = useState(null);
    const [loading, setLoading] = useState(true);
    const fetchStats = async () => {
        try {
            const response = await axiosInstance.get('/api/leads/stats');
            if (response.data.success) {
                setStats(response.data.data);
            }
            if (isPlatformOwner(user?.role)) {
                const adminRes = await axiosInstance.get('/api/dashboard/admin');
                if (adminRes.data.success) {
                    const d = adminRes.data.data;
                    setAdminExtras({
                        verifiedLeads: d.verifiedLeads,
                        totalSales: d.totalSales,
                        totalWalletCredits: d.totalWalletCredits,
                    });
                }
            }
        }
        catch (error) {
            message.error('Failed to load dashboard statistics.');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchStats();
    }, [user?.role]);
    if (loading) {
        return (_jsx("div", { style: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }, children: _jsx(Spin, { size: "large", tip: "Loading dashboard stats..." }) }));
    }
    if (!stats)
        return null;
    // Calculate colors for progress bars based on index
    const getSourceColor = (source) => {
        switch (source) {
            case 'GoogleAds': return '#1890ff';
            case 'MetaAds': return '#3b5998';
            case 'Website': return '#13c2c2';
            case 'WhatsApp': return '#52c41a';
            case 'Referral': return '#722ed1';
            case 'Instagram': return '#c13584';
            case 'Twitter': return '#1d9bf0';
            default: return '#fa8c16';
        }
    };
    return (_jsxs("div", { style: { padding: '8px' }, children: [_jsxs("div", { style: { marginBottom: '24px' }, children: [_jsx(Title, { level: 2, style: { margin: 0 }, children: "\uD83D\uDCCA Performance Dashboard" }), _jsx(Text, { type: "secondary", children: "Real-time leads status and verification activity logs." })] }), _jsxs(Row, { gutter: [24, 24], style: { marginBottom: '24px' }, children: [_jsx(Col, { xs: 24, sm: 12, lg: 6, children: _jsx(Card, { className: "dashboard-stat-card", bordered: false, children: _jsx(Statistic, { title: _jsx("span", { style: { color: 'var(--text-secondary)' }, children: "Total Leads Ingested" }), value: stats.totalLeads, prefix: _jsx(LineChartOutlined, { style: { color: 'var(--primary-color)', marginRight: 8 } }) }) }) }), _jsx(Col, { xs: 24, sm: 12, lg: 6, children: _jsx(Card, { className: "dashboard-stat-card", bordered: false, children: _jsx(Statistic, { title: _jsx("span", { style: { color: 'var(--text-secondary)' }, children: "Pending Verification" }), value: stats.pendingVerification, valueStyle: { color: '#faad14' }, prefix: _jsx(HistoryOutlined, { style: { marginRight: 8 } }) }) }) }), _jsx(Col, { xs: 24, sm: 12, lg: 6, children: _jsx(Card, { className: "dashboard-stat-card", bordered: false, children: _jsx(Statistic, { title: _jsx("span", { style: { color: 'var(--text-secondary)' }, children: "Verified Today" }), value: stats.verifiedToday, valueStyle: { color: 'var(--success-color)' }, prefix: _jsx(CheckCircleOutlined, { style: { marginRight: 8 } }) }) }) }), _jsx(Col, { xs: 24, sm: 12, lg: 6, children: _jsx(Card, { className: "dashboard-stat-card", bordered: false, children: _jsx(Statistic, { title: _jsx("span", { style: { color: 'var(--text-secondary)' }, children: "Rejected Today" }), value: stats.rejectedToday, valueStyle: { color: 'var(--error-color)' }, prefix: _jsx(CloseCircleOutlined, { style: { marginRight: 8 } }) }) }) })] }), adminExtras && (_jsxs(Row, { gutter: [24, 24], style: { marginBottom: 24 }, children: [_jsx(Col, { xs: 24, sm: 8, children: _jsx(Card, { bordered: false, children: _jsx(Statistic, { title: "Verified leads (all time)", value: adminExtras.verifiedLeads }) }) }), _jsx(Col, { xs: 24, sm: 8, children: _jsx(Card, { bordered: false, children: _jsx(Statistic, { title: "Lead purchases", value: adminExtras.totalSales }) }) }), _jsx(Col, { xs: 24, sm: 8, children: _jsx(Card, { bordered: false, children: _jsx(Statistic, { title: "Wallet top-ups (\u20B9)", value: adminExtras.totalWalletCredits, precision: 2 }) }) })] })), isPlatformOwner(user?.role) && (_jsx(Card, { style: { marginBottom: 24 }, title: "Quick links", children: _jsxs(Space, { wrap: true, children: [_jsx(Link, { to: "/customers", children: "Customer accounts" }), _jsx(Link, { to: "/leads/sales", children: "Assign & publish leads" }), _jsx(Link, { to: "/users", children: "User management" })] }) })), _jsxs(Row, { gutter: [24, 24], children: [_jsx(Col, { xs: 24, lg: 12, children: _jsx(Card, { title: _jsxs(Space, { children: [_jsx(FileProtectOutlined, {}), _jsx("span", { children: "Lead Source Breakdown" })] }), bordered: false, style: { borderRadius: '12px', boxShadow: 'var(--card-shadow)', height: '100%' }, children: _jsx(List, { dataSource: Object.entries(stats.sourceBreakdown).sort((a, b) => b[1] - a[1]), renderItem: ([source, count]) => {
                                    const percentage = stats.totalLeads > 0 ? Math.round((count / stats.totalLeads) * 100) : 0;
                                    return (_jsx(List.Item, { style: { borderBottom: '1px solid var(--border-color)', padding: '12px 0' }, children: _jsxs("div", { style: { width: '100%' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }, children: [_jsx(Text, { strong: true, children: source }), _jsxs(Text, { type: "secondary", children: [count, " leads (", percentage, "%)"] })] }), _jsx(Progress, { percent: percentage, strokeColor: getSourceColor(source), showInfo: false, size: "small", status: "active" })] }) }));
                                } }) }) }), _jsx(Col, { xs: 24, lg: 12, children: _jsxs(Row, { gutter: [24, 24], children: [_jsx(Col, { span: 24, children: _jsxs(Card, { title: _jsxs(Space, { children: [_jsx(InfoCircleOutlined, {}), _jsx("span", { children: "Verification Rate" })] }), bordered: false, style: { borderRadius: '12px', boxShadow: 'var(--card-shadow)' }, children: [_jsx("div", { style: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 0' }, children: _jsx(Progress, { type: "dashboard", percent: stats.verificationRate, strokeColor: {
                                                        '0%': '#108ee9',
                                                        '100%': '#87d068',
                                                    }, gapDegree: 30, width: 160 }) }), _jsx("div", { style: { textAlign: 'center', marginTop: '8px' }, children: _jsx(Text, { type: "secondary", children: "Percentage of leads successfully verified vs. rejected." }) })] }) }), _jsx(Col, { span: 24, children: _jsx(Card, { bordered: false, style: { borderRadius: '12px', boxShadow: 'var(--card-shadow)' }, children: _jsxs(Row, { gutter: 16, children: [_jsx(Col, { span: 12, style: { borderRight: '1px solid var(--border-color)' }, children: _jsx(Statistic, { title: _jsx("span", { style: { color: 'var(--text-secondary)' }, children: "Avg. Call Duration" }), value: stats.avgCallDurationSeconds, suffix: "sec", prefix: _jsx(ClockCircleOutlined, { style: { color: '#fa8c16', marginRight: 8 } }) }) }), _jsx(Col, { span: 12, style: { paddingLeft: '24px' }, children: _jsx(Statistic, { title: _jsx("span", { style: { color: 'var(--text-secondary)' }, children: "Duplicates Caught" }), value: stats.duplicatesFound, valueStyle: { color: 'var(--error-color)' }, prefix: _jsx(AlertOutlined, { style: { marginRight: 8 } }) }) })] }) }) })] }) })] })] }));
};
