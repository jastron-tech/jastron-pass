// Sui types
export interface SuiObject {
  objectId: string;
  version: string;
  digest: string;
  type: string;
  owner?: {
    AddressOwner?: string;
    ObjectOwner?: string;
    Shared?: {
      initial_shared_version: number;
    };
  };
  content?: {
    dataType: 'moveObject' | 'package';
    type: string;
    fields?: Record<string, unknown>;
  };
  display?: Record<string, string>;
  previousTransaction?: string;
  storageRebate?: string;
}

// Contract types based on Move contract structures

// Platform types
export interface Platform {
  id: string;
  treasury: string;
}

// Organizer types
export interface OrganizerCap {
  id: string;
  profile_id: string;
}

export interface OrganizerProfile {
  id: string;
  treasury: string;
}

// User types
export interface UserCap {
  id: string;
  profile_id: string;
}

export interface UserProfile {
  id: string;
  treasury: string;
  verified_at: number;
}

// Activity types
export interface Activity {
  id: string;
  total_supply: number;
  tickets_sold: number;
  ticket_price: number;
  organizer_profile_id: string;
  sale_ended_at: number;
}

// Ticket types
export interface Ticket {
  id: string;
  activity_id: string;
  used_at: number;
}

export interface ProtectedTicket {
  id: string;
  ticket: Ticket;
}

// Ticket listing for Kiosk
export interface TicketListing {
  id: string;
}

// Transfer Policy types
export interface TransferPolicy {
  id: string;
  type: string;
}

export interface TransferPolicyCap {
  id: string;
  policy_id: string;
}

export interface RoyaltyFeeRuleConfig {
  fee_bp: number;
  min_fee: number;
}

export interface ResellPriceLimitRuleConfig {
  price_limit_bp: number;
}

export interface PlatformFeeRuleConfig {
  fee_bp: number;
  min_fee: number;
}

// Kiosk types
export interface Kiosk {
  id: string;
  owner: string;
}

export interface KioskOwnerCap {
  id: string;
  kiosk_id: string;
}

// Event types based on Move contract events
export interface OrganizerProfileCreated {
  profile_id: string;
  created_by: string;
  created_at: number;
}

export interface UserProfileCreated {
  profile_id: string;
  user: string;
  registered_at: number;
}

export interface ActivityCreated {
  activity_id: string;
  organizer_profile_id: string;
  total_supply: number;
  ticket_price: number;
  created_at: number;
  created_by: string;
}

export interface TicketMinted {
  activity_id: string;
  ticket_id: string;
  created_at: number;
  created_by: string;
}

export interface OrganizerTicketPurchased {
  activity_id: string;
  ticket_id: string;
  buyer: string;
  seller: string;
  ticket_receiver: string;
  price: number;
  platform_fee: number;
  num_sold: number;
}

export interface KioskTicketListed {
  kiosk_id: string;
  ticket_id: string;
  price: number;
  listed_at: number;
}

export interface KioskTicketPurchased {
  kiosk_id: string;
  ticket_id: string;
  buyer: string;
  price: number;
  royalty_fee: number;
  platform_fee: number;
  purchased_at: number;
}

export interface KioskTicketDelisted {
  kiosk_id: string;
  ticket_id: string;
  delisted_at: number;
}

// Transaction types
export interface TransactionResult {
  digest: string;
  effects?: {
    status: {
      status: 'success' | 'failure';
      error?: string;
    };
    gasUsed: {
      computationCost: string;
      storageCost: string;
      storageRebate: string;
    };
  };
  events?: Array<{
    type: string;
    data: Record<string, unknown>;
  }>;
}

// Wallet types
export interface WalletState {
  connected: boolean;
  connecting: boolean;
  address: string | null;
  balance: string;
  error: string | null;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface CreatePlatformForm {
  name: string;
  description: string;
  website: string;
}

export interface CreateOrganizerForm {
  name: string;
  email: string;
  platformId: string;
}

export interface CreateUserForm {
  name: string;
  email: string;
}

export interface CreateActivityForm {
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  location: string;
  organizerId: string;
}

export interface CreateTicketForm {
  activityId: string;
  price: number;
  maxSupply: number;
}

// Error types
export interface SuiError {
  code: string;
  message: string;
  details?: unknown;
}

// Network types
export interface NetworkInfo {
  network: string;
  epoch: number;
  totalStake: string;
  systemStateVersion: number;
  chainId: string;
}
