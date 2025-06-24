const mongoose = require('mongoose');

const escrowSchema = new mongoose.Schema({
    escrowId: {
        type: Number,
        required: true,
        unique: true
    },
    amount: {
        type: String,
        required: true
    },
    seller: {
        type: String,
        required: true,
        lowercase: true
    },
    buyer: {
        type: String,
        required: true,
        lowercase: true
    },
    released: {
        type: Boolean,
        default: false
    },
    disputed: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
        maxlength: 500,
        default: ''
    },
    deadline: {
        type: Number,
        required: true
    },
    refunded: {
        type: Boolean,
        default: false
    },
    transactionHash: {
        type: String,
        required: false
    },
    orderId: {
        type: Number,
        required: false
    },
    // Additional fields for tracking
    createdBlockNumber: {
        type: Number,
        required: false
    },
    releasedBlockNumber: {
        type: Number,
        required: false
    },
    disputedBlockNumber: {
        type: Number,
        required: false
    },
    cancelledBlockNumber: {
        type: Number,
        required: false
    },
    // Fee information
    feeAmount: {
        type: String,
        default: '0'
    },
    feePercentage: {
        type: Number,
        default: 100 // 1% in basis points
    }
}, {
    timestamps: true
});

// Index for efficient queries
// escrowSchema.index({ escrowId: 1 });
escrowSchema.index({ seller: 1 });
escrowSchema.index({ buyer: 1 });
escrowSchema.index({ released: 1 });
escrowSchema.index({ disputed: 1 });
escrowSchema.index({ deadline: 1 });

// Virtual for status calculation
escrowSchema.virtual('status').get(function() {
    if (this.refunded) return 'Refunded';
    if (this.disputed) return 'Disputed';
    if (this.released) return 'Released';
    if (Date.now() / 1000 > this.deadline) return 'Expired';
    return 'Active';
});

// Method to check if escrow is expired
escrowSchema.methods.isExpired = function() {
    return Date.now() / 1000 > this.deadline;
};

// Method to check if escrow can be cancelled
escrowSchema.methods.canBeCancelled = function() {
    return !this.released && !this.disputed && !this.refunded && this.isExpired();
};

// Method to check if escrow can be released
escrowSchema.methods.canBeReleased = function() {
    return !this.released && !this.disputed && !this.refunded;
};

// Method to check if escrow can be disputed
escrowSchema.methods.canBeDisputed = function() {
    return !this.released && !this.disputed && !this.refunded;
};

// Pre-save middleware to ensure lowercase addresses
escrowSchema.pre('save', function(next) {
    if (this.seller) {
        this.seller = this.seller.toLowerCase();
    }
    if (this.buyer) {
        this.buyer = this.buyer.toLowerCase();
    }
    next();
});

// Static method to find escrows by participant
escrowSchema.statics.findByParticipant = function(address) {
    const normalizedAddress = address.toLowerCase();
    return this.find({
        $or: [
            { seller: normalizedAddress },
            { buyer: normalizedAddress }
        ]
    });
};

// Static method to find active escrows
escrowSchema.statics.findActive = function() {
    return this.find({
        released: false,
        disputed: false,
        refunded: false
    });
};

// Static method to find expired escrows
escrowSchema.statics.findExpired = function() {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    return this.find({
        deadline: { $lt: currentTimestamp },
        released: false,
        disputed: false,
        refunded: false
    });
};

module.exports = mongoose.model('Escrow', escrowSchema);