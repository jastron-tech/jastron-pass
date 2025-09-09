import { TransactionBlock } from '@mysten/sui.js/transactions';
import { CONTRACT_CONFIG, GAS_CONFIG, PACKAGE_ID } from './sui-config';
import { getDefaultSuiClient } from './sui-client';

// Contract interaction utilities
export class JastronPassContract {
  private packageId: string;
  private client: ReturnType<typeof getDefaultSuiClient>;

  constructor(packageId: string) {
    this.packageId = packageId;
    this.client = getDefaultSuiClient();
  }

  // Create transaction block
  private createTransactionBlock(): TransactionBlock {
    const txb = new TransactionBlock();
    txb.setGasBudget(GAS_CONFIG.DEFAULT_BUDGET);
    return txb;
  }

  // App module functions
  async registerOrganizerProfile() {
    const txb = this.createTransactionBlock();
    txb.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.APP}::${CONTRACT_CONFIG.FUNCTIONS.REGISTER_ORGANIZER_PROFILE}`,
      arguments: [],
    });
    return txb;
  }

  async registerUserProfile() {
    const txb = this.createTransactionBlock();
    txb.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.APP}::${CONTRACT_CONFIG.FUNCTIONS.REGISTER_USER_PROFILE}`,
      arguments: [],
    });
    return txb;
  }

  async createActivity(
    organizerCap: string,
    organizerProfile: string,
    totalSupply: number,
    ticketPrice: number,
    saleEndedAt: number
  ) {
    const txb = this.createTransactionBlock();
    txb.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.APP}::${CONTRACT_CONFIG.FUNCTIONS.CREATE_ACTIVITY}`,
      arguments: [
        txb.object(organizerCap),
        txb.object(organizerProfile),
        txb.pure(totalSupply),
        txb.pure(ticketPrice),
        txb.pure(saleEndedAt),
      ],
    });
    return txb;
  }

  async buyTicketFromOrganizer(
    activity: string,
    payment: string,
    platform: string,
    transferPolicy: string,
    organizerProfile: string,
    ticketReceiverProfile: string
  ) {
    const txb = this.createTransactionBlock();
    txb.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.APP}::${CONTRACT_CONFIG.FUNCTIONS.BUY_TICKET_FROM_ORGANIZER}`,
      arguments: [
        txb.object(activity),
        txb.object(payment),
        txb.object(platform),
        txb.object(transferPolicy),
        txb.object(organizerProfile),
        txb.object(ticketReceiverProfile),
      ],
    });
    return txb;
  }

  async createKiosk(userProfile: string) {
    const txb = this.createTransactionBlock();
    txb.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.APP}::${CONTRACT_CONFIG.FUNCTIONS.CREATE_KIOSK}`,
      arguments: [txb.object(userProfile)],
    });
    return txb;
  }

  async listTicketForResell(
    kiosk: string,
    kioskCap: string,
    transferPolicy: string,
    activity: string,
    protectedTicket: string,
    price: number
  ) {
    const txb = this.createTransactionBlock();
    txb.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.APP}::${CONTRACT_CONFIG.FUNCTIONS.LIST_TICKET_FOR_RESELL}`,
      arguments: [
        txb.object(kiosk),
        txb.object(kioskCap),
        txb.object(transferPolicy),
        txb.object(activity),
        txb.object(protectedTicket),
        txb.pure(price),
      ],
    });
    return txb;
  }

  async delistTicket(
    kiosk: string,
    kioskCap: string,
    ticketId: string
  ) {
    const txb = this.createTransactionBlock();
    txb.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.APP}::${CONTRACT_CONFIG.FUNCTIONS.DELIST_TICKET}`,
      arguments: [
        txb.object(kiosk),
        txb.object(kioskCap),
        txb.pure(ticketId),
      ],
    });
    return txb;
  }

  async purchaseTicket(
    kiosk: string,
    payment: string,
    ticketId: string,
    activity: string,
    organizerProfile: string,
    platform: string,
    transferPolicy: string
  ) {
    const txb = this.createTransactionBlock();
    txb.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.APP}::${CONTRACT_CONFIG.FUNCTIONS.PURCHASE_TICKET}`,
      arguments: [
        txb.object(kiosk),
        txb.object(payment),
        txb.pure(ticketId),
        txb.object(activity),
        txb.object(organizerProfile),
        txb.object(platform),
        txb.object(transferPolicy),
      ],
    });
    return txb;
  }

  async getTicketPrice(kiosk: string, ticketId: string) {
    const txb = this.createTransactionBlock();
    txb.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.APP}::${CONTRACT_CONFIG.FUNCTIONS.GET_TICKET_PRICE}`,
      arguments: [txb.object(kiosk), txb.pure(ticketId)],
    });
    return txb;
  }

  async isTicketListed(kiosk: string, ticketId: string) {
    const txb = this.createTransactionBlock();
    txb.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.APP}::${CONTRACT_CONFIG.FUNCTIONS.IS_TICKET_LISTED}`,
      arguments: [txb.object(kiosk), txb.pure(ticketId)],
    });
    return txb;
  }

  // Transfer Policy module functions
  async newPolicy(publisher: string) {
    const txb = this.createTransactionBlock();
    txb.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.TICKET_TRANSFER_POLICY}::${CONTRACT_CONFIG.FUNCTIONS.NEW_POLICY}`,
      arguments: [txb.object(publisher)],
    });
    return txb;
  }

  async addRoyaltyFeeRule(
    transferPolicy: string,
    transferPolicyCap: string,
    feeBp: number,
    minFee: number
  ) {
    const txb = this.createTransactionBlock();
    txb.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.TICKET_TRANSFER_POLICY}::${CONTRACT_CONFIG.FUNCTIONS.ADD_ROYALTY_FEE_RULE}`,
      arguments: [
        txb.object(transferPolicy),
        txb.object(transferPolicyCap),
        txb.pure(feeBp),
        txb.pure(minFee),
      ],
    });
    return txb;
  }

  async calculateRoyaltyFee(transferPolicy: string, price: number) {
    const txb = this.createTransactionBlock();
    txb.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.TICKET_TRANSFER_POLICY}::${CONTRACT_CONFIG.FUNCTIONS.CALCULATE_ROYALTY_FEE}`,
      arguments: [txb.object(transferPolicy), txb.pure(price)],
    });
    return txb;
  }

  async addResellPriceLimitRule(
    transferPolicy: string,
    transferPolicyCap: string,
    priceLimitBp: number
  ) {
    const txb = this.createTransactionBlock();
    txb.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.TICKET_TRANSFER_POLICY}::${CONTRACT_CONFIG.FUNCTIONS.ADD_RESELL_PRICE_LIMIT_RULE}`,
      arguments: [
        txb.object(transferPolicy),
        txb.object(transferPolicyCap),
        txb.pure(priceLimitBp),
      ],
    });
    return txb;
  }

  async calculateResellPriceLimit(transferPolicy: string, originalPrice: number) {
    const txb = this.createTransactionBlock();
    txb.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.TICKET_TRANSFER_POLICY}::${CONTRACT_CONFIG.FUNCTIONS.CALCULATE_RESELL_PRICE_LIMIT}`,
      arguments: [txb.object(transferPolicy), txb.pure(originalPrice)],
    });
    return txb;
  }

  async addPlatformFeeRule(
    transferPolicy: string,
    transferPolicyCap: string,
    feeBp: number,
    minFee: number
  ) {
    const txb = this.createTransactionBlock();
    txb.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.TICKET_TRANSFER_POLICY}::${CONTRACT_CONFIG.FUNCTIONS.ADD_PLATFORM_FEE_RULE}`,
      arguments: [
        txb.object(transferPolicy),
        txb.object(transferPolicyCap),
        txb.pure(feeBp),
        txb.pure(minFee),
      ],
    });
    return txb;
  }

  async calculatePlatformFee(transferPolicy: string, price: number) {
    const txb = this.createTransactionBlock();
    txb.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.TICKET_TRANSFER_POLICY}::${CONTRACT_CONFIG.FUNCTIONS.CALCULATE_PLATFORM_FEE}`,
      arguments: [txb.object(transferPolicy), txb.pure(price)],
    });
    return txb;
  }

  // Get object by ID
  async getObject(objectId: string) {
    try {
      return await this.client.getObject({
        id: objectId,
        options: {
          showContent: true,
          showDisplay: true,
          showType: true,
          showOwner: true,
          showPreviousTransaction: true,
          showStorageRebate: true,
        },
      });
    } catch (error) {
      console.error('Failed to get object:', error);
      throw error;
    }
  }

  // Get objects by owner
  async getObjectsByOwner(owner: string) {
    try {
      return await this.client.getOwnedObjects({
        owner,
        options: {
          showContent: true,
          showDisplay: true,
          showType: true,
          showOwner: true,
        },
      });
    } catch (error) {
      console.error('Failed to get objects by owner:', error);
      throw error;
    }
  }

  // Get events
  async getEvents(module: string, eventType?: string) {
    try {
      const query = {
        MoveModule: {
          package: this.packageId,
          module,
        },
      };
      
      if (eventType) {
        (query as Record<string, unknown>).MoveEventType = `${this.packageId}::${module}::${eventType}`;
      }

      return await this.client.queryEvents({
        query,
        limit: 50,
        order: 'descending',
      });
    } catch (error) {
      console.error('Failed to get events:', error);
      throw error;
    }
  }
}

// Create contract instance
export function createContract(packageId: string) {
  return new JastronPassContract(packageId);
}

export const jastronPassContract = createContract(PACKAGE_ID);