const express = require('express');
const { ethers } = require('ethers');
const { escrowContract, signer } = require('../services/blockchainService');
const Escrow = require('../models/Escrow');

const router = express.Router();

/**
 * @route   POST /api/escrows/:escrowId/dispute
 * @desc    Dispute an escrow (called by buyer or seller)
 * @access  Public
 */
router.post('/:escrowId/dispute', async (req, res) => {
    try {
        const { escrowId } = req.params;
        const { reason } = req.body;

        // In a real app, you'd verify the request comes from the legitimate buyer or seller
        // Here, we assume the backend signer is either the buyer or seller
        console.log(`Attempting to dispute escrow ${escrowId} as: ${signer.address}`);
        console.log(`Dispute reason: ${reason || 'No reason provided'}`);

        const tx = await escrowContract.disputeEscrow(escrowId);
        const receipt = await tx.wait();

        res.status(200).json({
            message: `Escrow ${escrowId} disputed successfully!`,
            transactionHash: receipt.hash,
            reason: reason || 'No reason provided'
        });

    } catch (error) {
        console.error(`Failed to dispute escrow ${escrowId}:`, error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

/**
 * @route   POST /api/escrows/:escrowId/resolve
 * @desc    Resolve a disputed escrow (admin only)
 * @body    { "recipient": "0x...", "reason": "Payment confirmed" }
 * @access  Admin
 */
router.post('/:escrowId/resolve', async (req, res) => {
    try {
        const { escrowId } = req.params;
        const { recipient, reason } = req.body;

        if (!recipient) {
            return res.status(400).json({ message: 'Recipient address is required' });
        }

        if (!ethers.isAddress(recipient)) {
            return res.status(400).json({ message: 'Invalid recipient address' });
        }

        // Only the contract owner (admin) can resolve disputes
        console.log(`Admin ${signer.address} resolving dispute for escrow ${escrowId}`);
        console.log(`Funds will be released to: ${recipient}`);
        console.log(`Resolution reason: ${reason || 'No reason provided'}`);

        const tx = await escrowContract.resolveDispute(escrowId, recipient);
        const receipt = await tx.wait();

        res.status(200).json({
            message: `Dispute for escrow ${escrowId} resolved successfully!`,
            transactionHash: receipt.hash,
            recipient,
            reason: reason || 'No reason provided'
        });

    } catch (error) {
        console.error(`Failed to resolve dispute for escrow ${escrowId}:`, error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

/**
 * @route   POST /api/escrows/restrict-user
 * @desc    Restrict a user from creating new escrows (admin only)
 * @body    { "userAddress": "0x...", "reason": "Fraudulent behavior" }
 * @access  Admin
 */
router.post('/restrict-user', async (req, res) => {
    try {
        const { userAddress, reason } = req.body;

        if (!userAddress) {
            return res.status(400).json({ message: 'User address is required' });
        }

        if (!ethers.isAddress(userAddress)) {
            return res.status(400).json({ message: 'Invalid user address' });
        }

        console.log(`Admin ${signer.address} restricting user: ${userAddress}`);
        console.log(`Restriction reason: ${reason || 'No reason provided'}`);

        const tx = await escrowContract.restrictUser(userAddress, reason || 'Violation of terms');
        const receipt = await tx.wait();

        res.status(200).json({
            message: `User ${userAddress} restricted successfully!`,
            transactionHash: receipt.hash,
            reason: reason || 'Violation of terms'
        });

    } catch (error) {
        console.error(`Failed to restrict user ${userAddress}:`, error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

/**
 * @route   GET /api/escrows/:escrowId/status
 * @desc    Get detailed status of an escrow including dispute information
 * @access  Public
 */
router.get('/:escrowId/status', async (req, res) => {
    try {
        const { escrowId } = req.params;
        const escrow = await escrowContract.escrows(escrowId);

        // Check if user is restricted
        const sellerRestricted = await escrowContract.restrictedUsers(escrow.seller);
        const buyerRestricted = await escrowContract.restrictedUsers(escrow.buyer);

        const formattedEscrow = {
            escrowId,
            amount: ethers.formatUnits(escrow.amount, 6),
            seller: escrow.seller,
            buyer: escrow.buyer,
            released: escrow.released,
            disputed: escrow.disputed,
            description: escrow.description,
            deadline: new Date(Number(escrow.deadline) * 1000).toISOString(),
            refunded: escrow.refunded,
            status: escrow.disputed ? 'DISPUTED' : 
                   escrow.released ? 'RELEASED' : 
                   escrow.refunded ? 'REFUNDED' : 'ACTIVE',
            restrictions: {
                sellerRestricted,
                buyerRestricted
            }
        };

        res.status(200).json(formattedEscrow);
    } catch (error) {
        console.error('Failed to fetch escrow status:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

/**
 * @route   POST /api/escrows/:escrowId/release
 * @desc    Release funds from an escrow (called by seller)
 * @access  Public
 */
router.post('/:escrowId/release', async (req, res) => {
    try {
        const { escrowId } = req.params;

        console.log(`Attempting to release escrow ${escrowId} as seller: ${signer.address}`);

        const tx = await escrowContract.releaseEscrow(escrowId);
        const receipt = await tx.wait();

        res.status(200).json({
            message: `Escrow ${escrowId} released successfully!`,
            transactionHash: receipt.hash,
        });

    } catch (error) {
        console.error(`Failed to release escrow ${escrowId}:`, error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

// Get all escrows
router.get('/', async (req, res) => {
    try {
        const escrows = await Escrow.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            escrows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Get escrow by ID
router.get('/:id', async (req, res) => {
    try {
        const escrow = await Escrow.findOne({ escrowId: req.params.id });
        if (!escrow) {
            return res.status(404).json({
                success: false,
                message: 'Escrow not found'
            });
        }

        res.json({
            success: true,
            escrow
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;