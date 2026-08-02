export const getHomeRouteForRole = (role: string): string => {
  switch (role) {
    case 'Customer':
      return '/customer/marketplace';
    case 'PlatformOwner':
      return '/dashboard';
    case 'Employee':
    case 'VerificationAgent':
      return '/verification';
    default:
      return '/dashboard';
  }
};
