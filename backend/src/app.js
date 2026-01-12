const express = require('express');
const cors = require('cors');
const Container = require('./container');
const auth = require('./middleware/auth');

// Import route creators
const createAuthRoutes = require('./routes/auth.routes');
const createClassRoutes = require('./routes/class.routes');
const createAttendanceRoutes = require('./routes/attendance.routes');
const createCourseRoutes = require('./routes/course.routes');

/**
 * Express App Configuration
 * Separates app configuration from server startup
 */
function createApp() {
    const app = express();

    // Initialize dependency injection container
    const container = new Container();

    // Middleware
    app.use(cors());
    app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging middleware (development)
    if (process.env.NODE_ENV === 'development') {
        app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    // Get controllers from container
    const authController = container.getController('authController');
    const classController = container.getController('classController');
    const attendanceController = container.getController('attendanceController');
    const courseController = container.getController('courseController');

    // Setup routes
    app.use('/api/auth', createAuthRoutes(authController));
    app.use('/api/classes', createClassRoutes(classController, auth));
    app.use('/api/attendance', createAttendanceRoutes(attendanceController, auth));
    app.use('/api/courses', createCourseRoutes(courseController, auth));

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // 404 handler
    app.use((req, res) => {
        res.status(404).json({ error: 'Route not found' });
    });

    // Global error handling middleware
    app.use((err, req, res, next) => {
        console.error('Global error handler:', err.stack);
        res.status(err.status || 500).json({
            error: process.env.NODE_ENV === 'development'
                ? err.message
                : 'Something went wrong!'
        });
    });

    return app;
}

module.exports = createApp;
