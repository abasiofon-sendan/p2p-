// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Escrow.sol";

contract OrderManager {
    Escrow public escrow;


    enum OrderStatus { None, Created, Cancelled }

    struct Order {
        uint256 orderId;
        address buyer;
        address seller;
        uint256 amount;
        uint256 deadline;
        OrderStatus status;
    }

    mapping(uint256 => Order) public orders;

    event OrderCreated(uint256 indexed orderId, address buyer, address seller, uint256 amount, uint256 deadline);
    event OrderCancelled(uint256 indexed orderId, address buyer);

    constructor(address escrowAddress) {
        require(escrowAddress != address(0), "Escrow address required");
        escrow = Escrow(escrowAddress);
    }

    function createOrder(
        uint256 orderId,
        address seller,
        uint256 amount,
        uint256 deadline
    ) external {
        require(orders[orderId].status == OrderStatus.None, "Order ID already exists");
        require(deadline > block.timestamp, "Deadline must be in future");

        // Call Escrow contract to lock funds
        escrow.lockFunds(orderId, seller, amount, deadline);

        // Record order
        orders[orderId] = Order({
            orderId: orderId,
            buyer: msg.sender,
            seller: seller,
            amount: amount,
            deadline: deadline,
            status: OrderStatus.Created
        });

        emit OrderCreated(orderId, msg.sender, seller, amount, deadline);
    }

    function cancelOrder(uint256 orderId) external {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.Created, "Not cancellable");
        require(msg.sender == order.buyer, "Only buyer can cancel");

        require(block.timestamp >= order.deadline, "Too early to cancel");

        // Refund from Escrow
        escrow.refund(orderId);

        order.status = OrderStatus.Cancelled;
        emit OrderCancelled(orderId, msg.sender);
    }

    function getOrder(uint256 orderId) external view returns (Order memory) {
        return orders[orderId];
    }
}
