import type { LeadRow } from '../pages/Leads/leadSalesTypes';

export const LEAD_SALES_DEMO_ROWS: LeadRow[] = [
  {
    id: 'demo-1',
    customerName: 'Priya Sharma',
    city: 'Pune',
    productInterest: 'Solar 5kW rooftop',
    verificationStatus: 'Verified',
    saleStatus: 'Available',
    listPrice: 1200,
    assignedEmployeeId: 'demo-emp',
    isDemo: true,
  },
  {
    id: 'demo-2',
    customerName: 'Rahul Verma',
    city: 'Jaipur',
    productInterest: 'Home loan inquiry',
    verificationStatus: 'Verified',
    saleStatus: 'NotForSale',
    listPrice: 850,
    isDemo: true,
  },
  {
    id: 'demo-3',
    customerName: 'Anita Desai',
    city: 'Mumbai',
    productInterest: 'CRM software demo',
    verificationStatus: 'Verified',
    saleStatus: 'NotForSale',
    isDemo: true,
  },
  {
    id: 'demo-4',
    customerName: 'Vikram Singh',
    city: 'Delhi',
    productInterest: 'EV charger install',
    verificationStatus: 'Verified',
    saleStatus: 'Sold',
    listPrice: 1500,
    isDemo: true,
  },
  {
    id: 'demo-5',
    customerName: 'Sneha Patel',
    city: 'Ahmedabad',
    productInterest: 'Health insurance family plan',
    verificationStatus: 'Verified',
    saleStatus: 'Available',
    listPrice: 650,
    isDemo: true,
  },
];

export const LEAD_SALES_DEMO_EMPLOYEES = [
  { id: 'demo-emp-1', fullName: 'Amit Verification Agent' },
  { id: 'demo-emp-2', fullName: 'Kavita Lead Specialist' },
];
