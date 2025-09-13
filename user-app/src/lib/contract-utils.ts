import { Transaction } from '@mysten/sui/transactions';
import { JASTRON_PASS_PACKAGE, GAS_CONFIG, getPackageId, getPlatformId, getPublisherId, SuiNetwork } from './sui-config';
import { getSuiClient } from './sui-client';

// Contract interaction utilities
export class JastronPassContract {
  private packageId: string;
  private platformId: string;
  private publisherId: string;
  private client: ReturnType<typeof getSuiClient>;

  constructor(network: SuiNetwork) {
    this.packageId = getPackageId(network);
    this.platformId = getPlatformId(network);
    this.publisherId = getPublisherId(network);
    this.client = getSuiClient(network);
  }

  // Create transaction
  private createTransaction(): Transaction {
    const tx = new Transaction();
    tx.setGasBudget(GAS_CONFIG.DEFAULT_BUDGET);
    return tx;
  }

  // App module functions
  async registerOrganizerProfile(platform: string, name: string, receiver: string) {
    const tx = this.createTransaction();
    const organizerCap = tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.APP}::${JASTRON_PASS_PACKAGE.FUNCTIONS.REGISTER_ORGANIZER_PROFILE}`,
      arguments: [
        tx.object(platform),
        tx.pure.string(name),
      ],
    });
    tx.transferObjects([organizerCap], receiver);
    return tx;
  }

  async registerUserProfile(platform: string, name: string, receiver: string) {
    const tx = this.createTransaction();
    const userCap = tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.APP}::${JASTRON_PASS_PACKAGE.FUNCTIONS.REGISTER_USER_PROFILE}`,
      arguments: [
        tx.object(platform),
        tx.pure.string(name),
      ],
    });
    
    // Transfer the returned UserCap to the receiver
    tx.transferObjects([userCap], receiver);
    return tx;
  }

  async createActivity(
    organizerCap: string,
    organizerProfile: string,
    platform: string,
    name: string,
    totalSupply: number,
    ticketPrice: number,
    saleEndedAt: number
  ) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.APP}::${JASTRON_PASS_PACKAGE.FUNCTIONS.CREATE_ACTIVITY}`,
      arguments: [
        tx.object(organizerCap),
        tx.object(organizerProfile),
        tx.object(platform),
        tx.pure.string(name),
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
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.APP}::${JASTRON_PASS_PACKAGE.FUNCTIONS.BUY_TICKET_FROM_ORGANIZER}`,
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

  async attendActivity(
    protectedTicket: string,
    userProfile: string,
    activity: string
  ) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.APP}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ATTEND_ACTIVITY}`,
      arguments: [
        tx.object(protectedTicket),
        tx.object(userProfile),
        tx.object(activity),
      ],
    });
    return tx;
  }

  async createKiosk(userProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.APP}::${JASTRON_PASS_PACKAGE.FUNCTIONS.CREATE_KIOSK}`,
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
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.APP}::${JASTRON_PASS_PACKAGE.FUNCTIONS.LIST_TICKET_FOR_RESELL}`,
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
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.APP}::${JASTRON_PASS_PACKAGE.FUNCTIONS.DELIST_TICKET}`,
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
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.APP}::${JASTRON_PASS_PACKAGE.FUNCTIONS.PURCHASE_TICKET}`,
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
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.APP}::${JASTRON_PASS_PACKAGE.FUNCTIONS.GET_TICKET_PRICE}`,
      arguments: [tx.object(kiosk), tx.pure.string(ticketId)],
    });
    return tx;
  }

  async isTicketListed(kiosk: string, ticketId: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.APP}::${JASTRON_PASS_PACKAGE.FUNCTIONS.IS_TICKET_LISTED}`,
      arguments: [tx.object(kiosk), tx.pure.string(ticketId)],
    });
    return tx;
  }

  // Platform module functions (readonly)
  async getPlatformTreasury(platform: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.PLATFORM}::${JASTRON_PASS_PACKAGE.FUNCTIONS.PLATFORM_GET_TREASURY}`,
      arguments: [tx.object(platform)],
    });
    return tx;
  }

  async isUserRegistered(platform: string, userProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.PLATFORM}::${JASTRON_PASS_PACKAGE.FUNCTIONS.PLATFORM_IS_USER_REGISTERED}`,
      arguments: [tx.object(platform), tx.pure.string(userProfile)],
    });
    return tx;
  }

  async isOrganizerRegistered(platform: string, organizerProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.PLATFORM}::${JASTRON_PASS_PACKAGE.FUNCTIONS.PLATFORM_IS_ORGANIZER_REGISTERED}`,
      arguments: [tx.object(platform), tx.pure.string(organizerProfile)],
    });
    return tx;
  }

  async getRegisteredUsersCount(platform: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.PLATFORM}::${JASTRON_PASS_PACKAGE.FUNCTIONS.PLATFORM_GET_REGISTERED_USERS_COUNT}`,
      arguments: [tx.object(platform)],
    });
    return tx;
  }

  async getRegisteredOrganizersCount(platform: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.PLATFORM}::${JASTRON_PASS_PACKAGE.FUNCTIONS.PLATFORM_GET_REGISTERED_ORGANIZERS_COUNT}`,
      arguments: [tx.object(platform)],
    });
    return tx;
  }

  async getNumActivities(platform: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.PLATFORM}::${JASTRON_PASS_PACKAGE.FUNCTIONS.PLATFORM_GET_NUM_ACTIVITIES}`,
      arguments: [tx.object(platform)],
    });
    return tx;
  }

  // Organizer module functions (readonly)
  async getOrganizerProfileId(organizerProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.ORGANIZER}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ORGANIZER_GET_PROFILE_ID}`,
      arguments: [tx.object(organizerProfile)],
    });
    return tx;
  }

  async getOrganizerTreasury(organizerProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.ORGANIZER}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ORGANIZER_GET_TREASURY}`,
      arguments: [tx.object(organizerProfile)],
    });
    return tx;
  }

  // User module functions (readonly)
  async getUserProfileId(userProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.USER}::${JASTRON_PASS_PACKAGE.FUNCTIONS.USER_GET_PROFILE_ID}`,
      arguments: [tx.object(userProfile)],
    });
    return tx;
  }

  async getUserTreasury(userProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.USER}::${JASTRON_PASS_PACKAGE.FUNCTIONS.USER_GET_TREASURY}`,
      arguments: [tx.object(userProfile)],
    });
    return tx;
  }

  async hasUserAttendedActivity(userProfile: string, activityId: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.USER}::${JASTRON_PASS_PACKAGE.FUNCTIONS.USER_HAS_ATTENDED_ACTIVITY}`,
      arguments: [tx.object(userProfile), tx.pure.string(activityId)],
    });
    return tx;
  }

  async getAttendedActivitiesCount(userProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.USER}::${JASTRON_PASS_PACKAGE.FUNCTIONS.USER_GET_ATTENDED_ACTIVITIES_COUNT}`,
      arguments: [tx.object(userProfile)],
    });
    return tx;
  }

  // Activity module functions (readonly)
  async getActivityId(activity: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.ACTIVITY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ACTIVITY_GET_ID}`,
      arguments: [tx.object(activity)],
    });
    return tx;
  }

  async getActivityOrganizerProfileId(activity: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.ACTIVITY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ACTIVITY_GET_ORGANIZER_PROFILE_ID}`,
      arguments: [tx.object(activity)],
    });
    return tx;
  }

  async hasAvailableTickets(activity: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.ACTIVITY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ACTIVITY_HAS_AVAILABLE_TICKETS}`,
      arguments: [tx.object(activity)],
    });
    return tx;
  }

  async getRemainingTickets(activity: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.ACTIVITY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ACTIVITY_GET_REMAINING_TICKETS}`,
      arguments: [tx.object(activity)],
    });
    return tx;
  }

  async getActivityTicketPrice(activity: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.ACTIVITY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ACTIVITY_GET_TICKET_PRICE}`,
      arguments: [tx.object(activity)],
    });
    return tx;
  }

  async getTotalSupply(activity: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.ACTIVITY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ACTIVITY_GET_TOTAL_SUPPLY}`,
      arguments: [tx.object(activity)],
    });
    return tx;
  }

  async getTicketsSold(activity: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.ACTIVITY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ACTIVITY_GET_TICKETS_SOLD}`,
      arguments: [tx.object(activity)],
    });
    return tx;
  }

  async getSaleEndedAt(activity: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.ACTIVITY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ACTIVITY_GET_SALE_ENDED_AT}`,
      arguments: [tx.object(activity)],
    });
    return tx;
  }

  async isSaleEnded(activity: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.ACTIVITY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ACTIVITY_IS_SALE_ENDED}`,
      arguments: [tx.object(activity)],
    });
    return tx;
  }

  async hasAttendee(activity: string, userProfileId: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.ACTIVITY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ACTIVITY_HAS_ATTENDEE}`,
      arguments: [tx.object(activity), tx.pure.string(userProfileId)],
    });
    return tx;
  }

  // Ticket module functions (readonly)
  async getTicketId(ticket: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.TICKET}::${JASTRON_PASS_PACKAGE.FUNCTIONS.TICKET_GET_ID}`,
      arguments: [tx.object(ticket)],
    });
    return tx;
  }

  async getTicketActivityId(ticket: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.TICKET}::${JASTRON_PASS_PACKAGE.FUNCTIONS.TICKET_GET_ACTIVITY_ID}`,
      arguments: [tx.object(ticket)],
    });
    return tx;
  }

  async isTicketClipped(ticket: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.TICKET}::${JASTRON_PASS_PACKAGE.FUNCTIONS.TICKET_IS_CLIPPED}`,
      arguments: [tx.object(ticket)],
    });
    return tx;
  }

  async isTicketBound(ticket: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.TICKET}::${JASTRON_PASS_PACKAGE.FUNCTIONS.TICKET_IS_BOUND}`,
      arguments: [tx.object(ticket)],
    });
    return tx;
  }

  async getProtectedTicketInnerId(protectedTicket: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.TICKET}::${JASTRON_PASS_PACKAGE.FUNCTIONS.TICKET_GET_INNER_ID}`,
      arguments: [tx.object(protectedTicket)],
    });
    return tx;
  }

  async getProtectedTicketInnerActivityId(protectedTicket: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.TICKET}::${JASTRON_PASS_PACKAGE.FUNCTIONS.TICKET_GET_INNER_ACTIVITY_ID}`,
      arguments: [tx.object(protectedTicket)],
    });
    return tx;
  }

  async getProtectedTicketInnerOwnerProfileId(protectedTicket: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.TICKET}::${JASTRON_PASS_PACKAGE.FUNCTIONS.TICKET_GET_INNER_OWNER_PROFILE_ID}`,
      arguments: [tx.object(protectedTicket)],
    });
    return tx;
  }

  // Transfer Policy module functions
  async newPolicy(publisher: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.TICKET_TRANSFER_POLICY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.NEW_POLICY}`,
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
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.TICKET_TRANSFER_POLICY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ADD_ROYALTY_FEE_RULE}`,
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
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.TICKET_TRANSFER_POLICY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.CALCULATE_ROYALTY_FEE}`,
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
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.TICKET_TRANSFER_POLICY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ADD_RESELL_PRICE_LIMIT_RULE}`,
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
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.TICKET_TRANSFER_POLICY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.CALCULATE_RESELL_PRICE_LIMIT}`,
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
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.TICKET_TRANSFER_POLICY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ADD_PLATFORM_FEE_RULE}`,
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
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.TICKET_TRANSFER_POLICY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.CALCULATE_PLATFORM_FEE}`,
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

  // Helper methods for readonly functions (these should be called via dryRun or devInspectTransaction)
  async callReadonlyFunction(tx: Transaction) {
    try {
      return await this.client.devInspectTransactionBlock({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transactionBlock: tx as any, // Type assertion for compatibility between Transaction and TransactionBlock
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000', // dummy address for readonly calls
      });
    } catch (error) {
      console.error('Failed to call readonly function:', error);
      throw error;
    }
  }

  // Platform readonly function calls
  async getPlatformTreasuryValue(platform: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.PLATFORM}::${JASTRON_PASS_PACKAGE.FUNCTIONS.PLATFORM_GET_TREASURY}`,
      arguments: [tx.object(platform)],
    });
    return this.callReadonlyFunction(tx);
  }

  async isUserRegisteredValue(platform: string, userProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.PLATFORM}::${JASTRON_PASS_PACKAGE.FUNCTIONS.PLATFORM_IS_USER_REGISTERED}`,
      arguments: [tx.object(platform), tx.pure.string(userProfile)],
    });
    return this.callReadonlyFunction(tx);
  }

  async isOrganizerRegisteredValue(platform: string, organizerProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.PLATFORM}::${JASTRON_PASS_PACKAGE.FUNCTIONS.PLATFORM_IS_ORGANIZER_REGISTERED}`,
      arguments: [tx.object(platform), tx.pure.string(organizerProfile)],
    });
    return this.callReadonlyFunction(tx);
  }

  async getRegisteredUsersCountValue(platform: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.PLATFORM}::${JASTRON_PASS_PACKAGE.FUNCTIONS.PLATFORM_GET_REGISTERED_USERS_COUNT}`,
      arguments: [tx.object(platform)],
    });
    return this.callReadonlyFunction(tx);
  }

  async getRegisteredOrganizersCountValue(platform: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.PLATFORM}::${JASTRON_PASS_PACKAGE.FUNCTIONS.PLATFORM_GET_REGISTERED_ORGANIZERS_COUNT}`,
      arguments: [tx.object(platform)],
    });
    return this.callReadonlyFunction(tx);
  }

  async getNumActivitiesValue(platform: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.PLATFORM}::${JASTRON_PASS_PACKAGE.FUNCTIONS.PLATFORM_GET_NUM_ACTIVITIES}`,
      arguments: [tx.object(platform)],
    });
    return this.callReadonlyFunction(tx);
  }

  // Activity readonly function calls
  async hasAvailableTicketsValue(activity: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.ACTIVITY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ACTIVITY_HAS_AVAILABLE_TICKETS}`,
      arguments: [tx.object(activity)],
    });
    return this.callReadonlyFunction(tx);
  }

  async getRemainingTicketsValue(activity: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.ACTIVITY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ACTIVITY_GET_REMAINING_TICKETS}`,
      arguments: [tx.object(activity)],
    });
    return this.callReadonlyFunction(tx);
  }

  async getActivityTicketPriceValue(activity: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.ACTIVITY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ACTIVITY_GET_TICKET_PRICE}`,
      arguments: [tx.object(activity)],
    });
    return this.callReadonlyFunction(tx);
  }

  async getTotalSupplyValue(activity: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.ACTIVITY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ACTIVITY_GET_TOTAL_SUPPLY}`,
      arguments: [tx.object(activity)],
    });
    return this.callReadonlyFunction(tx);
  }

  async getTicketsSoldValue(activity: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.ACTIVITY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ACTIVITY_GET_TICKETS_SOLD}`,
      arguments: [tx.object(activity)],
    });
    return this.callReadonlyFunction(tx);
  }

  async isSaleEndedValue(activity: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.ACTIVITY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ACTIVITY_IS_SALE_ENDED}`,
      arguments: [tx.object(activity)],
    });
    return this.callReadonlyFunction(tx);
  }

  // User readonly function calls
  async hasUserAttendedActivityValue(userProfile: string, activityId: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.USER}::${JASTRON_PASS_PACKAGE.FUNCTIONS.USER_HAS_ATTENDED_ACTIVITY}`,
      arguments: [tx.object(userProfile), tx.pure.string(activityId)],
    });
    return this.callReadonlyFunction(tx);
  }

  async getAttendedActivitiesCountValue(userProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.USER}::${JASTRON_PASS_PACKAGE.FUNCTIONS.USER_GET_ATTENDED_ACTIVITIES_COUNT}`,
      arguments: [tx.object(userProfile)],
    });
    return this.callReadonlyFunction(tx);
  }

  // Ticket readonly function calls
  async isTicketClippedValue(ticket: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.TICKET}::${JASTRON_PASS_PACKAGE.FUNCTIONS.TICKET_IS_CLIPPED}`,
      arguments: [tx.object(ticket)],
    });
    return this.callReadonlyFunction(tx);
  }

  async isTicketBoundValue(ticket: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.TICKET}::${JASTRON_PASS_PACKAGE.FUNCTIONS.TICKET_IS_BOUND}`,
      arguments: [tx.object(ticket)],
    });
    return this.callReadonlyFunction(tx);
  }
}

// Create contract instance
export function createContract(packageId: SuiNetwork) {
  return new JastronPassContract(packageId);
}
