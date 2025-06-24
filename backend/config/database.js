const mongoose = require('mongoose');

const connectDB = async () => {
    // Check if MONGODB_URI is defined
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI environment variable is not defined');
        process.exit(1);
    }
    
    console.log('Connecting to MongoDB:', process.env.MONGODB_URI);
    
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('Database connection error:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;