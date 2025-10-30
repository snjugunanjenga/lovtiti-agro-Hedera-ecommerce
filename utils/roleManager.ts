import type { User } from '@clerk/nextjs/server'; // Use server type for safety, but it's a client object
import type { UserResource } from '@clerk/types';

// Define the roles your application uses (matching database schema)
export type UserRole = 'BUYER' | 'FARMER' | 'DISTRIBUTOR' | 'TRANSPORTER' | 'AGROEXPERT' | 'ADMIN';

export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    BUYER: 'Buyer',
    FARMER: 'Farmer',
    ADMIN: 'Administrator',
    DISTRIBUTOR: 'Distributor',
    TRANSPORTER: 'Transporter',
    AGROEXPERT: 'Agro Expert'
  };
  return displayNames[role] || role;
}

export function getRolePermissions(role: UserRole): string[] {
  const permissions: Record<UserRole, string[]> = {
    BUYER: ['view_products', 'place_orders'],
    FARMER: ['manage_products', 'view_orders', 'manage_inventory'],
    ADMIN: ['manage_users', 'manage_roles', 'view_all', 'manage_all'],
    DISTRIBUTOR: ['manage_distribution', 'view_orders', 'connect_suppliers'],
    TRANSPORTER: ['manage_deliveries', 'route_optimization', 'fleet_management'],
    AGROEXPERT: ['sell_products', 'lease_equipment', 'expert_consultations']
  };
  return permissions[role] || [];
}

/**
 * Updates the user's role by calling the assign-role API endpoint.
 * This works from both client and server components.
 * @param user - The Clerk 'user' object from the 'useUser' hook.
 * @param role - The new role to assign to the user (should already be uppercase).
 */
export async function updateUserRole(
  user: UserResource | User | null | undefined,
  role: UserRole | string
): Promise<void> {
  if (!user) {
    throw new Error("User is not available to update.");
  }

  // Ensure role is uppercase
  const normalizedRole = (typeof role === 'string' ? role.toUpperCase() : role) as UserRole;

  // Validate role
  const validRoles: UserRole[] = ['BUYER', 'FARMER', 'DISTRIBUTOR', 'TRANSPORTER', 'AGROEXPERT', 'ADMIN'];
  if (!validRoles.includes(normalizedRole)) {
    throw new Error(`Invalid role: ${normalizedRole}. Must be one of: ${validRoles.join(', ')}`);
  }

  // Check if the role is already set to avoid unnecessary updates
  if (user.publicMetadata?.role === normalizedRole) {
    console.log(`User role is already set to '${normalizedRole}'.`);
    return;
  }

  try {
    console.log(`Updating user role to: ${normalizedRole}`);

    // Call the assign-role API endpoint instead of directly updating Clerk
    const response = await fetch('/api/auth/assign-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: normalizedRole }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to assign role: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Role assignment successful:', result);

    // Reload user to get updated metadata (only if reload method exists)
    if ('reload' in user && typeof user.reload === 'function') {
      await user.reload();
    }
  } catch (err) {
    console.error("Failed to update user role:", err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    throw new Error(`Could not update user role: ${errorMessage}`);
  }
}
export function getRoleColor(role: UserRole): string {
  const roleColours: Record<UserRole, string> = {
    BUYER: 'blue',
    FARMER: 'green',
    ADMIN: 'red',
    DISTRIBUTOR: 'orange',
    TRANSPORTER: 'purple',
    AGROEXPERT: 'teal'
  };
  return roleColours[role] || 'gray';
}
