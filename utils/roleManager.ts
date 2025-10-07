// Role management utilities for Lovitti Agro Mart

export type UserRole = 'FARMER' | 'BUYER' | 'DISTRIBUTOR' | 'TRANSPORTER' | 'VETERINARIAN' | 'ADMIN';

export interface RolePermissions {
  canAccessDashboard: (role: UserRole, dashboard: string) => boolean;
  canCreateListings: (role: UserRole) => boolean;
  canManageOrders: (role: UserRole) => boolean;
  canAccessAnalytics: (role: UserRole) => boolean;
  canManageUsers: (role: UserRole) => boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  FARMER: {
    canAccessDashboard: (role, dashboard) => dashboard === 'farmer' || dashboard === 'admin',
    canCreateListings: () => true,
    canManageOrders: () => true,
    canAccessAnalytics: () => true,
    canManageUsers: () => false,
  },
  BUYER: {
    canAccessDashboard: (role, dashboard) => dashboard === 'buyer' || dashboard === 'admin',
    canCreateListings: () => false,
    canManageOrders: () => true,
    canAccessAnalytics: () => true,
    canManageUsers: () => false,
  },
  DISTRIBUTOR: {
    canAccessDashboard: (role, dashboard) => dashboard === 'distributor' || dashboard === 'admin',
    canCreateListings: () => true,
    canManageOrders: () => true,
    canAccessAnalytics: () => true,
    canManageUsers: () => false,
  },
  TRANSPORTER: {
    canAccessDashboard: (role, dashboard) => dashboard === 'transporter' || dashboard === 'admin',
    canCreateListings: () => false,
    canManageOrders: () => true,
    canAccessAnalytics: () => true,
    canManageUsers: () => false,
  },
  VETERINARIAN: {
    canAccessDashboard: (role, dashboard) => dashboard === 'agro-vet' || dashboard === 'admin',
    canCreateListings: () => true,
    canManageOrders: () => true,
    canAccessAnalytics: () => true,
    canManageUsers: () => false,
  },
  ADMIN: {
    canAccessDashboard: () => true,
    canCreateListings: () => true,
    canManageOrders: () => true,
    canAccessAnalytics: () => true,
    canManageUsers: () => true,
  },
};

export const getRolePermissions = (role: UserRole): RolePermissions => {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.FARMER;
};

export const canAccessDashboard = (userRole: UserRole, dashboardPath: string): boolean => {
  const permissions = getRolePermissions(userRole);
  const dashboard = dashboardPath.replace('/dashboard/', '');
  return permissions.canAccessDashboard(userRole, dashboard);
};

export const getAvailableDashboards = (userRole: UserRole) => {
  const dashboards = [
    { name: 'Farmer Dashboard', path: '/dashboard/farmer', roles: ['FARMER', 'ADMIN'] },
    { name: 'Buyer Dashboard', path: '/dashboard/buyer', roles: ['BUYER', 'ADMIN'] },
    { name: 'Distributor Dashboard', path: '/dashboard/distributor', roles: ['DISTRIBUTOR', 'ADMIN'] },
    { name: 'Transporter Dashboard', path: '/dashboard/transporter', roles: ['TRANSPORTER', 'ADMIN'] },
    { name: 'Agro Expert Dashboard', path: '/dashboard/agro-vet', roles: ['VETERINARIAN', 'ADMIN'] },
  ];

  return dashboards.filter(dashboard => dashboard.roles.includes(userRole));
};

export const getRoleDisplayName = (role: UserRole): string => {
  const displayNames: Record<UserRole, string> = {
    FARMER: 'Farmer',
    BUYER: 'Buyer',
    DISTRIBUTOR: 'Distributor',
    TRANSPORTER: 'Transporter',
    VETERINARIAN: 'Agro Expert',
    ADMIN: 'Administrator',
  };

  return displayNames[role] || 'User';
};

export const getRoleDescription = (role: UserRole): string => {
  const descriptions: Record<UserRole, string> = {
    FARMER: 'Agricultural producer who grows and sells crops, livestock, and other farm products',
    BUYER: 'Individual or business that purchases agricultural products from farmers and distributors',
    DISTRIBUTOR: 'Supply chain intermediary who manages inventory and connects farmers with buyers',
    TRANSPORTER: 'Logistics provider who handles transportation and delivery of agricultural products',
    VETERINARIAN: 'Agricultural expert who sells products, leases equipment, and provides expert advice',
    ADMIN: 'Platform administrator with full access to all features and user management',
  };

  return descriptions[role] || 'Platform user';
};

export const getRoleColor = (role: UserRole): { text: string; bg: string } => {
  const colors: Record<UserRole, { text: string; bg: string }> = {
    FARMER: { text: 'text-green-600', bg: 'bg-green-100' },
    BUYER: { text: 'text-blue-600', bg: 'bg-blue-100' },
    DISTRIBUTOR: { text: 'text-purple-600', bg: 'bg-purple-100' },
    TRANSPORTER: { text: 'text-orange-600', bg: 'bg-orange-100' },
    VETERINARIAN: { text: 'text-red-600', bg: 'bg-red-100' },
    ADMIN: { text: 'text-gray-600', bg: 'bg-gray-100' },
  };

  return colors[role] || colors.FARMER;
};

export const getRoleIcon = (role: UserRole): string => {
  const icons: Record<UserRole, string> = {
    FARMER: 'Package',
    BUYER: 'ShoppingCart',
    DISTRIBUTOR: 'Package',
    TRANSPORTER: 'Truck',
    VETERINARIAN: 'Stethoscope',
    ADMIN: 'Shield',
  };

  return icons[role] || 'User';
};
