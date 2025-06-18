// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Escrow is Ownable {
    IERC20 public stablecoin;
    uint256 public platformFee = 75; // 0.75% in basis points
    address public feeCollector;

    struct EscrowInfo {
        address buyer;
        address seller;
        uint256 amount;
        uint256 deadline;
        bool released;
    }

    mapping(uint256 => EscrowInfo) public escrows;

    event FundsLocked(uint256 indexed orderId, address indexed buyer, address indexed seller, uint256 amount, uint256 deadline);
    event FundsReleased(uint256 indexed orderId, address indexed seller, uint256 amount, uint256 fee);
    event FundsRefunded(uint256 indexed orderId, address indexed buyer, uint256 amount);

    constructor(address _stablecoin, address _feeCollector) Ownable(msg.sender) {
        require(_stablecoin != address(0), "Invalid token address");
        require(_feeCollector != address(0), "Invalid fee collector");
        stablecoin = IERC20(_stablecoin);
        feeCollector = _feeCollector;
    }

    function lockFunds(
        uint256 orderId,
        address seller,
        uint256 amount,
        uint256 deadline
    ) external {
        require(!escrows[orderId].released, "Order already used");
        require(amount > 0, "Amount must be > 0");
        require(deadline > block.timestamp, "Deadline must be in the future");

        bool success = stablecoin.transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");

        escrows[orderId] = EscrowInfo({
            buyer: msg.sender,
            seller: seller,
            amount: amount,
            deadline: deadline,
            released: false
        });
        
        emit FundsLocked(orderId, msg.sender, seller, amount, deadline);
    }


    function confirmDelivery(uint256 orderId) external {
        EscrowInfo storage info = escrows[orderId];
        require(!info.released, "Already released");
        require(msg.sender == info.buyer, "Only buyer can confirm");
        require(info.amount > 0, "No funds");

        uint256 feeAmount = (info.amount * platformFee) / 10000;
        uint256 payout = info.amount - feeAmount;
        info.released = true;

        require(stablecoin.transfer(info.seller, payout), "Payout failed");
        require(stablecoin.transfer(feeCollector, feeAmount), "Fee transfer failed");

        emit FundsReleased(orderId, info.seller, payout, feeAmount);
    }

    function refund(uint256 orderId) external {
        EscrowInfo storage info = escrows[orderId];
        require(!info.released, "Already released");
        require(info.amount > 0, "No funds");
        require(block.timestamp >= info.deadline, "Deadline not reached");

        uint256 refundAmount = info.amount;
        info.released = true;

        require(stablecoin.transfer(info.buyer, refundAmount), "Refund failed");

        emit FundsRefunded(orderId, info.buyer, refundAmount);
    }

    function setPlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        platformFee = newFee;
    }

    function setFeeCollector(address newCollector) external onlyOwner {
        require(newCollector != address(0), "Invalid address");
        feeCollector = newCollector;
    }

    function getEscrow(uint256 orderId) external view returns (
        address buyer,
        address seller,
        uint256 amount,
        uint256 deadline,
        bool released
    ) {
        EscrowInfo storage info = escrows[orderId];
        return (info.buyer, info.seller, info.amount, info.deadline, info.released);
    }
}

