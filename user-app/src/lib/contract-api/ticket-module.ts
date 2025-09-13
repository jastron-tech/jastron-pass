import { JASTRON_PASS_PACKAGE } from '../sui-config';
import { BaseContract } from './base-contract';

export class TicketModule extends BaseContract {
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

  async getTicketIdValue(ticket: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.TICKET}::${JASTRON_PASS_PACKAGE.FUNCTIONS.TICKET_GET_ID}`,
      arguments: [tx.object(ticket)],
    });
    return this.callReadonlyFunction(tx);
  }

  async getTicketActivityIdValue(ticket: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.TICKET}::${JASTRON_PASS_PACKAGE.FUNCTIONS.TICKET_GET_ACTIVITY_ID}`,
      arguments: [tx.object(ticket)],
    });
    return this.callReadonlyFunction(tx);
  }

  async getProtectedTicketInnerIdValue(protectedTicket: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.TICKET}::${JASTRON_PASS_PACKAGE.FUNCTIONS.TICKET_GET_INNER_ID}`,
      arguments: [tx.object(protectedTicket)],
    });
    return this.callReadonlyFunction(tx);
  }

  async getProtectedTicketInnerActivityIdValue(protectedTicket: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.TICKET}::${JASTRON_PASS_PACKAGE.FUNCTIONS.TICKET_GET_INNER_ACTIVITY_ID}`,
      arguments: [tx.object(protectedTicket)],
    });
    return this.callReadonlyFunction(tx);
  }

  async getProtectedTicketInnerOwnerProfileIdValue(protectedTicket: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.TICKET}::${JASTRON_PASS_PACKAGE.FUNCTIONS.TICKET_GET_INNER_OWNER_PROFILE_ID}`,
      arguments: [tx.object(protectedTicket)],
    });
    return this.callReadonlyFunction(tx);
  }
}
