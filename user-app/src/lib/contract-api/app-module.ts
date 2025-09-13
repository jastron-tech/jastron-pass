import { JASTRON_PASS } from '../sui-config';
import { BaseContract } from './base-contract';

export class AppModule extends BaseContract {
  // App module functions
  async registerOrganizerProfile(platform: string, name: string, receiver: string) {
    const tx = this.createTransaction();
    const organizerCap = tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.APP}::${JASTRON_PASS.FUNCTIONS.REGISTER_ORGANIZER_PROFILE}`,
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
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.APP}::${JASTRON_PASS.FUNCTIONS.REGISTER_USER_PROFILE}`,
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
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.APP}::${JASTRON_PASS.FUNCTIONS.CREATE_ACTIVITY}`,
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
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.APP}::${JASTRON_PASS.FUNCTIONS.BUY_TICKET_FROM_ORGANIZER}`,
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
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.APP}::${JASTRON_PASS.FUNCTIONS.ATTEND_ACTIVITY}`,
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
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.APP}::${JASTRON_PASS.FUNCTIONS.CREATE_KIOSK}`,
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
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.APP}::${JASTRON_PASS.FUNCTIONS.LIST_TICKET_FOR_RESELL}`,
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
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.APP}::${JASTRON_PASS.FUNCTIONS.DELIST_TICKET}`,
      arguments: [
        tx.object(kiosk),
        tx.object(kioskCap),
        tx.object(ticketId),
      ],
    });
    return tx;
  }

  async delistTicketFromKiosk(
    kiosk: string,
    kioskCap: string,
    ticketId: string,
    receiverProfile: string
  ) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.APP}::${JASTRON_PASS.FUNCTIONS.DELIST_TICKET_FROM_KIOSK}`,
      arguments: [tx.object(kiosk), tx.object(kioskCap), tx.object(ticketId), tx.object(receiverProfile)],
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
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.APP}::${JASTRON_PASS.FUNCTIONS.PURCHASE_TICKET}`,
      arguments: [
        tx.object(kiosk),
        tx.object(payment),
        tx.object(ticketId),
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
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.APP}::${JASTRON_PASS.FUNCTIONS.GET_TICKET_PRICE}`,
      arguments: [tx.object(kiosk), tx.object(ticketId)],
    });
    return tx;
  }

  async getTicketPriceValue(kiosk: string, ticketId: string) {
    const tx = this.getTicketPrice(kiosk, ticketId);
    return this.callReadonlyFunction(await tx);
  }

  async isTicketListed(kiosk: string, ticketId: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.APP}::${JASTRON_PASS.FUNCTIONS.IS_TICKET_LISTED}`,
      arguments: [tx.object(kiosk), tx.object(ticketId)],
    });
    return tx;
  }

  async isTicketListedValue(kiosk: string, ticketId: string) {
    const tx = this.isTicketListed(kiosk, ticketId);
    return this.callReadonlyFunction(await tx);
  }
}
