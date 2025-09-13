// Sui network configuration
export const SUI_NETWORKS = {
  testnet: {
    name: 'Testnet',
    rpcUrl: 'https://fullnode.testnet.sui.io:443',
    wsUrl: 'wss://fullnode.testnet.sui.io:443',
    faucetUrl: 'https://faucet.testnet.sui.io/gas',
  },
  mainnet: {
    name: 'Mainnet',
    rpcUrl: 'https://fullnode.mainnet.sui.io:443',
    wsUrl: 'wss://fullnode.mainnet.sui.io:443',
  },
  devnet: {
    name: 'Devnet',
    rpcUrl: 'https://fullnode.devnet.sui.io:443',
    wsUrl: 'wss://fullnode.devnet.sui.io:443',
    faucetUrl: 'https://faucet.devnet.sui.io/gas',
  },
} as const;

export type SuiNetwork = keyof typeof SUI_NETWORKS;

// Contract configuration
export type PackageVersion = 'v1' | 'v2';
export const SUI = {
  PACKAGE_ID: '0x2',
  STRUCTS: {
    TRANSFER_POLICY: 'TransferPolicy',
    TRANSFER_POLICY_CAP: 'TransferPolicyCap',
  },
  MODULES: {
    TRANSFER_POLICY: 'transfer_policy',
  }
}

