const jwt = require('jsonwebtoken');
const Environment = require('../config/environment');

/**
 * AuthService - Business logic for authentication
 * Depends on UserRepository (Dependency Injection)
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

        // Create user data object
        const newUserData = {
            email,
            password,
            name,
            role
        };

        // Add registration number if student
        if (registrationNumber) {
            newUserData.registrationNumber = registrationNumber;
        }

        // Create user
        const user = await this.userRepository.create(newUserData);

        // Generate token
        const token = this.generateToken(user);

        return {
            token,
            user: this.sanitizeUser(user)
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

        // Find user
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }

        // Generate token
        const token = this.generateToken(user);

        return {
            token,
            user: this.sanitizeUser(user)
        };
    }



    /**
     * Verify Google ID Token
     * @param {string} token 
     * @returns {Promise<Object>} Payload
     */
    async verifyGoogleToken(token) {
        const { OAuth2Client } = require('google-auth-library');
        const client = new OAuth2Client(Environment.GOOGLE_CLIENT_ID);

        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: Environment.GOOGLE_CLIENT_ID,
            });
            return ticket.getPayload();
        } catch (error) {
            throw new Error('Invalid Google Token');
        }
    }

    /**
     * Google OAuth Login/Registration
     * @param {string} token - Google ID Token
     * @returns {Promise<Object>} { token, user }
     */
    async googleLogin(token) {
        // Verify token
        const payload = await this.verifyGoogleToken(token);
        const { email, name, sub: googleId, picture } = payload;

        // Validate SUST email domain
        if (!email.endsWith('sust.edu') && email != 'longlong4bugs@gmail.com') {
            throw new Error('Please use your SUST institutional email address.');
        }

        // Determine role based on email domain
        let role;
        let registrationNumber = null;

        if (email.endsWith('@student.sust.edu')) {
            role = 'student';
            // Extract registration number from student email
            const match = email.match(/^([0-9]{10})@student\.sust\.edu$/);
            if (match) {
                registrationNumber = match[1];
            }
        } else {
            role = 'teacher';
        }

        // Check if user already exists
        let user = await this.userRepository.findByEmail(email);

        if (user) {
            // Update existing user with Google info if needed
            if (!user.googleId) {
                user.googleId = googleId;
                user.picture = picture;
                await user.save();
            }
        } else {
            // Create new user
            const newUserData = {
                email,
                name,
                role,
                googleId,
                picture,
                password: Math.random().toString(36).slice(-12) // Random password for Google users
            };

            if (registrationNumber) {
                newUserData.registrationNumber = registrationNumber;
            }

            user = await this.userRepository.create(newUserData);
        }

        // Generate token
        const tokenJWT = this.generateToken(user);

        return {
            token: tokenJWT,
            user: this.sanitizeUser(user)
        };
    }

    /**
     * Generate JWT token
     * @param {Object} user 
     * @returns {string}
     */
    generateToken(user) {
        return jwt.sign(
            { userId: user._id, role: user.role },
            Environment.JWT_SECRET,
            { expiresIn: '7d' }
        );
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
