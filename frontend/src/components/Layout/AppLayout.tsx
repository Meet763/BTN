import React, { useEffect, useState } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Space, Typography, theme as antTheme, Grid } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UserOutlined,
  FileProtectOutlined,
  LogoutOutlined,
  BulbOutlined,
  BulbFilled,
  TeamOutlined,
  ShopOutlined,
  WalletOutlined,
  FileTextOutlined,
  DollarOutlined,
  UsergroupAddOutlined,
  FormOutlined,
  ApartmentOutlined,
  ClusterOutlined,
  GiftOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const screens = Grid.useBreakpoint();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, companyName, logout } = useAuth();
  const role = user?.role;
  const { theme, toggleTheme } = useTheme();
  const { token } = antTheme.useToken();

  useEffect(() => {
    if (!screens.lg) setCollapsed(true);
  }, [screens.lg]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: (
        <div style={{ padding: '4px 12px' }}>
          <Text strong>{user?.fullName}</Text>
          <br />
          <Text type="secondary">{user?.role}</Text>
        </div>
      ),
    },
    ...(role === 'Customer' ? [{ key: 'settings', icon: <SettingOutlined />, label: <Link to="/customer/settings">Account Settings</Link> }] : []),
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Sign Out', onClick: handleLogout },
  ];

  const menuItems: { key: string; icon: React.ReactNode; label: React.ReactNode }[] = [];
  if (role === 'PlatformOwner') {
    menuItems.push(
      { key: '/dashboard', icon: <DashboardOutlined />, label: <Link to="/dashboard">Dashboard</Link> },
      { key: '/users', icon: <UserOutlined />, label: <Link to="/users">Users</Link> },
      { key: '/employees', icon: <TeamOutlined />, label: <Link to="/employees">Employees</Link> },
      { key: '/admin/org-units', icon: <ApartmentOutlined />, label: <Link to="/admin/org-units">Org Products</Link> },
      { key: '/admin/hierarchy', icon: <ClusterOutlined />, label: <Link to="/admin/hierarchy">Hierarchy</Link> },
      { key: '/my-team', icon: <TeamOutlined />, label: <Link to="/my-team">My Team</Link> },
      { key: '/customers', icon: <UsergroupAddOutlined />, label: <Link to="/customers">Customers</Link> },
      { key: '/verification', icon: <FileProtectOutlined />, label: <Link to="/verification">Verification</Link> },
      { key: '/leads/advertise', icon: <FormOutlined />, label: <Link to="/leads/advertise">Gift form links</Link> },
      { key: '/campaign/submissions', icon: <GiftOutlined />, label: <Link to="/campaign/submissions">Gift submissions</Link> },
      { key: '/forms', icon: <FileTextOutlined />, label: <Link to="/forms">Forms</Link> },
      { key: '/leads/sales', icon: <DollarOutlined />, label: <Link to="/leads/sales">Lead sales</Link> },
    );
  } else if (role === 'Employee' || role === 'VerificationAgent') {
    menuItems.push(
      { key: '/verification', icon: <FileProtectOutlined />, label: <Link to="/verification">My Leads</Link> },
      { key: '/my-team', icon: <TeamOutlined />, label: <Link to="/my-team">My Team</Link> },
      { key: '/customers', icon: <UsergroupAddOutlined />, label: <Link to="/customers">Customers</Link> },
      { key: '/my-work', icon: <TeamOutlined />, label: <Link to="/my-work">My work</Link> },
    );
  } else if (role === 'Customer') {
    menuItems.push(
      { key: '/customer/marketplace', icon: <ShopOutlined />, label: <Link to="/customer/marketplace">Marketplace</Link> },
      { key: '/customer/wallet', icon: <WalletOutlined />, label: <Link to="/customer/wallet">Wallet</Link> },
      { key: '/customer/purchases', icon: <FileProtectOutlined />, label: <Link to="/customer/purchases">Purchases</Link> },
      { key: '/customer/billing', icon: <FileTextOutlined />, label: <Link to="/customer/billing">Billing</Link> },
    );
  } else {
    menuItems.push({ key: '/dashboard', icon: <DashboardOutlined />, label: <Link to="/dashboard">Dashboard</Link> });
  }

  const selectedKey =
    menuItems.find((m) => location.pathname === m.key || location.pathname.startsWith(`${m.key}/`))?.key ??
    location.pathname;

  return (
    <Layout style={{ minHeight: '100vh' }} className="app-layout-root">
      <Sider
        className="app-layout-sider"
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
        breakpoint="lg"
        collapsedWidth={screens.md ? 80 : 0}
      >
        <div className={`app-sidebar-brand ${collapsed ? 'app-sidebar-brand--collapsed' : ''}`}>
          <div className="app-sidebar-brand-mark" aria-hidden title="Business Trust Network">
            {collapsed ? (role === 'Customer' ? (companyName?.charAt(0).toUpperCase() || 'C') : 'B') : (role === 'Customer' ? (companyName || 'Your Company') : 'BTN')}
          </div>
          {!collapsed && (
            <div>
              <Title level={5} className="app-sidebar-brand-text">
                {role === 'Customer' ? (companyName || 'Your Company') : 'BTN'}
              </Title>
              <span className="app-sidebar-brand-sub">{role === 'Customer' ? 'Customer workspace' : 'Business Trust Network'}</span>
            </div>
          )}
        </div>
        <Menu mode="inline" selectedKeys={[selectedKey]} items={menuItems} />
      </Sider>
      <Layout className="app-layout-main">
        <Header className="app-layout-header" style={{ padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} />
          <Space>
            <Button type="text" icon={theme === 'dark' ? <BulbFilled /> : <BulbOutlined />} onClick={toggleTheme} />
            <Dropdown menu={{ items: userMenuItems }}>
              <Avatar style={{ backgroundColor: token.colorPrimary }}>{user?.fullName?.charAt(0)}</Avatar>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: screens.xs ? 12 : 24 }}>{children}</Content>
      </Layout>
    </Layout>
  );
};
