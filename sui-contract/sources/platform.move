module jastron_pass::platform;

use jastron_pass::activity::{Self, Activity};
use jastron_pass::organizer::{Self, OrganizerProfile};
use jastron_pass::user::{Self, UserProfile};
use jastron_pass::ticket::{Self};
use sui::coin::{Self, Coin};
use sui::event;
use sui::sui::SUI;
use sui::package;

//---errors---
const ENotEnoughBalance: u64 = 0;
const ENotEnoughTickets: u64 = 1;
const EOrganizerProfileMismatch: u64 = 2;

//---data types---
//witness
public struct PLATFORM has drop {}

public struct AdminCap has key, store {
    id: UID,
}

public struct Platform has key {
    id: UID,
}

//---events---
public struct PaymentTransferred has copy, drop {
    activity_id: ID,
    receiver: address,
    amount: u64,
    transferred_at: u64,
}

public struct TicketPurchased has copy, drop {
    activity_id: ID,
    ticket_id: ID,
    buyer: address,
    price: u64,
}

//---functions---
public fun buy_ticket_from_organizer(
    activity: &mut Activity,
    organizer_profile: &OrganizerProfile,
    payment: &mut Coin<SUI>,
    buyer_profile: &UserProfile,
    ctx: &mut TxContext,
) {
    let ticket_price = activity::get_ticket_price(activity);
    
    assert!(
        activity::get_organizer_profile_id(activity) == organizer::get_profile_id(organizer_profile),
        EOrganizerProfileMismatch,
    );
    assert!(coin::value(payment) >= ticket_price, ENotEnoughBalance);
    assert!(activity::has_available_tickets(activity), ENotEnoughTickets);

    let activity_id = activity::get_id(activity);
    let payment_receiver = organizer::get_treasury(organizer_profile);
    let ticket_receiver = user::get_treasury(buyer_profile);
    
    let ticket = ticket::new(activity_id, ctx);
    let ticket_id = ticket::get_id(&ticket);

    let payment_for_organizer = coin::split(payment, ticket_price, ctx);
    
    transfer::public_transfer(payment_for_organizer, payment_receiver);
    event::emit(PaymentTransferred {
        activity_id,
        receiver: payment_receiver,
        amount: ticket_price,
        transferred_at: tx_context::epoch(ctx),
    });

    activity::increment_tickets_sold(activity);
    
    ticket::transfer(ticket, buyer_profile);
    event::emit(TicketPurchased {
        activity_id,
        ticket_id,
        buyer: ticket_receiver,
        price: ticket_price,
    });
}

fun init(otw: PLATFORM, ctx: &mut TxContext) {
    let platform_publisher = tx_context::sender(ctx);

    let publisher_proof = package::claim(otw, ctx);
    transfer::public_transfer(publisher_proof, platform_publisher);
    
    let admin_cap = AdminCap {
        id: object::new(ctx),
    };
    transfer::public_transfer(admin_cap, platform_publisher);

    let platform = Platform {
        id: object::new(ctx),
    };
    transfer::share_object(platform);
}
