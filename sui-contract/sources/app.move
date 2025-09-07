module jastron_pass::app;

use jastron_pass::organizer::{Self, OrganizerCap, OrganizerProfile};
use jastron_pass::activity::{Self, Activity};
use jastron_pass::platform::{Platform};
use jastron_pass::ticket_transfer_policy;
use jastron_pass::ticket::{Self, Ticket, ProtectedTicket};
use jastron_pass::user::{Self, UserProfile, UserCap};
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::transfer_policy::{Self, TransferPolicy};
use sui::event;
use sui::kiosk::{Self, Kiosk, KioskOwnerCap};
use sui::dynamic_field as df;

//---errors---
const EApp: u64 = 100;
const ENotEnoughBalance: u64 = 1 + EApp;
const ENotEnoughTickets: u64 = 2 + EApp;
const EOrganizerProfileMismatch: u64 = 3 + EApp;
const EInvalidPrice: u64 = 4 + EApp;
const EItemNotListed: u64 = 5 + EApp;
const EResellPriceLimitExceeded: u64 = 6 + EApp;

//---data types---
public struct TicketListing has copy, store, drop {
    id: ID,
}

//---events---
public struct OrganizerTicketPurchased has copy, drop {
    activity_id: ID,
    ticket_id: ID,
    buyer: address,
    seller: address,
    ticket_receiver: address,
    price: u64,
    platform_fee: u64,
    num_sold: u64,
}

public struct KioskTicketListed has copy, drop {
    kiosk_id: ID,
    ticket_id: ID,
    price: u64,
    listed_at: u64,
}

public struct KioskTicketPurchased has copy, drop {
    kiosk_id: ID,
    ticket_id: ID,
    buyer: address,
    price: u64,
    royalty_fee: u64,
    platform_fee: u64,
    purchased_at: u64,
}

public struct KioskTicketDelisted has copy, drop {
    kiosk_id: ID,
    ticket_id: ID,
    delisted_at: u64,
}

//---functions---
#[allow(lint(share_owned, self_transfer))]
public fun register_organizer_profile(ctx: &mut TxContext): OrganizerCap {
    let (profile, cap) = organizer::new(ctx);
    transfer::public_share_object(profile);
    cap
}

#[allow(lint(share_owned, self_transfer))]
public fun register_user_profile(ctx: &mut TxContext): UserCap {
    let (profile, cap) = user::new(ctx);
    transfer::public_share_object(profile);
    cap
}

#[allow(lint(share_owned, self_transfer))]
public fun create_activity(_cap: &OrganizerCap, organizer_profile: &OrganizerProfile, total_supply: u64, ticket_price: u64, sale_ended_at: u64, ctx: &mut TxContext) {
    let activity = activity::new(total_supply, ticket_price, organizer_profile, sale_ended_at, ctx);
    transfer::public_share_object(activity);
}

public fun buy_ticket_from_organizer(
    activity: &mut Activity,
    mut payment: Coin<SUI>,
    platform: &Platform,
    transfer_policy: &TransferPolicy<Ticket>,
    organizer_profile: &OrganizerProfile,
    ticket_receiver_profile: &UserProfile,
    ctx: &mut TxContext,
): Coin<SUI> {
    let ticket_price = activity.get_ticket_price();
    let platform_fee = ticket_transfer_policy::calculate_platform_fee(transfer_policy, ticket_price);
    let total_cost = ticket_price + platform_fee;
    
    assert!(
        activity.get_organizer_profile_id() == organizer_profile.get_profile_id(),
        EOrganizerProfileMismatch,
    );
    assert!(coin::value(&payment) >= total_cost, ENotEnoughBalance);
    assert!(activity.has_available_tickets(), ENotEnoughTickets);

    let payment_for_platform = payment.split(platform_fee, ctx);
    let payment_for_organizer = payment.split(ticket_price, ctx);
    
    let activity_id = activity.get_id();
    let seller = organizer_profile.get_treasury();
    let ticket_receiver = ticket_receiver_profile.get_treasury();
    
    transfer::public_transfer(payment_for_platform, platform.get_treasury());
    transfer::public_transfer(payment_for_organizer, seller);
    
    let protected_ticket = ticket::mint(activity, ctx);
    let ticket_id = protected_ticket.get_inner_id();
    
    protected_ticket.transfer(ticket_receiver);
    activity.increment_tickets_sold();

    event::emit(OrganizerTicketPurchased {
        activity_id,
        ticket_id,
        buyer: tx_context::sender(ctx),
        seller,
        ticket_receiver,
        platform_fee,
        price: ticket_price,
        num_sold: activity::get_tickets_sold(activity),
    });

    payment
}

