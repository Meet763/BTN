import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spin } from 'antd';
import { AccessDeniedPage } from '../pages/Public/AccessDeniedPage';
export const ProtectedRoute = () => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) {
        return (_jsx("div", { style: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }, children: _jsx(Spin, { size: "large", tip: "Loading BTN platform..." }) }));
    }
    return isAuthenticated ? _jsx(Outlet, {}) : _jsx(AccessDeniedPage, {});
};
