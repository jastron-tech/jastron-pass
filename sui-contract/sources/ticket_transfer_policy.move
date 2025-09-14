module jastron_pass::ticket_transfer_policy;
use jastron_pass::ticket::{Ticket};
use jastron_pass::activity::{Self,Activity};
use jastron_pass::platform::{Platform};
use jastron_pass::organizer::{OrganizerProfile};
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::transfer_policy::{
    Self,
    TransferPolicy,
    TransferPolicyCap,
    TransferRequest
};

//---errors---
const ETicketTransferRule: u64 = 400;
const EOverBpFactor: u64 = 1 + ETicketTransferRule;
const ERoyaltyFeeNotEnough: u64 = 2 + ETicketTransferRule;
const EResellPriceLimitExceeded: u64 = 3 + ETicketTransferRule;
const EPlatformFeeNotEnough: u64 = 4 + ETicketTransferRule;
const ETicketMismatch: u64 = 5 + ETicketTransferRule;
const EActivityMismatch: u64 = 6 + ETicketTransferRule;
const EOrganizerProfileMismatch: u64 = 7 + ETicketTransferRule;

//constants
const BP_FACTOR: u64 = 10_000; // 1/BP_FACTOR -> 0.01%, BP_FACTOR/BP_FACTOR = 100%

//---functions---

//royalty fee rule
public struct ROYALTY_FEE_RULE has drop {}
public struct RoyaltyFeeRuleConfig has store, drop {
    fee_bp: u64,
    min_fee: u64,
}

public fun add_royalty_fee_rule(self: &mut TransferPolicy<Ticket>,_cap: &TransferPolicyCap<Ticket>, fee_bp: u64, min_fee: u64) {
    assert!(fee_bp <= BP_FACTOR, EOverBpFactor);
    if (transfer_policy::has_rule<Ticket, ROYALTY_FEE_RULE>(self)) {
        transfer_policy::remove_rule<Ticket, ROYALTY_FEE_RULE, RoyaltyFeeRuleConfig>(self, _cap);
    };
    transfer_policy::add_rule(ROYALTY_FEE_RULE {}, self, _cap, RoyaltyFeeRuleConfig { fee_bp, min_fee });
}

public fun calculate_royalty_fee(self: &TransferPolicy<Ticket>, price: u64): u64 {
    let config: &RoyaltyFeeRuleConfig = transfer_policy::get_rule(ROYALTY_FEE_RULE {}, self);
    let fee_bp = config.fee_bp;
    let min_fee = config.min_fee;
    let fee = ((price as u128) * (fee_bp as u128) / (BP_FACTOR as u128)) as u64;
    if (fee < min_fee) {
        min_fee
    } else {
        fee
    }
}

public(package) fun pay_royalty_fee(
    self: &TransferPolicy<Ticket>, 
    request: &mut TransferRequest<Ticket>, 
    payment: Coin<SUI>, 
    ticket: &Ticket,
    activity: &Activity, 
    organizer_profile: &OrganizerProfile) {
    assert!(ticket.get_id() == request.item(), ETicketMismatch);
    assert!(activity.get_id() == ticket.get_activity_id(), EActivityMismatch);
    assert!(activity.get_organizer_profile_id() == organizer_profile.get_profile_id(), EOrganizerProfileMismatch);

    let paid = request.paid();
    let fee = calculate_royalty_fee(self, paid);
    assert!(fee <= coin::value(&payment), ERoyaltyFeeNotEnough);

    transfer::public_transfer(payment, organizer_profile.get_treasury());
    transfer_policy::add_receipt(ROYALTY_FEE_RULE {}, request);
}

//resell price limit rule
public struct RESELL_PRICE_LIMIT_RULE has drop {}
public struct ResellPriceLimitRuleConfig has store, drop {
    price_limit_bp: u64,
}

public fun add_resell_price_limit_rule(self: &mut TransferPolicy<Ticket>, _cap: &TransferPolicyCap<Ticket>, price_limit_bp: u64) {
    if (transfer_policy::has_rule<Ticket, RESELL_PRICE_LIMIT_RULE>(self)) {
        transfer_policy::remove_rule<Ticket, RESELL_PRICE_LIMIT_RULE, ResellPriceLimitRuleConfig>(self, _cap);
    };
    transfer_policy::add_rule(RESELL_PRICE_LIMIT_RULE {}, self, _cap, ResellPriceLimitRuleConfig { price_limit_bp });
}

