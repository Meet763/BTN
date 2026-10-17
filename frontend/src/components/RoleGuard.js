import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
export const RoleGuard = ({ allowedRoles, children }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    if (!user || !allowedRoles.includes(user.role)) {
        return (_jsx("div", { style: { padding: '40px', background: 'var(--container-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', margin: '20px' }, children: _jsx(Result, { status: "403", title: "403", subTitle: "Sorry, you are not authorized to access this page.", extra: _jsx(Button, { type: "primary", onClick: () => navigate('/dashboard'), children: "Back Dashboard" }) }) }));
    }
    return _jsx(_Fragment, { children: children });
};
