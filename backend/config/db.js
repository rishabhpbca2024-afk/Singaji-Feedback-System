const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (!process.env.DB_URL) {
            console.warn(
                'DB_URL is not set in .env – skipping database connection.'
            );
            return;
        }

        const conn = await mongoose.connect(process.env.DB_URL);
        
    console.log(`MongoDB connected: ${conn.connection.host}`);
    console.log(`Database name: ${conn.connection.name}`);


    } catch (error) {
        console.error(`Database connection error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;