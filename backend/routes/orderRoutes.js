const express = require('express');
const { ethers } = require('ethers');
const { orderManagerContract, signer } = require('../services/blockchainService');

const router = express.Router();

/**
 * @route   POST /api/orders/create
 * @desc    Create a new trade order
 * @body    { "seller": "0x...", "amount": "100", "deadline": 1735689600 }
 * @access  Public
 */
router.post('/create', async (req, res) => {
    const { seller, amount, deadline } = req.body;

    if (!seller || !amount || !deadline) {
        return res.status(400).json({ message: 'Missing required fields: seller, amount, deadline' });
    }

    try {
        // The `createOrder` function is called by the buyer.
        // For this example, we use the backend's signer as the buyer.
        const buyer = await signer.getAddress();
        console.log(`Attempting to create order as buyer: ${buyer} for seller: ${seller}`);

        // NOTE: For this to work, the 'seller' must have first approved the Escrow contract
        // to spend their MockUSDT tokens. This is a critical on-chain step.
        const amountInWei = ethers.parseUnits(amount.toString(), 6); // MockUSDT has 6 decimals

        const tx = await orderManagerContract.createOrder(seller, amountInWei, deadline);
        const receipt = await tx.wait();

        // Find the OrderCreated event to get the new orderId
        const iface = orderManagerContract.interface;
        const orderCreatedEvent = receipt.logs.map(log => {
            try {
                return iface.parseLog(log);
            } catch (e) {
                return null;
            }
        }).find(e => e?.name === 'OrderCreated');
        
        if (!orderCreatedEvent) {
            throw new Error("OrderCreated event not found in transaction receipt.");
        }
        const orderId = orderCreatedEvent.args.orderId;

        res.status(201).json({
            message: 'Order created successfully!',
            transactionHash: receipt.hash,
            orderId: orderId.toString(),
        });

    } catch (error) {
        console.error('Failed to create order:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

/**
 * @route   GET /api/orders/:orderId
 * @desc    Get details for a specific order
 * @access  Public
 */
router.get('/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await orderManagerContract.orders(orderId);

        // Format the raw contract data into a readable JSON object
        const formattedOrder = {
            orderId: order.orderId.toString(),
            buyer: order.buyer,
            seller: order.seller,
            amount: ethers.formatUnits(order.amount, 6), // Format back to human-readable
            deadline: new Date(Number(order.deadline) * 1000).toISOString(),
            status: ["None", "Created", "Cancelled"][order.status],
            escrowId: order.escrowId.toString(),
        };

        res.status(200).json(formattedOrder);
    } catch (error) {
        console.error('Failed to fetch order:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

/**
 * @route   POST /api/orders/:orderId/cancel
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

module.exports = router;
