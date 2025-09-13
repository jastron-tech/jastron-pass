import { JASTRON_PASS_PACKAGE } from '../sui-config';
import { BaseContract } from './base-contract';

export class ActivityModule extends BaseContract {
  // Activity module functions (readonly)
  async getActivityId(activity: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.ACTIVITY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ACTIVITY_GET_ID}`,
      arguments: [tx.object(activity)],
    });
    return tx;
  }

  async getActivityName(activity: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.ACTIVITY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ACTIVITY_GET_NAME}`,
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

  async getActivityNameValue(activity: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.ACTIVITY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ACTIVITY_GET_NAME}`,
      arguments: [tx.object(activity)],
    });
    return this.callReadonlyFunction(tx);
  }

  async getActivityIdValue(activity: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.ACTIVITY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ACTIVITY_GET_ID}`,
      arguments: [tx.object(activity)],
    });
    return this.callReadonlyFunction(tx);
  }

  async getActivityOrganizerProfileIdValue(activity: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.ACTIVITY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ACTIVITY_GET_ORGANIZER_PROFILE_ID}`,
      arguments: [tx.object(activity)],
    });
    return this.callReadonlyFunction(tx);
  }

  async getSaleEndedAtValue(activity: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.ACTIVITY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ACTIVITY_GET_SALE_ENDED_AT}`,
      arguments: [tx.object(activity)],
    });
    return this.callReadonlyFunction(tx);
  }

  async hasAttendeeValue(activity: string, userProfileId: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.ACTIVITY}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ACTIVITY_HAS_ATTENDEE}`,
      arguments: [tx.object(activity), tx.pure.string(userProfileId)],
    });
    return this.callReadonlyFunction(tx);
  }
}
