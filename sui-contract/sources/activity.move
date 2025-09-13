module jastron_pass::activity;

use jastron_pass::organizer::{OrganizerProfile};
use sui::event;
use std::string::String;
use sui::table::{Self, Table};

//---errors---
const EActivity: u64 = 0;
const EInvalidPrice: u64 = 1 + EActivity;
const EAttendeeAlreadyAdded: u64 = 2 + EActivity;

//---data types---
public struct Activity has key, store {
    id: UID,
    name: String,
    total_supply: u64,
    tickets_sold: u64,
    ticket_price: u64,
    organizer_profile_id: ID,
    sale_ended_at: u64,
    attendees: Table<ID, u64>, // user_profile_id -> attended_at
}

//---events---
public struct ActivityCreated has copy, drop {
    activity_id: ID,
    organizer_profile_id: ID,
    total_supply: u64,
    ticket_price: u64,
    created_at: u64,
    created_by: address,
}

//---package functions---
public(package) fun new(
    name: String,
    total_supply: u64,
    ticket_price: u64,
    organizer_profile: &OrganizerProfile,
    sale_ended_at: u64,
    ctx: &mut TxContext,
): Activity {
    assert!(ticket_price > 0, EInvalidPrice);

    let caller = tx_context::sender(ctx);
    let cur_time = tx_context::epoch(ctx);
    let activity = Activity {
        id: object::new(ctx),
        name,
        total_supply,
        tickets_sold: 0,
        ticket_price,
        organizer_profile_id: organizer_profile.get_profile_id(),
        sale_ended_at,
        attendees: table::new(ctx),
    };

    event::emit(ActivityCreated {
        activity_id: object::uid_to_inner(&activity.id),
        organizer_profile_id: organizer_profile.get_profile_id(),
        total_supply,
        ticket_price,
        created_at: cur_time,
        created_by: caller,
    });

    activity
}

public(package) fun increment_tickets_sold(self: &mut Activity) {
    self.tickets_sold = self.tickets_sold + 1;
}

public(package) fun add_attendee(self: &mut Activity, user_profile_id: ID, ctx: &TxContext) {
    assert!(!self.has_attendee(user_profile_id), EAttendeeAlreadyAdded);
    let cur_time = tx_context::epoch(ctx);
    table::add(&mut self.attendees, user_profile_id, cur_time);
}

//---public functions---
public fun get_id(self: &Activity): ID {
    object::uid_to_inner(&self.id)
}

public fun get_organizer_profile_id(self: &Activity): ID {
    self.organizer_profile_id
}

public fun has_available_tickets(self: &Activity): bool {
    self.tickets_sold < self.total_supply
}

public fun get_remaining_tickets(self: &Activity): u64 {
    self.total_supply - self.tickets_sold
}

public fun get_ticket_price(self: &Activity): u64 {
    self.ticket_price
}

public fun get_total_supply(activity: &Activity): u64 {
    activity.total_supply
}

public fun get_tickets_sold(activity: &Activity): u64 {
    activity.tickets_sold
}

public fun get_sale_ended_at(self: &Activity): u64 {
    self.sale_ended_at
}

public fun is_sale_ended(self: &Activity, ctx: &TxContext): bool {
    self.sale_ended_at < tx_context::epoch(ctx)
}

public fun has_attendee(self: &Activity, user_profile_id: ID): bool {
    table::contains(&self.attendees, user_profile_id)
}

public fun get_name(self: &Activity): String {
    self.name
}