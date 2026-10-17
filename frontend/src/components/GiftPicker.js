import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
export const GiftPicker = ({ value, placeholder, options, onChange, searchable = false, searchPlaceholder = 'Search', emptyHint = 'Type to search', }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const rootRef = useRef(null);
    const searchRef = useRef(null);
    const listId = useId();
    const selected = options.find((option) => option.value === value);
    const needsQuery = searchable && options.length > 40;
    const shown = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (needsQuery && q.length < 1)
            return [];
        const pool = q ? options.filter((option) => option.label.toLowerCase().includes(q)) : options;
        return pool.slice(0, needsQuery ? 40 : 80);
    }, [needsQuery, options, query]);
    useEffect(() => {
        if (!open)
            return;
        const onPointer = (event) => {
            if (!rootRef.current?.contains(event.target))
                setOpen(false);
        };
        document.addEventListener('mousedown', onPointer);
        const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 30);
        return () => {
            document.removeEventListener('mousedown', onPointer);
            window.clearTimeout(focusTimer);
        };
    }, [open]);
    return (_jsxs("div", { className: "gift-picker", ref: rootRef, children: [_jsxs("button", { type: "button", className: `gift-picker-trigger${selected ? '' : ' is-empty'}`, "aria-expanded": open, "aria-controls": listId, onClick: () => {
                    setOpen((current) => !current);
                    setQuery('');
                }, children: [_jsx("span", { children: selected?.label || placeholder }), _jsx("span", { className: "gift-picker-chevron", "aria-hidden": true })] }), open && (_jsxs("div", { className: "gift-picker-panel", id: listId, children: [searchable && (_jsx("input", { ref: searchRef, className: "gift-picker-search", value: query, placeholder: searchPlaceholder, onChange: (event) => setQuery(event.target.value) })), _jsxs("div", { className: "gift-picker-list", role: "listbox", children: [shown.length === 0 && _jsx("p", { className: "gift-picker-empty", children: needsQuery && !query.trim() ? emptyHint : 'No matches' }), shown.map((option) => (_jsx("button", { type: "button", role: "option", "aria-selected": option.value === value, className: `gift-picker-option${option.value === value ? ' is-selected' : ''}`, onClick: () => {
                                    onChange(option.value);
                                    setOpen(false);
                                    setQuery('');
                                }, children: option.label }, option.value)))] })] }))] }));
};
