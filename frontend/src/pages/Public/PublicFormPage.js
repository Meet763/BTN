import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../api/apiBase';
import { GiftPicker } from '../../components/GiftPicker';
import { WORLD_COUNTRIES, WORLD_STATES } from '../../data/worldStates';
import { DEFAULT_GIFT_APPEARANCE, giftThemeCssVars, resolveGiftAppearance } from './giftFormThemes';
import './GiftCampaignPage.css';
const youtubeId = (url) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/i);
    return match?.[1] ?? '';
};
export const PublicFormPage = () => {
    const { slug = '' } = useParams();
    const [appearance, setAppearance] = useState(DEFAULT_GIFT_APPEARANCE);
    const [missing, setMissing] = useState(false);
    const [meta, setMeta] = useState({ name: '', introTitle: '', introBody: '', submitLabel: 'Submit' });
    const [fields, setFields] = useState([]);
    const [phase, setPhase] = useState('intro');
    const [step, setStep] = useState(0);
    const [values, setValues] = useState({});
    const [files, setFiles] = useState({});
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [honeypot, setHoneypot] = useState('');
    const themeVars = useMemo(() => giftThemeCssVars(appearance), [appearance]);
    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/public/campaign/appearance`).then((res) => {
            setAppearance(resolveGiftAppearance(res.data?.data));
        }).catch(() => setAppearance(DEFAULT_GIFT_APPEARANCE));
    }, []);
    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/public/forms/${slug}`).then((res) => {
            const data = res.data?.data;
            setMeta({
                name: data.name,
                introTitle: data.introTitle,
                introBody: data.introBody,
                submitLabel: data.submitLabel || 'Submit',
            });
            setFields(data.fields || []);
            document.title = data.name || 'Form';
        }).catch(() => setMissing(true));
    }, [slug]);
    const current = fields[step];
    const progress = fields.length ? ((step + 1) / fields.length) * 100 : 0;
    const validate = (field) => {
        const value = (values[field.fieldKey] || '').trim();
        if (field.fieldType === 'youtube')
            return '';
        if (field.fieldType === 'document') {
            return field.isRequired && !files[field.fieldKey] ? 'Upload a file to continue.' : '';
        }
        if (!value)
            return field.isRequired ? 'This answer is required.' : '';
        if (field.fieldType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
            return 'Enter a valid email address.';
        if (field.fieldType === 'phone') {
            const digits = value.replace(/\D/g, '');
            if (digits.length < 7 || digits.length > 15)
                return 'Enter a phone number with 7 to 15 digits.';
        }
        if (field.fieldType === 'number') {
            const number = Number(value);
            if (Number.isNaN(number))
                return 'Enter a number.';
            if (field.validation?.min != null && number < field.validation.min)
                return `Must be at least ${field.validation.min}.`;
            if (field.validation?.max != null && number > field.validation.max)
                return `Must be at most ${field.validation.max}.`;
        }
        if (field.fieldType === 'videoLink' && !youtubeId(value))
            return 'Paste a YouTube video link.';
        if (field.fieldType === 'website' && !/^https?:\/\//i.test(value))
            return 'Start the link with https://.';
        const min = field.validation?.minLength;
        const max = field.validation?.maxLength;
        if (min && value.length < min)
            return `Use at least ${min} characters.`;
        if (max && value.length > max)
            return `Use ${max} characters or fewer.`;
        return '';
    };
    const goNext = async () => {
        if (!current)
            return;
        const message = validate(current);
        if (message) {
            setError(message);
            return;
        }
        setError('');
        if (step < fields.length - 1) {
            setStep((index) => index + 1);
            return;
        }
        await submit();
    };
    const submit = async () => {
        setSaving(true);
        try {
            const body = new FormData();
            body.append('answers', JSON.stringify(values));
            body.append('website', honeypot);
            Object.entries(files).forEach(([key, file]) => body.append(key, file));
            await axios.post(`${API_BASE_URL}/api/public/forms/${slug}`, body);
            setPhase('done');
        }
        catch (error) {
            const message = error.response?.data?.error;
            setError(message || 'Could not submit. Please try again.');
        }
        finally {
            setSaving(false);
        }
    };
    const setValue = (key, value) => {
        setValues((prev) => ({ ...prev, [key]: value }));
        if (error)
            setError('');
    };
    return (_jsxs("div", { className: "gift-shell", style: themeVars, children: [_jsx("div", { className: "gift-glow" }), phase === 'form' && (_jsx("div", { className: "gift-progress", children: _jsx("div", { className: "gift-progress-bar", style: { width: `${progress}%` } }) })), _jsx("header", { className: "gift-top", children: _jsx("span", { className: "gift-from", children: meta.name || 'Form' }) }), missing && (_jsxs("main", { className: "gift-stage", children: [_jsx("h1", { className: "gift-hero-title", children: "This form is not available" }), _jsx("p", { className: "gift-hero-copy", children: "It may still be a draft, or the link is wrong." })] })), !missing && phase === 'intro' && (_jsxs("main", { className: "gift-stage", children: [_jsx("h1", { className: "gift-hero-title", children: meta.introTitle || 'Tell us a little about you' }), _jsx("p", { className: "gift-hero-copy", children: meta.introBody }), _jsx("button", { className: "gift-cta", type: "button", disabled: !fields.length, onClick: () => setPhase('form'), children: "Start" })] })), !missing && phase === 'form' && current && (_jsxs("main", { className: "gift-stage gift-stage-field", children: [_jsxs("p", { className: "gift-kicker", children: [step + 1, " of ", fields.length] }), _jsx("h1", { className: "gift-question", children: current.label }), current.hint && _jsx("p", { className: "gift-hint", children: current.hint }), _jsx(FieldControl, { field: current, value: values[current.fieldKey] || '', file: files[current.fieldKey], onChange: (value) => setValue(current.fieldKey, value), onFile: (file) => {
                            setFiles((prev) => ({ ...prev, [current.fieldKey]: file }));
                            if (error)
                                setError('');
                        }, onEnter: () => void goNext() }), _jsx("input", { className: "gift-honeypot", tabIndex: -1, autoComplete: "off", value: honeypot, onChange: (event) => setHoneypot(event.target.value), "aria-hidden": "true" }), error && _jsx("p", { className: "gift-error", children: error }), _jsxs("div", { className: "gift-actions", children: [_jsx("button", { className: "gift-back", type: "button", disabled: saving, onClick: () => {
                                    setError('');
                                    if (step === 0)
                                        setPhase('intro');
                                    else
                                        setStep((index) => index - 1);
                                }, children: "Back" }), !current.isRequired && current.fieldType !== 'youtube' && (_jsx("button", { className: "gift-skip", type: "button", disabled: saving, onClick: () => {
                                    setError('');
                                    if (step < fields.length - 1)
                                        setStep((index) => index + 1);
                                    else
                                        void submit();
                                }, children: "Skip" })), _jsx("button", { className: "gift-cta", type: "button", disabled: saving, onClick: () => void goNext(), children: saving ? 'Sending…' : step === fields.length - 1 ? meta.submitLabel : 'Continue' })] })] })), phase === 'done' && (_jsxs("main", { className: "gift-stage", children: [_jsx("div", { className: "gift-done-icon", "aria-hidden": true, children: "\u2713" }), _jsx("h1", { className: "gift-hero-title", children: "Received" }), _jsx("p", { className: "gift-hero-copy", children: "Thanks. You can close this page." })] }))] }));
};
const FieldControl = ({ field, value, file, onChange, onFile, onEnter }) => {
    if (field.fieldType === 'state') {
        return (_jsx(GiftPicker, { searchable: true, value: value, placeholder: field.placeholder || 'Search for your state', searchPlaceholder: "Search state or country", emptyHint: "Type a state, province, or country.", options: WORLD_STATES, onChange: onChange }));
    }
    if (field.fieldType === 'country') {
        return (_jsx(GiftPicker, { searchable: true, value: value, placeholder: field.placeholder || 'Search for your country', searchPlaceholder: "Search countries", emptyHint: "Type a country name.", options: WORLD_COUNTRIES.map((country) => ({ value: country, label: country })), onChange: onChange }));
    }
    if (field.fieldType === 'dropdown') {
        return (_jsx(GiftPicker, { searchable: field.options.length > 8, value: value, placeholder: field.placeholder || 'Select an option', options: field.options.filter(Boolean).map((option) => ({ value: option, label: option })), onChange: onChange }));
    }
    if (field.fieldType === 'yesNo') {
        return (_jsx(GiftPicker, { value: value, placeholder: "Select an option", options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], onChange: onChange }));
    }
    if (field.fieldType === 'checkbox') {
        return (_jsxs("label", { className: "gift-consent", children: [_jsx("input", { type: "checkbox", checked: value === 'yes', onChange: (event) => onChange(event.target.checked ? 'yes' : '') }), _jsx("span", { children: "Yes, I confirm" })] }));
    }
    if (field.fieldType === 'youtube') {
        const id = youtubeId(field.settings?.youtubeUrl || '');
        return id ? (_jsx("iframe", { className: "gift-video", src: `https://www.youtube.com/embed/${id}`, title: field.label, allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture", allowFullScreen: true })) : (_jsx("p", { className: "gift-hint", children: "This video is not available." }));
    }
    if (field.fieldType === 'document') {
        return (_jsxs(_Fragment, { children: [_jsx("input", { className: "gift-file", type: "file", onChange: (event) => {
                        const next = event.target.files?.[0];
                        if (next)
                            onFile(next);
                    } }), file && _jsx("p", { className: "gift-hint", children: file.name })] }));
    }
    if (field.fieldType === 'note' || field.fieldType === 'address') {
        return (_jsx("textarea", { className: "gift-textarea", value: value, placeholder: field.placeholder, onChange: (event) => onChange(event.target.value) }));
    }
    const inputType = field.fieldType === 'email' ? 'email' : field.fieldType === 'date' ? 'date' : field.fieldType === 'number' ? 'number' : 'text';
    return (_jsx("input", { className: "gift-input", value: value, type: inputType, inputMode: field.fieldType === 'phone' || field.fieldType === 'postalCode' ? 'numeric' : field.fieldType === 'number' ? 'decimal' : undefined, placeholder: field.placeholder, onChange: (event) => onChange(event.target.value), onKeyDown: (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                onEnter();
            }
        } }));
};
