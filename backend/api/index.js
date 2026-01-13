const createApp = require('../src/app');
const DatabaseConfig = require('../src/config/database');
const mongoose = require('mongoose');

// Initialize app
const app = createApp();
const dbConfig = new DatabaseConfig();

module.exports = async (req, res) => {
    // Handle CORS preflight requests if not handled by app (Express cors middleware usually handles it but good to be safe for serverless)
    // Actually our app has cors middleware.

    // Connect to database if not already connected
    if (mongoose.connection.readyState !== 1) {
        try {
            await dbConfig.connect();
        } catch (error) {
            console.error('Database connection failed:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    // Forward request to Express app
    app(req, res);
};
