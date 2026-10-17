import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Spin } from 'antd';
import { useParams } from 'react-router-dom';
import { axiosInstance } from '../../api/axiosConfig';
export const CustomerLeadDetailPage = () => {
    const { id } = useParams();
    const [lead, setLead] = useState(null);
    useEffect(() => {
        axiosInstance.get(`/api/leads/${id}`).then((res) => setLead(res.data.data));
    }, [id]);
    if (!lead)
        return _jsx(Spin, {});
    return (_jsx(Card, { title: "Lead Details", children: _jsxs(Descriptions, { column: 1, bordered: true, children: [_jsx(Descriptions.Item, { label: "Name", children: lead.customerName }), _jsx(Descriptions.Item, { label: "Phone", children: lead.phone }), _jsx(Descriptions.Item, { label: "Email", children: lead.email || '-' }), _jsx(Descriptions.Item, { label: "City", children: lead.city }), _jsx(Descriptions.Item, { label: "Interest", children: lead.productInterest }), _jsx(Descriptions.Item, { label: "Requirements", children: lead.customerRequirements || '-' })] }) }));
};
