module jastron_pass::user;

use sui::event;

//---data types---
//Owned Object
public struct UserCap has key {
    id: UID,
}

//Shared Object
public struct UserProfile has key {
    id: UID,
    treasury: address,
    registered_at: u64,
    verified_at: u64
}

//---events---
public struct UserRegistered has copy, drop {
    profile_id: ID,
    user: address,
    registered_at: u64,
}

//---functions---
public fun register(
    ctx: &mut TxContext,
) {
    let user = tx_context::sender(ctx);
    let profile = UserProfile {
        id: object::new(ctx),
        registered_at: tx_context::epoch(ctx),
        verified_at: 0,
        treasury: user,
    };

    let cap = UserCap {
        id: object::new(ctx),
    };
    transfer::transfer(cap, user);

    event::emit(UserRegistered {
        profile_id: object::uid_to_inner(&profile.id),
        user: user,
        registered_at: profile.registered_at,
    });

    transfer::share_object(profile);
}

//---readonly functions---
public fun get_profile_id(profile: &UserProfile): ID {
    object::uid_to_inner(&profile.id)
}

public fun get_treasury(profile: &UserProfile): address {
    profile.treasury
}

public fun get_registered_at(profile: &UserProfile): u64 {
    profile.registered_at
}