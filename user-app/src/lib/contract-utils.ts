import { Transaction } from '@mysten/sui/transactions';
import { CONTRACT_CONFIG, GAS_CONFIG, PACKAGE_ID } from './sui-config';
import { getDefaultSuiClient } from './sui-client';

// Contract interaction utilities
export class JastronPassContract {
  private packageId: string;
  private client: ReturnType<typeof getDefaultSuiClient>;

  constructor(packageId: string = PACKAGE_ID) {
    this.packageId = packageId;
    this.client = getDefaultSuiClient();
  }

  // Create transaction
  private createTransaction(): Transaction {
    const tx = new Transaction();
    tx.setGasBudget(GAS_CONFIG.DEFAULT_BUDGET);
    return tx;
  }

  // App module functions
  async registerOrganizerProfile() {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.APP}::${CONTRACT_CONFIG.FUNCTIONS.REGISTER_ORGANIZER_PROFILE}`,
      arguments: [],
    });
    return tx;
  }

  async registerUserProfile(receiver: string) {
    const tx = this.createTransaction();
    const userCap = tx.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.APP}::${CONTRACT_CONFIG.FUNCTIONS.REGISTER_USER_PROFILE}`,
      arguments: [],
    });
    
    // Transfer the returned UserCap to the receiver
    tx.transferObjects([userCap], receiver);
    return tx;
  }

  async createActivity(
    organizerCap: string,
    organizerProfile: string,
    totalSupply: number,
    ticketPrice: number,
    saleEndedAt: number
  ) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.APP}::${CONTRACT_CONFIG.FUNCTIONS.CREATE_ACTIVITY}`,
      arguments: [
        tx.object(organizerCap),
        tx.object(organizerProfile),
        tx.pure.u64(totalSupply),
        tx.pure.u64(ticketPrice),
        tx.pure.u64(saleEndedAt),
      ],
    });
    return tx;
  }

  async buyTicketFromOrganizer(
    activity: string,
    payment: string,
    platform: string,
    transferPolicy: string,
    organizerProfile: string,
    ticketReceiverProfile: string
  ) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.APP}::${CONTRACT_CONFIG.FUNCTIONS.BUY_TICKET_FROM_ORGANIZER}`,
      arguments: [
        tx.object(activity),
        tx.object(payment),
        tx.object(platform),
        tx.object(transferPolicy),
        tx.object(organizerProfile),
        tx.object(ticketReceiverProfile),
      ],
    });
    return tx;
  }

  async createKiosk(userProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.APP}::${CONTRACT_CONFIG.FUNCTIONS.CREATE_KIOSK}`,
      arguments: [tx.object(userProfile)],
    });
    return tx;
  }

  async listTicketForResell(
    kiosk: string,
    kioskCap: string,
    transferPolicy: string,
    activity: string,
    protectedTicket: string,
    price: number
  ) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.APP}::${CONTRACT_CONFIG.FUNCTIONS.LIST_TICKET_FOR_RESELL}`,
      arguments: [
        tx.object(kiosk),
        tx.object(kioskCap),
        tx.object(transferPolicy),
        tx.object(activity),
        tx.object(protectedTicket),
        tx.pure.u64(price),
      ],
    });
    return tx;
  }

  async delistTicket(
    kiosk: string,
    kioskCap: string,
    ticketId: string
  ) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.APP}::${CONTRACT_CONFIG.FUNCTIONS.DELIST_TICKET}`,
      arguments: [
        tx.object(kiosk),
        tx.object(kioskCap),
        tx.pure.string(ticketId),
      ],
    });
    return tx;
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
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.APP}::${CONTRACT_CONFIG.FUNCTIONS.PURCHASE_TICKET}`,
      arguments: [
        tx.object(kiosk),
        tx.object(payment),
        tx.pure.string(ticketId),
        tx.object(activity),
        tx.object(organizerProfile),
        tx.object(platform),
        tx.object(transferPolicy),
      ],
    });
    return tx;
  }

  async getTicketPrice(kiosk: string, ticketId: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.APP}::${CONTRACT_CONFIG.FUNCTIONS.GET_TICKET_PRICE}`,
      arguments: [tx.object(kiosk), tx.pure.string(ticketId)],
    });
    return tx;
  }

  async isTicketListed(kiosk: string, ticketId: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.APP}::${CONTRACT_CONFIG.FUNCTIONS.IS_TICKET_LISTED}`,
      arguments: [tx.object(kiosk), tx.pure.string(ticketId)],
    });
    return tx;
  }

  // Transfer Policy module functions
  async newPolicy(publisher: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.TICKET_TRANSFER_POLICY}::${CONTRACT_CONFIG.FUNCTIONS.NEW_POLICY}`,
      arguments: [tx.object(publisher)],
    });
    return tx;
  }

  async addRoyaltyFeeRule(
    transferPolicy: string,
    transferPolicyCap: string,
    feeBp: number,
    minFee: number
  ) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.TICKET_TRANSFER_POLICY}::${CONTRACT_CONFIG.FUNCTIONS.ADD_ROYALTY_FEE_RULE}`,
      arguments: [
        tx.object(transferPolicy),
        tx.object(transferPolicyCap),
        tx.pure.u64(feeBp),
        tx.pure.u64(minFee),
      ],
    });
    return tx;
  }

  async calculateRoyaltyFee(transferPolicy: string, price: number) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.TICKET_TRANSFER_POLICY}::${CONTRACT_CONFIG.FUNCTIONS.CALCULATE_ROYALTY_FEE}`,
      arguments: [tx.object(transferPolicy), tx.pure.u64(price)],
    });
    return tx;
  }

  async addResellPriceLimitRule(
    transferPolicy: string,
    transferPolicyCap: string,
    priceLimitBp: number
  ) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.TICKET_TRANSFER_POLICY}::${CONTRACT_CONFIG.FUNCTIONS.ADD_RESELL_PRICE_LIMIT_RULE}`,
      arguments: [
        tx.object(transferPolicy),
        tx.object(transferPolicyCap),
        tx.pure.u64(priceLimitBp),
      ],
    });
    return tx;
  }

  async calculateResellPriceLimit(transferPolicy: string, originalPrice: number) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.TICKET_TRANSFER_POLICY}::${CONTRACT_CONFIG.FUNCTIONS.CALCULATE_RESELL_PRICE_LIMIT}`,
      arguments: [tx.object(transferPolicy), tx.pure.u64(originalPrice)],
    });
    return tx;
  }

  async addPlatformFeeRule(
    transferPolicy: string,
    transferPolicyCap: string,
    feeBp: number,
    minFee: number
  ) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.TICKET_TRANSFER_POLICY}::${CONTRACT_CONFIG.FUNCTIONS.ADD_PLATFORM_FEE_RULE}`,
      arguments: [
        tx.object(transferPolicy),
        tx.object(transferPolicyCap),
        tx.pure.u64(feeBp),
        tx.pure.u64(minFee),
      ],
    });
    return tx;
  }

  async calculatePlatformFee(transferPolicy: string, price: number) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${CONTRACT_CONFIG.MODULES.TICKET_TRANSFER_POLICY}::${CONTRACT_CONFIG.FUNCTIONS.CALCULATE_PLATFORM_FEE}`,
      arguments: [tx.object(transferPolicy), tx.pure.u64(price)],
    });
    return tx;
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