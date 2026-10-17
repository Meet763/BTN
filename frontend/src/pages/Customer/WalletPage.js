import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, InputNumber, Row, Space, Statistic, Table, Tag, Typography, message, } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, CreditCardOutlined, WalletOutlined, } from '@ant-design/icons';
import { axiosInstance } from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';
import { isRazorpayCheckoutEnabled, openRazorpayCheckout } from '../../utils/razorpay';
const { Title, Text, Paragraph } = Typography;
const QUICK_AMOUNTS = [500, 1000, 2000, 5000];
export const WalletPage = () => {
    const { user } = useAuth();
    const [wallet, setWallet] = useState(null);
    const [txns, setTxns] = useState([]);
    const [amount, setAmount] = useState(500);
    const [loading, setLoading] = useState(false);
    const [paying, setPaying] = useState(false);
    const load = async () => {
        setLoading(true);
        try {
            const [w, t] = await Promise.all([
                axiosInstance.get('/api/wallet'),
                axiosInstance.get('/api/wallet/transactions', { params: { pageSize: 50 } }),
            ]);
            setWallet(w.data.data);
            setTxns(t.data.data.items);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        load();
    }, []);
    const confirmTopUp = async (order, providerPaymentId) => {
        await axiosInstance.post('/api/wallet/confirm-top-up', {
            paymentOrderId: order.paymentOrderId,
            providerPaymentId,
            idempotencyKey: providerPaymentId,
        });
        message.success('Wallet credited successfully');
        await load();
    };
    const simulateTestPayment = async () => {
        if (amount < 100) {
            message.warning('Minimum top-up is ₹100');
            return;
        }
        setPaying(true);
        try {
            const orderRes = await axiosInstance.post('/api/wallet/top-up', { amount });
            const order = orderRes.data.data;
            await confirmTopUp(order, `test_pay_${Date.now()}`);
        }
        catch (e) {
            const err = e;
            message.error(err.response?.data?.error || 'Top-up failed');
        }
        finally {
            setPaying(false);
        }
    };
    const payWithRazorpay = async () => {
        if (amount < 100) {
            message.warning('Minimum top-up is ₹100');
            return;
        }
        setPaying(true);
        try {
            const orderRes = await axiosInstance.post('/api/wallet/top-up', { amount });
            const order = orderRes.data.data;
            const keyId = order.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
            if (!isRazorpayCheckoutEnabled(keyId)) {
                message.info('Razorpay keys not configured — using sandbox simulation.');
                await confirmTopUp(order, `sim_${Date.now()}`);
                return;
            }
            await openRazorpayCheckout({
                keyId: keyId,
                amountMinor: order.amountMinor,
                currency: order.currency,
                providerOrderId: order.providerOrderId,
                customerName: user?.fullName,
                email: user?.email,
                onSuccess: async (paymentId) => {
                    try {
                        await confirmTopUp(order, paymentId);
                    }
                    catch {
                        message.error('Payment received but wallet confirm failed. Contact support with payment ID.');
                    }
                    finally {
                        setPaying(false);
                    }
                },
                onDismiss: () => setPaying(false),
            });
        }
        catch (e) {
            const err = e;
            message.error(err.response?.data?.error || err.message || 'Could not start payment');
            setPaying(false);
        }
    };
    const razorpayReady = isRazorpayCheckoutEnabled(import.meta.env.VITE_RAZORPAY_KEY_ID);
    return (_jsxs(Space, { direction: "vertical", size: "large", style: { width: '100%' }, children: [_jsxs("div", { children: [_jsxs(Title, { level: 3, style: { margin: 0 }, children: [_jsx(WalletOutlined, {}), " eWallet"] }), _jsx(Text, { type: "secondary", children: "Add money via Razorpay (test/live). Purchases deduct from this balance." })] }), _jsxs(Row, { gutter: [16, 16], children: [_jsx(Col, { xs: 24, md: 10, children: _jsxs(Card, { bordered: false, style: { borderRadius: 12, boxShadow: 'var(--card-shadow)' }, children: [_jsx(Statistic, { title: "Available balance", prefix: "\u20B9", value: wallet?.balance ?? 0, precision: 2, valueStyle: { color: 'var(--primary-color)', fontSize: 36 } }), _jsxs(Text, { type: "secondary", children: ["Currency: ", wallet?.currency || 'INR'] })] }) }), _jsx(Col, { xs: 24, md: 14, children: _jsxs(Card, { title: "Add money", bordered: false, style: { borderRadius: 12, boxShadow: 'var(--card-shadow)' }, children: [_jsx(Paragraph, { type: "secondary", style: { marginBottom: 12 }, children: "Choose amount, then pay with Razorpay Checkout or use dev simulation when keys are placeholders." }), _jsx(Space, { wrap: true, style: { marginBottom: 16 }, children: QUICK_AMOUNTS.map((a) => (_jsxs(Button, { type: amount === a ? 'primary' : 'default', onClick: () => setAmount(a), children: ["\u20B9", a] }, a))) }), _jsxs(Space, { wrap: true, align: "center", children: [_jsx(InputNumber, { min: 100, step: 100, value: amount, onChange: (v) => setAmount(v || 100), addonBefore: "\u20B9", style: { width: 160 } }), _jsx(Button, { type: "primary", icon: _jsx(CreditCardOutlined, {}), loading: paying, onClick: () => void payWithRazorpay(), children: "Pay with Razorpay" }), _jsx(Button, { loading: paying, onClick: () => void simulateTestPayment(), children: "Simulate (dev)" })] }), !razorpayReady && (_jsx(Alert, { style: { marginTop: 16 }, type: "info", showIcon: true, message: "Test mode", description: "Set Razorpay:KeyId in API appsettings or VITE_RAZORPAY_KEY_ID for real checkout. Until then, use Simulate." }))] }) })] }), _jsx(Card, { title: "Transaction history", loading: loading, children: _jsx(Table, { rowKey: "id", dataSource: txns, pagination: { pageSize: 10 }, scroll: { x: true }, columns: [
                        {
                            title: 'Type',
                            dataIndex: 'type',
                            render: (type) => type === 'Credit' ? (_jsx(Tag, { icon: _jsx(ArrowDownOutlined, {}), color: "success", children: "Credit" })) : (_jsx(Tag, { icon: _jsx(ArrowUpOutlined, {}), color: "error", children: "Debit" })),
                        },
                        {
                            title: 'Amount',
                            render: (_, r) => (_jsxs(Text, { strong: true, style: { color: r.type === 'Credit' ? '#389e0d' : '#cf1322' }, children: [r.type === 'Credit' ? '+' : '-', "\u20B9", (r.amountMinor / 100).toFixed(2)] })),
                        },
                        {
                            title: 'Balance after',
                            render: (_, r) => `₹${(r.balanceAfter / 100).toFixed(2)}`,
                        },
                        { title: 'Description', dataIndex: 'description', ellipsis: true },
                        {
                            title: 'Date',
                            dataIndex: 'createdAt',
                            render: (d) => new Date(d).toLocaleString(),
                        },
                    ] }) })] }));
};
