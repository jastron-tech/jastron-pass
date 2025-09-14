import { SuiNetwork } from './sui-config';
import { 
  AppModule, 
  PlatformModule, 
  OrganizerModule, 
  UserModule, 
  ActivityModule, 
  TicketModule, 
  TransferPolicyModule 
} from './contract-api';

// Main contract class that combines all modules
export class JastronPassContract {
  public app: AppModule;
  public platform: PlatformModule;
  public organizer: OrganizerModule;
  public user: UserModule;
  public activity: ActivityModule;
  public ticket: TicketModule;
  public transferPolicy: TransferPolicyModule;

  constructor(network: SuiNetwork) {
    this.app = new AppModule(network);
    this.platform = new PlatformModule(network);
    this.organizer = new OrganizerModule(network);
    this.user = new UserModule(network);
    this.activity = new ActivityModule(network);
    this.ticket = new TicketModule(network);
    this.transferPolicy = new TransferPolicyModule(network);
  }

  // Convenience methods for backward compatibility
  // These delegate to the appropriate modules

  // App module convenience methods
  async registerOrganizerProfile(platform: string, name: string, receiver: string) {
    return this.app.registerOrganizerProfile(platform, name, receiver);
  }

  async registerUserProfile(platform: string, name: string, receiver: string) {
    return this.app.registerUserProfile(platform, name, receiver);
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
    return this.app.createActivity(organizerCap, organizerProfile, platform, name, totalSupply, ticketPrice, saleEndedAt);
  }

  async buyTicketFromOrganizer(
    activity: string,
    payment: string,
    platform: string,
    transferPolicy: string,
    organizerProfile: string,
    ticketReceiverProfile: string
  ) {
    return this.app.buyTicketFromOrganizer(activity, payment, platform, transferPolicy, organizerProfile, ticketReceiverProfile);
  }

  async attendActivity(
    protectedTicket: string,
    userProfile: string,
    activity: string
  ) {
    return this.app.attendActivity(protectedTicket, userProfile, activity);
  }

  async createKiosk(userProfile: string) {
    return this.app.createKiosk(userProfile);
  }

  async listTicketForResell(
    kiosk: string,
    kioskCap: string,
    transferPolicy: string,
    activity: string,
    protectedTicket: string,
    price: number
  ) {
    return this.app.listTicketForResell(kiosk, kioskCap, transferPolicy, activity, protectedTicket, price);
  }

  async delistTicket(
    kiosk: string,
    kioskCap: string,
    ticketId: string
  ) {
    return this.app.delistTicket(kiosk, kioskCap, ticketId);
  }

  async delistTicketFromKiosk(
    kiosk: string,
    kioskCap: string,
    ticketId: string,
    receiverProfile: string
  ) {
    return this.app.delistTicketFromKiosk(kiosk, kioskCap, ticketId, receiverProfile);
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
    return this.app.purchaseTicket(kiosk, payment, ticketId, activity, organizerProfile, platform, transferPolicy);
  }

  async getTicketPrice(kiosk: string, ticketId: string) {
    return this.app.getTicketPrice(kiosk, ticketId);
  }

  async getTicketPriceValue(kiosk: string, ticketId: string) {
    return this.app.getTicketPriceValue(kiosk, ticketId);
  }

  async isTicketListed(kiosk: string, ticketId: string) {
    return this.app.isTicketListed(kiosk, ticketId);
  }

  async isTicketListedValue(kiosk: string, ticketId: string) {
    return this.app.isTicketListedValue(kiosk, ticketId);
  }

  // Platform module convenience methods
  async getPlatformTreasury(platform: string) {
    return this.platform.getPlatformTreasury(platform);
  }

  async isUserRegistered(platform: string, userProfile: string) {
    return this.platform.isUserRegistered(platform, userProfile);
  }

  async isOrganizerRegistered(platform: string, organizerProfile: string) {
    return this.platform.isOrganizerRegistered(platform, organizerProfile);
  }

  async getRegisteredUsersCount(platform: string) {
    return this.platform.getRegisteredUsersCount(platform);
  }

