module jastron_pass::ticket_transfer_policy;
use jastron_pass::ticket::{Ticket};
use jastron_pass::activity::{Self,Activity};
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::package::{Publisher};
use sui::transfer_policy::{
    Self,
    TransferPolicy,
    TransferPolicyCap,
    TransferRequest
};

//---errors---
const ETicketTransferRule: u64 = 200;
/// The `amount_bp` passed is more than 100%.
const EOverBpFactor: u64 = 1 + ETicketTransferRule;
const ERoyaltyFeeNotEnough: u64 = 2 + ETicketTransferRule;
const EResellPriceLimitExceeded: u64 = 3 + ETicketTransferRule;

//constants
const BP_FACTOR: u64 = 10_000; // 1/BP_FACTOR -> 0.01%, BP_FACTOR/BP_FACTOR = 100%

//---functions---
#[allow(lint(share_owned, self_transfer))]
public fun new_policy(publisher: &Publisher, ctx: &mut TxContext) {
    let (policy, policy_cap) = transfer_policy::new<Ticket>(publisher, ctx);
    transfer::public_share_object(policy);
    transfer::public_transfer(policy_cap, tx_context::sender(ctx));
}

//royalty fee rule
public struct ROYALTY_FEE_RULE has drop {}
public struct RoyaltyFeeRuleConfig has store, drop {
    fee_bp: u64,
    min_fee: u64,
}

public fun add_royalty_fee_rule(_cap: &TransferPolicyCap<Ticket>, policy: &mut TransferPolicy<Ticket>, fee_bp: u64, min_fee: u64) {
    assert!(fee_bp <= BP_FACTOR, EOverBpFactor);
    transfer_policy::add_rule(ROYALTY_FEE_RULE {}, policy, _cap, RoyaltyFeeRuleConfig { fee_bp, min_fee });
}

fun calculate_royalty_fee(policy: &TransferPolicy<Ticket>, price: u64): u64 {
    let config: &RoyaltyFeeRuleConfig = transfer_policy::get_rule(ROYALTY_FEE_RULE {}, policy);
    let fee_bp = config.fee_bp;
    let min_fee = config.min_fee;
    let fee = ((price as u128) * (fee_bp as u128) / (BP_FACTOR as u128)) as u64;
    if (fee < min_fee) {
        min_fee
    } else {
        fee
    }
}

public fun pay_royalty_fee(policy: &mut TransferPolicy<Ticket>, request: &mut TransferRequest<Ticket>, payment: Coin<SUI>) {
    let paid = transfer_policy::paid(request);
    let fee = calculate_royalty_fee(policy, paid);
    assert!(fee <= coin::value(&payment), ERoyaltyFeeNotEnough);
    transfer_policy::add_to_balance(ROYALTY_FEE_RULE {}, policy, payment);
    transfer_policy::add_receipt(ROYALTY_FEE_RULE {}, request);
}

//resell price limit rule
public struct RESELL_PRICE_LIMIT_RULE has drop {}
public struct ResellPriceLimitRuleConfig has store, drop {
    price_limit_bp: u64,
}

public fun add_resell_price_limit_rule(_cap: &TransferPolicyCap<Ticket>, policy: &mut TransferPolicy<Ticket>, price_limit_bp: u64) {
    transfer_policy::add_rule(RESELL_PRICE_LIMIT_RULE {}, policy, _cap, ResellPriceLimitRuleConfig { price_limit_bp });
}

fun calculate_resell_price_limit(policy: &TransferPolicy<Ticket>, original_price: u64): u64 {
    let config: &ResellPriceLimitRuleConfig = transfer_policy::get_rule(RESELL_PRICE_LIMIT_RULE {}, policy);
    let price_limit_bp = config.price_limit_bp;
    let price_limit = ((original_price as u128) * (price_limit_bp as u128) / (BP_FACTOR as u128)) as u64;
    price_limit
}

public fun check_resell_price_limit(policy: &TransferPolicy<Ticket>, request: &mut TransferRequest<Ticket>, activity: &Activity) {
    let paid = transfer_policy::paid(request);
    let price_limit = calculate_resell_price_limit(policy, activity::get_ticket_price(activity));
    assert!(paid <= price_limit, EResellPriceLimitExceeded);
    transfer_policy::add_receipt(RESELL_PRICE_LIMIT_RULE {}, request);
}