const { ethers } = require('ethers');

// Initialize blockchain connection
const provider = new ethers.JsonRpcProvider(process.env.LISK_SEPOLIA_RPC_URL || 'https://rpc.sepolia-api.lisk.com');

// Contract ABIs based on your actual contract structure
const mockUSDTABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)"
];

const escrowABI = [
    "function createEscrow(uint256 amount, address buyer, string memory description, uint256 deadline) external returns (uint256)",
    "function lockFunds(uint256 orderId, address seller, uint256 amount, uint256 deadline) external returns (uint256)",
    "function releaseEscrow(uint256 escrowId) external",
    "function disputeEscrow(uint256 escrowId) external",
    "function cancelEscrow(uint256 escrowId) external",
    "function resolveDispute(uint256 escrowId, address recipient) external",
    "function restrictUser(address user, string memory reason) external",
    "function escrows(uint256) view returns (uint256 amount, address seller, address buyer, bool released, bool disputed, string memory description, uint256 deadline, bool refunded)",
    "function escrowCounter() view returns (uint256)",
    "function restrictedUsers(address) view returns (bool)",
    "function feePercentage() view returns (uint256)",
    "function feeCollector() view returns (address)",
    "event EscrowCreated(uint256 indexed escrowId, address indexed seller, address indexed buyer, uint256 amount)",
    "event EscrowReleased(uint256 indexed escrowId)",
    "event EscrowDisputed(uint256 indexed escrowId)",
    "event EscrowCancelled(uint256 indexed escrowId)",
    "event UserRestricted(address indexed user, string reason)"
];

const orderManagerABI = [
    "function createOrder(address seller, uint256 amount, uint256 deadline) external",
    "function cancelOrder(uint256 orderId) external",
    "function orders(uint256) view returns (uint256 orderId, address buyer, address seller, uint256 amount, uint256 deadline, uint8 status, uint256 escrowId)",
    "function orderCounter() view returns (uint256)",
    "function escrow() view returns (address)",
    "event OrderCreated(uint256 indexed orderId, address buyer, address seller, uint256 amount, uint256 deadline)",
    "event OrderCancelled(uint256 indexed orderId, address buyer)"
];

// Initialize contracts
let mockUSDT, escrowContract, orderManager;

try {
    if (process.env.MOCK_USDT_ADDRESS) {
        mockUSDT = new ethers.Contract(process.env.MOCK_USDT_ADDRESS, mockUSDTABI, provider);
    }
    
    if (process.env.ESCROW_ADDRESS) {
        escrowContract = new ethers.Contract(process.env.ESCROW_ADDRESS, escrowABI, provider);
    }
    
    if (process.env.ORDER_MANAGER_ADDRESS) {
        orderManager = new ethers.Contract(process.env.ORDER_MANAGER_ADDRESS, orderManagerABI, provider);
    }
    
    console.log('Blockchain service initialized. Contracts connected.');
} catch (error) {
    console.error('Error initializing blockchain service:', error.message);
}

// Helper functions
const getContractWithSigner = (contract, privateKey) => {
    const wallet = new ethers.Wallet(privateKey, provider);
    return contract.connect(wallet);
};

const formatEther = (value) => {
    return ethers.formatEther(value);
};

const parseEther = (value) => {
    return ethers.parseEther(value.toString());
};

const formatUnits = (value, decimals = 18) => {
    return ethers.formatUnits(value, decimals);
};

const parseUnits = (value, decimals = 18) => {
    return ethers.parseUnits(value.toString(), decimals);
};

module.exports = {
    provider,
    mockUSDT,
    escrowContract,
    orderManager,
    getContractWithSigner,
    formatEther,
    parseEther,
    formatUnits,
    parseUnits
};