export const JASTRON_PASS = {
  // Package ID from testnet deployment (upgraded)
  testnet: {
    latestVersion: 'v4',
    PACKAGE_ID: {
      v1: '0x2a8a0e8014614208589a1f3cd35ffe5a7fd42930f6aeee4435e80712a3c62602', // Original package
      v2: '0x1f9bdf3f62acbc67bf123326e93462cd2c3ca1607c6b0aea2cc00249b444af95', // Upgraded package
      v3: '0x37f7193d31d0a06422cc1bd5495a238f651b3108f729a39ddfde6b8a97c78580',
      v4: '0xa686fa7aae5097c0a791845cdfff74278d9d901b24d7a6bb71b6b4d09d2d537a'
    },
    PLATFORM_ID: '0x6d2c7597c11e1ea3502ed169723c8653a5009eb80bc350c5b232f74d82dbb45d',
    PUBLISHER_ID: '0x8c547b6c90861e9668bc923bb5798a5640b9b1d891f54de2f3db222f5525e55b',
    TICKET_TRANSFER_POLICY_ID: '0x5055bfff8da0d53a277bda60b120d1af8f5beea1627d83eea37d23223a783a8b',
    TICKET_TRANSFER_POLICY_CAP_ID: '0x9dfe04648fbea4c8e59f27535545784112aa6ad03a2405b376571235d8844378',
    UPGRADE_CAP_ID: '0x29f662d9a02a190374b4cd19f55870ac67e30d6a9f69dc7087f01bb6310dc04a'
  },
  mainnet: {
    latestVersion: 'v1',
    PACKAGE_ID: {
      v1: '',
      v2: '',
    },
    PLATFORM_ID: '',
    PUBLISHER_ID: '',
    TICKET_TRANSFER_POLICY_ID: '',
    TICKET_TRANSFER_POLICY_CAP_ID: '',
    UPGRADE_CAP_ID: '',
  },
  devnet: {
    latestVersion: 'v1',
    PACKAGE_ID: {
      v1: '0x0329932e8d08bf9223f2893dd496fcab6c942d9109ada415b2085170818bdb81',
      v2: '',
    },
    PLATFORM_ID: '0x8098f063262e46f4f6d6dc3a44ab470dce1809631f9edb95b3ae17574a27ecf8',
    PUBLISHER_ID: '0x3943d0be7b74fbf383cea1126f87aa76f62336006474cbc2a801869efa351c47',
    TICKET_TRANSFER_POLICY_ID: '0xbdfc493527eac7f2043743de28a12d046413c6e9fe9d730ec98a8b22bb6ffd52',
    TICKET_TRANSFER_POLICY_CAP_ID: '0xd0f5f04775ea17c4324aadcefc6c1f9c9707fcd455e3810ac042fa206ae8e257',
    UPGRADE_CAP_ID: '',
  },
  
  NAME: 'jastron_pass',
  // Module names
  MODULES: {
    APP: 'app',
    PLATFORM: 'platform',
    ORGANIZER: 'organizer',
    USER: 'user',
    TICKET: 'ticket',
    ACTIVITY: 'activity',
    TICKET_TRANSFER_POLICY: 'ticket_transfer_policy',
  },

  // Public function names from Move contracts
  FUNCTIONS: {
    // App module (public functions only)
    REGISTER_ORGANIZER_PROFILE: 'register_organizer_profile',
    REGISTER_USER_PROFILE: 'register_user_profile',
    CREATE_ACTIVITY: 'create_activity',
    BUY_TICKET_FROM_ORGANIZER: 'buy_ticket_from_organizer',
    ATTEND_ACTIVITY: 'attend_activity',
    CREATE_KIOSK: 'create_kiosk',
    LIST_TICKET_FOR_RESELL: 'list_ticket_for_resell',
    DELIST_TICKET: 'delist_ticket',
    DELIST_TICKET_FROM_KIOSK: 'delist_ticket_from_kiosk',
    PURCHASE_TICKET: 'purchase_ticket',
    GET_TICKET_PRICE: 'get_ticket_price',
    IS_TICKET_LISTED: 'is_ticket_listed',

    // Platform module (public functions only)
    PLATFORM_GET_TREASURY: 'get_treasury',
    PLATFORM_IS_USER_REGISTERED: 'is_user_registered',
    PLATFORM_IS_ORGANIZER_REGISTERED: 'is_organizer_registered',
    PLATFORM_GET_USER_REGISTERED_AT: 'get_user_registered_at',
    PLATFORM_GET_ORGANIZER_REGISTERED_AT: 'get_organizer_registered_at',
    PLATFORM_GET_REGISTERED_USERS_COUNT: 'get_registered_users_count',
    PLATFORM_GET_REGISTERED_ORGANIZERS_COUNT: 'get_registered_organizers_count',
    PLATFORM_GET_NUM_ACTIVITIES: 'get_num_activities',
    PLATFORM_LIST_ACTIVITIES: 'list_activities',
    
    // Organizer module (public functions only)
    ORGANIZER_GET_PROFILE_ID: 'get_profile_id',
    ORGANIZER_GET_TREASURY: 'get_treasury',
    ORGANIZER_GET_NAME: 'get_name',
    
    // User module (public functions only)
    USER_GET_PROFILE_ID: 'get_profile_id',
    USER_GET_TREASURY: 'get_treasury',
    USER_GET_NAME: 'get_name',
    USER_HAS_ATTENDED_ACTIVITY: 'has_attended_activity',
    USER_GET_ATTENDED_AT: 'get_attended_at',
    USER_GET_ATTENDED_ACTIVITIES_COUNT: 'get_attended_activities_count',
    
    // Activity module (public functions only)
    ACTIVITY_GET_ID: 'get_id',
    ACTIVITY_GET_NAME: 'get_name',
    ACTIVITY_GET_ORGANIZER_PROFILE_ID: 'get_organizer_profile_id',
    ACTIVITY_HAS_AVAILABLE_TICKETS: 'has_available_tickets',
    ACTIVITY_GET_REMAINING_TICKETS: 'get_remaining_tickets',
    ACTIVITY_GET_TICKET_PRICE: 'get_ticket_price',
    ACTIVITY_GET_TOTAL_SUPPLY: 'get_total_supply',
    ACTIVITY_GET_TICKETS_SOLD: 'get_tickets_sold',
    ACTIVITY_GET_SALE_ENDED_AT: 'get_sale_ended_at',
    ACTIVITY_IS_SALE_ENDED: 'is_sale_ended',
    ACTIVITY_HAS_ATTENDEE: 'has_attendee',
    
    // Ticket module (public functions only)
    TICKET_GET_ID: 'get_id',
    TICKET_GET_ACTIVITY_ID: 'get_activity_id',
    TICKET_IS_CLIPPED: 'is_clipped',
    TICKET_IS_BOUND: 'is_bound',
    TICKET_GET_INNER_ID: 'get_inner_id',
    TICKET_GET_INNER_ACTIVITY_ID: 'get_inner_activity_id',
    TICKET_GET_INNER_OWNER_PROFILE_ID: 'get_inner_owner_profile_id',
    
    // Ticket Transfer Policy module (public functions only)
    NEW_POLICY: 'new_policy',
    ADD_ROYALTY_FEE_RULE: 'add_royalty_fee_rule',
    CALCULATE_ROYALTY_FEE: 'calculate_royalty_fee',
    ADD_RESELL_PRICE_LIMIT_RULE: 'add_resell_price_limit_rule',
    CALCULATE_RESELL_PRICE_LIMIT: 'calculate_resell_price_limit',
    ADD_PLATFORM_FEE_RULE: 'add_platform_fee_rule',
    CALCULATE_PLATFORM_FEE: 'calculate_platform_fee',
    GET_PLATFORM_FEE_RULE: 'get_platform_fee_rule',
    GET_ROYALTY_FEE_RULE: 'get_royalty_fee_rule',
    GET_RESELL_PRICE_LIMIT_RULE: 'get_resell_price_limit_rule',
  },

  STRUCTS: {
    // Core structs
    PLATFORM: 'Platform',
    PLATFORM_WITNESS: 'PLATFORM',
    ORGANIZER_CAP: 'OrganizerCap',
    ORGANIZER_PROFILE: 'OrganizerProfile',
    USER_CAP: 'UserCap',
    USER_PROFILE: 'UserProfile',
    ACTIVITY: 'Activity',
    TICKET: 'Ticket',
    PROTECTED_TICKET: 'ProtectedTicket',
    TICKET_LISTING: 'TicketListing',
    
    // Transfer policy structs
    ROYALTY_FEE_RULE: 'ROYALTY_FEE_RULE',
    ROYALTY_FEE_RULE_CONFIG: 'RoyaltyFeeRuleConfig',
    RESELL_PRICE_LIMIT_RULE: 'RESELL_PRICE_LIMIT_RULE',
    RESELL_PRICE_LIMIT_RULE_CONFIG: 'ResellPriceLimitRuleConfig',
    PLATFORM_FEE_RULE: 'PLATFORM_FEE_RULE',
    PLATFORM_FEE_RULE_CONFIG: 'PlatformFeeRuleConfig'
  },

  EVENTS: {
    // App module events
    ORGANIZER_TICKET_PURCHASED: 'OrganizerTicketPurchased',
    KIOSK_TICKET_LISTED: 'KioskTicketListed',
    KIOSK_TICKET_PURCHASED: 'KioskTicketPurchased',
    KIOSK_TICKET_DELISTED: 'KioskTicketDelisted',
    
    // Platform module events
    USER_REGISTERED: 'UserRegistered',
    ORGANIZER_REGISTERED: 'OrganizerRegistered',
    
    // Organizer module events
    ORGANIZER_PROFILE_REGISTERED: 'OrganizerProfileRegistered',
    
    // User module events
    USER_PROFILE_REGISTERED: 'UserProfileRegistered',
    ACTIVITY_ATTENDED: 'ActivityAttended',
    
    // Activity module events
    ACTIVITY_CREATED: 'ActivityCreated',
    
    // Ticket module events
    TICKET_MINTED: 'TicketMinted',
    TICKET_BOUND: 'TicketBound',
    TICKET_CLIPPED: 'TicketClipped',
  },

  // Error codes from Move contracts
  ERROR_CODES: {
    // App module errors (EApp = 100)
    E_NOT_ENOUGH_BALANCE: 101,
    E_NOT_ENOUGH_TICKETS: 102,
    E_ORGANIZER_PROFILE_MISMATCH: 103,
    E_INVALID_PRICE: 104,
    E_ITEM_NOT_LISTED: 105,
    E_RESELL_PRICE_LIMIT_EXCEEDED: 106,
    E_ACTIVITY_SALE_ENDED: 107,
    E_ACTIVITY_MISMATCH: 108,
    E_USER_PROFILE_MISMATCH: 109,
    
    // Platform module errors (EPlatform = 300)
    E_USER_ALREADY_REGISTERED: 301,
    E_ORGANIZER_ALREADY_REGISTERED: 302,
    
    // Activity module errors (EActivity = 0)
    E_ACTIVITY_INVALID_PRICE: 1,
    E_ATTENDEE_ALREADY_ADDED: 2,
    
    // Ticket module errors (ETicket = 500)
    E_TICKET_HAS_BEEN_CLIPPED: 501,
    E_TICKET_HAS_BEEN_BOUND: 502,
    E_TICKET_NOT_BOUND: 503,
    
    // User module errors (EUser = 600)
    E_ACTIVITY_ALREADY_ATTENDED: 601,
    
    // Ticket Transfer Policy errors (ETicketTransferRule = 400)
    E_OVER_BP_FACTOR: 401,
    E_ROYALTY_FEE_NOT_ENOUGH: 402,
    E_RESELL_PRICE_LIMIT_EXCEEDED_2: 403,
    E_PLATFORM_FEE_NOT_ENOUGH: 404,
    E_TICKET_MISMATCH: 405,
    E_ACTIVITY_MISMATCH_2: 406,
    E_ORGANIZER_PROFILE_MISMATCH_2: 407,
  },

  // Constants
  CONSTANTS: {
    BP_FACTOR: 10000, // 1/BP_FACTOR -> 0.01%, BP_FACTOR/BP_FACTOR = 100%
  },
} as const;

