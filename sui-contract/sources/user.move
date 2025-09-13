module jastron_pass::user;

use sui::event;
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
    verified_at: u64
}

//---events---
public struct UserProfileCreated has copy, drop {
    profile_id: ID,
    user: address,
    registered_at: u64,
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
        verified_at: 0
    };

    let cap = UserCap {
        id: object::new(ctx),
        profile_id: object::uid_to_inner(&profile.id),
    };
    
    event::emit(UserProfileCreated {
        profile_id: object::uid_to_inner(&profile.id),
        user: user,
        registered_at: cur_time,
    });

    (profile, cap)
}

//---readonly functions---
public fun get_profile_id(self: &UserProfile): ID {
    object::uid_to_inner(&self.id)
}

public fun get_treasury(self: &UserProfile): address {
    self.treasury
}
