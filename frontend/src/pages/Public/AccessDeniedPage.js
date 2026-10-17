import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AccessDeniedPage.css';
export const AccessDeniedPage = () => {
    useEffect(() => {
        const previous = document.title;
        document.title = 'Access denied';
        return () => {
            document.title = previous;
        };
    }, []);
    return (_jsxs("div", { className: "denied-shell", children: [_jsx("p", { className: "denied-code", children: "403" }), _jsx("h1", { children: "Access denied" }), _jsx("p", { className: "denied-copy", children: "You don\u2019t have access to this page. If you were claiming a gift, go back to the form. Staff can sign in with an account." }), _jsxs("div", { className: "denied-actions", children: [_jsx(Link, { className: "denied-primary", to: "/gift", children: "Gift form" }), _jsx(Link, { className: "denied-secondary", to: "/login", children: "Sign in" })] })] }));
};
