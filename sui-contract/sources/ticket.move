module jastron_pass::ticket;

use std::string::String;
use sui::coin::{Self, Coin};
use sui::event;
use sui::object::{Self, UID, ID};
use sui::sui::SUI;
use sui::tx_context::TxContext;

//---errors---

//---events---
public struct TicketCreated has copy, drop {
    ticket_id: ID,
    activity_id: ID,
    img_url: String,
    created_at: u64,
}

//---data types---
public struct Ticket has key {
    id: UID,
    activity_id: ID,
    img_url: String,
    created_at: u64,
}

public fun create(activity_id: ID, img_url: String, ctx: &mut TxContext): Ticket {
    let ticket = Ticket {
        id: object::new(ctx),
        activity_id,
        img_url,
        created_at: tx_context::epoch(ctx),
    };
    event::emit(TicketCreated {
        ticket_id: object::uid_to_inner(&ticket.id),
        activity_id,
        img_url,
        created_at: ticket.created_at,
    });

    ticket
}

public fun get_info(ticket: &Ticket): (ID, ID, String) {
    (object::uid_to_inner(&ticket.id), ticket.activity_id, ticket.img_url)
}

public fun get_id(ticket: &Ticket): ID {
    object::uid_to_inner(&ticket.id)
}

public fun get_activity_id(ticket: &Ticket): ID {
    ticket.activity_id
}

public fun get_img_url(ticket: &Ticket): String {
    ticket.img_url
}
