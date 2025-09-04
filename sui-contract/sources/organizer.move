module jastron_pass::organizer;

use jastron_pass::activity::{Self, Activity, ActivityCreated};
use std::string::String;
use sui::coin::{Self, Coin};
use sui::event;
use sui::object::{Self, UID, ID};
use sui::sui::SUI;
use sui::tx_context::TxContext;

//---errors---
const ENotVerified: u64 = 0;

//---data types---
//Owned Object
public struct OrganizerCap has key {
    id: UID,
}

//Shared Object
public struct OrganizerProfile has key {
    id: UID,
    name: String,
    description: String,
    avatar_url: String,
    contact_email: String,
    website: String,
    verified: bool,
    treasury: address,
    registered_at: u64,
    verified_at: u64,
}

//---events---
public struct OrganizerRegistered has copy, drop {
    profile_id: ID,
    organizer: address,
    name: String,
    registered_at: u64,
}

public struct OrganizerVerified has copy, drop {
    profile_id: ID,
    organizer: address,
    verified_at: u64,
}

//---APIs---
public entry fun register(
    name: String,
    description: String,
    avatar_url: String,
    contact_email: String,
    website: String,
    ctx: &mut TxContext,
) {
    let organizer = tx_context::sender(ctx);
    let profile = OrganizerProfile {
        id: object::new(ctx),
        name,
        description,
        avatar_url,
        contact_email,
        website,
        verified: false, // default not verified
        registered_at: tx_context::epoch(ctx),
        verified_at: 0,
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
        name: profile.name,
        registered_at: profile.registered_at,
    });

    transfer::share_object(profile);
}

public entry fun create_activity(
    _cap: &OrganizerCap,
    organizer_profile: &OrganizerProfile,
    name: String,
    description: String,
    img_url: String,
    total_supply: u64,
    ticket_price: u64,
    started_at: u64,
    ended_at: u64,
    ctx: &mut TxContext,
) {
    assert!(is_verified(organizer_profile), ENotVerified);
    activity::create(
        name,
        description,
        img_url,
        total_supply,
        ticket_price,
        get_profile_id(organizer_profile),
        started_at,
        ended_at,
        ctx,
    );
}

//---functions---
public fun update_profile_info(
    _cap: &OrganizerCap,
    profile: &mut OrganizerProfile,
    new_name: String,
    new_description: String,
    new_avatar_url: String,
    new_contact_email: String,
    new_website: String,
) {
    profile.name = new_name;
    profile.description = new_description;
    profile.avatar_url = new_avatar_url;
    profile.contact_email = new_contact_email;
    profile.website = new_website;
}

public fun get_profile_info(
    profile: &OrganizerProfile,
): (String, String, String, String, String, bool, u64) {
    (
        profile.name,
        profile.description,
        profile.avatar_url,
        profile.contact_email,
        profile.website,
        profile.verified,
        profile.registered_at,
    )
}

public fun get_profile_id(profile: &OrganizerProfile): ID {
    object::uid_to_inner(&profile.id)
}

public fun is_verified(profile: &OrganizerProfile): bool {
    profile.verified
}

public fun can_create_activity(profile: &OrganizerProfile): bool {
    profile.verified
}

public fun get_registered_at(profile: &OrganizerProfile): u64 {
    profile.registered_at
}

public fun get_treasury(profile: &OrganizerProfile): address {
    profile.treasury
}
