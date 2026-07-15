const Environment = require('./config/environment');
const createApp = require('./app');

/**
 * Server Entry Point
 * Starts the Express server. Supabase is accessed over HTTPS per-request
 * (see src/config/supabase.js), so there's no persistent DB connection to
 * open/close like there was with Mongoose.
 */
function startServer() {
    try {
        // Validate environment variables
        Environment.validate();

        // Create Express app
        const app = createApp();

        // Start server
        const PORT = Environment.PORT;
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📊 Environment: ${Environment.NODE_ENV}`);
            console.log(`✅ Backend ready to accept requests`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();
