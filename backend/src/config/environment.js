require('dotenv').config();

class Environment {
    static get PORT() {
        return process.env.PORT || 3000;
    }

    static get SUPABASE_URL() {
        return process.env.SUPABASE_URL;
    }

    static get SUPABASE_ANON_KEY() {
        return process.env.SUPABASE_ANON_KEY;
    }

    static get SUPABASE_SERVICE_ROLE_KEY() {
        return process.env.SUPABASE_SERVICE_ROLE_KEY;
    }

    static get NODE_ENV() {
        return process.env.NODE_ENV || 'development';
    }

    static validate() {
        const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
        const missing = required.filter(key => !process.env[key]);

        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }
}

module.exports = Environment;
