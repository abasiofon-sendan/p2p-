// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Escrow is ReentrancyGuard, Ownable {
    IERC20 public token;
    address public feeCollector;
    uint256 public feePercentage = 100; // 1% (100 basis points)
    
    struct EscrowData {
        uint256 amount;
        address seller;
        address buyer;
        bool released;
        bool disputed;
        string description;
        uint256 deadline;
        bool refunded;
    }
    
    mapping(uint256 => EscrowData) public escrows;
    uint256 public escrowCounter;
    
    event EscrowCreated(uint256 indexed escrowId, address indexed seller, address indexed buyer, uint256 amount);
    event EscrowReleased(uint256 indexed escrowId);
    event EscrowDisputed(uint256 indexed escrowId);
    event FundsLocked(uint256 indexed orderId, address indexed seller, uint256 amount, uint256 deadline);
    event FundsRefunded(uint256 indexed orderId, address indexed seller, uint256 amount);
    
    constructor(address _token, address _feeCollector) Ownable(msg.sender) {
        token = IERC20(_token);
        feeCollector = _feeCollector;
    }
    
    // Add the missing lockFunds function
    function lockFunds(uint256 orderId, address seller, uint256 amount, uint256 deadline) external {
        require(amount > 0, "Amount must be greater than 0");
        require(seller != address(0), "Invalid seller address");
        require(deadline > block.timestamp, "Invalid deadline");
        
        // Transfer tokens from seller to contract
        require(token.transferFrom(seller, address(this), amount), "Token transfer failed");
        
        // Store the escrow data using orderId
        escrows[orderId] = EscrowData({
            amount: amount,
            seller: seller,
            buyer: address(0), // Buyer not set yet
            released: false,
            disputed: false,
            description: "",
            deadline: deadline,
            refunded: false
        });
        
        emit FundsLocked(orderId, seller, amount, deadline);
    }
    
    // Add the missing refund function
    function refund(uint256 orderId) external nonReentrant {
        EscrowData storage escrow = escrows[orderId];
        require(escrow.amount > 0, "Escrow does not exist");
        require(!escrow.released, "Already released");
        require(!escrow.refunded, "Already refunded");
        require(!escrow.disputed, "Escrow is disputed");
        require(block.timestamp >= escrow.deadline, "Deadline not reached");
        
        escrow.refunded = true;
        
        // Refund tokens to seller
        require(token.transfer(escrow.seller, escrow.amount), "Refund transfer failed");
        
        emit FundsRefunded(orderId, escrow.seller, escrow.amount);
    }
    
    function createEscrow(uint256 amount, address buyer, string memory description) external returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        require(buyer != address(0), "Invalid buyer address");
        require(buyer != msg.sender, "Buyer cannot be seller");
        
        // Transfer tokens from seller to contract
        require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        
        uint256 escrowId = escrowCounter++;
        escrows[escrowId] = EscrowData({
            amount: amount,
            seller: msg.sender,
            buyer: buyer,
            released: false,
            disputed: false,
            description: description,
            deadline: 0,
            refunded: false
        });
        
        emit EscrowCreated(escrowId, msg.sender, buyer, amount);
        return escrowId;
    }
    
    function setBuyer(uint256 escrowId, address buyer) external {
        EscrowData storage escrow = escrows[escrowId];
        require(escrow.seller == msg.sender, "Only seller can set buyer");
        require(escrow.buyer == address(0), "Buyer already set");
        require(buyer != address(0), "Invalid buyer address");
        require(buyer != escrow.seller, "Buyer cannot be seller");
        
        escrow.buyer = buyer;
    }
    
    function releaseEscrow(uint256 escrowId) external nonReentrant {
        EscrowData storage escrow = escrows[escrowId];
        require(escrow.seller == msg.sender, "Only seller can release");
        require(!escrow.released, "Already released");
        require(!escrow.disputed, "Escrow is disputed");
        require(!escrow.refunded, "Already refunded");
        require(escrow.buyer != address(0), "Buyer not set");
        
        escrow.released = true;
        
        // Calculate fee
        uint256 fee = (escrow.amount * feePercentage) / 10000;
        uint256 buyerAmount = escrow.amount - fee;
        
        // Transfer tokens
        if (fee > 0) {
            require(token.transfer(feeCollector, fee), "Fee transfer failed");
        }
        require(token.transfer(escrow.buyer, buyerAmount), "Buyer transfer failed");
        
        emit EscrowReleased(escrowId);
    }
    
    function disputeEscrow(uint256 escrowId) external {
        EscrowData storage escrow = escrows[escrowId];
        require(escrow.buyer == msg.sender || escrow.seller == msg.sender, "Not authorized");
        require(!escrow.released, "Already released");
        require(!escrow.refunded, "Already refunded");
        require(!escrow.disputed, "Already disputed");
        
        escrow.disputed = true;
        emit EscrowDisputed(escrowId);
    }
    
    function getEscrow(uint256 escrowId) external view returns (EscrowData memory) {
        return escrows[escrowId];
    }
    
    function getEscrowCount() external view returns (uint256) {
        return escrowCounter;
    }
    
    // Admin functions
    function setFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 1000, "Fee too high"); // Max 10%
        feePercentage = _feePercentage;
    }
    
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Invalid address");
        feeCollector = _feeCollector;
    }
}