public fun calculate_resell_price_limit(self: &TransferPolicy<Ticket>, original_price: u64): u64 {
    let config: &ResellPriceLimitRuleConfig = transfer_policy::get_rule(RESELL_PRICE_LIMIT_RULE {}, self);
    let price_limit_bp = config.price_limit_bp;
    let price_limit = ((original_price as u128) * (price_limit_bp as u128) / (BP_FACTOR as u128)) as u64;
    price_limit
}

public(package) fun check_resell_price_limit(self: &TransferPolicy<Ticket>, request: &mut TransferRequest<Ticket>, ticket: &Ticket, activity: &Activity) {
    assert!(ticket.get_id() == request.item(), ETicketMismatch);
    assert!(activity.get_id() == ticket.get_activity_id(), EActivityMismatch);

    let paid = transfer_policy::paid(request);
    let price_limit = calculate_resell_price_limit(self, activity::get_ticket_price(activity));
    
    assert!(paid <= price_limit, EResellPriceLimitExceeded);
    
    transfer_policy::add_receipt(RESELL_PRICE_LIMIT_RULE {}, request);
}

//platform fee rule
public struct PLATFORM_FEE_RULE has drop {}
public struct PlatformFeeRuleConfig has store, drop {
    fee_bp: u64,
    min_fee: u64,
}

public fun add_platform_fee_rule(self: &mut TransferPolicy<Ticket>, _cap: &TransferPolicyCap<Ticket>, fee_bp: u64, min_fee: u64) {
    if (transfer_policy::has_rule<Ticket, PLATFORM_FEE_RULE>(self)) {
        transfer_policy::remove_rule<Ticket, PLATFORM_FEE_RULE, PlatformFeeRuleConfig>(self, _cap);
    };
    transfer_policy::add_rule(PLATFORM_FEE_RULE {}, self, _cap, PlatformFeeRuleConfig { fee_bp, min_fee });
}

public fun calculate_platform_fee(self: &TransferPolicy<Ticket>, price: u64): u64 {
    let config: &PlatformFeeRuleConfig = transfer_policy::get_rule(PLATFORM_FEE_RULE {}, self);
    let fee_bp = config.fee_bp;
    let min_fee = config.min_fee;
    let fee = ((price as u128) * (fee_bp as u128) / (BP_FACTOR as u128)) as u64;
    if (fee < min_fee) {
        min_fee
    } else {
        fee
    }
}

public(package) fun pay_platform_fee(self: &TransferPolicy<Ticket>, request: &mut TransferRequest<Ticket>, payment: Coin<SUI>, platform: &Platform) {
    let paid = request.paid();
    let fee = calculate_platform_fee(self, paid);
    assert!(fee <= coin::value(&payment), EPlatformFeeNotEnough);
    
    transfer::public_transfer(payment, platform.get_treasury());
    transfer_policy::add_receipt(PLATFORM_FEE_RULE {}, request);
}

public fun get_platform_fee_rule(self: &TransferPolicy<Ticket>): (u64, u64) {
    if (transfer_policy::has_rule<Ticket, PLATFORM_FEE_RULE>(self)) {
        let config: &PlatformFeeRuleConfig = transfer_policy::get_rule(PLATFORM_FEE_RULE {}, self);
        (config.fee_bp, config.min_fee)
    } else {
        (0, 0)
    }
}

public fun get_royalty_fee_rule(self: &TransferPolicy<Ticket>): (u64, u64) {
    if (transfer_policy::has_rule<Ticket, ROYALTY_FEE_RULE>(self)) {
        let config: &RoyaltyFeeRuleConfig = transfer_policy::get_rule(ROYALTY_FEE_RULE {}, self);
        (config.fee_bp, config.min_fee)
    } else {
        (0, 0)
    }
}

public fun get_resell_price_limit_rule(self: &TransferPolicy<Ticket>): u64 {
    if (transfer_policy::has_rule<Ticket, RESELL_PRICE_LIMIT_RULE>(self)) {
        let config: &ResellPriceLimitRuleConfig = transfer_policy::get_rule(RESELL_PRICE_LIMIT_RULE {}, self);
        config.price_limit_bp
    } else {
        0
    }
}
