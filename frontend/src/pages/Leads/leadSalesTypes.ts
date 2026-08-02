export interface LeadRow {
  id: string;
  customerName: string;
  city?: string;
  productInterest?: string;
  verificationStatus: string;
  saleStatus?: string;
  listPrice?: number;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  isDemo?: boolean;
}

export interface EmployeeOption {
  id: string;
  fullName: string;
}
