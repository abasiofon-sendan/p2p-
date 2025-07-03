const mongoose = require('mongoose');

const EscrowSchema = new mongoose.Schema({
    escrowId: {
        type: String,
        unique: true,
        sparse: true, // This is the fix!
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
    },
    amount: {
        type: String, // Storing as string to handle large numbers from blockchain
        required: true,
    },
    fiatAmount: {
        type: Number,
        required: true,
    },
    seller: {
        type: String, // Wallet address
        required: true,
        lowercase: true,
    },
    buyer: {
        type: String, // Wallet address
        required: true,
        lowercase: true,
    },
    status: {
        type: String,
        enum: ['Active', 'PaymentSent', 'Disputed', 'Completed', 'Cancelled'],
        default: 'Active',
    },
    deadline: {
        type: Date,
        // required: true, // Temporarily disable
    },
    disputeReason: String,
    disputeRaisedBy: {
        type: String,
        enum: ['buyer', 'seller'],
    },
    paymentSentAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('Escrow', EscrowSchema);