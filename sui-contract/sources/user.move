module jastron_pass::user;

use sui::event;
use sui::table::{Self, Table};
use std::string::String;
use sui::kiosk;

//---errors---
const EUser: u64 = 600;
const EActivityAlreadyAttended: u64 = 1 + EUser;

//---data types---
public struct UserCap has key, store {
    id: UID,
    profile_id: ID,
}

public struct UserProfile has key, store {
    id: UID,
    name: String,
    treasury: address,
    kiosk_id: ID,
    registered_at: u64,
    verified_at: u64,
    activities: Table<ID, u64>, // activity_id -> attended_at
}

//---events---
public struct UserProfileRegistered has copy, drop {
    profile_id: ID,
    registered_by: address,
    registered_at: u64,
}

public struct ActivityAttended has copy, drop {
    profile_id: ID,
    activity_id: ID,
    attended_at: u64,
}

//---functions---
#[allow(lint(share_owned, self_transfer))]
public(package) fun new(
    name: String,
    ctx: &mut TxContext,
): (UserProfile, UserCap) {
    let cur_time = tx_context::epoch(ctx);
    let user = tx_context::sender(ctx);

    let (kiosk, kiosk_cap) = kiosk::new(ctx);
    let profile = UserProfile {
        id: object::new(ctx),
        name: name,
        treasury: user,
        kiosk_id: object::id(&kiosk),
        registered_at: cur_time,
        verified_at: 0,
        activities: table::new(ctx)
    };

    let cap = UserCap {
        id: object::new(ctx),
        profile_id: object::uid_to_inner(&profile.id),
    };
    
    event::emit(UserProfileRegistered {
        profile_id: object::uid_to_inner(&profile.id),
        registered_by: user,
        registered_at: cur_time,
    });

    transfer::public_transfer(kiosk_cap, user);
    transfer::public_share_object(kiosk);

    (profile, cap)
}

public(package) fun add_attended_activity(
    self: &mut UserProfile,
    activity_id: ID,
    ctx: &TxContext,
) {
    assert!(!self.has_attended_activity(activity_id), EActivityAlreadyAttended);
    let cur_time = tx_context::epoch(ctx);
    table::add(&mut self.activities, activity_id, cur_time);
    
    event::emit(ActivityAttended {
        profile_id: object::uid_to_inner(&self.id),
        activity_id,
        attended_at: cur_time,
    });
}

//---readonly functions---
public fun get_profile_id(self: &UserProfile): ID {
    object::uid_to_inner(&self.id)
}

public fun get_treasury(self: &UserProfile): address {
    self.treasury
}

public fun has_attended_activity(self: &UserProfile, activity_id: ID): bool {
    table::contains(&self.activities, activity_id)
}

public fun get_attended_at(self: &UserProfile, activity_id: ID): u64 {
    *table::borrow(&self.activities, activity_id)
}

public fun get_attended_activities_count(self: &UserProfile): u64 {
    table::length(&self.activities)
}
