const express = require('express');
const { ethers } = require('ethers');
const crypto = require('crypto');
const User = require('../models/User');
const Escrow = require('../models/Escrow');
const { mockUSDT } = require('../services/blockchainService');

const router = express.Router();

/**
 * @route   POST /api/users/auth
 * @desc    Login or Register a user with their wallet address
 * @body    { "walletAddress": "0x..." }
 * @access  Public
 */
router.post('/auth', async (req, res) => {
    try {
        const { walletAddress } = req.body;

        // Validate wallet address
        if (!walletAddress || !ethers.isAddress(walletAddress)) {
            return res.status(400).json({ message: 'A valid wallet address is required' });
        }

        const lowercasedAddress = walletAddress.toLowerCase();

        // Find user or create a new one if they don't exist
        let user = await User.findOne({ walletAddress: lowercasedAddress });

        if (!user) {
            user = new User({ walletAddress: lowercasedAddress });
            await user.save();
            
            // Return a 201 status for new user creation
            return res.status(201).json({
                message: 'User registered successfully',
                user: {
                    id: user._id,
                    walletAddress: user.walletAddress,
                }
            });
        }
        
        // Return a 200 status for existing user login
        res.status(200).json({
            message: 'User logged in successfully',
            user: {
                id: user._id,
                walletAddress: user.walletAddress,
                email: user.email,
                fullName: user.fullName,
                isEmailVerified: user.isEmailVerified,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('User authentication failed:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

/**
 * @route   GET /api/users/dashboard/:walletAddress
 * @desc    Get all dashboard data for a user
 * @access  Authenticated (implicitly by wallet address)
 */
router.get('/dashboard/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        if (!ethers.isAddress(walletAddress)) {
            return res.status(400).json({ message: 'Invalid wallet address' });
        }
        const lowercasedAddress = walletAddress.toLowerCase();

        // 1. Fetch user data from DB
        const user = await User.findOne({ walletAddress: lowercasedAddress });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 2. Fetch wallet balances from Blockchain
        let usdtBalance = '0';
        if (mockUSDT) {
            const rawUsdtBalance = await mockUSDT.balanceOf(lowercasedAddress);
            usdtBalance = ethers.formatUnits(rawUsdtBalance, 6); // MockUSDT has 6 decimals
        }
        const balances = {
            usdt: parseFloat(usdtBalance),
            usdc: 0, // Placeholder for USDC or other tokens
        };

        // 3. Fetch recent transactions from DB
        const recentEscrows = await Escrow.find({
            $or: [{ seller: lowercasedAddress }, { buyer: lowercasedAddress }]
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate({
            path: 'order',
            select: 'asset' 
        });

        // Filter out escrows where the order might have been deleted or is otherwise missing
        const validEscrows = recentEscrows.filter(escrow => escrow.order);

        const recentTransactions = validEscrows.map(escrow => ({
            id: escrow._id.toString(),
            type: escrow.seller.toLowerCase() === lowercasedAddress ? 'sell' : 'buy',
            currency: escrow.order.asset, // Now safe to access .asset
            amount: parseFloat(escrow.amount),
            status: escrow.status,
            date: escrow.createdAt,
            counterparty: escrow.seller.toLowerCase() === lowercasedAddress ? escrow.buyer : escrow.seller,
        }));


        // 4. Assemble and send dashboard data
        const dashboardData = {
            stats: {
                rating: user.reputation || 0,
                completedTrades: user.completedTrades || 0,
                kycStatus: user.kycStatus || 'unverified',
            },
            balances,
            recentTransactions,
        };

        res.status(200).json(dashboardData);

    } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});


/**
 * @route   GET /api/users/profile/:walletAddress
 * @desc    Get user profile by wallet address
 * @access  Public
 */
router.get('/profile/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;

        if (!ethers.isAddress(walletAddress)) {
            return res.status(400).json({ message: 'Invalid wallet address' });
        }

        const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return public profile information
        res.status(200).json({
            id: user._id,
            walletAddress: user.walletAddress,
            fullName: user.fullName,
            tradingStats: user.tradingStats,
            isKYCVerified: user.isKYCVerified,
            isRestricted: user.isRestricted,
            createdAt: user.createdAt,
            lastActive: user.lastActive
        });

    } catch (error) {
        console.error('Failed to fetch user profile:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

module.exports = router;
