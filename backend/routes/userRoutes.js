const express = require('express');
const { ethers } = require('ethers');
const crypto = require('crypto');
const User = require('../models/User');

const router = express.Router();

/**
 * @route   POST /api/users/register
 * @desc    Register a new user with wallet or email
 * @body    { "walletAddress": "0x...", "email": "user@example.com" (optional) }
 * @access  Public
 */
router.post('/register', async (req, res) => {
    try {
        const { walletAddress, email, firstName, lastName, phoneNumber } = req.body;

        // Validate wallet address
        if (!walletAddress || !ethers.isAddress(walletAddress)) {
            return res.status(400).json({ message: 'Valid wallet address is required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [
                { walletAddress: walletAddress.toLowerCase() },
                ...(email ? [{ email: email.toLowerCase() }] : [])
            ]
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this wallet or email' });
        }

        // Create new user
        const userData = {
            walletAddress: walletAddress.toLowerCase(),
            firstName,
            lastName,
            phoneNumber
        };

        if (email) {
            userData.email = email.toLowerCase();
        }

        const user = new User(userData);

        // Generate email verification token if email provided
        let verificationToken = null;
        if (email) {
            // verificationToken = user.generateEmailVerificationToken();
            // TODO: Send verification email
        }

        await user.save();

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user._id,
                walletAddress: user.walletAddress,
                email: user.email,
                fullName: user.fullName,
                isEmailVerified: user.isEmailVerified,
                createdAt: user.createdAt
            },
            ...(verificationToken && { verificationToken }) // Only for testing
        });

    } catch (error) {
        console.error('User registration failed:', error);
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
