require('dotenv').config();

class Environment {
    static get PORT() {
        return process.env.PORT || 3000;
    }

    static get MONGODB_URI() {
        return process.env.MONGODB_URI;
    }

    static get JWT_SECRET() {
        return process.env.JWT_SECRET;
    }

    static get CLOUDINARY_CLOUD_NAME() {
        return process.env.CLOUDINARY_CLOUD_NAME;
    }

    static get CLOUDINARY_API_KEY() {
        return process.env.CLOUDINARY_API_KEY;
    }

    static get CLOUDINARY_API_SECRET() {
        return process.env.CLOUDINARY_API_SECRET;
    }

    static get GOOGLE_CLIENT_ID() {
        return process.env.GOOGLE_CLIENT_ID;
    }

    static get GOOGLE_CLIENT_SECRET() {
        return process.env.GOOGLE_CLIENT_SECRET;
    }

    static get GOOGLE_CALLBACK_URL() {
        return process.env.GOOGLE_CALLBACK_URL;
    }

    static get SESSION_SECRET() {
        return process.env.SESSION_SECRET || 'your-session-secret-change-in-production';
    }

    static get NODE_ENV() {
        return process.env.NODE_ENV || 'development';
    }

    static validate() {
        const required = ['MONGODB_URI', 'JWT_SECRET'];
        const missing = required.filter(key => !process.env[key]);

        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }
}

module.exports = Environment;
