// Business Logic for Lovitti Agro Mart
// Defines the relationships and interactions between different user roles

export type UserRole = 'FARMER' | 'BUYER' | 'DISTRIBUTOR' | 'TRANSPORTER' | 'VETERINARIAN' | 'ADMIN';

export interface BusinessRule {
  canBuyFrom: UserRole[];
  canSellTo: UserRole[];
  canLeaseFrom: UserRole[];
  canLeaseTo: UserRole[];
  canProvideServicesTo: UserRole[];
  canReceiveServicesFrom: UserRole[];
}

export const BUSINESS_RULES: Record<UserRole, BusinessRule> = {
  // Buyers can buy agricultural products from farmers and distributors
  BUYER: {
    canBuyFrom: ['FARMER', 'DISTRIBUTOR'],
    canSellTo: [], // Buyers don't sell products
    canLeaseFrom: ['VETERINARIAN'], // Buyers can lease equipment from Agrovets
    canLeaseTo: [], // Buyers don't lease out equipment
    canProvideServicesTo: [], // Buyers don't provide services
    canReceiveServicesFrom: ['TRANSPORTER', 'DISTRIBUTOR'], // Buyers can receive logistics services
  },

  // Farmers can sell products to buyers and distributors, lease equipment from Agrovets
  FARMER: {
    canBuyFrom: ['VETERINARIAN'], // Farmers can buy equipment/products from Agrovets
    canSellTo: ['BUYER', 'DISTRIBUTOR'], // Farmers sell to buyers and distributors
    canLeaseFrom: ['VETERINARIAN'], // Farmers lease equipment from Agrovets
    canLeaseTo: [], // Farmers don't lease out equipment
    canProvideServicesTo: [], // Farmers don't provide services
    canReceiveServicesFrom: ['TRANSPORTER', 'DISTRIBUTOR'], // Farmers can receive logistics services
  },

  // Distributors can buy from farmers and sell to buyers
  DISTRIBUTOR: {
    canBuyFrom: ['FARMER'], // Distributors buy from farmers
    canSellTo: ['BUYER'], // Distributors sell to buyers
    canLeaseFrom: ['VETERINARIAN'], // Distributors can lease equipment from Agrovets
    canLeaseTo: [], // Distributors don't lease out equipment
    canProvideServicesTo: ['FARMER', 'BUYER'], // Distributors provide supply chain services
    canReceiveServicesFrom: ['TRANSPORTER'], // Distributors can receive logistics services
  },

  // Transporters provide logistics services to all users
  TRANSPORTER: {
    canBuyFrom: [], // Transporters don't buy products
    canSellTo: [], // Transporters don't sell products
    canLeaseFrom: ['VETERINARIAN'], // Transporters can lease equipment from Agrovets
    canLeaseTo: [], // Transporters don't lease out equipment
    canProvideServicesTo: ['FARMER', 'BUYER', 'DISTRIBUTOR'], // Transporters provide logistics to all
    canReceiveServicesFrom: [], // Transporters don't receive services
  },

  // Agrovets sell equipment/products to farmers and lease equipment to all users
  VETERINARIAN: {
    canBuyFrom: [], // Agrovets don't buy products
    canSellTo: ['FARMER', 'BUYER', 'DISTRIBUTOR'], // Agrovets sell to farmers, buyers, distributors
    canLeaseFrom: [], // Agrovets don't lease from others
    canLeaseTo: ['FARMER', 'BUYER', 'DISTRIBUTOR', 'TRANSPORTER'], // Agrovets lease to all users
    canProvideServicesTo: ['FARMER', 'BUYER', 'DISTRIBUTOR'], // Agrovets provide expert services
    canReceiveServicesFrom: ['TRANSPORTER'], // Agrovets can receive logistics services
  },

  // Admins are platform moderators - they don't participate in transactions
  ADMIN: {
    canBuyFrom: [], // Admins don't buy products
    canSellTo: [], // Admins don't sell products
    canLeaseFrom: [], // Admins don't lease equipment
    canLeaseTo: [], // Admins don't lease out equipment
    canProvideServicesTo: [], // Admins don't provide commercial services
    canReceiveServicesFrom: [], // Admins don't receive commercial services
  },
};

export interface TransactionType {
  type: 'PURCHASE' | 'LEASE' | 'SERVICE';
  fromRole: UserRole;
  toRole: UserRole;
  description: string;
}

