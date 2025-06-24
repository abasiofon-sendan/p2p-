const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        // required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        // required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    walletAddress: {
        type: String,
        required: true, // Wallet address is now the primary identifier
        unique: true,
        sparse: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isRestricted: {
        type: Boolean,
        default: false
    },
    kycStatus: {
        type: String,
        enum: ['unverified', 'pending', 'verified', 'rejected'],
        default: 'unverified'
    },
    restrictionReason: {
        type: String,
        default: null
    },
    createdOrders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],
    completedTrades: {
        type: Number,
        default: 0
    },
    reputation: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    }
}, {
    timestamps: true
});


module.exports = mongoose.model('User', userSchema);