import { JASTRON_PASS_PACKAGE } from '../sui-config';
import { BaseContract } from './base-contract';

export class PlatformModule extends BaseContract {
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

  async getUserRegisteredAt(platform: string, userProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.PLATFORM}::${JASTRON_PASS_PACKAGE.FUNCTIONS.PLATFORM_GET_USER_REGISTERED_AT}`,
      arguments: [tx.object(platform), tx.pure.string(userProfile)],
    });
    return tx;
  }

  async getOrganizerRegisteredAt(platform: string, organizerProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.PLATFORM}::${JASTRON_PASS_PACKAGE.FUNCTIONS.PLATFORM_GET_ORGANIZER_REGISTERED_AT}`,
      arguments: [tx.object(platform), tx.pure.string(organizerProfile)],
    });
    return tx;
  }

  async listActivities(platform: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.PLATFORM}::${JASTRON_PASS_PACKAGE.FUNCTIONS.PLATFORM_LIST_ACTIVITIES}`,
      arguments: [tx.object(platform)],
    });
    return tx;
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

  async getUserRegisteredAtValue(platform: string, userProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.PLATFORM}::${JASTRON_PASS_PACKAGE.FUNCTIONS.PLATFORM_GET_USER_REGISTERED_AT}`,
      arguments: [tx.object(platform), tx.pure.string(userProfile)],
    });
    return this.callReadonlyFunction(tx);
  }

  async getOrganizerRegisteredAtValue(platform: string, organizerProfile: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.PLATFORM}::${JASTRON_PASS_PACKAGE.FUNCTIONS.PLATFORM_GET_ORGANIZER_REGISTERED_AT}`,
      arguments: [tx.object(platform), tx.pure.string(organizerProfile)],
    });
    return this.callReadonlyFunction(tx);
  }

  async listActivitiesValue(platform: string) {
    const tx = this.createTransaction();
    tx.moveCall({
      target: `${this.packageId}::${JASTRON_PASS_PACKAGE.MODULES.PLATFORM}::${JASTRON_PASS_PACKAGE.FUNCTIONS.PLATFORM_LIST_ACTIVITIES}`,
      arguments: [tx.object(platform)],
    });
    return this.callReadonlyFunction(tx);
  }
}