export const VALID_TRANSACTIONS: TransactionType[] = [
  // Purchase transactions
  { type: 'PURCHASE', fromRole: 'FARMER', toRole: 'BUYER', description: 'Buyers buy agricultural products from farmers' },
  { type: 'PURCHASE', fromRole: 'FARMER', toRole: 'DISTRIBUTOR', description: 'Distributors buy products from farmers' },
  { type: 'PURCHASE', fromRole: 'DISTRIBUTOR', toRole: 'BUYER', description: 'Buyers buy products from distributors' },
  { type: 'PURCHASE', fromRole: 'VETERINARIAN', toRole: 'FARMER', description: 'Farmers buy equipment from Agrovets' },
  { type: 'PURCHASE', fromRole: 'VETERINARIAN', toRole: 'BUYER', description: 'Buyers buy equipment from Agrovets' },
  { type: 'PURCHASE', fromRole: 'VETERINARIAN', toRole: 'DISTRIBUTOR', description: 'Distributors buy equipment from Agrovets' },

  // Lease transactions
  { type: 'LEASE', fromRole: 'VETERINARIAN', toRole: 'FARMER', description: 'Farmers lease equipment from Agrovets' },
  { type: 'LEASE', fromRole: 'VETERINARIAN', toRole: 'BUYER', description: 'Buyers lease equipment from Agrovets' },
  { type: 'LEASE', fromRole: 'VETERINARIAN', toRole: 'DISTRIBUTOR', description: 'Distributors lease equipment from Agrovets' },
  { type: 'LEASE', fromRole: 'VETERINARIAN', toRole: 'TRANSPORTER', description: 'Transporters lease equipment from Agrovets' },

  // Service transactions
  { type: 'SERVICE', fromRole: 'TRANSPORTER', toRole: 'FARMER', description: 'Transporters provide logistics services to farmers' },
  { type: 'SERVICE', fromRole: 'TRANSPORTER', toRole: 'BUYER', description: 'Transporters provide logistics services to buyers' },
  { type: 'SERVICE', fromRole: 'TRANSPORTER', toRole: 'DISTRIBUTOR', description: 'Transporters provide logistics services to distributors' },
  { type: 'SERVICE', fromRole: 'TRANSPORTER', toRole: 'VETERINARIAN', description: 'Transporters provide logistics services to Agrovets' },
  { type: 'SERVICE', fromRole: 'DISTRIBUTOR', toRole: 'FARMER', description: 'Distributors provide supply chain services to farmers' },
  { type: 'SERVICE', fromRole: 'DISTRIBUTOR', toRole: 'BUYER', description: 'Distributors provide supply chain services to buyers' },
  { type: 'SERVICE', fromRole: 'VETERINARIAN', toRole: 'FARMER', description: 'Agrovets provide expert services to farmers' },
  { type: 'SERVICE', fromRole: 'VETERINARIAN', toRole: 'BUYER', description: 'Agrovets provide expert services to buyers' },
  { type: 'SERVICE', fromRole: 'VETERINARIAN', toRole: 'DISTRIBUTOR', description: 'Agrovets provide expert services to distributors' },
];

export function canUserBuyFrom(buyerRole: UserRole, sellerRole: UserRole): boolean {
  const rules = BUSINESS_RULES[buyerRole];
  return rules.canBuyFrom.includes(sellerRole);
}

export function canUserSellTo(sellerRole: UserRole, buyerRole: UserRole): boolean {
  const rules = BUSINESS_RULES[sellerRole];
  return rules.canSellTo.includes(buyerRole);
}

export function canUserLeaseFrom(lesseeRole: UserRole, lessorRole: UserRole): boolean {
  const rules = BUSINESS_RULES[lesseeRole];
  return rules.canLeaseFrom.includes(lessorRole);
}

export function canUserLeaseTo(lessorRole: UserRole, lesseeRole: UserRole): boolean {
  const rules = BUSINESS_RULES[lessorRole];
  return rules.canLeaseTo.includes(lesseeRole);
}

export function canUserProvideServicesTo(providerRole: UserRole, receiverRole: UserRole): boolean {
  const rules = BUSINESS_RULES[providerRole];
  return rules.canProvideServicesTo.includes(receiverRole);
}

export function canUserReceiveServicesFrom(receiverRole: UserRole, providerRole: UserRole): boolean {
  const rules = BUSINESS_RULES[receiverRole];
  return rules.canReceiveServicesFrom.includes(providerRole);
}

export function getValidTransactionsForUser(userRole: UserRole): TransactionType[] {
  return VALID_TRANSACTIONS.filter(transaction => 
    transaction.fromRole === userRole || transaction.toRole === userRole
  );
}

export function getBusinessRulesForUser(userRole: UserRole): BusinessRule {
  return BUSINESS_RULES[userRole];
}

export function getRoleDescription(userRole: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    FARMER: 'Agricultural producer who grows and sells crops, livestock, and other farm products. Can buy equipment from Agrovets and receive logistics services.',
    BUYER: 'Individual or business that purchases agricultural products from farmers and distributors. Can lease equipment from Agrovets and receive logistics services.',
    DISTRIBUTOR: 'Supply chain intermediary who manages inventory and connects farmers with buyers. Can buy from farmers, sell to buyers, and provide supply chain services.',
    TRANSPORTER: 'Logistics provider who handles transportation and delivery of agricultural products. Provides logistics services to all users.',
    VETERINARIAN: 'Agricultural expert who sells products, leases equipment, and provides expert advice. Serves farmers, buyers, distributors, and transporters.',
    ADMIN: 'Platform moderator managing KYC verification, listings, disputes, and system oversight. Does not participate in commercial transactions.',
  };

  return descriptions[userRole] || 'Platform user';
}
