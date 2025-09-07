module jastron_pass::platform;

use sui::package;

//---errors---
//const EPlatform: u64 = 300;

//---data types---
//witness
public struct PLATFORM has drop {}

public struct Platform has key {
    id: UID,
    treasury: address,
}

//---events---


//---functions---

//---internal functions---
fun init(otw: PLATFORM, ctx: &mut TxContext) {
    let platform_publisher = tx_context::sender(ctx);

    let publisher = package::claim(otw, ctx);
    transfer::public_transfer(publisher, platform_publisher);
    
    let platform = Platform {
        id: object::new(ctx),
        treasury: platform_publisher,
    };
    transfer::share_object(platform);
}

//---readonly functions---
public fun get_treasury(self: &Platform): address {
    self.treasury
}
