import { getRoleDescription as describeRole, type UserRole } from './businessLogic';

export type { UserRole };

export interface RoleColorClasses {
  bg: string;
  text: string;
  ring: string;
  border: string;
}

interface RoleMetadata {
  displayName: string;
  permissions: string[];
  colors: RoleColorClasses;
}

const ROLE_METADATA: Record<UserRole, RoleMetadata> = {
  BUYER: {
    displayName: 'Buyer',
    permissions: ['view_products', 'place_orders', 'track_orders'],
    colors: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      ring: 'ring-blue-500',
      border: 'border-blue-200',
    },
  },
  FARMER: {
    displayName: 'Farmer',
    permissions: [
      'manage_products',
      'view_orders',
      'manage_inventory',
      'access_farmer_dashboard',
    ],
    colors: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      ring: 'ring-green-500',
      border: 'border-green-200',
    },
  },
  DISTRIBUTOR: {
    displayName: 'Distributor',
    permissions: [
      'manage_inventory',
      'view_orders',
      'coordinate_logistics',
      'access_distribution_tools',
    ],
    colors: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      ring: 'ring-amber-500',
      border: 'border-amber-200',
    },
  },
  TRANSPORTER: {
    displayName: 'Transporter',
    permissions: [
      'manage_deliveries',
      'update_tracking',
      'access_logistics_dashboard',
    ],
    colors: {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      ring: 'ring-purple-500',
      border: 'border-purple-200',
    },
  },
  AGROEXPERT: {
    displayName: 'Agro Expert',
    permissions: [
      'manage_equipment',
      'lease_equipment',
      'sell_equipment',
      'provide_consultation',
    ],
    colors: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      ring: 'ring-emerald-500',
      border: 'border-emerald-200',
    },
  },
  VETERINARIAN: {
    displayName: 'Veterinarian',
    permissions: [
      'manage_equipment',
      'lease_equipment',
      'sell_equipment',
      'provide_consultation',
    ],
    colors: {
      bg: 'bg-teal-100',
      text: 'text-teal-700',
      ring: 'ring-teal-500',
      border: 'border-teal-200',
    },
  },
  ADMIN: {
    displayName: 'Administrator',
    permissions: [
      'manage_users',
      'manage_roles',
      'view_all',
      'access_admin_dashboard',
    ],
    colors: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      ring: 'ring-slate-500',
      border: 'border-slate-200',
    },
  },
};

export const ALL_ROLES: UserRole[] = Object.keys(ROLE_METADATA) as UserRole[];

export function getRoleDisplayName(role: UserRole): string {
  return ROLE_METADATA[role]?.displayName ?? formatRoleName(role);
}

export function getRolePermissions(role: UserRole): string[] {
  return ROLE_METADATA[role]?.permissions ?? [];
}

export function getRoleColor(role: UserRole): RoleColorClasses {
  return ROLE_METADATA[role]?.colors ?? ROLE_METADATA.BUYER.colors;
}

export function getRoleDescription(role: UserRole): string {
  return describeRole(role);
}

export async function updateUserRole(role: UserRole) {
  const response = await fetch('/api/auth/assign-role', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || 'Failed to update user role');
  }

  return response.json();
}

function formatRoleName(role: string): string {
  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}
