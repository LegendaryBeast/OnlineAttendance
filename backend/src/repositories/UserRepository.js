const { adminClient } = require('../config/supabase');

const TABLE = 'profiles';

function toProfile(row) {
    if (!row) return null;
    return {
        _id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        registrationNumber: row.registration_number,
        googleId: row.google_id,
        picture: row.picture,
        createdAt: row.created_at
    };
}

function toRow(userData) {
    const row = {};
    if (userData.id !== undefined) row.id = userData.id;
    if (userData.email !== undefined) row.email = userData.email;
    if (userData.name !== undefined) row.name = userData.name;
    if (userData.role !== undefined) row.role = userData.role;
    if (userData.registrationNumber !== undefined) row.registration_number = userData.registrationNumber;
    if (userData.googleId !== undefined) row.google_id = userData.googleId;
    if (userData.picture !== undefined) row.picture = userData.picture;
    return row;
}

/**
 * UserRepository - Data access layer for the `profiles` table (app-specific
 * data for a Supabase Auth user: name, role, registration number, etc).
 * Implements Repository Pattern (Dependency Inversion Principle).
 */
class UserRepository {
    /**
     * Find user by email
     * @param {string} email
     * @returns {Promise<Object|null>}
     */
    async findByEmail(email) {
        const { data, error } = await adminClient
            .from(TABLE)
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (error) throw new Error(error.message);
        return toProfile(data);
    }

    /**
     * Find user by ID
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    async findById(id) {
        const { data, error } = await adminClient
            .from(TABLE)
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw new Error(error.message);
        return toProfile(data);
    }

    /**
     * Create profile row for an already-created Supabase Auth user
     * @param {Object} userData - { id, email, name, role, registrationNumber, googleId, picture }
     * @returns {Promise<Object>}
     */
    async create(userData) {
        const { data, error } = await adminClient
            .from(TABLE)
            .insert(toRow(userData))
            .select()
            .single();

        if (error) throw new Error(error.message);
        return toProfile(data);
    }

    /**
     * Update user
     * @param {string} id
     * @param {Object} updates
     * @returns {Promise<Object|null>}
     */
    async update(id, updates) {
        const { data, error } = await adminClient
            .from(TABLE)
            .update(toRow(updates))
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) throw new Error(error.message);
        return toProfile(data);
    }

    /**
     * Delete user
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    async delete(id) {
        const { data, error } = await adminClient
            .from(TABLE)
            .delete()
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) throw new Error(error.message);
        return toProfile(data);
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
     * @returns {Promise<Object|null>}
     */
    async findByRegistrationNumber(registrationNumber) {
        const { data, error } = await adminClient
            .from(TABLE)
            .select('*')
            .eq('registration_number', registrationNumber)
            .maybeSingle();

        if (error) throw new Error(error.message);
        return toProfile(data);
    }
}

module.exports = UserRepository;
