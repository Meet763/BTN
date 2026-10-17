import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spin } from 'antd';
import { AccessDeniedPage } from '../pages/Public/AccessDeniedPage';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Loading BTN platform..." />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <AccessDeniedPage />;
};
