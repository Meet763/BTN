import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useMemo, useState } from 'react';
import { Card, Drawer, Input, Space, Table, Tag, Tree, Typography } from 'antd';
import { axiosInstance } from '../../api/axiosConfig';
const toTreeData = (nodes) => nodes.map((n) => ({
    key: n.employeeId,
    title: (_jsxs(Space, { wrap: true, children: [_jsx("span", { children: n.fullName }), n.jobTitle && _jsx(Tag, { children: n.jobTitle }), n.orgUnitCode && _jsx(Tag, { color: "blue", children: n.orgUnitCode }), _jsxs(Typography.Text, { type: "secondary", children: ["(", n.openLeadCount, " open)"] })] })),
    children: n.children?.length ? toTreeData(n.children) : undefined,
}));
export const HierarchyExplorerPage = () => {
    const [tree, setTree] = useState([]);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [under, setUnder] = useState([]);
    const [loading, setLoading] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await axiosInstance.get('/api/hierarchy/tree');
                setTree(res.data.data || []);
            }
            finally {
                setLoading(false);
            }
        };
        void load();
    }, []);
    const filteredTree = useMemo(() => {
        if (!search.trim())
            return tree;
        const q = search.toLowerCase();
        const filterNodes = (nodes) => nodes
            .map((n) => {
            const children = filterNodes(n.children || []);
            const match = n.fullName.toLowerCase().includes(q) ||
                (n.orgUnitCode || '').toLowerCase().includes(q) ||
                (n.orgUnitName || '').toLowerCase().includes(q) ||
                (n.jobTitle || '').toLowerCase().includes(q);
            if (match || children.length)
                return { ...n, children };
            return null;
        })
            .filter(Boolean);
        return filterNodes(tree);
    }, [tree, search]);
    const openUnder = async (employeeId) => {
        const find = (nodes) => {
            for (const n of nodes) {
                if (n.employeeId === employeeId)
                    return n;
                const c = find(n.children || []);
                if (c)
                    return c;
            }
            return null;
        };
        setSelected(find(tree));
        const res = await axiosInstance.get(`/api/hierarchy/under/${employeeId}`);
        setUnder(res.data.data || []);
        setDrawerOpen(true);
    };
    return (_jsxs(Card, { title: "Hierarchy Explorer", loading: loading, children: [_jsx(Input.Search, { placeholder: "Search by name / product code", allowClear: true, style: { maxWidth: 360, marginBottom: 16 }, onChange: (e) => setSearch(e.target.value) }), _jsx(Tree, { showLine: true, defaultExpandAll: true, treeData: toTreeData(filteredTree), onSelect: (keys) => {
                    if (keys[0])
                        void openUnder(String(keys[0]));
                } }), _jsx(Drawer, { title: selected ? `People under ${selected.fullName}` : 'Team', open: drawerOpen, onClose: () => setDrawerOpen(false), width: 720, children: _jsx(Table, { rowKey: "employeeId", dataSource: under, pagination: { pageSize: 8 }, locale: { emptyText: 'No people under this user' }, columns: [
                        { title: 'Name', dataIndex: 'fullName' },
                        { title: 'Job title', dataIndex: 'jobTitle', render: (t) => _jsx(Tag, { children: t }) },
                        { title: 'Product', dataIndex: 'orgUnitCode', render: (c) => (c ? _jsx(Tag, { color: "blue", children: c }) : '—') },
                        { title: 'Open leads', dataIndex: 'openLeadCount' },
                        {
                            title: 'Status',
                            dataIndex: 'isActive',
                            render: (v) => _jsx(Tag, { color: v ? 'green' : 'red', children: v ? 'Active' : 'Inactive' }),
                        },
                    ] }) })] }));
};
