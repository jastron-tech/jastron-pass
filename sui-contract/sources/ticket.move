module jastron_pass::ticket;

use jastron_pass::activity::{Activity};
use jastron_pass::user::{UserProfile};
use sui::event;

//---errors---
const ETicket: u64 = 500;
const ETicketHasBeenClipped: u64 = 1 + ETicket;
const ETicketHasBeenBound: u64 = 2 + ETicket;
const ETicketNotBound: u64 = 3 + ETicket;

//---data types---
public struct Ticket has key, store {
    id: UID,
    owner_profile_id: ID,
    activity_id: ID,
    bound_at: u64,
    clipped_at: u64,
}

public struct ProtectedTicket has key {
    id: UID,
    ticket: Ticket
}

//---events---
public struct TicketMinted has copy, drop {
    activity_id: ID,
    ticket_id: ID,
    created_at: u64,
    created_by: address,
}

public struct TicketBound has copy, drop {
    ticket_id: ID,
    bound_at: u64,
}

public struct TicketClipped has copy, drop {
    ticket_id: ID,
    clipped_at: u64,
    clipped_by: address,
}

//---internal functions---
public(package) fun bind(self: &mut ProtectedTicket, ctx: &TxContext) {
    assert!(!self.ticket.is_bound(), ETicketHasBeenBound);

    self.ticket.bound_at = tx_context::epoch(ctx);
    event::emit(TicketBound {
        ticket_id: object::uid_to_inner(&self.ticket.id),
        bound_at: tx_context::epoch(ctx),
    });
}

//clip the ticket (use the ticket)
public(package) fun clip(self: &mut ProtectedTicket, ctx: &TxContext) {
    assert!(self.ticket.is_bound(), ETicketNotBound);
    assert!(!self.ticket.is_clipped(), ETicketHasBeenClipped);

    self.ticket.clipped_at = tx_context::epoch(ctx);
    event::emit(TicketClipped {
        ticket_id: object::uid_to_inner(&self.ticket.id),
        clipped_at: tx_context::epoch(ctx),
        clipped_by: tx_context::sender(ctx),
    });
}

public(package) fun mint(activity_id: &Activity, receiver_profile: &UserProfile, ctx: &mut TxContext): ID {
    let caller = tx_context::sender(ctx);
    let cur_time = tx_context::epoch(ctx);
    
    let ticket = Ticket {
        id: object::new(ctx),
        owner_profile_id: receiver_profile.get_profile_id(),
        activity_id: activity_id.get_id(),
        bound_at: 0,
        clipped_at: 0,
    };
    let ticket_id = object::uid_to_inner(&ticket.id);

    event::emit(TicketMinted {
        activity_id: activity_id.get_id(),
        ticket_id,
        created_at: cur_time,
        created_by: caller,
    });

    let protected_ticket = wrap(ticket, ctx);
    transfer(protected_ticket, receiver_profile);

    ticket_id
}

public(package) fun unwrap(self: ProtectedTicket): Ticket {
    let ProtectedTicket { id, ticket } = self;
    object::delete(id);
    ticket
}

public(package) fun wrap(self: Ticket, ctx: &mut TxContext): ProtectedTicket {
    ProtectedTicket {
        id: object::new(ctx),
        ticket: self
    }
}

public(package) fun transfer(mut self: ProtectedTicket, receiver_profile: &UserProfile) {
    assert!(!self.ticket.is_bound(), ETicketHasBeenBound);
    self.ticket.owner_profile_id = receiver_profile.get_profile_id();
    transfer::transfer(self, receiver_profile.get_treasury());
}

//---readonly functions---
public fun get_id(self: &Ticket): ID {
    object::uid_to_inner(&self.id)
}

public fun get_activity_id(self: &Ticket): ID {
    self.activity_id
}

public fun is_clipped(self: &Ticket): bool {
    self.clipped_at > 0
}

public fun is_bound(self: &Ticket): bool {
    self.bound_at > 0
}

public fun get_inner_id(self: &ProtectedTicket): ID {
    object::uid_to_inner(&self.id)
}

public fun get_inner_activity_id(self: &ProtectedTicket): ID {
    self.ticket.activity_id
}

public fun get_inner_owner_profile_id(self: &ProtectedTicket): ID {
    self.ticket.owner_profile_id
}

