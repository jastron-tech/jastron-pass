module jastron_pass::platform;

use sui::package;
use sui::table::{Self, Table};
use sui::event;
use sui::linked_table::{Self, LinkedTable};
use sui::transfer_policy;
use jastron_pass::ticket::{Ticket};

//---errors---
const EPlatform: u64 = 300;
const EUserAlreadyRegistered: u64 = 1 + EPlatform;
const EOrganizerAlreadyRegistered: u64 = 2 + EPlatform;

//---data types---
//witness
public struct PLATFORM has drop {}

public struct Platform has key {
    id: UID,
    treasury: address,
    registered_users: Table<ID, u64>, // user_address -> registered_at
    registered_organizers: Table<ID, u64>, // organizer_address -> registered_at
    activities: LinkedTable<u64, ID>,
    num_activities: u64,
    transfer_policy_id: ID,
}

//---events---
public struct UserRegistered has copy, drop {
    profile: ID,
    registered_at: u64,
}

public struct OrganizerRegistered has copy, drop {
    profile: ID,
    registered_at: u64,
}

//---functions---

//---internal functions---
#[allow(lint(share_owned, self_transfer))]
fun init(otw: PLATFORM, ctx: &mut TxContext) {
    let platform_publisher = tx_context::sender(ctx);

    let publisher = package::claim(otw, ctx);
    let (policy, policy_cap) = transfer_policy::new<Ticket>(&publisher, ctx);
    let platform = Platform {
        id: object::new(ctx),
        treasury: platform_publisher,
        registered_users: table::new(ctx),
        registered_organizers: table::new(ctx),
        activities: linked_table::new(ctx),
        num_activities: 0,
        transfer_policy_id: object::id(&policy),
    };

    transfer::share_object(platform);
    transfer::public_share_object(policy);
    transfer::public_transfer(policy_cap, platform_publisher);
    transfer::public_transfer(publisher, platform_publisher);
}

public(package) fun register_user(self: &mut Platform, user_profile: ID, ctx: &TxContext) {
    assert!(!self.is_user_registered(user_profile), EUserAlreadyRegistered);
    let cur_time = tx_context::epoch(ctx);
    table::add(&mut self.registered_users, user_profile, cur_time);
    
    event::emit(UserRegistered {
        profile: user_profile,
        registered_at: cur_time,
    });
}

public(package) fun register_organizer(self: &mut Platform, organizer_profile: ID, ctx: &TxContext) {
    assert!(!self.is_organizer_registered(organizer_profile), EOrganizerAlreadyRegistered);
    let cur_time = tx_context::epoch(ctx);
    table::add(&mut self.registered_organizers, organizer_profile, cur_time);
    
    event::emit(OrganizerRegistered {
        profile: organizer_profile,
        registered_at: cur_time,
    });
}

public(package) fun add_activity(self: &mut Platform, activity_id: ID) {
    // Use the current num_activities as the key, and activity_id as the value
    linked_table::push_front(&mut self.activities, self.num_activities, activity_id);
    self.num_activities = self.num_activities + 1;
}

//---readonly functions---
public fun get_treasury(self: &Platform): address {
    self.treasury
}

public fun is_user_registered(self: &Platform, user_profile: ID): bool {
    table::contains(&self.registered_users, user_profile)
}

public fun is_organizer_registered(self: &Platform, organizer_profile: ID): bool {
    table::contains(&self.registered_organizers, organizer_profile)
}

public fun get_user_registered_at(self: &Platform, user_profile: ID): u64 {
    *table::borrow(&self.registered_users, user_profile)
}

public fun get_organizer_registered_at(self: &Platform, organizer_profile: ID): u64 {
    *table::borrow(&self.registered_organizers, organizer_profile)
}

public fun get_registered_users_count(self: &Platform): u64 {
    table::length(&self.registered_users)
}

public fun get_registered_organizers_count(self: &Platform): u64 {
    table::length(&self.registered_organizers)
}

public fun get_num_activities(self: &Platform): u64 {
    self.num_activities
}

public fun list_activities(self: &Platform): &LinkedTable<u64, ID> {
    &self.activities
}
