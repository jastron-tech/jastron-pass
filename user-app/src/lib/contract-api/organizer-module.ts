import { JASTRON_PASS_PACKAGE } from '../sui-config';
import { BaseContract } from './base-contract';

export class OrganizerModule extends BaseContract {
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

  // Organizer readonly function calls
  async getOrganizerProfileIdValue(organizerProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.ORGANIZER}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ORGANIZER_GET_PROFILE_ID}`,
      arguments: [tx.object(organizerProfile)],
    });
    return this.callReadonlyFunction(tx);
  }

  async getOrganizerTreasuryValue(organizerProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.ORGANIZER}::${JASTRON_PASS_PACKAGE.FUNCTIONS.ORGANIZER_GET_TREASURY}`,
      arguments: [tx.object(organizerProfile)],
    });
    return this.callReadonlyFunction(tx);
  }
}
