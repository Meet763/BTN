import React, { useEffect, useMemo, useState } from 'react';
import { Card, Drawer, Input, Space, Table, Tag, Tree, Typography } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { axiosInstance } from '../../api/axiosConfig';

interface HierarchyNode {
  employeeId: string;
  fullName: string;
  email: string;
  jobTitle?: string;
  orgUnitName?: string;
  orgUnitCode?: string;
  isActive: boolean;
  openLeadCount: number;
  children: HierarchyNode[];
}

interface UnderCard {
  employeeId: string;
  fullName: string;
  email: string;
  jobTitle?: string;
  orgUnitName?: string;
  orgUnitCode?: string;
  isActive: boolean;
  openLeadCount: number;
}

const toTreeData = (nodes: HierarchyNode[]): DataNode[] =>
  nodes.map((n) => ({
    key: n.employeeId,
    title: (
      <Space wrap>
        <span>{n.fullName}</span>
        {n.jobTitle && <Tag>{n.jobTitle}</Tag>}
        {n.orgUnitCode && <Tag color="blue">{n.orgUnitCode}</Tag>}
        <Typography.Text type="secondary">({n.openLeadCount} open)</Typography.Text>
      </Space>
    ),
    children: n.children?.length ? toTreeData(n.children) : undefined,
  }));

export const HierarchyExplorerPage: React.FC = () => {
  const [tree, setTree] = useState<HierarchyNode[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<HierarchyNode | null>(null);
  const [under, setUnder] = useState<UnderCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get('/api/hierarchy/tree');
        setTree(res.data.data || []);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const filteredTree = useMemo(() => {
    if (!search.trim()) return tree;
    const q = search.toLowerCase();
    const filterNodes = (nodes: HierarchyNode[]): HierarchyNode[] =>
      nodes
        .map((n) => {
          const children = filterNodes(n.children || []);
          const match =
            n.fullName.toLowerCase().includes(q) ||
            (n.orgUnitCode || '').toLowerCase().includes(q) ||
            (n.orgUnitName || '').toLowerCase().includes(q) ||
            (n.jobTitle || '').toLowerCase().includes(q);
          if (match || children.length) return { ...n, children };
          return null;
        })
        .filter(Boolean) as HierarchyNode[];
    return filterNodes(tree);
  }, [tree, search]);

  const openUnder = async (employeeId: string) => {
    const find = (nodes: HierarchyNode[]): HierarchyNode | null => {
      for (const n of nodes) {
        if (n.employeeId === employeeId) return n;
        const c = find(n.children || []);
        if (c) return c;
      }
      return null;
    };
    setSelected(find(tree));
    const res = await axiosInstance.get(`/api/hierarchy/under/${employeeId}`);
    setUnder(res.data.data || []);
    setDrawerOpen(true);
  };

  return (
    <Card title="Hierarchy Explorer" loading={loading}>
      <Input.Search
        placeholder="Search by name / product code"
        allowClear
        style={{ maxWidth: 360, marginBottom: 16 }}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Tree
        showLine
        defaultExpandAll
        treeData={toTreeData(filteredTree)}
        onSelect={(keys) => {
          if (keys[0]) void openUnder(String(keys[0]));
        }}
      />

      <Drawer
        title={selected ? `People under ${selected.fullName}` : 'Team'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={720}
      >
        <Table
          rowKey="employeeId"
          dataSource={under}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: 'No people under this user' }}
          columns={[
            { title: 'Name', dataIndex: 'fullName' },
            { title: 'Job title', dataIndex: 'jobTitle', render: (t) => <Tag>{t}</Tag> },
            { title: 'Product', dataIndex: 'orgUnitCode', render: (c) => (c ? <Tag color="blue">{c}</Tag> : '—') },
            { title: 'Open leads', dataIndex: 'openLeadCount' },
            {
              title: 'Status',
              dataIndex: 'isActive',
              render: (v) => <Tag color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</Tag>,
            },
          ]}
        />
      </Drawer>
    </Card>
  );
};
