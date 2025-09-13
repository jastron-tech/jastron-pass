module jastron_pass::user;

use sui::event;
use sui::table::{Self, Table};
use std::string::String;

//---errors---
//const EUser: u64 = 600;

//---data types---
public struct UserCap has key, store {
    id: UID,
    profile_id: ID,
}

public struct UserProfile has key, store {
    id: UID,
    name: String,
    treasury: address,
    registered_at: u64,
    verified_at: u64,
    attended_activities: Table<ID, u64>, // activity_id -> attendance_timestamp
}

//---events---
public struct UserProfileRegistered has copy, drop {
    profile_id: ID,
    registered_by: address,
    registered_at: u64,
}

public struct ActivityAttended has copy, drop {
    user_profile_id: ID,
    activity_id: ID,
    attendance_timestamp: u64,
}

//---functions---
public(package) fun new(
    name: String,
    ctx: &mut TxContext,
): (UserProfile, UserCap) {
    let cur_time = tx_context::epoch(ctx);
    let user = tx_context::sender(ctx);
    let profile = UserProfile {
        id: object::new(ctx),
        name: name,
        treasury: user,
        registered_at: cur_time,
        verified_at: 0,
        attended_activities: table::new(ctx)
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

    (profile, cap)
}

public(package) fun add_attended_activity(
    self: &mut UserProfile,
    activity_id: ID,
    attendance_timestamp: u64
) {
    table::add(&mut self.attended_activities, activity_id, attendance_timestamp);
    
    event::emit(ActivityAttended {
        user_profile_id: object::uid_to_inner(&self.id),
        activity_id: activity_id,
        attendance_timestamp: attendance_timestamp,
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
    table::contains(&self.attended_activities, activity_id)
}

// More efficient version that doesn't throw on missing key
public fun has_attended_activity_safe(self: &UserProfile, activity_id: ID): bool {
    table::contains(&self.attended_activities, activity_id)
}

public fun get_attendance_timestamp(self: &UserProfile, activity_id: ID): u64 {
    *table::borrow(&self.attended_activities, activity_id)
}

public fun get_attended_activities_count(self: &UserProfile): u64 {
    table::length(&self.attended_activities)
}