public fun create_kiosk(user_profile: &UserProfile, ctx: &mut TxContext) {
    let (kiosk, kiosk_cap) = kiosk::new(ctx);
    transfer::public_transfer(kiosk_cap, user_profile.get_treasury());
    transfer::public_share_object(kiosk);
}

public fun list_ticket_for_resell(
    kiosk: &mut Kiosk,
    kiosk_cap: &KioskOwnerCap,
    transfer_policy: &TransferPolicy<Ticket>,
    activity: &Activity,
    protected_ticket: ProtectedTicket,
    price: u64,
    ctx: &mut TxContext,
) {
    assert!(price > 0, EInvalidPrice);

    let resell_price_limit = ticket_transfer_policy::calculate_resell_price_limit(transfer_policy, activity.get_ticket_price());
    assert!(price <= resell_price_limit, EResellPriceLimitExceeded);

    let ticket_id = ticket::get_inner_id(&protected_ticket);
    let kiosk_id = object::uid_to_inner(kiosk::uid(kiosk));
    let ticket = ticket::unwrap(protected_ticket);

    kiosk::place_and_list(kiosk, kiosk_cap, ticket, price);
    df::add(kiosk.uid_mut(), TicketListing { id: ticket_id }, price);
    
    event::emit(KioskTicketListed {
        kiosk_id,
        ticket_id,
        price,
        listed_at: tx_context::epoch(ctx),
    });
}

public fun delist_ticket(
    kiosk: &mut Kiosk,
    kiosk_cap: &KioskOwnerCap,
    ticket_id: ID,
    ctx: &mut TxContext,
): ProtectedTicket {
    let kiosk_id = object::uid_to_inner(kiosk::uid(kiosk));
    let ticket = kiosk::take(kiosk, kiosk_cap, ticket_id);
    df::remove<TicketListing, u64>(kiosk.uid_mut(), TicketListing { id: ticket_id });

    // 发出取消列出门票事件
    event::emit(KioskTicketDelisted {
        kiosk_id,
        ticket_id,
        delisted_at: tx_context::epoch(ctx),
    });
    
    let protected_ticket = ticket::wrap(ticket, ctx);
    protected_ticket
}

public fun purchase_ticket(
    kiosk: &mut Kiosk,
    mut payment: Coin<SUI>,
    ticket_id: ID,
    activity: &Activity,
    organizer_profile: &OrganizerProfile,
    platform: &Platform,
    transfer_policy: &mut TransferPolicy<Ticket>,
    ctx: &mut TxContext,
): (ProtectedTicket, Coin<SUI>) {
    let ticket_price = get_ticket_price(kiosk, ticket_id);
    let royalty_fee = ticket_transfer_policy::calculate_royalty_fee(transfer_policy, ticket_price);
    let platform_fee = ticket_transfer_policy::calculate_platform_fee(transfer_policy, ticket_price);
    let total_fee = royalty_fee + platform_fee;
    let total_cost = ticket_price + total_fee;
    assert!(payment.value() >= total_cost, ENotEnoughBalance);

    let payment_for_platform = payment.split(platform_fee, ctx);
    let payment_for_royalty = payment.split(royalty_fee, ctx);
    let payment_for_ticket = payment.split(ticket_price, ctx);

    let (ticket, mut transfer_request) = kiosk::purchase(kiosk, ticket_id, payment_for_ticket);
    
    ticket_transfer_policy::pay_royalty_fee(transfer_policy, &mut transfer_request, payment_for_royalty, &ticket, activity, organizer_profile);
    ticket_transfer_policy::check_resell_price_limit(transfer_policy, &mut transfer_request, &ticket, activity);
    ticket_transfer_policy::pay_platform_fee(transfer_policy, &mut transfer_request, payment_for_platform, platform);

    transfer_policy::confirm_request<Ticket>(transfer_policy, transfer_request);
    
    let kiosk_id = object::uid_to_inner(kiosk::uid(kiosk));
    event::emit(KioskTicketPurchased {
        kiosk_id,
        ticket_id,
        price: ticket_price,
        buyer: tx_context::sender(ctx),
        royalty_fee,
        platform_fee,
        purchased_at: tx_context::epoch(ctx),
    });

    (ticket.wrap(ctx), payment)
}

public fun get_ticket_price(kiosk: &Kiosk, ticket_id: ID): u64 {
    assert!(is_ticket_listed(kiosk, ticket_id), EItemNotListed);
    let price = df::borrow<TicketListing, u64>(kiosk.uid(), TicketListing { id: ticket_id });
    *price
}

public fun is_ticket_listed(kiosk: &Kiosk, ticket_id: ID): bool {
    kiosk::has_item(kiosk, ticket_id)
}
