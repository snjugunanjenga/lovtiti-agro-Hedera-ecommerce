import { UserRole } from './roleManager';

/**
 * Maps user roles to their respective dashboard paths
 */
export const getRoleDashboardPath = (role: UserRole | string | null | undefined): string => {
  if (!role) return '/dashboard/buyer'; // Default fallback

  const normalizedRole = (typeof role === 'string' ? role.toUpperCase() : role) as UserRole;

  const dashboardPaths: Record<UserRole, string> = {
    FARMER: '/dashboard/farmer',
    BUYER: '/dashboard/buyer',
    DISTRIBUTOR: '/dashboard/distributor',
    TRANSPORTER: '/dashboard/transporter',
    AGROEXPERT: '/dashboard/agro-vet',
    ADMIN: '/dashboard/admin'
  };

  return dashboardPaths[normalizedRole] || '/dashboard/buyer';
};

/**
 * Gets the user's role from Clerk metadata with fallback to database
 */
export const getUserRole = async (userId: string): Promise<string | null> => {
  try {
    const response = await fetch('/api/auth/sync-user', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch user role from database');
      return null;
    }

    const data = await response.json();
    return data.user?.role || null;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
};

/**
 * Gets the display name for a dashboard based on role
 */
export const getDashboardDisplayName = (role: UserRole | string | null): string => {
  if (!role) return 'Dashboard';

  const normalizedRole = (typeof role === 'string' ? role.toUpperCase() : role) as UserRole;

  const displayNames: Record<UserRole, string> = {
    FARMER: 'Farmer Dashboard',
    BUYER: 'Buyer Dashboard',
    DISTRIBUTOR: 'Distributor Dashboard',
    TRANSPORTER: 'Transporter Dashboard',
    AGROEXPERT: 'Agro Expert Dashboard',
    ADMIN: 'Admin Dashboard'
  };

  return displayNames[normalizedRole] || 'Dashboard';
};

/**
 * Checks if a role has access to a specific dashboard
 */
export const canAccessDashboard = (
  userRole: UserRole | string | null,
  dashboardRole: UserRole | string
): boolean => {
  if (!userRole) return false;

  const normalizedUserRole = (typeof userRole === 'string' ? userRole.toUpperCase() : userRole) as UserRole;
  const normalizedDashboardRole = (typeof dashboardRole === 'string' ? dashboardRole.toUpperCase() : dashboardRole) as UserRole;

  // Admins can access all dashboards
  if (normalizedUserRole === 'ADMIN') return true;

  // Users can access their own dashboard
  return normalizedUserRole === normalizedDashboardRole;
};