  async getRegisteredOrganizersCount(platform: string) {
    return this.platform.getRegisteredOrganizersCount(platform);
  }

  async getNumActivities(platform: string) {
    return this.platform.getNumActivities(platform);
  }

  async getUserRegisteredAt(platform: string, userProfile: string) {
    return this.platform.getUserRegisteredAt(platform, userProfile);
  }

  async getOrganizerRegisteredAt(platform: string, organizerProfile: string) {
    return this.platform.getOrganizerRegisteredAt(platform, organizerProfile);
  }

  async listActivities(platform: string) {
    return this.platform.listActivities(platform);
  }

  // Organizer module convenience methods
  async getOrganizerProfileId(organizerProfile: string) {
    return this.organizer.getOrganizerProfileId(organizerProfile);
  }

  async getOrganizerTreasury(organizerProfile: string) {
    return this.organizer.getOrganizerTreasury(organizerProfile);
  }

  async getOrganizerName(organizerProfile: string) {
    return this.organizer.getOrganizerName(organizerProfile);
  }

  // User module convenience methods
  async getUserProfileId(userProfile: string) {
    return this.user.getUserProfileId(userProfile);
  }

  async getUserTreasury(userProfile: string) {
    return this.user.getUserTreasury(userProfile);
  }

  async getUserName(userProfile: string) {
    return this.user.getUserName(userProfile);
  }

  async hasUserAttendedActivity(userProfile: string, activityId: string) {
    return this.user.hasUserAttendedActivity(userProfile, activityId);
  }

  async getAttendedActivitiesCount(userProfile: string) {
    return this.user.getAttendedActivitiesCount(userProfile);
  }

  async getAttendedAt(userProfile: string, activityId: string) {
    return this.user.getAttendedAt(userProfile, activityId);
  }

  // Activity module convenience methods
  async getActivityId(activity: string) {
    return this.activity.getActivityId(activity);
  }

  async getActivityName(activity: string) {
    return this.activity.getActivityName(activity);
  }

  async getActivityOrganizerProfileId(activity: string) {
    return this.activity.getActivityOrganizerProfileId(activity);
  }

  async hasAvailableTickets(activity: string) {
    return this.activity.hasAvailableTickets(activity);
  }

  async getRemainingTickets(activity: string) {
    return this.activity.getRemainingTickets(activity);
  }

  async getActivityTicketPrice(activity: string) {
    return this.activity.getActivityTicketPrice(activity);
  }

  async getTotalSupply(activity: string) {
    return this.activity.getTotalSupply(activity);
  }

  async getTicketsSold(activity: string) {
    return this.activity.getTicketsSold(activity);
  }

  async getSaleEndedAt(activity: string) {
    return this.activity.getSaleEndedAt(activity);
  }

  async isSaleEnded(activity: string) {
    return this.activity.isSaleEnded(activity);
  }

  async hasAttendee(activity: string, userProfileId: string) {
    return this.activity.hasAttendee(activity, userProfileId);
  }

  // Ticket module convenience methods
  async getTicketId(ticket: string) {
    return this.ticket.getTicketId(ticket);
  }

  async getTicketActivityId(ticket: string) {
    return this.ticket.getTicketActivityId(ticket);
  }

  async isTicketClipped(ticket: string) {
    return this.ticket.isTicketClipped(ticket);
  }

  async isTicketBound(ticket: string) {
    return this.ticket.isTicketBound(ticket);
  }

  async getProtectedTicketInnerId(protectedTicket: string) {
    return this.ticket.getProtectedTicketInnerId(protectedTicket);
  }

  async getProtectedTicketInnerActivityId(protectedTicket: string) {
    return this.ticket.getProtectedTicketInnerActivityId(protectedTicket);
  }

  async getProtectedTicketInnerOwnerProfileId(protectedTicket: string) {
    return this.ticket.getProtectedTicketInnerOwnerProfileId(protectedTicket);
  }

  // Transfer Policy module convenience methods
  async newPolicy(publisher: string) {
    return this.transferPolicy.newPolicy(publisher);
  }

