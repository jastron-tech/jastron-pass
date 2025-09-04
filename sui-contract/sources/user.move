module jastron_pass::user;

use std::string::String;
use sui::coin::{Self, Coin};
use sui::object::{Self, UID, ID};
use sui::sui::SUI;
use sui::tx_context::TxContext;

public struct UserProfile has key {
    id: UID,
}
