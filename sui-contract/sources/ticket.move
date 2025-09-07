module jastron_pass::ticket;

use sui::event;
use jastron_pass::user::{Self, UserProfile};

//---errors---
const ETicket: u64 = 100;
const EAlreadyRedeemed: u64 = 1 + ETicket;

//---data types---
public struct Ticket has key {
    id: UID,
    activity_id: ID,
    created_at: u64,
    redeemed_at: u64,
}

//---events---
public struct TicketCreated has copy, drop {
    ticket_id: ID,
    activity_id: ID,
    created_at: u64,
}

//---functions---
public fun transfer(ticket: Ticket, receiver_profile: &UserProfile) {
    assert!(ticket.redeemed_at == 0, EAlreadyRedeemed);
    let receiver = user::get_treasury(receiver_profile);
    transfer::transfer(ticket, receiver);
}

//---internal functions---
public(package) fun new(activity_id: ID, ctx: &mut TxContext): Ticket {
    let ticket = Ticket {
        id: object::new(ctx),
        activity_id,
        created_at: tx_context::epoch(ctx),
        redeemed_at: 0,
    };
    event::emit(TicketCreated {
        ticket_id: object::uid_to_inner(&ticket.id),
        activity_id,
        created_at: ticket.created_at,
    });

    ticket
}

//---readonly functions---
public fun get_id(ticket: &Ticket): ID {
    object::uid_to_inner(&ticket.id)
}

public fun get_activity_id(ticket: &Ticket): ID {
    ticket.activity_id
}

public fun is_redeemed(ticket: &Ticket): bool {
    ticket.redeemed_at > 0
}
