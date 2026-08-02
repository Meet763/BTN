import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography } from 'antd';
import { MailOutlined, LockOutlined, BulbOutlined, BulbFilled } from '@ant-design/icons';
import { useNavigate, Navigate } from 'react-router-dom';
import { getHomeRouteForRole } from '../../utils/roleHome';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const { Title, Text, Link } = Typography;

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // If already authenticated, redirect directly to dashboard
  if (isAuthenticated && user) {
    return <Navigate to={getHomeRouteForRole(user.role)} replace />;
  }

  const onFinish = async (values: any) => {
    setLoading(true);
    const userData = await login(values.email, values.password);
    setLoading(false);
    if (userData) {
      navigate(getHomeRouteForRole(userData.role));
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: theme === 'dark' 
          ? 'radial-gradient(circle at 10% 20%, rgb(15, 23, 42) 0%, rgb(30, 41, 59) 90.1%)'
          : 'radial-gradient(circle at 10% 20%, rgb(241, 245, 249) 0%, rgb(226, 232, 240) 90.1%)',
        position: 'relative',
        padding: '20px',
      }}
    >
      {/* Theme Toggle Top Right */}
      <div style={{ position: 'absolute', top: 24, right: 24 }}>
        <Button
          type="text"
          icon={theme === 'dark' ? <BulbFilled style={{ color: '#faad14' }} /> : <BulbOutlined />}
          onClick={toggleTheme}
          style={{ fontSize: '18px' }}
        />
      </div>

      <Card
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '420px',
          boxShadow: 'var(--card-shadow)',
          borderRadius: '16px',
        }}
        bodyStyle={{ padding: '40px 32px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1677ff, #3b82f6)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '24px',
              marginBottom: '16px',
              boxShadow: '0 8px 16px rgba(22, 119, 255, 0.25)',
            }}
          >
            B
          </div>
          <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
            Welcome Back
          </Title>
          <Text type="secondary">Business Trust Network — Verification Portal</Text>
        </div>

        <Form name="login_form" layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email address!' },
            ]}
          >
            <Input prefix={<MailOutlined style={{ color: 'var(--text-secondary)' }} />} placeholder="Email address" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'var(--text-secondary)' }} />}
              placeholder="Password"
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '13px' }}>
            <Link onClick={() => alert('Please contact system administrator to reset password.')}>
              Forgot password?
            </Link>
          </div>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ height: '45px', fontWeight: 600 }}>
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
