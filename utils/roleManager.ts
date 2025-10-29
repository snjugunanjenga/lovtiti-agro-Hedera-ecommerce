import type { User } from '@clerk/nextjs/server'; // Use server type for safety, but it's a client object
import type { UserResource } from '@clerk/types';

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

/**
 * Updates the user's role in Clerk's unsafeMetadata.
 * This must be called from a client component where 'useUser' is available.
 * * @param user - The Clerk 'user' object from the 'useUser' hook.
 * @param role - The new role to assign to the user.
 */
export async function updateUserRole(
  user: UserResource | User | null | undefined, 
  role: UserRole
): Promise<void> {
  if (!user) {
    throw new Error("User is not available to update.");
  }

  const normalizedRole = role.toUpperCase();

  // Check if the role is already set to avoid unnecessary updates
  if (
    user.publicMetadata?.role === normalizedRole &&
    user.unsafeMetadata?.role === normalizedRole
  ) {
    console.log(`User role is already set to '${normalizedRole}'.`);
    return;
  }

  try {
    // Use the user.update() method from the client-side 'useUser' hook
    await user.update({
      unsafeMetadata: {
        ...user.unsafeMetadata,
        role: normalizedRole,
      },
      publicMetadata: {
        ...user.publicMetadata,
        role: normalizedRole,
      },
    });
  } catch (err) {
    console.error("Failed to update user metadata in Clerk:", err);
    throw new Error("Could not update user role via Clerk.");
  }
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
