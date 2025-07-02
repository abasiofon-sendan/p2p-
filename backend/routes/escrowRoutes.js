const express = require('express');
const { ethers } = require('ethers');
const { escrowContract, signer } = require('../services/blockchainService');
const Escrow = require('../models/Escrow');
const Order = require('../models/Order');
const User = require('../models/User');

const router = express.Router();

/**
 * @route   GET /api/escrows/by-order/:orderId
 * @desc    Get an escrow by its associated Order ID
 * @access  Public (for now, should be protected)
 */
router.get('/by-order/:orderId', async (req, res) => {
    try {
        const escrow = await Escrow.findOne({ order: req.params.orderId }).populate({
            path: 'order',
            populate: {
                path: 'seller',
                model: 'User',
                select: 'walletAddress fullName kycStatus'
            }
        });

        if (!escrow) {
            return res.status(404).json({ message: 'Escrow not found for this order' });
        }
        res.json(escrow);
    } catch (error) {
        console.error('Failed to fetch escrow by order ID:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

/**
 * @route   POST /api/escrows/initiate
 * @desc    Initiate a trade by creating an escrow record
 * @access  Public
 */
router.post('/initiate', async (req, res) => {
    try {
        const { orderId, amount, fiatAmount, buyerAddress } = req.body;

        if (!orderId || !amount || !fiatAmount || !buyerAddress || !ethers.isAddress(buyerAddress)) {
            return res.status(400).json({ message: 'Invalid or missing request data' });
        }

        const order = await Order.findById(orderId).populate('seller');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.status !== 'active') return res.status(400).json({ message: 'Order is no longer active' });
        if (fiatAmount < order.minLimit || fiatAmount > order.maxLimit) {
            return res.status(400).json({ message: `Amount must be between $${order.minLimit} and $${order.maxLimit}` });
        }
        if (amount > order.amount) {
            return res.status(400).json({ message: 'Insufficient order amount available' });
        }

        const escrow = new Escrow({
            escrowId: Date.now(), // Using timestamp as a temporary unique ID
            order: orderId,
            amount: ethers.parseUnits(amount.toString(), 6).toString(),
            fiatAmount,
            seller: order.seller.walletAddress.toLowerCase(),
            buyer: buyerAddress.toLowerCase(),
            deadline: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24-hour deadline
        });

        await escrow.save();

        order.amount -= amount;
        if (order.amount <= 0) {
            order.status = 'completed';
        } else {
            order.status = 'matched';
        }
        await order.save();

        const populatedEscrow = await Escrow.findById(escrow._id).populate({
            path: 'order',
            populate: { path: 'seller' }
        });

        res.status(201).json({
            message: 'Trade initiated successfully!',
            escrow: populatedEscrow
        });

    } catch (error) {
        console.error('Failed to initiate trade:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

/**
 * @route   POST /api/escrows/:id/confirm-payment
 * @desc    Buyer confirms they have sent the fiat payment
 * @access  Authenticated (Buyer)
 */
router.post('/:id/confirm-payment', async (req, res) => {
    try {
        const escrow = await Escrow.findById(req.params.id);
        if (!escrow) return res.status(404).json({ message: 'Escrow not found' });
        if (escrow.status !== 'Active') return res.status(400).json({ message: 'This action cannot be performed at the current stage.' });

        escrow.status = 'PaymentSent';
        await escrow.save();

        // TODO: Notify seller via WebSocket/email
        res.status(200).json({ message: 'Payment confirmed. Seller has been notified.', escrow });

    } catch (error) {
        console.error('Failed to confirm payment:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

/**
 * @route   POST /api/escrows/:id/confirm-receipt
 * @desc    Seller confirms receipt of payment and releases crypto
 * @access  Authenticated (Seller)
 */
router.post('/:id/confirm-receipt', async (req, res) => {
    try {
        const escrow = await Escrow.findById(req.params.id);
        if (!escrow) return res.status(404).json({ message: 'Escrow not found' });
        if (escrow.status !== 'PaymentSent') return res.status(400).json({ message: 'Cannot confirm receipt until buyer confirms payment.' });

        // --- BLOCKCHAIN INTERACTION ---
        // In a real app, this is where you'd call the smart contract to release funds.
        // For now, we simulate it.
        console.log(`MOCK: Releasing ${ethers.formatUnits(escrow.amount, 6)} crypto to ${escrow.buyer}`);
        // const tx = await escrowContract.releaseEscrow(escrow.escrowId);
        // await tx.wait();
        // escrow.transactionHash = tx.hash;
        // --- END MOCK ---

        escrow.status = 'Completed';
        await escrow.save();

        // Update user stats
        await User.findOneAndUpdate({ walletAddress: escrow.seller }, { $inc: { completedTrades: 1 } });
        await User.findOneAndUpdate({ walletAddress: escrow.buyer }, { $inc: { completedTrades: 1 } });

        // TODO: Notify buyer of release
        res.status(200).json({ message: 'Payment received and crypto released successfully!', escrow });

    } catch (error) {
        console.error('Failed to confirm receipt:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

/**
 * @route   POST /api/escrows/:id/raise-dispute
 * @desc    Seller or Buyer raises a dispute
 * @access  Authenticated
 */
router.post('/:id/raise-dispute', async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason) return res.status(400).json({ message: 'A reason for the dispute is required.' });

        const escrow = await Escrow.findById(req.params.id);
        if (!escrow) return res.status(404).json({ message: 'Escrow not found' });
        if (escrow.status === 'Completed' || escrow.status === 'Cancelled') {
            return res.status(400).json({ message: 'Cannot raise dispute for completed or cancelled trades' });
        }
        if (escrow.status === 'Disputed') {
            return res.status(400).json({ message: 'A dispute has already been raised for this trade' });
        }

        escrow.status = 'Disputed';
        escrow.disputeReason = reason;
        escrow.disputeRaisedAt = new Date();
        await escrow.save();

        // TODO: Notify admins via email/webhook
        console.log('🚨 Admin notification: New dispute raised');
        console.log(`Escrow: ${escrow._id}, Reason: ${reason}`);

        res.status(200).json({
            message: 'Dispute raised successfully. An admin will review the case.',
            escrow
        });

    } catch (error) {
        console.error('❌ Failed to raise dispute:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

/**
 * @route   POST /api/escrows/:id/add-evidence
 * @desc    Add evidence to a disputed trade
 * @access  Public (should be authenticated as buyer or seller)
 */
router.post('/:id/add-evidence', async (req, res) => {
    try {
        const { evidence, submittedBy } = req.body; // submittedBy should be 'buyer' or 'seller'
        
        if (!evidence || !evidence.trim()) {
            return res.status(400).json({ message: 'Evidence description is required' });
        }

        if (!submittedBy || !['buyer', 'seller'].includes(submittedBy)) {
            return res.status(400).json({ message: 'submittedBy must be either "buyer" or "seller"' });
        }

        const escrow = await Escrow.findById(req.params.id);
        
        if (!escrow) {
            return res.status(404).json({ message: 'Escrow not found' });
        }

        if (escrow.status !== 'Disputed') {
            return res.status(400).json({ 
                message: 'Evidence can only be added to disputed trades' 
            });
        }

        // Add evidence to appropriate array
        const evidenceEntry = {
            type: evidence.trim(),
            uploadedAt: new Date()
        };

        if (submittedBy === 'buyer') {
            escrow.buyerEvidence.push(evidenceEntry);
        } else {
            escrow.sellerEvidence.push(evidenceEntry);
        }

        await escrow.save();

        res.status(200).json({
            message: 'Evidence added successfully',
            escrow
        });

    } catch (error) {
        console.error('❌ Failed to add evidence:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

/**
 * @route   POST /api/escrows/:id/resolve-dispute
 * @desc    Admin resolves a dispute (awards to buyer or seller)
 * @access  Admin only
 */
router.post('/:id/resolve-dispute', async (req, res) => {
    try {
        const { resolution, adminAddress, adminReason } = req.body;
        // resolution should be 'awarded_to_buyer' or 'awarded_to_seller'
        
        if (!resolution || !['awarded_to_buyer', 'awarded_to_seller'].includes(resolution)) {
            return res.status(400).json({ 
                message: 'resolution must be either "awarded_to_buyer" or "awarded_to_seller"' 
            });
        }

        const escrow = await Escrow.findById(req.params.id);
        
        if (!escrow) {
            return res.status(404).json({ message: 'Escrow not found' });
        }

        if (escrow.status !== 'Disputed') {
            return res.status(400).json({ 
                message: 'Can only resolve disputed trades' 
            });
        }

        // Update escrow with resolution
        escrow.disputeResolution = resolution;
        escrow.disputeResolvedBy = adminAddress || 'admin';
        escrow.disputeResolvedAt = new Date();
        escrow.status = 'Completed'; // Mark as completed regardless of outcome
        
        // Add admin message to dispute log
        if (adminReason) {
            escrow.disputeMessages.push({
                from: 'admin',
                message: `RESOLUTION: ${adminReason}`,
                timestamp: new Date()
            });
        }

        await escrow.save();

        // Update reputation based on outcome
        if (resolution === 'awarded_to_buyer') {
            // Buyer wins - penalize seller
            await User.findOneAndUpdate(
                { walletAddress: escrow.seller }, 
                { $inc: { reputation: -0.5 } } // Decrease seller reputation
            );
            await User.findOneAndUpdate(
                { walletAddress: escrow.buyer }, 
                { $inc: { completedTrades: 1 } }
            );
            console.log(`✅ Dispute resolved in favor of buyer. Crypto released to ${escrow.buyer}`);
        } else {
            // Seller wins - penalize buyer
            await User.findOneAndUpdate(
                { walletAddress: escrow.buyer }, 
                { $inc: { reputation: -0.5 } } // Decrease buyer reputation
            );
            await User.findOneAndUpdate(
                { walletAddress: escrow.seller }, 
                { $inc: { completedTrades: 1 } }
            );
            console.log(`✅ Dispute resolved in favor of seller. Crypto returned to ${escrow.seller}`);
        }

        res.status(200).json({
            message: `Dispute resolved in favor of ${resolution.includes('buyer') ? 'buyer' : 'seller'}`,
            escrow
        });

    } catch (error) {
        console.error('❌ Failed to resolve dispute:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

/**
 * @route   GET /api/escrows/:id
 * @desc    Get escrow details
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const escrow = await Escrow.findById(req.params.id).populate('order');
        
        if (!escrow) {
            return res.status(404).json({ message: 'Escrow not found' });
        }

        res.status(200).json(escrow);

    } catch (error) {
        console.error('❌ Failed to get escrow:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

/**
 * @route   GET /api/escrows/disputes/pending
 * @desc    Get all pending disputes (admin only)
 * @access  Admin
 */
router.get('/disputes/pending', async (req, res) => {
    try {
        // TODO: Admin authentication/authorization check

        const pendingDisputes = await Escrow.find({ 
            status: 'Disputed' 
        }).populate('order');

        res.status(200).json({
            success: true,
            disputes: pendingDisputes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/escrows/disputes/:id
 * @desc    Get dispute details by ID (admin only)
 * @access  Admin
 */
router.get('/disputes/:id', async (req, res) => {
    try {
        // TODO: Admin authentication/authorization check

        const dispute = await Escrow.findById(req.params.id).populate('order');

        if (!dispute) {
            return res.status(404).json({
                success: false,
                message: 'Dispute not found'
            });
        }

        res.json({
            success: true,
            dispute
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