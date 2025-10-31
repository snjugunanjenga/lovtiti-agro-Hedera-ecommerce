// Define the roles your application uses
export type UserRole = 'buyer' | 'farmer' | 'admin' | 'logistics_provider' | 'warehouse_manager';

export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    buyer: 'Buyer',
    farmer: 'Farmer',
    admin: 'Administrator',
    logistics_provider: 'Logistics Provider',
    warehouse_manager: 'Warehouse Manager'
  };
  return displayNames[role] || role;
}

export function getRolePermissions(role: UserRole): string[] {
  const permissions: Record<UserRole, string[]> = {
    buyer: ['view_products', 'place_orders'],
    farmer: ['manage_products', 'view_orders', 'manage_inventory'],
    admin: ['manage_users', 'manage_roles', 'view_all', 'manage_all'],
    logistics_provider: ['view_orders', 'manage_deliveries'],
    warehouse_manager: ['manage_inventory', 'view_orders']
  };
  return permissions[role] || [];
}

export function getRoleColor(role: UserRole): string {
  const roleColours: Record<UserRole, string> = {
    buyer: 'blue',
    farmer: 'green',
    admin: 'red',
    logistics_provider: 'orange',
    warehouse_manager: 'purple'
  };
  return roleColours[role] || 'gray';
}

export async function updateUserRole(role: UserRole) {
  const normalizedRole = role.toUpperCase();
  const response = await fetch('/api/auth/assign-role', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ role: normalizedRole }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || 'Failed to update user role');
  }

  return response.json();
}
