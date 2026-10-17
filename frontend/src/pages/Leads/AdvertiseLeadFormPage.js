import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Input, Space, Typography, message } from 'antd';
import { CopyOutlined, GiftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { axiosInstance } from '../../api/axiosConfig';
import { useFeedback } from '../../context/FeedbackContext';
import '../Public/GiftCampaignPage.css';
import './AdvertiseLeadFormPage.css';
import { DEFAULT_GIFT_APPEARANCE, GIFT_THEME_PRESETS, giftThemeCssVars, resolveGiftAppearance, } from '../Public/giftFormThemes';
const { Title, Paragraph, Text } = Typography;
const PLATFORMS = [
    { id: 'instagram', label: 'Instagram' },
    { id: 'facebook', label: 'Facebook' },
    { id: 'twitter', label: 'X / Twitter' },
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'youtube', label: 'YouTube' },
    { id: 'google', label: 'Google' },
    { id: 'website', label: 'Website' },
];
const readAppearance = (payload) => {
    const root = payload;
    const data = (root?.data ?? root);
    return resolveGiftAppearance(data);
};
const readApiError = (err) => {
    const ax = err;
    if (ax.response?.data?.error)
        return ax.response.data.error;
    if (ax.response?.status === 404) {
        return 'The API does not have this endpoint yet. Restart BTN.API so the new code and migration load.';
    }
    if (!ax.response) {
        return 'Cannot reach the API. Start BTN.API (dotnet run in backend/src/BTN.API), then try again.';
    }
    return ax.response.data?.title || ax.message || `Request failed (${ax.response.status})`;
};
export const AdvertiseLeadFormPage = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const feedback = useFeedback();
    const [copied, setCopied] = useState('');
    const [draft, setDraft] = useState(DEFAULT_GIFT_APPEARANCE);
    const [saved, setSaved] = useState(DEFAULT_GIFT_APPEARANCE);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const resolvedDraft = useMemo(() => resolveGiftAppearance(draft), [draft]);
    const previewVars = useMemo(() => giftThemeCssVars(resolvedDraft), [resolvedDraft]);
    const dirty = draft.themeKey !== saved.themeKey ||
        draft.backgroundColor !== saved.backgroundColor ||
        draft.accentColor !== saved.accentColor ||
        draft.ctaColor !== saved.ctaColor;
    useEffect(() => {
        let cancelled = false;
        axiosInstance
            .get('/api/campaign-form-appearance')
            .then((res) => {
            const next = readAppearance(res.data);
            if (!cancelled) {
                setDraft(next);
                setSaved(next);
            }
        })
            .catch((err) => {
            if (!cancelled) {
                feedback.error('Could not load form look', readApiError(err));
            }
        })
            .finally(() => {
            if (!cancelled)
                setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [feedback]);
    const links = useMemo(() => PLATFORMS.map((p) => ({
        ...p,
        url: `${origin}/gift/${p.id}?campaign=BTN%20Gift%20Campaign`,
    })), [origin]);
    const copy = async (url, id) => {
        await navigator.clipboard.writeText(url);
        setCopied(id);
        message.success('Link copied — paste it in your bio or story');
    };
    const selectTheme = (key) => {
        if (key === 'custom') {
            setDraft((prev) => ({
                themeKey: 'custom',
                backgroundColor: prev.backgroundColor,
                accentColor: prev.accentColor,
                ctaColor: prev.ctaColor,
            }));
            return;
        }
        const preset = GIFT_THEME_PRESETS.find((p) => p.key === key);
        if (!preset)
            return;
        setDraft({
            themeKey: preset.key,
            backgroundColor: preset.background,
            accentColor: preset.accent,
            ctaColor: preset.cta,
        });
    };
    const saveLook = async () => {
        setSaving(true);
        try {
            const res = await axiosInstance.put('/api/campaign-form-appearance', resolvedDraft);
            const next = readAppearance(res.data);
            setDraft(next);
            setSaved(next);
            message.success('Gift form look saved. Customers will see this on /gift.');
        }
        catch (err) {
            feedback.error('Could not save form look', readApiError(err));
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsxs(Card, { children: [_jsxs(Space, { align: "start", size: 12, style: { marginBottom: 8 }, children: [_jsx(GiftOutlined, { style: { fontSize: 22 } }), _jsxs("div", { children: [_jsx(Title, { level: 4, style: { margin: 0 }, children: "Gift campaign form" }), _jsx(Paragraph, { type: "secondary", style: { margin: '4px 0 0' }, children: "Public, mobile-first form (one question per screen). Attach a platform link on Instagram, Twitter, or WhatsApp. Submissions appear under Gift submissions, with the platform saved for filtering." })] })] }), _jsx(Title, { level: 5, style: { marginTop: 8 }, children: "Form look" }), _jsx(Paragraph, { type: "secondary", style: { marginTop: 0 }, children: "Only you can change this. Customers on /gift always see the last saved look \u2014 not a draft." }), _jsxs("div", { className: "gift-theme-grid", children: [GIFT_THEME_PRESETS.map((preset) => {
                        const selected = draft.themeKey === preset.key;
                        return (_jsxs("button", { type: "button", className: `gift-theme-card${selected ? ' is-selected' : ''}`, onClick: () => selectTheme(preset.key), disabled: loading, children: [_jsxs("span", { className: "gift-theme-swatches", "aria-hidden": true, children: [_jsx("span", { style: { background: preset.background } }), _jsx("span", { style: { background: preset.accent } }), _jsx("span", { style: { background: preset.cta } })] }), _jsx("strong", { children: preset.name }), _jsx("span", { children: preset.blurb })] }, preset.key));
                    }), _jsxs("button", { type: "button", className: `gift-theme-card${draft.themeKey === 'custom' ? ' is-selected' : ''}`, onClick: () => selectTheme('custom'), disabled: loading, children: [_jsxs("span", { className: "gift-theme-swatches", "aria-hidden": true, children: [_jsx("span", { style: { background: draft.backgroundColor } }), _jsx("span", { style: { background: draft.accentColor } }), _jsx("span", { style: { background: draft.ctaColor } })] }), _jsx("strong", { children: "Custom" }), _jsx("span", { children: "Pick background, accent, and button colors for your brand." })] })] }), draft.themeKey === 'custom' && (_jsxs("div", { className: "gift-theme-custom", children: [_jsxs("label", { children: ["Background", _jsx("input", { type: "color", value: resolvedDraft.backgroundColor, onChange: (e) => setDraft((prev) => ({ ...prev, themeKey: 'custom', backgroundColor: e.target.value })) })] }), _jsxs("label", { children: ["Accent", _jsx("input", { type: "color", value: resolvedDraft.accentColor, onChange: (e) => setDraft((prev) => ({ ...prev, themeKey: 'custom', accentColor: e.target.value })) })] }), _jsxs("label", { children: ["Button", _jsx("input", { type: "color", value: resolvedDraft.ctaColor, onChange: (e) => setDraft((prev) => ({ ...prev, themeKey: 'custom', ctaColor: e.target.value })) })] })] })), _jsxs("div", { className: "gift-shell gift-theme-preview", "data-theme": resolvedDraft.themeKey, style: previewVars, children: [_jsx("div", { className: "gift-glow" }), _jsx("p", { className: "gift-kicker", children: "Live preview" }), _jsx("h1", { className: "gift-hero-title", children: "Claim your complimentary gift" }), _jsx("p", { className: "gift-hero-copy", children: "Tell us where to send it. Takes about a minute." }), _jsx("button", { className: "gift-cta", type: "button", children: "Start" })] }), _jsxs(Space, { style: { marginTop: 16 }, wrap: true, children: [_jsx(Button, { type: "primary", onClick: () => void saveLook(), loading: saving, disabled: loading || !dirty, children: "Save look" }), _jsx(Button, { href: "/gift", target: "_blank", children: "Preview form" }), dirty ? (_jsx(Text, { type: "warning", children: "Unsaved \u2014 customers still see the previous look." })) : (_jsx(Text, { type: "secondary", children: "Saved look is live on /gift." }))] }), _jsxs(Paragraph, { style: { marginTop: 28 }, children: ["Base link:", ' ', _jsxs(Text, { code: true, copyable: true, children: [origin, "/gift"] })] }), _jsxs(Paragraph, { type: "secondary", children: ["Add ", _jsx(Text, { code: true, children: "?src=instagram" }), " or use ", _jsx(Text, { code: true, children: "/gift/instagram" }), ". Also accepts", ' ', _jsx(Text, { code: true, children: "utm_source" }), " and ", _jsx(Text, { code: true, children: "campaign" }), "."] }), _jsx(Space, { direction: "vertical", size: 10, style: { width: '100%', marginTop: 8 }, children: links.map((link) => (_jsx(Input, { value: link.url, readOnly: true, addonBefore: link.label, addonAfter: _jsx(Button, { type: "text", size: "small", icon: _jsx(CopyOutlined, {}), onClick: () => void copy(link.url, link.id), children: copied === link.id ? 'Copied' : 'Copy' }) }, link.id))) }), _jsxs(Space, { style: { marginTop: 20 }, children: [_jsx(Button, { type: "primary", href: "/gift/instagram", target: "_blank", children: "Preview Instagram form" }), _jsx(Link, { to: "/campaign/submissions", children: _jsx(Button, { children: "View submissions" }) })] })] }));
};
