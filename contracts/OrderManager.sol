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
        uint256 escrowId;
    }

    mapping(uint256 => Order) public orders;
    uint256 public orderCounter;

    event OrderCreated(uint256 indexed orderId, address buyer, address seller, uint256 amount, uint256 deadline);
    event OrderCancelled(uint256 indexed orderId, address buyer);

    constructor(address escrowAddress) {
        require(escrowAddress != address(0), "Escrow address required");
        escrow = Escrow(escrowAddress);
    }

    function createOrder(
        address seller,
        uint256 amount,
        uint256 deadline
    ) external {
        require(seller != address(0), "Invalid seller");
        require(amount > 0, "Amount must be greater than 0");
        require(deadline > block.timestamp, "Invalid deadline");

        uint256 orderId = orderCounter++;

        // Lock funds in escrow and get the escrow ID
        uint256 escrowId = escrow.lockFunds(orderId, seller, amount, deadline);

        // Record order with escrow ID
        orders[orderId] = Order({
            orderId: orderId,
            buyer: msg.sender,
            seller: seller,
            amount: amount,
            deadline: deadline,
            status: OrderStatus.Created,
            escrowId: escrowId
        });

        emit OrderCreated(orderId, msg.sender, seller, amount, deadline);
    }

    function cancelOrder(uint256 orderId) external {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.Created, "Not cancellable");
        require(msg.sender == order.buyer, "Only buyer can cancel");
        require(block.timestamp >= order.deadline, "Too early to cancel");

        // Cancel the escrow using the stored escrow ID
        escrow.cancelEscrow(order.escrowId);

        order.status = OrderStatus.Cancelled;
        emit OrderCancelled(orderId, msg.sender);
    }

    function getOrder(uint256 orderId) external view returns (Order memory) {
        return orders[orderId];
    }
}
