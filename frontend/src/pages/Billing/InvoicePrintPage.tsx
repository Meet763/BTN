import React, { useEffect, useState } from 'react';
import { Button, Card } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { axiosInstance } from '../../api/axiosConfig';

export const InvoicePrintPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);

  useEffect(() => {
    axiosInstance.get(`/api/billing/invoices/${id}`).then((res) => setInvoice(res.data.data));
  }, [id]);

  if (!invoice) return null;

  return (
    <Card>
      <div className="invoice-print">
        {invoice.organization?.logoUrl && <img src={invoice.organization.logoUrl} alt="logo" style={{ maxHeight: 64 }} />}
        <h2>{invoice.organization?.legalName}</h2>
        <p>{invoice.organization?.address}</p>
        <h3>Invoice {invoice.invoiceNumber}</h3>
        <p>Bill To: {invoice.customer?.name}</p>
        <table style={{ width: '100%', marginTop: 16 }}>
          <thead>
            <tr><th align="left">Description</th><th>Qty</th><th>Price</th><th>Total</th></tr>
          </thead>
          <tbody>
            {invoice.lines?.map((l: any, idx: number) => (
              <tr key={idx}>
                <td>{l.description}</td>
                <td align="center">{l.quantity}</td>
                <td align="right">₹{l.unitPrice}</td>
                <td align="right">₹{l.lineTotal}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3 style={{ textAlign: 'right' }}>Total: ₹{invoice.totalAmount}</h3>
      </div>
      <Button style={{ marginTop: 16 }} onClick={() => window.print()}>Print</Button>
      <Button style={{ marginTop: 16, marginLeft: 8 }} onClick={() => navigate(-1)}>Back</Button>
    </Card>
  );
};