// Default network
export const CURRENT_NETWORK: SuiNetwork = process.env.NEXT_PUBLIC_NETWORK as SuiNetwork || 'testnet';

// Gas configuration - optimized for Devnet
export const GAS_CONFIG = {
  DEFAULT_BUDGET: 500000000, // 0.5 SUI - higher for Devnet reliability
  MAX_BUDGET: 2000000000,    // 2 SUI - for complex transactions
  PRICE: 1000,               // MIST per gas unit
  TIMEOUT: 120000,           // 120 seconds timeout for Devnet
  RETRY_ATTEMPTS: 3,         // Number of retry attempts
} as const;

// Dynamic contract IDs based on current network
export function getPlatformId(network: SuiNetwork): string {
  return JASTRON_PASS[network].PLATFORM_ID;
}

export function getPublisherId(network: SuiNetwork): string {
  return JASTRON_PASS[network].PUBLISHER_ID;
}

export function getTicketTransferPolicyId(network: SuiNetwork): string {
  return JASTRON_PASS[network].TICKET_TRANSFER_POLICY_ID;
}

export function getLatestPackageId(network: SuiNetwork): string {
  return JASTRON_PASS[network].PACKAGE_ID[JASTRON_PASS[network].latestVersion as PackageVersion];
}

export function getGenericStructType(struct: string, type: string[]): string {
  return `${struct}<${type.join(',')}>`;
}

export function getSuiStructType(module: string, struct: string): string {
  return `${SUI.PACKAGE_ID}::${module}::${struct}`;
}

// Helper function to get struct type with specified package version
export function getJastronPassStructType(module: string, struct: string, network: SuiNetwork, version: PackageVersion = 'v1'): string {
  const packageId = JASTRON_PASS[network].PACKAGE_ID[version];
  return `${packageId}::${module}::${struct}`;
}

// Helper function to get event type with specified package version
export function getJastronPassEventType(module: string, event: string, network: SuiNetwork, version: PackageVersion = 'v1'): string {
  const packageId = JASTRON_PASS[network].PACKAGE_ID[version];
  return `${packageId}::${module}::${event}`;
}
