const User = require('../models/User');

/**
 * UserRepository - Data access layer for User model
 * Implements Repository Pattern (Dependency Inversion Principle)
 * All database operations for users are isolated here
 */
class UserRepository {
    /**
     * Find user by email
     * @param {string} email 
     * @returns {Promise<User|null>}
     */
    async findByEmail(email) {
        return await User.findOne({ email });
    }

    /**
     * Find user by ID
     * @param {string} id 
     * @returns {Promise<User|null>}
     */
    async findById(id) {
        return await User.findById(id);
    }

    /**
     * Create new user
     * @param {Object} userData 
     * @returns {Promise<User>}
     */
    async create(userData) {
        const user = new User(userData);
        return await user.save();
    }

    /**
     * Update user
     * @param {string} id 
     * @param {Object} updates 
     * @returns {Promise<User|null>}
     */
    async update(id, updates) {
        return await User.findByIdAndUpdate(id, updates, { new: true });
    }

    /**
     * Delete user
     * @param {string} id 
     * @returns {Promise<User|null>}
     */
    async delete(id) {
        return await User.findByIdAndDelete(id);
    }

    /**
     * Check if email exists
     * @param {string} email 
     * @returns {Promise<boolean>}
     */
    async emailExists(email) {
        const user = await this.findByEmail(email);
        return !!user;
    }

    /**
     * Find user by registration number
     * @param {string} registrationNumber 
     * @returns {Promise<User|null>}
     */
    async findByRegistrationNumber(registrationNumber) {
        return await User.findOne({ registrationNumber });
    }
}

module.exports = UserRepository;