  async addRoyaltyFeeRule(
    transferPolicy: string,
    transferPolicyCap: string,
    feeBp: number,
    minFee: number
  ) {
    return this.transferPolicy.addRoyaltyFeeRule(transferPolicy, transferPolicyCap, feeBp, minFee);
  }

  async calculateRoyaltyFee(transferPolicy: string, price: number) {
    return this.transferPolicy.calculateRoyaltyFee(transferPolicy, price);
  }

  async addResellPriceLimitRule(
    transferPolicy: string,
    transferPolicyCap: string,
    priceLimitBp: number
  ) {
    return this.transferPolicy.addResellPriceLimitRule(transferPolicy, transferPolicyCap, priceLimitBp);
  }

  async calculateResellPriceLimit(transferPolicy: string, originalPrice: number) {
    return this.transferPolicy.calculateResellPriceLimit(transferPolicy, originalPrice);
  }

  async addPlatformFeeRule(
    transferPolicy: string,
    transferPolicyCap: string,
    feeBp: number,
    minFee: number
  ) {
    return this.transferPolicy.addPlatformFeeRule(transferPolicy, transferPolicyCap, feeBp, minFee);
  }

  async calculatePlatformFee(transferPolicy: string, price: number) {
    return this.transferPolicy.calculatePlatformFee(transferPolicy, price);
  }

  async calculateRoyaltyFeeValue(transferPolicy: string, price: number) {
    return this.transferPolicy.calculateRoyaltyFeeValue(transferPolicy, price);
  }

  async calculatePlatformFeeValue(transferPolicy: string, price: number) {
    return this.transferPolicy.calculatePlatformFeeValue(transferPolicy, price);
  }

  // Get rule functions
  async getPlatformFeeRule(transferPolicy: string) {
    return this.transferPolicy.getPlatformFeeRule(transferPolicy);
  }

  async getRoyaltyFeeRule(transferPolicy: string) {
    return this.transferPolicy.getRoyaltyFeeRule(transferPolicy);
  }

  async getResellPriceLimitRule(transferPolicy: string) {
    return this.transferPolicy.getResellPriceLimitRule(transferPolicy);
  }

  // Utility methods (delegated to base contract)
  async getObject(objectId: string) {
    return this.app.getObject(objectId);
  }

  async getObjectsByOwner(owner: string) {
    return this.app.getObjectsByOwner(owner);
  }

  async getEvents(module: string, eventType?: string) {
    return this.app.getEvents(module, eventType);
  }

  // Readonly function calls (delegated to appropriate modules)
  async getPlatformTreasuryValue(platform: string) {
    return this.platform.getPlatformTreasuryValue(platform);
  }

  async isUserRegisteredValue(platform: string, userProfile: string) {
    return this.platform.isUserRegisteredValue(platform, userProfile);
  }

  async isOrganizerRegisteredValue(platform: string, organizerProfile: string) {
    return this.platform.isOrganizerRegisteredValue(platform, organizerProfile);
  }

  async getRegisteredUsersCountValue(platform: string) {
    return this.platform.getRegisteredUsersCountValue(platform);
  }

  async getRegisteredOrganizersCountValue(platform: string) {
    return this.platform.getRegisteredOrganizersCountValue(platform);
  }

  async getNumActivitiesValue(platform: string) {
    return this.platform.getNumActivitiesValue(platform);
  }

  async getUserRegisteredAtValue(platform: string, userProfile: string) {
    return this.platform.getUserRegisteredAtValue(platform, userProfile);
  }

  async getOrganizerRegisteredAtValue(platform: string, organizerProfile: string) {
    return this.platform.getOrganizerRegisteredAtValue(platform, organizerProfile);
  }

  async listActivitiesValue(platform: string) {
    return this.platform.listActivitiesValue(platform);
  }

  async getOrganizerProfileIdValue(organizerProfile: string) {
    return this.organizer.getOrganizerProfileIdValue(organizerProfile);
  }

  async getOrganizerTreasuryValue(organizerProfile: string) {
    return this.organizer.getOrganizerTreasuryValue(organizerProfile);
  }

  async getOrganizerNameValue(organizerProfile: string) {
    return this.organizer.getOrganizerNameValue(organizerProfile);
  }

