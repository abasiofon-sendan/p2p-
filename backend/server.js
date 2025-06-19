const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Contract ABIs (you'll need to add these after compilation)
const mockUSDTABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function mint(address to, uint256 amount) external",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
  "function name() external view returns (string)"
];

const escrowABI = [
  "function createEscrow(uint256 amount, address buyer, string memory description) external returns (uint256)",
  "function releaseEscrow(uint256 escrowId) external",
  "function disputeEscrow(uint256 escrowId) external",
  "function getEscrow(uint256 escrowId) external view returns (tuple(uint256 amount, address seller, address buyer, bool released, bool disputed, string description))",
  "function getEscrowCount() external view returns (uint256)"
];

const orderManagerABI = [
  "function createOrder(uint256 orderId, address seller, uint256 amount, uint256 deadline) external",
  "function cancelOrder(uint256 orderId) external",
  "function getOrder(uint256 orderId) external view returns (tuple(uint256 orderId, address buyer, address seller, uint256 amount, uint256 deadline, uint8 status))"
];

// Provider and wallet setup
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f4ff80', provider);

// Contract addresses (update these after deployment)
const MOCK_USDT_ADDRESS = process.env.MOCK_USDT_ADDRESS || '';
const ESCROW_ADDRESS = process.env.ESCROW_ADDRESS || '';
const ORDER_MANAGER_ADDRESS = process.env.ORDER_MANAGER_ADDRESS || '';

let mockUSDTContract, escrowContract;

// Initialize contracts
async function initializeContracts() {
  if (MOCK_USDT_ADDRESS && ESCROW_ADDRESS) {
    mockUSDTContract = new ethers.Contract(MOCK_USDT_ADDRESS, mockUSDTABI, wallet);
    escrowContract = new ethers.Contract(ESCROW_ADDRESS, escrowABI, wallet);
    console.log('Contracts initialized successfully');
  } else {
    console.log('Please set contract addresses in environment variables');
  }
}

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get wallet balance
app.get('/wallet/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const balance = await provider.getBalance(address);
    const tokenBalance = mockUSDTContract ? await mockUSDTContract.balanceOf(address) : '0';
    
    res.json({
      address,
      ethBalance: ethers.formatEther(balance),
      tokenBalance: ethers.formatUnits(tokenBalance, 6) // USDT has 6 decimals
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mint testnet tokens
app.post('/tokens/mint', async (req, res) => {
  try {
    const { to, amount } = req.body;
    
    if (!mockUSDTContract) {
      return res.status(400).json({ error: 'MockUSDT contract not initialized' });
    }
    
    const tx = await mockUSDTContract.mint(to, ethers.parseUnits(amount.toString(), 6));
    await tx.wait();
    
    res.json({
      success: true,
      txHash: tx.hash,
      to,
      amount,
      message: `Minted ${amount} MockUSDT to ${to}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create escrow
app.post('/escrow/create', async (req, res) => {
  try {
    const { amount, buyer, description } = req.body;
    
    if (!escrowContract) {
      return res.status(400).json({ error: 'Escrow contract not initialized' });
    }
    
    // First approve the escrow contract to spend tokens
    const approveTx = await mockUSDTContract.approve(ESCROW_ADDRESS, ethers.parseUnits(amount.toString(), 6));
    await approveTx.wait();
    
    // Create escrow
    const tx = await escrowContract.createEscrow(
      ethers.parseUnits(amount.toString(), 6),
      buyer,
      description
    );
    const receipt = await tx.wait();
    
    res.json({
      success: true,
      txHash: tx.hash,
      amount,
      buyer,
      description,
      blockNumber: receipt.blockNumber
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get escrow details
app.get('/escrow/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!escrowContract) {
      return res.status(400).json({ error: 'Escrow contract not initialized' });
    }
    
    const escrow = await escrowContract.getEscrow(id);
    
    res.json({
      id,
      amount: ethers.formatUnits(escrow.amount, 6),
      seller: escrow.seller,
      buyer: escrow.buyer,
      released: escrow.released,
      disputed: escrow.disputed,
      description: escrow.description
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Release escrow
app.post('/escrow/:id/release', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!escrowContract) {
      return res.status(400).json({ error: 'Escrow contract not initialized' });
    }
    
    const tx = await escrowContract.releaseEscrow(id);
    await tx.wait();
    
    res.json({
      success: true,
      txHash: tx.hash,
      escrowId: id,
      message: `Escrow ${id} released successfully`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all escrows count
app.get('/escrow/count', async (req, res) => {
  try {
    if (!escrowContract) {
      return res.status(400).json({ error: 'Escrow contract not initialized' });
    }
    
    const count = await escrowContract.getEscrowCount();
    
    res.json({
      totalEscrows: count.toString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create order
app.post('/order/create', async (req, res) => {
  try {
    const { orderId, seller, amount, deadline } = req.body;
    const orderManager = new ethers.Contract(ORDER_MANAGER_ADDRESS, orderManagerABI, wallet);
    
    const tx = await orderManager.createOrder(orderId, seller, ethers.parseUnits(amount.toString(), 6), deadline);
    await tx.wait();
    
    res.json({ success: true, txHash: tx.hash, orderId, seller, amount, deadline });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get order details
app.get('/order/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const orderManager = new ethers.Contract(ORDER_MANAGER_ADDRESS, orderManagerABI, wallet);
    
    const order = await orderManager.getOrder(id);
    
    res.json({
      orderId: order.orderId.toString(),
      buyer: order.buyer,
      seller: order.seller,
      amount: ethers.formatUnits(order.amount, 6),
      deadline: order.deadline.toString(),
      status: order.status // 0=None, 1=Created, 2=Cancelled
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel order
app.post('/order/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const orderManager = new ethers.Contract(ORDER_MANAGER_ADDRESS, orderManagerABI, wallet);
    
    const tx = await orderManager.cancelOrder(id);
    await tx.wait();
    
    res.json({
      success: true,
      txHash: tx.hash,
      orderId: id,
      message: `Order ${id} cancelled and funds refunded`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get escrow by order ID (since lockFunds uses orderId)
app.get('/escrow/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!escrowContract) {
      return res.status(400).json({ error: 'Escrow contract not initialized' });
    }
    
    const escrow = await escrowContract.getEscrow(orderId);
    
    res.json({
      orderId,
      amount: ethers.formatUnits(escrow.amount, 6),
      seller: escrow.seller,
      buyer: escrow.buyer,
      released: escrow.released,
      disputed: escrow.disputed,
      refunded: escrow.refunded,
      deadline: escrow.deadline.toString(),
      description: escrow.description
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initializeContracts();
});