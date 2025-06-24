const express = require('express');
const { ethers } = require('ethers');
const crypto = require('crypto');
const User = require('../models/User');

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
