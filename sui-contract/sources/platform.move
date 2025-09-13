module jastron_pass::platform;

use sui::package;
use sui::table::{Self, Table};
use sui::event;

//---errors---
//const EPlatform: u64 = 300;

//---data types---
//witness
public struct PLATFORM has drop {}

public struct Platform has key {
    id: UID,
    treasury: address,
    registered_users: Table<ID, u64>, // user_address -> registration_timestamp
    registered_organizers: Table<ID, u64>, // organizer_address -> registration_timestamp
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
fun init(otw: PLATFORM, ctx: &mut TxContext) {
    let platform_publisher = tx_context::sender(ctx);

    let publisher = package::claim(otw, ctx);
    transfer::public_transfer(publisher, platform_publisher);
    
    let platform = Platform {
        id: object::new(ctx),
        treasury: platform_publisher,
        registered_users: table::new(ctx),
        registered_organizers: table::new(ctx),
    };
    transfer::share_object(platform);
}

public(package) fun register_user(self: &mut Platform, user_profile: ID, ctx: &TxContext) {
    let cur_time = tx_context::epoch(ctx);
    table::add(&mut self.registered_users, user_profile, cur_time);
    
    event::emit(UserRegistered {
        profile: user_profile,
        registered_at: cur_time,
    });
}

public(package) fun register_organizer(self: &mut Platform, organizer_profile: ID, ctx: &TxContext) {
    let cur_time = tx_context::epoch(ctx);
    table::add(&mut self.registered_organizers, organizer_profile, cur_time);
    
    event::emit(OrganizerRegistered {
        profile: organizer_profile,
        registered_at: cur_time,
    });
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

public fun get_user_registration_timestamp(self: &Platform, user_profile: ID): u64 {
    *table::borrow(&self.registered_users, user_profile)
}

public fun get_organizer_registration_timestamp(self: &Platform, organizer_profile: ID): u64 {
    *table::borrow(&self.registered_organizers, organizer_profile)
}

public fun get_registered_users_count(self: &Platform): u64 {
    table::length(&self.registered_users)
}

public fun get_registered_organizers_count(self: &Platform): u64 {
    table::length(&self.registered_organizers)
}
