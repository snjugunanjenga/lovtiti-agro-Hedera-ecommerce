// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Marketplace {
    struct Escrow {
        address buyer;
        address seller;
        uint256 amount;
        bool released;
    }

    mapping(bytes32 => Escrow) public escrows;

    function createEscrow(bytes32 orderId, address seller) external payable {
        require(msg.value > 0, "amount required");
        require(escrows[orderId].amount == 0, "exists");
        escrows[orderId] = Escrow({ buyer: msg.sender, seller: seller, amount: msg.value, released: false });
    }

    function release(bytes32 orderId) external {
        Escrow storage e = escrows[orderId];
        require(!e.released, "released");
        require(e.amount > 0, "missing");
        require(msg.sender == e.buyer, "only buyer");
        e.released = true;
        payable(e.seller).transfer(e.amount);
    }
}
