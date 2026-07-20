const { authClient, adminClient } = require('../config/supabase');

/**
 * AuthService - Business logic for authentication
 * Identity/credentials are handled by Supabase Auth; app-specific fields
 * (name, role, registration number) live in the `profiles` table via
 * UserRepository (Dependency Injection).
 * Single Responsibility: Authentication operations
 */
class AuthService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Register a new user
     * @param {Object} userData - { email, password, name, role }
     * @returns {Promise<Object>} { token, user }
     */
    async register(userData) {
        const { email, password, name, role } = userData;

        // Validate required fields
        this.validateRequiredFields({ email, password, name, role });
        this.validateSustEmail(email);

        // Check if user already exists
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new Error('Email already registered');
        }

        // Extract and validate registration number for students
        let registrationNumber = null;
        if (role === 'student') {
            registrationNumber = this.extractRegistrationNumber(email);
        }

        // Create the Supabase Auth user (handles password hashing/storage)
        const { data: created, error: createError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (createError) {
            throw new Error(createError.message);
        }

        // Create the app-specific profile row
        let profile;
        try {
            profile = await this.userRepository.create({
                id: created.user.id,
                email,
                name,
                role,
                registrationNumber
            });
        } catch (error) {
            // Roll back the auth user if the profile write fails, so we don't
            // end up with a dangling auth.users row with no profile.
            await adminClient.auth.admin.deleteUser(created.user.id);
            throw error;
        }

        // Sign in immediately so registration also logs the user in
        const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
            email,
            password
        });

        if (signInError) {
            throw new Error(signInError.message);
        }

        return {
            token: signInData.session.access_token,
            user: this.sanitizeUser(profile)
        };
    }

    /**
     * Login user
     * @param {Object} credentials - { email, password }
     * @returns {Promise<Object>} { token, user }
     */
    async login(credentials) {
        const { email, password } = credentials;

        // Validate required fields
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        const { data, error } = await authClient.auth.signInWithPassword({ email, password });
        if (error) {
            throw new Error('Invalid email or password');
        }

        const profile = await this.userRepository.findById(data.user.id);
        if (!profile) {
            throw new Error('Invalid email or password');
        }

        return {
            token: data.session.access_token,
            user: this.sanitizeUser(profile)
        };
    }

    /**
     * Google OAuth Login/Registration via Supabase OAuth flow.
     * The frontend completes the OAuth redirect with Supabase and sends
     * the resulting Supabase access token here for profile creation/lookup.
     * @param {string} accessToken - Supabase session access_token
     * @returns {Promise<Object>} { token, user }
     */
    async googleLogin(accessToken) {
        // Verify the Supabase access token and get the authenticated user
        const { data, error } = await authClient.auth.getUser(accessToken);

        if (error || !data.user) {
            throw new Error('Invalid or expired token');
        }

        const user = data.user;
        const email = user.email;

        // Validate SUST email domain
        if (!email.endsWith('sust.edu') && email !== 'longlong4bugs@gmail.com') {
            throw new Error('Please use your SUST institutional email address.');
        }

        // Determine role based on email domain
        let role;
        let registrationNumber = null;

        if (email.endsWith('@student.sust.edu')) {
            role = 'student';
            const match = email.match(/^([0-9]{10})@student\.sust\.edu$/);
            if (match) {
                registrationNumber = match[1];
            }
        } else {
            role = 'teacher';
        }

        const googleId = user.user_metadata?.sub || user.user_metadata?.provider_id || null;
        const picture = user.user_metadata?.picture || user.user_metadata?.avatar_url || null;
        const name = user.user_metadata?.name || user.user_metadata?.full_name || email;

        let profile = await this.userRepository.findById(user.id);

        if (!profile) {
            profile = await this.userRepository.create({
                id: user.id,
                email,
                name,
                role,
                registrationNumber,
                googleId,
                picture
            });
        } else if (!profile.googleId) {
            profile = await this.userRepository.update(user.id, { googleId, picture });
        }

        return {
            token: accessToken,   // Return the same Supabase token — already valid
            user: this.sanitizeUser(profile)
        };
    }

    /**
     * Validate required fields
     * @param {Object} fields
     */
    validateRequiredFields(fields) {
        const { email, password, name, role } = fields;
        if (!email || !password || !name || !role) {
            throw new Error('All fields are required');
        }
    }

    /**
     * Validate SUST email format
     * @param {string} email
     */
    validateSustEmail(email) {
        const isValid = /^[0-9]{10}@student\.sust\.edu$/.test(email)
            || /@sust\.edu$/.test(email)
            || /^longlong4bugs@gmail\.com$/.test(email);

        if (!isValid) {
            throw new Error('Email must be a valid SUST email address');
        }
    }

    /**
     * Extract registration number from student email
     * @param {string} email
     * @returns {string}
     */
    extractRegistrationNumber(email) {
        const match = email.match(/^([0-9]{10})@student\.sust\.edu$/);
        if (!match) {
            throw new Error(
                'Invalid student email format. Must be: XXXXXXXXXX@student.sust.edu'
            );
        }
        return match[1];
    }

    /**
     * Remove sensitive data from user object
     * @param {Object} user
     * @returns {Object}
     */
    sanitizeUser(user) {
        return {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            registrationNumber: user.registrationNumber
        };
    }
}

module.exports = AuthService;
