const express = require('express');

/**
 * Auth Routes
 * Routes are just for URL mapping, controllers handle the logic
 */
function createAuthRoutes(authController) {
    const router = express.Router();

    // Register
    router.post('/register', (req, res) => authController.register(req, res));

    // Login
    router.post('/login', (req, res) => authController.login(req, res));

    // Google OAuth — receives Supabase access token from frontend after OAuth redirect
    router.post('/google', (req, res) => authController.googleLogin(req, res));

    return router;
}

module.exports = createAuthRoutes;
