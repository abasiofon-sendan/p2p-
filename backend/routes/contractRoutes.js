const express = require('express');
const { ethers } = require('ethers');
const { orderManagerContract, signer } = require('../services/blockchainService');

const router = express.Router();

/**
 * @route   POST /api/contracts/:orderId/cancel
 * @desc    Cancel an order after the deadline (called by buyer)
 * @access  Public
 */
router.post('/:orderId/cancel', async (req, res) => {
    try {
        const { orderId } = req.params;

        // The backend's signer acts as the buyer initiating the cancellation.
        console.log(`Attempting to cancel order ${orderId} as buyer: ${signer.address}`);

        const tx = await orderManagerContract.cancelOrder(orderId);
        const receipt = await tx.wait();

        res.status(200).json({
            message: `Order ${orderId} cancelled successfully!`,
            transactionHash: receipt.hash,
        });

    } catch (error) {
        console.error(`Failed to cancel order ${orderId}:`, error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

/**
 * @route   GET /api/contracts/:orderId
 * @desc    Get details for a specific order from blockchain
 * @access  Public
 */
router.get('/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await orderManagerContract.orders(orderId);

        const formattedOrder = {
            buyer: order.buyer,
            seller: order.seller,
            amount: ethers.formatUnits(order.amount, 6),
            deadline: new Date(Number(order.deadline) * 1000).toISOString(),
            description: order.description,
            status: order.status,
        };

        res.status(200).json(formattedOrder);
    } catch (error) {
        console.error('Failed to fetch order details:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

// Get contract addresses
router.get('/addresses', (req, res) => {
    res.json({
        success: true,
        contracts: {
            mockUSDT: process.env.MOCK_USDT_ADDRESS,
            escrow: process.env.ESCROW_ADDRESS,
            orderManager: process.env.ORDER_MANAGER_ADDRESS
        }
    });
});

// Health check for blockchain service
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Contract service is running',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;