const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    username: {
        type: String,
        unique: true,
        sparse: true, // This is the fix!
        trim: true,
        minlength: 3,
    },
    email: {
        type: String,
        unique: true,
        sparse: true, // This allows multiple null values while maintaining uniqueness for non-null values
        trim: true,
        lowercase: true
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