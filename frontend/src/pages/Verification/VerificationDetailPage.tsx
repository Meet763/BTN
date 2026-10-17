import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Descriptions,
  Tag,
  Button,
  Form,
  Select,
  Checkbox,
  InputNumber,
  Input,
  Modal,
  Spin,
  Space,
  Typography,
  message,
  Divider,
  DatePicker,
} from 'antd';
import {
  ArrowLeftOutlined,
  PhoneOutlined,
  CheckOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { axiosInstance } from '../../api/axiosConfig';
import { LeadProfileEditor } from '../../components/Leads/LeadProfileEditor';

const { Text, Paragraph } = Typography;
const { Option } = Select;

interface VerificationRecord {
  leadId: string;
  verifiedByUser: string;
  verificationMethod?: string;
  isPhoneValid: boolean;
  isRequirementReal: boolean;
  intentLevel: string;
  isLocationServiceable: boolean;
  callAttempted: boolean;
  callConnected: boolean;
  callDurationSeconds?: number;
  callNotes?: string;
  result: string;
  rejectionReason?: string;
  createdAt: string;
  inquiryType?: string;
  productOrService?: string;
  inquiryDetails?: string;
  customerRequirements?: string;
  budgetAmount?: number;
  timeline?: string;
  contactOutcome?: string;
  followUpAt?: string;
  remarks?: string;
  additionalNotes?: string;
}

interface LeadDetail {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  source: string;
  productInterest?: string;
  rawData?: any;
  verificationStatus: string;
  verifiedByUser?: string;
  verifiedAt?: string;
  isDuplicate: boolean;
  duplicateOfLeadId?: string;
  createdAt: string;
  inquiryType?: string;
  inquiryDetails?: string;
  customerRequirements?: string;
  budgetAmount?: number;
  budgetCurrency?: string;
  timeline?: string;
  contactOutcome?: string;
  followUpAt?: string;
  remarks?: string;
  workflowStatus?: string;
  saleStatus?: string;
  verification?: VerificationRecord;
}

export const VerificationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Rejection modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const [methods, setMethods] = useState<{ code: string; displayName: string }[]>([]);
  const [history, setHistory] = useState<VerificationRecord[]>([]);
  const [assignmentHistory, setAssignmentHistory] = useState<
    { assignedAt: string; employeeName: string; reason?: string }[]
  >([]);
  const [statusHistory, setStatusHistory] = useState<
    { fromStatus: string; toStatus: string; changedBy: string; changedAt: string; note?: string }[]
  >([]);

  const buildPayload = (values: any, result: 'Verified' | 'Rejected', rejectionReason?: string) => ({
    verificationMethodCode: values.verificationMethodCode || 'PhoneCall',
    inquiryType: values.inquiryType,
    productOrService: values.productOrService,
    inquiryDetails: values.inquiryDetails,
    customerRequirements: values.customerRequirements,
    budgetAmount: values.budgetAmount,
    timeline: values.timeline,
    contactOutcome: values.contactOutcome,
    followUpAt: values.followUpAt ? new Date(values.followUpAt).toISOString() : undefined,
    remarks: values.remarks,
    additionalNotes: values.additionalNotes,
    isPhoneValid: values.isPhoneValid === 'true',
    isRequirementReal: values.isRequirementReal === 'true',
    intentLevel: values.intentLevel,
    isLocationServiceable: values.isLocationServiceable === 'true',
    callAttempted: values.callAttempted || false,
    callConnected: values.callConnected || false,
    callDurationSeconds: values.callDurationSeconds || 0,
    callNotes: values.callNotes,
    result,
    rejectionReason,
  });

  const fetchLeadDetail = async () => {
    setLoading(true);
    try {
      const [leadRes, historyRes, methodsRes, assignRes, statusRes] = await Promise.all([
        axiosInstance.get(`/api/leads/${id}`),
        axiosInstance.get(`/api/leads/${id}/verifications`),
        axiosInstance.get('/api/leads/verification-methods'),
        axiosInstance.get(`/api/leads/${id}/assignment-history`),
        axiosInstance.get(`/api/leads/${id}/status-history`),
      ]);
      if (leadRes.data.success) setLead(leadRes.data.data);
      if (historyRes.data.success) setHistory(historyRes.data.data);
      if (methodsRes.data.success) setMethods(methodsRes.data.data);
      if (assignRes.data.success) setAssignmentHistory(assignRes.data.data);
      if (statusRes.data.success) setStatusHistory(statusRes.data.data);
    } catch {
      message.error('Failed to load lead verification workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadDetail();
  }, [id]);

  const handleVerify = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      
      const response = await axiosInstance.post(`/api/leads/${id}/verifications`, buildPayload(values, 'Verified'));

      if (response.data.success) {
        message.success('Lead verified successfully.');
        navigate('/verification');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to submit verification form.';
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRejectModal = async () => {
    try {
      // Validate fields first before asking for rejection reason
      await form.validateFields();
      setRejectModalVisible(true);
    } catch (e) {
      message.error('Please fill out the verification questions before rejecting.');
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      message.error('Please enter a rejection reason.');
      return;
    }

    try {
      const values = form.getFieldsValue();
      setSubmitting(true);
      setRejectModalVisible(false);

      const response = await axiosInstance.post(`/api/leads/${id}/verifications`, buildPayload(values, 'Rejected', rejectionReason));

      if (response.data.success) {
        message.success('Lead rejected successfully.');
        navigate('/verification');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to reject lead.';
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="Loading verification detail..." />
      </div>
    );
  }

  if (!lead) return null;

  const isPending = lead.verificationStatus === 'Pending';

  return (
    <div>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/verification')} 
        style={{ marginBottom: '24px' }}
      >
        Back to Directory
      </Button>

      <Row gutter={[24, 24]}>
        {/* Left Side: Lead Info */}
        <Col xs={24} lg={12}>
          <Card 
            title="📋 Lead Information Profile" 
            bordered={false} 
            style={{ borderRadius: '12px', boxShadow: 'var(--card-shadow)' }}
          >
            <Descriptions column={1} bordered size="middle">
              <Descriptions.Item label="Customer Name">
                <Text strong>{lead.customerName}</Text>
                {lead.isDuplicate && <Tag color="red" style={{ marginLeft: 8 }}>Duplicate</Tag>}
              </Descriptions.Item>
              
              <Descriptions.Item label="Phone Number">
                <Space>
                  <Text copyable strong>{lead.phone}</Text>
                  <Button 
                    type="primary" 
                    shape="circle" 
                    icon={<PhoneOutlined />} 
                    href={`tel:${lead.phone}`}
                    size="small"
                  />
                </Space>
              </Descriptions.Item>
              
              <Descriptions.Item label="Email Address">{lead.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="Gift / shipping address" span={2}>{lead.address || '-'}</Descriptions.Item>
              <Descriptions.Item label="City">{lead.city || '-'}</Descriptions.Item>
              <Descriptions.Item label="State">{lead.state || '-'}</Descriptions.Item>
              <Descriptions.Item label="Pincode">{lead.pincode || '-'}</Descriptions.Item>
              <Descriptions.Item label="Lead Source">
                <Tag color="blue">{lead.source}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Product Interest">{lead.productInterest || '-'}</Descriptions.Item>
              {(lead.inquiryType || lead.inquiryDetails) && (
                <>
                  <Descriptions.Item label="Inquiry type">{lead.inquiryType || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Inquiry details">{lead.inquiryDetails || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Requirements">{lead.customerRequirements || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Budget">
                    {lead.budgetAmount != null ? `₹${lead.budgetAmount}` : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Timeline">{lead.timeline || '-'}</Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="Workflow">
                <Tag>{lead.workflowStatus || 'Created'}</Tag>
                {lead.saleStatus && <Tag color="blue">{lead.saleStatus}</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Ingestion Date">
                <Space><CalendarOutlined /><Text>{new Date(lead.createdAt).toLocaleString()}</Text></Space>
              </Descriptions.Item>
            </Descriptions>

            {lead.rawData && (
              <div style={{ marginTop: '20px' }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
                  <DatabaseOutlined /> Raw Metadata
                </Text>
                <pre style={{ 
                  padding: '12px', 
                  borderRadius: '8px', 
                  backgroundColor: 'var(--bg-color)', 
                  border: '1px solid var(--border-color)',
                  overflowX: 'auto',
                  maxHeight: '150px',
                  fontSize: '12px'
                }}>
                  {JSON.stringify(lead.rawData, null, 2)}
                </pre>
              </div>
            )}
            <LeadProfileEditor lead={lead} onUpdated={fetchLeadDetail} />
          </Card>
        </Col>

        {/* Right Side: Verification Action / Log Detail */}
        <Col xs={24} lg={12}>
          {isPending ? (
            /* Pending: Display input verification form */
            <Card 
              title="Verification workspace" 
              bordered={false} 
              style={{ borderRadius: '12px', boxShadow: 'var(--card-shadow)' }}
            >
              <Form 
                form={form} 
                layout="vertical" 
                initialValues={{ 
                  verificationMethodCode: 'PhoneCall',
                  isPhoneValid: 'true', 
                  isRequirementReal: 'true',
                  isLocationServiceable: 'true',
                  intentLevel: 'Serious',
                  callAttempted: true,
                  callConnected: true,
                  productOrService: lead.productInterest,
                  inquiryType: lead.inquiryType,
                  inquiryDetails: lead.inquiryDetails,
                  customerRequirements: lead.customerRequirements,
                  budgetAmount: lead.budgetAmount,
                  timeline: lead.timeline,
                }}
              >
                <Divider titlePlacement="start" plain>Method & inquiry</Divider>
                <Form.Item name="verificationMethodCode" label="Verification method" rules={[{ required: true }]}>
                  <Select>
                    {methods.map((m) => (
                      <Option key={m.code} value={m.code}>{m.displayName}</Option>
                    ))}
                  </Select>
                </Form.Item>
                <Row gutter={16}>
                  <Col span={12}><Form.Item name="inquiryType" label="Inquiry Type"><Input /></Form.Item></Col>
                  <Col span={12}><Form.Item name="productOrService" label="Product/Service"><Input /></Form.Item></Col>
                </Row>
                <Form.Item name="inquiryDetails" label="Inquiry Details"><Input.TextArea rows={2} /></Form.Item>
                <Form.Item name="customerRequirements" label="Customer Requirements"><Input.TextArea rows={2} /></Form.Item>
                <Row gutter={16}>
                  <Col span={12}><Form.Item name="budgetAmount" label="Budget"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                  <Col span={12}><Form.Item name="timeline" label="Timeline"><Input /></Form.Item></Col>
                </Row>

                <Divider titlePlacement="start" plain>Qualification</Divider>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item 
                      name="isPhoneValid" 
                      label="Is phone number valid?" 
                      rules={[{ required: true }]}
                    >
                      <Select>
                        <Option value="true">Yes</Option>
                        <Option value="false">No (Fake Number)</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item 
                      name="isRequirementReal" 
                      label="Is Requirement Genuine?" 
                      rules={[{ required: true }]}
                    >
                      <Select>
                        <Option value="true">Yes</Option>
                        <Option value="false">No (No Requirement)</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item 
                      name="intentLevel" 
                      label="Customer Intent Level" 
                      rules={[{ required: true }]}
                    >
                      <Select>
                        <Option value="Serious">🔥 Serious Buyer</Option>
                        <Option value="Exploring">🔍 Just Exploring</Option>
                        <Option value="NotInterested">💤 Not Interested</Option>
                        <Option value="Fake">⚠️ Fake Lead</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item 
                      name="isLocationServiceable" 
                      label="Location Serviceable?" 
                      rules={[{ required: true }]}
                    >
                      <Select>
                        <Option value="true">Yes</Option>
                        <Option value="false">No (Out of Area)</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Divider titlePlacement="start" plain>Call log</Divider>
                <Row gutter={16} style={{ marginBottom: '16px' }}>
                  <Col span={12}>
                    <Form.Item name="callAttempted" valuePropName="checked" noStyle>
                      <Checkbox>Call Attempted?</Checkbox>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="callConnected" valuePropName="checked" noStyle>
                      <Checkbox>Call Connected?</Checkbox>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item 
                  name="callDurationSeconds" 
                  label="Call Duration (Seconds)"
                  rules={[{ type: 'number', min: 0 }]}
                >
                  <InputNumber style={{ width: '100%' }} placeholder="E.g., 90" />
                </Form.Item>

                <Form.Item 
                  name="callNotes" 
                  label="Agent call notes"
                  rules={[{ required: true, message: 'Please write call notes!' }]}
                >
                  <Input.TextArea rows={4} placeholder="Summarize customer requirement, budget, delivery location details..." />
                </Form.Item>

                <Divider titlePlacement="start" plain>Outcome</Divider>
                <Form.Item name="contactOutcome" label="Contact outcome"><Input /></Form.Item>
                <Form.Item name="remarks" label="Remarks"><Input.TextArea rows={2} /></Form.Item>
                <Form.Item name="additionalNotes" label="Additional notes"><Input.TextArea rows={2} /></Form.Item>
                <Form.Item name="followUpAt" label="Follow-up date">
                  <DatePicker showTime style={{ width: '100%' }} />
                </Form.Item>

                <Space size="large" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                  <Button 
                    danger 
                    size="large" 
                    icon={<CloseOutlined />} 
                    onClick={handleOpenRejectModal}
                    loading={submitting}
                  >
                    Reject Lead
                  </Button>
                  <Button 
                    type="primary" 
                    size="large" 
                    icon={<CheckOutlined />} 
                    onClick={handleVerify}
                    loading={submitting}
                    style={{ backgroundColor: 'var(--success-color)' }}
                  >
                    Verify & Approve
                  </Button>
                </Space>
              </Form>
            </Card>
          ) : (
            /* Processed: Display read-only verification details */
            <Card 
              title={
                <Space>
                  <span>Verification Results Summary</span>
                  <Tag color={lead.verificationStatus === 'Verified' ? 'green' : 'red'}>
                    {lead.verificationStatus}
                  </Tag>
                </Space>
              }
              bordered={false} 
              style={{ borderRadius: '12px', boxShadow: 'var(--card-shadow)' }}
            >
              {lead.verification ? (
                <Descriptions column={1} bordered size="middle">
                  {lead.verification.verificationMethod && (
                    <Descriptions.Item label="Method">{lead.verification.verificationMethod}</Descriptions.Item>
                  )}
                  <Descriptions.Item label="Processed By">
                    <Space><UserOutlined /><Text strong>{lead.verification.verifiedByUser}</Text></Space>
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="Processed On">
                    <Space><CalendarOutlined /><Text>{new Date(lead.verification.createdAt).toLocaleString()}</Text></Space>
                  </Descriptions.Item>

                  <Descriptions.Item label="Phone Valid?">
                    {lead.verification.isPhoneValid ? <Tag color="green">Yes</Tag> : <Tag color="red">No</Tag>}
                  </Descriptions.Item>

                  <Descriptions.Item label="Genuine Need?">
                    {lead.verification.isRequirementReal ? <Tag color="green">Yes</Tag> : <Tag color="red">No</Tag>}
                  </Descriptions.Item>

                  <Descriptions.Item label="Customer Intent">
                    <Tag color="orange">{lead.verification.intentLevel}</Tag>
                  </Descriptions.Item>

                  <Descriptions.Item label="Location Serviceable?">
                    {lead.verification.isLocationServiceable ? <Tag color="green">Yes</Tag> : <Tag color="red">No</Tag>}
                  </Descriptions.Item>

                  <Descriptions.Item label="Call Connected?">
                    {lead.verification.callConnected ? <Tag color="green">Yes</Tag> : <Tag color="red">No</Tag>}
                  </Descriptions.Item>

                  <Descriptions.Item label="Call Duration">
                    <Space><ClockCircleOutlined /><Text>{lead.verification.callDurationSeconds || 0} seconds</Text></Space>
                  </Descriptions.Item>

                  {lead.verification.rejectionReason && (
                    <Descriptions.Item label="Rejection Reason">
                      <Text type="danger" strong>{lead.verification.rejectionReason}</Text>
                    </Descriptions.Item>
                  )}

                  <Descriptions.Item label="Agent Work Notes">
                    <Paragraph style={{ margin: 0, whiteSpace: 'pre-line' }}>{lead.verification.callNotes || '-'}</Paragraph>
                  </Descriptions.Item>
                  {lead.verification.inquiryType && (
                    <Descriptions.Item label="Inquiry type">{lead.verification.inquiryType}</Descriptions.Item>
                  )}
                  {lead.verification.budgetAmount != null && (
                    <Descriptions.Item label="Budget">₹{lead.verification.budgetAmount}</Descriptions.Item>
                  )}
                  {lead.verification.contactOutcome && (
                    <Descriptions.Item label="Contact outcome">{lead.verification.contactOutcome}</Descriptions.Item>
                  )}
                  {lead.verification.followUpAt && (
                    <Descriptions.Item label="Follow-up">
                      {new Date(lead.verification.followUpAt).toLocaleString()}
                    </Descriptions.Item>
                  )}
                  {lead.verification.remarks && (
                    <Descriptions.Item label="Remarks">{lead.verification.remarks}</Descriptions.Item>
                  )}
                </Descriptions>
              ) : (
                <Text type="secondary">Lead was marked as {lead.verificationStatus} directly, no phone call logs found.</Text>
              )}
            </Card>
          )}
        </Col>
      </Row>

      {statusHistory.length > 0 && (
        <Card title="Status history" style={{ marginTop: 24 }}>
          {statusHistory.map((s) => (
            <div key={s.changedAt + s.toStatus} style={{ marginBottom: 12 }}>
              <Tag>
                {s.fromStatus} → {s.toStatus}
              </Tag>
              {new Date(s.changedAt).toLocaleString()} — {s.changedBy}
              {s.note ? ` — ${s.note}` : ''}
            </div>
          ))}
        </Card>
      )}

      {assignmentHistory.length > 0 && (
        <Card title="Lead assignment history" style={{ marginTop: 24 }}>
          {assignmentHistory.map((a) => (
            <div key={a.assignedAt + a.employeeName} style={{ marginBottom: 12 }}>
              <Tag color="blue">{a.employeeName}</Tag>
              {new Date(a.assignedAt).toLocaleString()}
              {a.reason ? ` — ${a.reason}` : ''}
            </div>
          ))}
        </Card>
      )}

      {history.length > 0 && (
        <Card title="Verification History" style={{ marginTop: 24 }}>
          {history.map((h) => (
            <div key={h.leadId + h.createdAt} style={{ marginBottom: 12 }}>
              <Tag>{h.result}</Tag> {new Date(h.createdAt).toLocaleString()} — {h.callNotes || 'No notes'}
            </div>
          ))}
        </Card>
      )}

      {/* Reject Modal dialog */}
      <Modal
        title="⚠️ Reject Lead Verification"
        open={rejectModalVisible}
        onOk={handleRejectSubmit}
        onCancel={() => setRejectModalVisible(false)}
        okText="Confirm Rejection"
        okButtonProps={{ danger: true }}
      >
        <div style={{ margin: '16px 0' }}>
          <Text>Please provide a reason for rejecting this lead. This help keep advertisers informed.</Text>
        </div>
        <Form.Item label="Rejection Reason" required>
          <Input 
            placeholder="E.g., Number not reachable after 3 attempts / Wrong number" 
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </Form.Item>
      </Modal>
    </div>
  );
};
