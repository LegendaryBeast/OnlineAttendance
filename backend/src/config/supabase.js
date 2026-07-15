const { createClient } = require('@supabase/supabase-js');
const Environment = require('./environment');

/**
 * Two Supabase clients, per Supabase's recommended server-side pattern:
 * - authClient (anon key): used for auth flows a normal user could perform
 *   (sign up, sign in, verify a session token).
 * - adminClient (service_role key): used for all Postgres table access and
 *   admin-only auth operations (creating users, setting metadata). Bypasses
 *   Row Level Security - authorization is enforced in the service layer.
 */
const authClient = createClient(
    Environment.SUPABASE_URL,
    Environment.SUPABASE_ANON_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const adminClient = createClient(
    Environment.SUPABASE_URL,
    Environment.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

module.exports = { authClient, adminClient };