  async hasUserAttendedActivityValue(userProfile: string, activityId: string) {
    return this.user.hasUserAttendedActivityValue(userProfile, activityId);
  }

  async getAttendedActivitiesCountValue(userProfile: string) {
    return this.user.getAttendedActivitiesCountValue(userProfile);
  }

  async getAttendedAtValue(userProfile: string, activityId: string) {
    return this.user.getAttendedAtValue(userProfile, activityId);
  }

  async getUserProfileIdValue(userProfile: string) {
    return this.user.getUserProfileIdValue(userProfile);
  }

  async getUserTreasuryValue(userProfile: string) {
    return this.user.getUserTreasuryValue(userProfile);
  }

  async getUserNameValue(userProfile: string) {
    return this.user.getUserNameValue(userProfile);
  }

  async hasAvailableTicketsValue(activity: string) {
    return this.activity.hasAvailableTicketsValue(activity);
  }

  async getRemainingTicketsValue(activity: string) {
    return this.activity.getRemainingTicketsValue(activity);
  }

  async getActivityTicketPriceValue(activity: string) {
    return this.activity.getActivityTicketPriceValue(activity);
  }

  async getTotalSupplyValue(activity: string) {
    return this.activity.getTotalSupplyValue(activity);
  }

  async getTicketsSoldValue(activity: string) {
    return this.activity.getTicketsSoldValue(activity);
  }

  async isSaleEndedValue(activity: string) {
    return this.activity.isSaleEndedValue(activity);
  }

  async getActivityNameValue(activity: string) {
    return this.activity.getActivityNameValue(activity);
  }

  async getActivityIdValue(activity: string) {
    return this.activity.getActivityIdValue(activity);
  }

  async getActivityOrganizerProfileIdValue(activity: string) {
    return this.activity.getActivityOrganizerProfileIdValue(activity);
  }

  async getSaleEndedAtValue(activity: string) {
    return this.activity.getSaleEndedAtValue(activity);
  }

  async hasAttendeeValue(activity: string, userProfileId: string) {
    return this.activity.hasAttendeeValue(activity, userProfileId);
  }

  async isTicketClippedValue(ticket: string) {
    return this.ticket.isTicketClippedValue(ticket);
  }

  async isTicketBoundValue(ticket: string) {
    return this.ticket.isTicketBoundValue(ticket);
  }

  async getTicketIdValue(ticket: string) {
    return this.ticket.getTicketIdValue(ticket);
  }

  async getTicketActivityIdValue(ticket: string) {
    return this.ticket.getTicketActivityIdValue(ticket);
  }

  async getProtectedTicketInnerIdValue(protectedTicket: string) {
    return this.ticket.getProtectedTicketInnerIdValue(protectedTicket);
  }

  async getProtectedTicketInnerActivityIdValue(protectedTicket: string) {
    return this.ticket.getProtectedTicketInnerActivityIdValue(protectedTicket);
  }

  async getProtectedTicketInnerOwnerProfileIdValue(protectedTicket: string) {
    return this.ticket.getProtectedTicketInnerOwnerProfileIdValue(protectedTicket);
  }

  // Transfer policy readonly functions
  async getPlatformFeeRuleValue(transferPolicy: string) {
    return this.transferPolicy.getPlatformFeeRuleValue(transferPolicy);
  }

  async getRoyaltyFeeRuleValue(transferPolicy: string) {
    return this.transferPolicy.getRoyaltyFeeRuleValue(transferPolicy);
  }

  async getResellPriceLimitRuleValue(transferPolicy: string) {
    return this.transferPolicy.getResellPriceLimitRuleValue(transferPolicy);
  }

  // TransferPolicyCap functions
  async getTransferPolicyCaps(owner: string) {
    return this.transferPolicy.getTransferPolicyCaps(owner);
  }

  async getTransferPolicyFromCap(transferPolicyCap: string) {
    return this.transferPolicy.getTransferPolicyFromCap(transferPolicyCap);
  }
}

// Create contract instance
export function createContract(network: SuiNetwork) {
  return new JastronPassContract(network);
}