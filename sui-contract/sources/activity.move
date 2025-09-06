module jastron_pass::activity;

use sui::event;

//---data types---
//Shared Object
public struct Activity has key {
    id: UID,
    total_supply: u64,
    tickets_sold: u64,
    ticket_price: u64, // Price in MIST (1 SUI = 1,000,000,000 MIST)
    organizer_profile_id: ID,
    created_at: u64
}

//---events---
public struct ActivityCreated has copy, drop {
    activity_id: ID,
    organizer_profile_id: ID,
    total_supply: u64,
    ticket_price: u64,
}

//---functions---

//---internal functions---
public(package) fun new(
    total_supply: u64,
    ticket_price: u64,
    organizer_profile_id: ID,
    ctx: &mut TxContext,
) {
    let activity = Activity {
        id: object::new(ctx),
        total_supply,
        tickets_sold: 0,
        ticket_price,
        organizer_profile_id,
        created_at: tx_context::epoch(ctx),
    };

    event::emit(ActivityCreated {
        activity_id: object::uid_to_inner(&activity.id),
        organizer_profile_id,
        total_supply,
        ticket_price,
    });

    transfer::share_object(activity);
}

public(package) fun increment_tickets_sold(activity: &mut Activity) {
    activity.tickets_sold = activity.tickets_sold + 1;
}

//---readonly functions---
public fun get_id(activity: &Activity): ID {
    object::uid_to_inner(&activity.id)
}

public fun get_organizer_profile_id(activity: &Activity): ID {
    activity.organizer_profile_id
}

public fun has_available_tickets(activity: &Activity): bool {
    activity.tickets_sold < activity.total_supply
}

public fun get_remaining_tickets(activity: &Activity): u64 {
    activity.total_supply - activity.tickets_sold
}

public fun get_ticket_price(activity: &Activity): u64 {
    activity.ticket_price
}

public fun get_total_supply(activity: &Activity): u64 {
    activity.total_supply
}

public fun get_tickets_sold(activity: &Activity): u64 {
    activity.tickets_sold
}