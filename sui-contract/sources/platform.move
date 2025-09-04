module jastron_pass::platform;

use jastron_pass::activity::{Self, Activity};
use jastron_pass::organizer::{Self, OrganizerProfile};
use jastron_pass::ticket::{Self, Ticket};
use std::string::String;
use sui::coin::{Self, Coin};
use sui::event;
use sui::object::{Self, UID, ID};
use sui::sui::SUI;
use sui::transfer::{Self, transfer};
use sui::tx_context::TxContext;

//---errors---
const ENotEnoughBalance: u64 = 0;
const ENotEnoughTickets: u64 = 1;
const EOrganizerProfileMismatch: u64 = 2;

//---data types---
public struct AdminCap has key {
    id: UID,
}

public struct Platform has key {
    id: UID,
}

//---APIs---
public fun buy_ticket_from_organizer(
    activity: &mut Activity,
    organizer_profile: &OrganizerProfile,
    payment: &mut Coin<SUI>,
    ctx: &mut TxContext,
): Ticket {
    assert!(
        activity::get_organizer_profile_id(activity) == organizer::get_profile_id(organizer_profile),
        EOrganizerProfileMismatch,
    );
    assert!(coin::value(payment) >= activity::get_ticket_price(activity), ENotEnoughBalance);
    assert!(activity::has_available_tickets(activity), ENotEnoughTickets);

    let ticket = ticket::create(activity::get_id(activity), activity::get_img_url(activity), ctx);

    ticket
}

//---functions---
fun init(ctx: &mut TxContext) {
    let publisher = tx_context::sender(ctx);
    let admin_cap = AdminCap {
        id: object::new(ctx),
    };
    transfer::transfer(admin_cap, publisher);

    let platform = Platform {
        id: object::new(ctx),
    };
    transfer::share_object(platform);
}
