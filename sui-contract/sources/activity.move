module jastron_pass::activity;

use jastron_pass::organizer::{Self, OrganizerProfile};
use jastron_pass::ticket::{Self, Ticket};
use std::string::String;
use sui::coin::{Self, Coin};
use sui::event;
use sui::object::{Self, UID, ID};
use sui::sui::SUI;
use sui::transfer::{Self, transfer};
use sui::tx_context::TxContext;

//---data types---
//Shared Object
public struct Activity has key {
    id: UID,
    name: String,
    description: String,
    img_url: String,
    total_supply: u64,
    tickets_sold: u64,
    ticket_price: u64, // Price in MIST (1 SUI = 1,000,000,000 MIST)
    organizer_profile_id: ID,
    created_at: u64,
    started_at: u64,
    ended_at: u64,
}

//---events---
public struct TicketPurchased has copy, drop {
    activity_id: ID,
    ticket_id: ID,
    buyer: address,
    price: u64,
}

public struct ActivityCreated has copy, drop {
    activity_id: ID,
    organizer_profile_id: ID,
    total_supply: u64,
    ticket_price: u64,
}

//---functions---
public fun create(
    name: String,
    description: String,
    img_url: String,
    total_supply: u64,
    ticket_price: u64,
    organizer_profile_id: ID,
    started_at: u64,
    ended_at: u64,
    ctx: &mut TxContext,
) {
    let activity = Activity {
        id: object::new(ctx),
        name,
        description,
        img_url,
        total_supply,
        tickets_sold: 0,
        ticket_price,
        organizer_profile_id,
        created_at: tx_context::epoch(ctx),
        started_at,
        ended_at,
    };

    event::emit(ActivityCreated {
        activity_id: object::uid_to_inner(&activity.id),
        organizer_profile_id,
        total_supply,
        ticket_price,
    });

    transfer::share_object(activity);
}

public fun get_id(activity: &Activity): ID {
    object::uid_to_inner(&activity.id)
}

public fun get_organizer_profile_id(activity: &Activity): ID {
    activity.organizer_profile_id
}

public fun get_info(activity: &Activity): (String, String, String, u64, u64, u64, ID) {
    (
        activity.name,
        activity.description,
        activity.img_url,
        activity.total_supply,
        activity.tickets_sold,
        activity.ticket_price,
        activity.organizer_profile_id,
    )
}

public fun has_available_tickets(activity: &Activity): bool {
    activity.tickets_sold < activity.total_supply
}

public fun get_remaining_tickets(activity: &Activity): u64 {
    activity.total_supply - activity.tickets_sold
}

public fun get_name(activity: &Activity): String {
    activity.name
}

public fun get_description(activity: &Activity): String {
    activity.description
}

public fun get_img_url(activity: &Activity): String {
    activity.img_url
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
