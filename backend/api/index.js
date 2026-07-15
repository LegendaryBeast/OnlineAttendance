const createApp = require('../src/app');

// Initialize app once per serverless instance. Supabase is accessed over
// HTTPS per-request, so there's no connection pool/state to manage here
// the way there was with Mongoose.
const app = createApp();

module.exports = (req, res) => {
    app(req, res);
};
