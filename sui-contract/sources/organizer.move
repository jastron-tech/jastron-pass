module jastron_pass::organizer;
use sui::event;

//---errors---
//const EOrganizer: u64 = 200;

//---events---
public struct OrganizerProfileCreated has copy, drop {
    profile_id: ID,
    created_by: address,
    created_at: u64,
}

//---data types---
public struct OrganizerCap has key, store {
    id: UID,
    profile_id: ID,
}

public struct OrganizerProfile has key, store {
    id: UID,
    treasury: address
}

//---functions---
public(package) fun new(ctx: &mut TxContext): (OrganizerProfile, OrganizerCap) {
    let caller = tx_context::sender(ctx);
    let profile = OrganizerProfile {
        id: object::new(ctx),
        treasury: caller,
    };

    let cap = OrganizerCap {
        id: object::new(ctx),
        profile_id: object::uid_to_inner(&profile.id),
    };

    event::emit(OrganizerProfileCreated {
        profile_id: object::uid_to_inner(&profile.id),
        created_by: caller,
        created_at: tx_context::epoch(ctx),
    });

    (profile, cap)
}

//---readonly functions---
public fun get_profile_id(self: &OrganizerProfile): ID {
    object::uid_to_inner(&self.id)
}

public fun get_treasury(self: &OrganizerProfile): address {
    self.treasury
}
