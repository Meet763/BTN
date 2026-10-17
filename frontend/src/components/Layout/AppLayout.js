import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Space, Typography, theme as antTheme, Grid } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, DashboardOutlined, UserOutlined, FileProtectOutlined, LogoutOutlined, BulbOutlined, BulbFilled, TeamOutlined, ShopOutlined, WalletOutlined, FileTextOutlined, DollarOutlined, UsergroupAddOutlined, FormOutlined, ApartmentOutlined, ClusterOutlined, GiftOutlined, } from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;
export const AppLayout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const screens = Grid.useBreakpoint();
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { token } = antTheme.useToken();
    useEffect(() => {
        if (!screens.lg)
            setCollapsed(true);
    }, [screens.lg]);
    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };
    const userMenuItems = [
        {
            key: 'profile',
            label: (_jsxs("div", { style: { padding: '4px 12px' }, children: [_jsx(Text, { strong: true, children: user?.fullName }), _jsx("br", {}), _jsx(Text, { type: "secondary", children: user?.role })] })),
        },
        { type: 'divider' },
        { key: 'logout', icon: _jsx(LogoutOutlined, {}), label: 'Sign Out', onClick: handleLogout },
    ];
    const menuItems = [];
    const role = user?.role;
    if (role === 'PlatformOwner') {
        menuItems.push({ key: '/dashboard', icon: _jsx(DashboardOutlined, {}), label: _jsx(Link, { to: "/dashboard", children: "Dashboard" }) }, { key: '/users', icon: _jsx(UserOutlined, {}), label: _jsx(Link, { to: "/users", children: "Users" }) }, { key: '/employees', icon: _jsx(TeamOutlined, {}), label: _jsx(Link, { to: "/employees", children: "Employees" }) }, { key: '/admin/org-units', icon: _jsx(ApartmentOutlined, {}), label: _jsx(Link, { to: "/admin/org-units", children: "Org Products" }) }, { key: '/admin/hierarchy', icon: _jsx(ClusterOutlined, {}), label: _jsx(Link, { to: "/admin/hierarchy", children: "Hierarchy" }) }, { key: '/my-team', icon: _jsx(TeamOutlined, {}), label: _jsx(Link, { to: "/my-team", children: "My Team" }) }, { key: '/customers', icon: _jsx(UsergroupAddOutlined, {}), label: _jsx(Link, { to: "/customers", children: "Customers" }) }, { key: '/verification', icon: _jsx(FileProtectOutlined, {}), label: _jsx(Link, { to: "/verification", children: "Verification" }) }, { key: '/leads/advertise', icon: _jsx(FormOutlined, {}), label: _jsx(Link, { to: "/leads/advertise", children: "Gift form links" }) }, { key: '/campaign/submissions', icon: _jsx(GiftOutlined, {}), label: _jsx(Link, { to: "/campaign/submissions", children: "Gift submissions" }) }, { key: '/forms', icon: _jsx(FileTextOutlined, {}), label: _jsx(Link, { to: "/forms", children: "Forms" }) }, { key: '/leads/sales', icon: _jsx(DollarOutlined, {}), label: _jsx(Link, { to: "/leads/sales", children: "Lead sales" }) });
    }
    else if (role === 'Employee' || role === 'VerificationAgent') {
        menuItems.push({ key: '/verification', icon: _jsx(FileProtectOutlined, {}), label: _jsx(Link, { to: "/verification", children: "My Leads" }) }, { key: '/my-team', icon: _jsx(TeamOutlined, {}), label: _jsx(Link, { to: "/my-team", children: "My Team" }) }, { key: '/customers', icon: _jsx(UsergroupAddOutlined, {}), label: _jsx(Link, { to: "/customers", children: "Customers" }) }, { key: '/my-work', icon: _jsx(TeamOutlined, {}), label: _jsx(Link, { to: "/my-work", children: "My work" }) });
    }
    else if (role === 'Customer') {
        menuItems.push({ key: '/customer/marketplace', icon: _jsx(ShopOutlined, {}), label: _jsx(Link, { to: "/customer/marketplace", children: "Marketplace" }) }, { key: '/customer/wallet', icon: _jsx(WalletOutlined, {}), label: _jsx(Link, { to: "/customer/wallet", children: "Wallet" }) }, { key: '/customer/purchases', icon: _jsx(FileProtectOutlined, {}), label: _jsx(Link, { to: "/customer/purchases", children: "Purchases" }) }, { key: '/customer/billing', icon: _jsx(FileTextOutlined, {}), label: _jsx(Link, { to: "/customer/billing", children: "Billing" }) });
    }
    else {
        menuItems.push({ key: '/dashboard', icon: _jsx(DashboardOutlined, {}), label: _jsx(Link, { to: "/dashboard", children: "Dashboard" }) });
    }
    const selectedKey = menuItems.find((m) => location.pathname === m.key || location.pathname.startsWith(`${m.key}/`))?.key ??
        location.pathname;
    return (_jsxs(Layout, { style: { minHeight: '100vh' }, className: "app-layout-root", children: [_jsxs(Sider, { className: "app-layout-sider", trigger: null, collapsible: true, collapsed: collapsed, width: 260, breakpoint: "lg", collapsedWidth: screens.md ? 80 : 0, children: [_jsxs("div", { className: `app-sidebar-brand ${collapsed ? 'app-sidebar-brand--collapsed' : ''}`, children: [_jsx("div", { className: "app-sidebar-brand-mark", "aria-hidden": true, title: "Business Trust Network", children: collapsed ? 'B' : 'BTN' }), !collapsed && (_jsxs("div", { children: [_jsx(Title, { level: 5, className: "app-sidebar-brand-text", children: "BTN" }), _jsx("span", { className: "app-sidebar-brand-sub", children: "Business Trust Network" })] }))] }), _jsx(Menu, { mode: "inline", selectedKeys: [selectedKey], items: menuItems })] }), _jsxs(Layout, { className: "app-layout-main", children: [_jsxs(Header, { className: "app-layout-header", style: { padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx(Button, { type: "text", icon: collapsed ? _jsx(MenuUnfoldOutlined, {}) : _jsx(MenuFoldOutlined, {}), onClick: () => setCollapsed(!collapsed) }), _jsxs(Space, { children: [_jsx(Button, { type: "text", icon: theme === 'dark' ? _jsx(BulbFilled, {}) : _jsx(BulbOutlined, {}), onClick: toggleTheme }), _jsx(Dropdown, { menu: { items: userMenuItems }, children: _jsx(Avatar, { style: { backgroundColor: token.colorPrimary }, children: user?.fullName?.charAt(0) }) })] })] }), _jsx(Content, { style: { margin: screens.xs ? 12 : 24 }, children: children })] })] }));
};
