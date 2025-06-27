const mongoose = require('mongoose');

const bankDetailsSchema = new mongoose.Schema({
    bankName: {
        type: String,
        required: true,
        trim: true,
    },
    accountNumber: {
        type: String,
        required: true,
        trim: true,
    },
    accountName: {
        type: String,
        required: true,
        trim: true,
    }
}, { _id: false }); // Don't create separate _id for subdocument

const orderSchema = new mongoose.Schema({
    orderId: { // Optional: If you link to a smart contract order ID
        type: String,
        unique: true,
        sparse: true, // Allows multiple documents to have a null value
    },
    orderType: {
        type: String,
        enum: ['buy', 'sell'],
        required: true,
    },
    asset: {
        type: String,
        enum: ['USDT', 'USDC'],
        required: true,
    },
    amount: { // Total amount of crypto for sale/purchase
        type: Number,
        required: true,
    },
    rate: { // Fiat price per unit of crypto
        type: Number,
        required: true,
    },
    minLimit: { // Minimum fiat amount for a trade
        type: Number,
        required: true,
    },
    maxLimit: { // Maximum fiat amount for a trade
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'matched', 'completed', 'cancelled'],
        default: 'active',
    },
    seller: { // The user who created the order
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    paymentMethods: [{ // List of accepted payment methods (now only Bank Transfer)
        type: String,
        enum: ['Bank Transfer'], // Restrict to only bank transfers
        default: ['Bank Transfer']
    }],
    paymentInstructions: {
        type: String,
        trim: true,
    },
    bankDetails: {
        type: bankDetailsSchema,
        required: true, // Bank details are now required
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields automatically
});

module.exports = mongoose.model('Order', orderSchema);