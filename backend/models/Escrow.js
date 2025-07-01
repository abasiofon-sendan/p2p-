const mongoose = require('mongoose');

const escrowSchema = new mongoose.Schema({
    escrowId: {
        type: Number,
        required: true,
        unique: true
    },
    order: { // Link to the original order
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
    },
    amount: { // Crypto amount
        type: String,
        required: true
    },
    fiatAmount: { // Fiat amount for the trade
        type: Number,
        required: true,
    },
    seller: {
        type: String, // wallet address
        required: true,
        lowercase: true
    },
    buyer: {
        type: String, // wallet address
        required: true,
        lowercase: true
    },
    status: {
        type: String,
        enum: ['Active', 'PaymentSent', 'Disputed', 'Completed', 'Cancelled'],
        default: 'Active'
    },
    // Payment confirmation fields
    paymentSentAt: {
        type: Date
    },
    paymentConfirmedAt: {
        type: Date
    },
    // Dispute system fields
    disputeReason: {
        type: String,
        trim: true,
    },
    disputeRaisedBy: {
        type: String, // 'buyer' or 'seller'
        enum: ['buyer', 'seller']
    },
    disputeRaisedAt: {
        type: Date
    },
    disputeResolution: {
        type: String,
        enum: ['pending', 'awarded_to_buyer', 'awarded_to_seller']
    },
    disputeResolvedBy: {
        type: String, // admin wallet address
    },
    disputeResolvedAt: {
        type: Date
    },
    // Evidence storage
    buyerEvidence: [{
        type: String, // URL or description of evidence
        uploadedAt: { type: Date, default: Date.now }
    }],
    sellerEvidence: [{
        type: String, // URL or description of evidence
        uploadedAt: { type: Date, default: Date.now }
    }],
    // Communication log
    disputeMessages: [{
        from: String, // wallet address
        message: String,
        timestamp: { type: Date, default: Date.now }
    }],
    deadline: { // Deadline for the trade to be completed
        type: Number,
        required: true
    },
    transactionHash: {
        type: String,
    },
}, {
    timestamps: true
});

// Indexes for efficient queries
escrowSchema.index({ seller: 1, status: 1 });
escrowSchema.index({ buyer: 1, status: 1 });
escrowSchema.index({ status: 1, disputeRaisedAt: 1 });

module.exports = mongoose.model('Escrow', escrowSchema);