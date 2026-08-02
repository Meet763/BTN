import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div style={{ padding: '40px', background: 'var(--container-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', margin: '20px' }}>
        <Result
          status="403"
          title="403"
          subTitle="Sorry, you are not authorized to access this page."
          extra={
            <Button type="primary" onClick={() => navigate('/dashboard')}>
              Back Dashboard
            </Button>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
};
