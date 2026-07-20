/**
 * AuthController - Thin controller layer
 * Only handles HTTP request/response
 * Delegates business logic to AuthService
 */
class AuthController {
    constructor(authService) {
        this.authService = authService;
    }

    /**
     * Register new user
     */
    async register(req, res) {
        try {
            const result = await this.authService.register(req.body);

            res.status(201).json({
                message: 'User registered successfully',
                token: result.token,
                user: result.user
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(error.message.includes('already registered') ? 400 : 500)
                .json({ error: error.message });
        }
    }

    /**
     * Login user
     */
    async login(req, res) {
        try {
            const result = await this.authService.login(req.body);

            res.json({
                message: 'Login successful',
                token: result.token,
                user: result.user
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(error.message.includes('Invalid') ? 401 : 500)
                .json({ error: error.message });
        }
    }

    /**
     * Google Login with Supabase ID Token
     * Receives the Supabase access token from the frontend after OAuth redirect
     * and creates/fetches the user profile.
     */
    async googleLogin(req, res) {
        try {
            const { token } = req.body;
            if (!token) {
                return res.status(400).json({ error: 'Token is required' });
            }

            const result = await this.authService.googleLogin(token);

            res.json({
                message: 'Google login successful',
                token: result.token,
                user: result.user
            });
        } catch (error) {
            console.error('Google login error:', error);
            res.status(401).json({ error: error.message });
        }
    }

    /**
     * Delete a Supabase auth user who used a non-SUST email.
     * Called by the frontend immediately after detecting a rejected domain,
     * before signOut(), so we can clean up the dangling auth.users record.
     */
    async rejectGoogleUser(req, res) {
        try {
            const { token } = req.body;
            if (!token) return res.status(400).json({ error: 'Token required' });

            await this.authService.rejectNonSustUser(token);
            res.json({ message: 'User rejected and removed' });
        } catch (error) {
            console.error('Reject user error:', error);
            res.status(500).json({ error: error.message });
        }
    }


}

module.exports = AuthController;
