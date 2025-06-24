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

// Hashing logic is no longer needed and can be removed.
/*
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});
*/

// Password comparison is no longer needed.
/*
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};
*/

module.exports = mongoose.model('User', userSchema);