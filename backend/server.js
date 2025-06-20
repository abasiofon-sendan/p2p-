require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Initialize database connection
const connectDB = require('./config/database');
connectDB();

// Initialize blockchain service on startup
require('./services/blockchainService');

const contractRoutes = require('./routes/contractRoutes');
const orderRoutes = require('./routes/orderRoutes');
const escrowRoutes = require('./routes/escrowRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health Check Route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/contracts', contractRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/escrows', escrowRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
