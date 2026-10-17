import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircleFilled, CloseCircleFilled, InfoCircleFilled, LoadingOutlined } from '@ant-design/icons';
import { registerFeedbackBridge } from '../utils/feedbackBridge';
const FeedbackContext = createContext(undefined);
let toastSeq = 0;
export const FeedbackProvider = ({ children }) => {
    const [activeRequests, setActiveRequests] = useState(0);
    const [toasts, setToasts] = useState([]);
    const timers = useRef({});
    const pushToast = useCallback((type, title, text, ttl = 2800) => {
        const id = ++toastSeq;
        setToasts((prev) => [...prev.slice(-4), { id, type, title, text }]);
        if (type !== 'loading' && ttl > 0) {
            timers.current[id] = window.setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
                delete timers.current[id];
            }, ttl);
        }
        return id;
    }, []);
    const startLoading = useCallback((title = 'Saving…') => {
        setActiveRequests((n) => n + 1);
        setToasts((prev) => {
            const withoutLoading = prev.filter((t) => t.type !== 'loading');
            const id = ++toastSeq;
            return [...withoutLoading, { id, type: 'loading', title }];
        });
    }, []);
    const stopLoading = useCallback(() => {
        setActiveRequests((n) => Math.max(0, n - 1));
        setToasts((prev) => prev.filter((t) => t.type !== 'loading'));
    }, []);
    const success = useCallback((title, text) => {
        setToasts((prev) => prev.filter((t) => t.type !== 'loading'));
        pushToast('success', title, text);
    }, [pushToast]);
    const error = useCallback((title, text) => {
        setToasts((prev) => prev.filter((t) => t.type !== 'loading'));
        pushToast('error', title, text, 4200);
    }, [pushToast]);
    const info = useCallback((title, text) => {
        pushToast('info', title, text);
    }, [pushToast]);
    const withLoading = useCallback(async (fn, loadingTitle = 'Saving…') => {
        startLoading(loadingTitle);
        try {
            const result = await fn();
            return result;
        }
        finally {
            stopLoading();
        }
    }, [startLoading, stopLoading]);
    const value = useMemo(() => ({ startLoading, stopLoading, success, error, info, withLoading }), [startLoading, stopLoading, success, error, info, withLoading]);
    useEffect(() => {
        registerFeedbackBridge({ startLoading, stopLoading, success, error });
        return () => registerFeedbackBridge(null);
    }, [startLoading, stopLoading, success, error]);
    const showBar = activeRequests > 0;
    return (_jsxs(FeedbackContext.Provider, { value: value, children: [children, _jsx("div", { className: `btn-top-loader ${showBar ? 'btn-top-loader--on' : ''}`, "aria-hidden": !showBar }), _jsx("div", { className: "btn-toast-stack", "aria-live": "polite", children: toasts.map((t) => (_jsxs("div", { className: `btn-toast btn-toast--${t.type}`, children: [_jsxs("span", { className: "btn-toast-icon", children: [t.type === 'success' && _jsx(CheckCircleFilled, {}), t.type === 'error' && _jsx(CloseCircleFilled, {}), t.type === 'info' && _jsx(InfoCircleFilled, {}), t.type === 'loading' && _jsx(LoadingOutlined, { spin: true })] }), _jsxs("div", { children: [_jsx("div", { className: "btn-toast-title", children: t.title }), t.text && _jsx("div", { className: "btn-toast-text", children: t.text })] })] }, t.id))) })] }));
};
export const useFeedback = () => {
    const ctx = useContext(FeedbackContext);
    if (!ctx)
        throw new Error('useFeedback must be used within FeedbackProvider');
    return ctx;
};
