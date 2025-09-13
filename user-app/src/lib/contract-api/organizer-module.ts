import { JASTRON_PASS } from '../sui-config';
import { BaseContract } from './base-contract';

export class OrganizerModule extends BaseContract {
  // Organizer module functions (readonly)
  async getOrganizerProfileId(organizerProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.ORGANIZER}::${JASTRON_PASS.FUNCTIONS.ORGANIZER_GET_PROFILE_ID}`,
      arguments: [tx.object(organizerProfile)],
    });
    return tx;
  }

  async getOrganizerTreasury(organizerProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.ORGANIZER}::${JASTRON_PASS.FUNCTIONS.ORGANIZER_GET_TREASURY}`,
      arguments: [tx.object(organizerProfile)],
    });
    return tx;
  }

  async getOrganizerName(organizerProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.ORGANIZER}::${JASTRON_PASS.FUNCTIONS.ORGANIZER_GET_NAME}`,
      arguments: [tx.object(organizerProfile)],
    });
    return tx;
  }

  // Organizer readonly function calls
  async getOrganizerProfileIdValue(organizerProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.ORGANIZER}::${JASTRON_PASS.FUNCTIONS.ORGANIZER_GET_PROFILE_ID}`,
      arguments: [tx.object(organizerProfile)],
    });
    return this.callReadonlyFunction(tx);
  }

  async getOrganizerTreasuryValue(organizerProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.ORGANIZER}::${JASTRON_PASS.FUNCTIONS.ORGANIZER_GET_TREASURY}`,
      arguments: [tx.object(organizerProfile)],
    });
    return this.callReadonlyFunction(tx);
  }

  async getOrganizerNameValue(organizerProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.latestPackageId}::${JASTRON_PASS.MODULES.ORGANIZER}::${JASTRON_PASS.FUNCTIONS.ORGANIZER_GET_NAME}`,
      arguments: [tx.object(organizerProfile)],
    });
    return this.callReadonlyFunction(tx);
  }
}
