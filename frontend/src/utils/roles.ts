export const isPlatformOwner = (role?: string) => role === 'PlatformOwner';
export const isEmployeeRole = (role?: string) =>
  role === 'Employee' || role === 'VerificationAgent';
export const isCustomerRole = (role?: string) => role === 'Customer';
