module jastron_pass::organizer;
use sui::event;
use std::string::String;
use sui::linked_table::{Self, LinkedTable};
//---errors---
//const EOrganizer: u64 = 200;

//---events---
public struct OrganizerProfileRegistered has copy, drop {
    profile_id: ID,
    registered_by: address,
    registered_at: u64,
}

//---data types---
public struct OrganizerCap has key, store {
    id: UID,
    profile_id: ID,
}

public struct OrganizerProfile has key, store {
    id: UID,
    name: String,
    treasury: address,
    registered_at: u64,
    verified_at: u64,
    activities: LinkedTable<u64, ID>, // activity_id -> created_at
    num_activities: u64,
}

//---functions---
public(package) fun new(name: String, ctx: &mut TxContext): (OrganizerProfile, OrganizerCap) {
    let caller = tx_context::sender(ctx);
    let cur_time = tx_context::epoch(ctx);
    let profile = OrganizerProfile {
        id: object::new(ctx),
        name: name,
        treasury: caller,
        registered_at: cur_time,
        verified_at: 0,
        activities: linked_table::new(ctx),
        num_activities: 0,
    };

    let cap = OrganizerCap {
        id: object::new(ctx),
        profile_id: object::uid_to_inner(&profile.id),
    };

    event::emit(OrganizerProfileRegistered {
        profile_id: object::uid_to_inner(&profile.id),
        registered_by: caller,
        registered_at: cur_time,
    });

    (profile, cap)
}

public(package) fun add_activity(self: &mut OrganizerProfile, activity_id: ID) {
    linked_table::push_front(&mut self.activities, self.num_activities, activity_id);
    self.num_activities = self.num_activities + 1;
}

//---readonly functions---
public fun get_profile_id(self: &OrganizerProfile): ID {
    object::uid_to_inner(&self.id)
}

public fun get_treasury(self: &OrganizerProfile): address {
    self.treasury
}

public fun get_name(self: &OrganizerProfile): String {
    self.name
}
