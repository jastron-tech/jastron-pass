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
export const JASTRON_PASS_PACKAGE = {
  // Package ID from testnet deployment
  testnet: {
    PACKAGE_ID: '0x96d2d7b6b3e778975e4a4a968dc96a70e26c3cad21e3d8e07dcc87454f07ae06',
    PLATFORM_ID: '0x5647fe597dcaba23078c3e728baa5b4b8d9993157d450f454d2c900d98ed2848',
    PUBLISHER_ID: '0x0ed07581264c22f020102be95224866e286035e59641c22196a6d6b6eba3dce6',
  },
  mainnet: {
    PACKAGE_ID: '',
    PLATFORM_ID: '',
    PUBLISHER_ID: '',
  },
  devnet: {
    PACKAGE_ID: '',
    PLATFORM_ID: '',
    PUBLISHER_ID: '',
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
  
  STRUCTS: {
    ORGANIZER_CAP: 'OrganizerCap',
    ORGANIZER_PROFILE: 'OrganizerProfile',
    USER_CAP: 'UserCap',
    USER_PROFILE: 'UserProfile',
    TICKET: 'Ticket',
    ACTIVITY: 'Activity',
    TICKET_TRANSFER_POLICY: 'TicketTransferPolicy',
    PROTECTED_TICKET: 'ProtectedTicket',
    PLATFORM: 'Platform'
  },

  // Public function names from Move contracts
  FUNCTIONS: {
    // App module (public functions only)
    REGISTER_ORGANIZER_PROFILE: 'register_organizer_profile',
    REGISTER_USER_PROFILE: 'register_user_profile',
    CREATE_ACTIVITY: 'create_activity',
    BUY_TICKET_FROM_ORGANIZER: 'buy_ticket_from_organizer',
    CREATE_KIOSK: 'create_kiosk',
    LIST_TICKET_FOR_RESELL: 'list_ticket_for_resell',
    DELIST_TICKET: 'delist_ticket',
    PURCHASE_TICKET: 'purchase_ticket',
    GET_TICKET_PRICE: 'get_ticket_price',
    IS_TICKET_LISTED: 'is_ticket_listed',
    
    // Platform module (public functions only)
    PLATFORM_GET_TREASURY: 'get_treasury',
    
    // Organizer module (public functions only)
    ORGANIZER_GET_PROFILE_ID: 'get_profile_id',
    ORGANIZER_GET_TREASURY: 'get_treasury',
    
    // User module (public functions only)
    USER_GET_PROFILE_ID: 'get_profile_id',
    USER_GET_TREASURY: 'get_treasury',
    
    // Activity module (public functions only)
    ACTIVITY_GET_ID: 'get_id',
    ACTIVITY_GET_ORGANIZER_PROFILE_ID: 'get_organizer_profile_id',
    ACTIVITY_HAS_AVAILABLE_TICKETS: 'has_available_tickets',
    ACTIVITY_GET_REMAINING_TICKETS: 'get_remaining_tickets',
    ACTIVITY_GET_TICKET_PRICE: 'get_ticket_price',
    ACTIVITY_GET_TOTAL_SUPPLY: 'get_total_supply',
    ACTIVITY_GET_TICKETS_SOLD: 'get_tickets_sold',
    ACTIVITY_GET_SALE_ENDED_AT: 'get_sale_ended_at',
    
    // Ticket module (public functions only)
    TICKET_GET_ID: 'get_id',
    TICKET_GET_ACTIVITY_ID: 'get_activity_id',
    TICKET_IS_REDEEMED: 'is_redeemed',
    TICKET_GET_INNER_ID: 'get_inner_id',
    TICKET_GET_INNER_ACTIVITY_ID: 'get_inner_activity_id',
    TICKET_IS_INNER_REDEEMED: 'is_inner_redeemed',
    
    // Ticket Transfer Policy module (public functions only)
    NEW_POLICY: 'new_policy',
    ADD_ROYALTY_FEE_RULE: 'add_royalty_fee_rule',
    CALCULATE_ROYALTY_FEE: 'calculate_royalty_fee',
    ADD_RESELL_PRICE_LIMIT_RULE: 'add_resell_price_limit_rule',
    CALCULATE_RESELL_PRICE_LIMIT: 'calculate_resell_price_limit',
    ADD_PLATFORM_FEE_RULE: 'add_platform_fee_rule',
    CALCULATE_PLATFORM_FEE: 'calculate_platform_fee',
  },
} as const;

// Default network
export const CURRENT_NETWORK: SuiNetwork = process.env.NEXT_PUBLIC_NETWORK as SuiNetwork || 'testnet';

// Gas configuration
export const GAS_CONFIG = {
  DEFAULT_BUDGET: 100000000, // 0.1 SUI
  MAX_BUDGET: 1000000000,    // 1 SUI
  PRICE: 1000,               // MIST per gas unit
} as const;


export const PACKAGE_ID = JASTRON_PASS_PACKAGE[CURRENT_NETWORK].PACKAGE_ID;
export const PLATFORM_ID = JASTRON_PASS_PACKAGE[CURRENT_NETWORK].PLATFORM_ID;
export const PUBLISHER_ID = JASTRON_PASS_PACKAGE[CURRENT_NETWORK].PUBLISHER_ID;