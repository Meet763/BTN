import React, { useEffect, useState } from 'react';
import { Button, Card } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { axiosInstance } from '../../api/axiosConfig';

export const QuotationPrintPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<any>(null);

  useEffect(() => {
    axiosInstance.get(`/api/billing/quotations/${id}`).then((res) => setQuotation(res.data.data));
  }, [id]);

  if (!quotation) return null;

  return (
    <Card>
      <div className="invoice-print">
        {quotation.organization?.logoUrl && (
          <img src={quotation.organization.logoUrl} alt="logo" style={{ maxHeight: 64 }} />
        )}
        <h2>{quotation.organization?.legalName}</h2>
        <p>{quotation.organization?.address}</p>
        <h3>Quotation {quotation.quotationNumber}</h3>
        <p>To: {quotation.customer?.name}</p>
        {quotation.validUntil && <p>Valid until: {new Date(quotation.validUntil).toLocaleDateString()}</p>}
        <table style={{ width: '100%', marginTop: 16 }}>
          <thead>
            <tr>
              <th align="left">Description</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {quotation.lines?.map((l: any, idx: number) => (
              <tr key={idx}>
                <td>{l.description}</td>
                <td align="center">{l.quantity}</td>
                <td align="right">₹{l.unitPrice}</td>
                <td align="right">₹{l.lineTotal}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3 style={{ textAlign: 'right' }}>Total: ₹{quotation.totalAmount}</h3>
      </div>
      <Button style={{ marginTop: 16 }} onClick={() => window.print()}>
        Print
      </Button>
      <Button style={{ marginTop: 16, marginLeft: 8 }} onClick={() => navigate(-1)}>
        Back
      </Button>
    </Card>
  );
};
