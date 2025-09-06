module jastron_pass::organizer;

use jastron_pass::activity;
use sui::event;

//---errors---

//---events---
public struct OrganizerRegistered has copy, drop {
    profile_id: ID,
    organizer: address,
    registered_at: u64,
}

//---data types---
//Owned Object
public struct OrganizerCap has key {
    id: UID,
}

//Shared Object
public struct OrganizerProfile has key {
    id: UID,
    treasury: address,
    registered_at: u64,
}

//---functions---
public fun register(ctx: &mut TxContext) {
    let organizer = tx_context::sender(ctx);
    let profile = OrganizerProfile {
        id: object::new(ctx),
        registered_at: tx_context::epoch(ctx),
        treasury: organizer,
    };

    let cap = OrganizerCap {
        id: object::new(ctx),
    };
    transfer::transfer(cap, organizer);

    // emit registered event
    event::emit(OrganizerRegistered {
        profile_id: object::uid_to_inner(&profile.id),
        organizer: organizer,
        registered_at: profile.registered_at,
    });

    transfer::share_object(profile);
}

public fun create_activity(
    _cap: &OrganizerCap,
    organizer_profile: &OrganizerProfile,
    total_supply: u64,
    ticket_price: u64,
    ctx: &mut TxContext,
) {
    activity::new(
        total_supply,
        ticket_price,
        get_profile_id(organizer_profile),
        ctx,
    );
}

//---readonly functions---
public fun get_profile_id(profile: &OrganizerProfile): ID {
    object::uid_to_inner(&profile.id)
}

public fun get_registered_at(profile: &OrganizerProfile): u64 {
    profile.registered_at
}

public fun get_treasury(profile: &OrganizerProfile): address {
    profile.treasury
}
