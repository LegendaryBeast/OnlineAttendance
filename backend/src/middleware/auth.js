const { authClient, adminClient } = require('../config/supabase');

/**
 * Middleware to verify a Supabase Auth access token and attach the user's
 * profile (id, role, name, registrationNumber) to the request.
 */
async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const { data, error } = await authClient.auth.getUser(token);
        if (error || !data.user) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        const { data: profile, error: profileError } = await adminClient
            .from('profiles')
            .select('role, name, registration_number')
            .eq('id', data.user.id)
            .maybeSingle();

        if (profileError || !profile) {
            return res.status(403).json({ error: 'User profile not found' });
        }

        req.user = {
            userId: data.user.id,
            email: data.user.email,
            role: profile.role,
            name: profile.name,
            registrationNumber: profile.registration_number
        };
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
}

/**
 * Middleware to check if user has required role
 */
function requireRole(role) {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({ error: `Access denied. ${role} role required.` });
        }
        next();
    };
}

module.exports = {
    authenticateToken,
    requireRole
};
