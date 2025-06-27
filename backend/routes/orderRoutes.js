const express = require('express');
const { ethers } = require('ethers');
const { orderManagerContract, signer } = require('../services/blockchainService');
const Order = require('../models/Order'); // Assuming you create an Order model
const User = require('../models/User'); // To populate seller info

const router = express.Router();

/**
 * @route   GET /api/orders
 * @desc    Get all active sell orders for the marketplace
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const { type } = req.query;
        
        // Build query based on type parameter
        let query = { status: 'active' };
        if (type === 'sell') {
            query.orderType = 'sell';
        } else if (type === 'buy') {
            query.orderType = 'buy';
        }

        // Find active orders and populate seller's info
        const orders = await Order.find(query)
            .populate({
                path: 'seller',
                select: 'username reputation completedTrades walletAddress'
            })
            .sort({ rate: 1, createdAt: -1 }); // Sort by best rate, then newest

        res.status(200).json(orders);
    } catch (error) {
        console.error('Failed to fetch orders:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

/**
 * @route   POST /api/orders/create
 * @desc    Create a new trade order in the database
 * @body    { 
 *   "orderType": "buy|sell", 
 *   "asset": "USDT|USDC", 
 *   "amount": 100, 
 *   "rate": 1.00,
 *   "minLimit": 10,
 *   "maxLimit": 1000,
 *   "seller": "userId",
 *   "paymentMethods": ["Bank Transfer"],
 *   "paymentInstructions": "...",
 *   "bankDetails": {
 *     "bankName": "Chase Bank",
 *     "accountNumber": "1234567890",
 *     "accountName": "John Doe"
 *   }
 * }
 * @access  Public
 */
router.post('/create', async (req, res) => {
    try {
        const { 
            orderType, 
            asset, 
            amount, 
            rate, 
            minLimit, 
            maxLimit, 
            seller, 
            paymentMethods, 
            paymentInstructions, 
            bankDetails 
        } = req.body;

        // Validate required fields
        if (!orderType || !asset || !amount || !rate || !minLimit || !maxLimit || !seller) {
            return res.status(400).json({ 
                message: 'Missing required fields: orderType, asset, amount, rate, minLimit, maxLimit, seller' 
            });
        }

        // Validate bank details
        if (!bankDetails || !bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.accountName) {
            return res.status(400).json({ 
                message: 'Bank details are required: bankName, accountNumber, accountName' 
            });
        }

        // Validate limits
        if (minLimit >= maxLimit) {
            return res.status(400).json({ 
                message: 'Maximum limit must be greater than minimum limit' 
            });
        }

        // Validate seller exists
        const sellerUser = await User.findById(seller);
        if (!sellerUser) {
            return res.status(404).json({ message: 'Seller not found' });
        }

        // Create new order
        const newOrder = new Order({
            orderType,
            asset,
            amount: parseFloat(amount),
            rate: parseFloat(rate),
            minLimit: parseFloat(minLimit),
            maxLimit: parseFloat(maxLimit),
            seller,
            paymentMethods: paymentMethods || ['Bank Transfer'],
            paymentInstructions: paymentInstructions || '',
            bankDetails: {
                bankName: bankDetails.bankName.trim(),
                accountNumber: bankDetails.accountNumber.trim(),
                accountName: bankDetails.accountName.trim()
            }
        });

        const savedOrder = await newOrder.save();

        // Populate seller info for response
        await savedOrder.populate({
            path: 'seller',
            select: 'username reputation completedTrades walletAddress'
        });

        res.status(201).json({
            message: 'Order created successfully!',
            order: savedOrder
        });

    } catch (error) {
        console.error('Failed to create order:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                message: 'Validation failed', 
                errors: validationErrors 
            });
        }

        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

/**
 * @route   GET /api/orders/:orderId
 * @desc    Get details for a specific order from database
 * @access  Public
 */
router.get('/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const order = await Order.findById(orderId)
            .populate({
                path: 'seller',
                select: 'username reputation completedTrades walletAddress'
            });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json(order);
    } catch (error) {
        console.error('Failed to fetch order:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

/**
 * @route   PUT /api/orders/:orderId/status
 * @desc    Update order status
 * @body    { "status": "active|matched|completed|cancelled" }
 * @access  Public
 */
router.put('/:orderId/status', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        if (!status || !['active', 'matched', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ 
                message: 'Invalid status. Must be one of: active, matched, completed, cancelled' 
            });
        }

        const order = await Order.findByIdAndUpdate(
            orderId, 
            { status }, 
            { new: true }
        ).populate({
            path: 'seller',
            select: 'username reputation completedTrades walletAddress'
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json({
            message: 'Order status updated successfully',
            order
        });

    } catch (error) {
        console.error('Failed to update order status:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

module.exports = router;
