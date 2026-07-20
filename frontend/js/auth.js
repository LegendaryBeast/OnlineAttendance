window.API_URL = 'https://attendance-api-backend.vercel.app/api';
const SUPABASE_URL = 'https://nnzvdfffoxtvtrkbjyui.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uenZkZmZmb3h0dnRya2JqeXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMzIyNjcsImV4cCI6MjA5OTcwODI2N30.epjQdfc-vf6YxzuAF2qez_6hvzvJ4Y8B43JjIbabHYo';

// ============================================================
// UI HELPERS
// ============================================================
function showAlert(elementId, message, type) {
    const alertDiv = document.getElementById(elementId);
    if (!alertDiv) return;
    alertDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => { alertDiv.innerHTML = ''; }, 5000);
}

function saveUserData(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

function getUserData() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return { token, user: user ? JSON.parse(user) : null };
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
}

function redirectByRole(role) {
    window.location.href = role === 'student'
        ? '/student-dashboard.html'
        : '/teacher-dashboard.html';
}

function checkAuth() {
    const { token, user } = getUserData();
    if (token && user) redirectByRole(user.role);
}

// ============================================================
// GOOGLE SIGN-IN — Supabase OAuth (full-page redirect, no popup)
// ============================================================
async function signInWithGoogle() {
    const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/index.html`,
            queryParams: {
                prompt: 'select_account'  // Show saved Google accounts chooser every time
            }
        }
    });
    if (error) {
        showAlert('login-alert', 'Google login failed: ' + error.message, 'error');
    }
}

// ============================================================
// HANDLE RETURN FROM SUPABASE OAUTH REDIRECT
// ============================================================
async function handleSupabaseCallback() {
    const hasHash = window.location.hash.includes('access_token');
    const hasCode = window.location.search.includes('code=');
    if (!hasHash && !hasCode) return false;

    const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await client.auth.getSession();
    if (error || !data.session) return false;

    const session = data.session;
    const email = session.user.email;

    // Validate SUST email domain
    if (!email.endsWith('sust.edu') && email !== 'longlong4bugs@gmail.com') {
        // Sign out from Supabase session
        await client.auth.signOut();
        // Ask backend to delete the dangling Supabase auth.users record
        try {
            await fetch(`${API_URL}/auth/google/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: session.access_token })
            });
        } catch { /* best-effort */ }
        window.history.replaceState({}, document.title, window.location.pathname);
        showAlert('login-alert', 'Access denied. Please use your SUST institutional email (@student.sust.edu or @sust.edu).', 'error');
        return true;
    }

    // Pass Supabase access token to backend to get/create user profile
    try {
        const res = await fetch(`${API_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: session.access_token })
        });
        const profileData = await res.json();

        if (res.ok) {
            saveUserData(session.access_token, profileData.user);
            window.history.replaceState({}, document.title, window.location.pathname);
            showAlert('login-alert', 'Login successful! Redirecting...', 'success');
            setTimeout(() => redirectByRole(profileData.user.role), 1000);
        } else {
            showAlert('login-alert', profileData.error || 'Google login failed.', 'error');
        }
    } catch {
        showAlert('login-alert', 'Network error during Google login.', 'error');
    }
    return true;
}

// ============================================================
// EMAIL / PASSWORD LOGIN
// ============================================================
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btnText = document.getElementById('login-btn-text');
    const spinner = document.getElementById('login-spinner');

    btnText.classList.add('hidden');
    spinner.classList.remove('hidden');

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        if (response.ok) {
            saveUserData(data.token, data.user);
            const rememberMe = document.getElementById('remember-me')?.checked;
            if (rememberMe) localStorage.setItem('rememberedEmail', email);
            else localStorage.removeItem('rememberedEmail');
            showAlert('login-alert', 'Login successful! Redirecting...', 'success');
            setTimeout(() => redirectByRole(data.user.role), 1000);
        } else {
            showAlert('login-alert', data.error || 'Login failed', 'error');
        }
    } catch {
        showAlert('login-alert', 'Network error. Please try again.', 'error');
    } finally {
        btnText.classList.remove('hidden');
        spinner.classList.add('hidden');
    }
});

// ============================================================
// REGISTER
// ============================================================
document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;
    const btnText = document.getElementById('register-btn-text');
    const spinner = document.getElementById('register-spinner');

    btnText.classList.add('hidden');
    spinner.classList.remove('hidden');

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
        });
        const data = await response.json();

        if (response.ok) {
            saveUserData(data.token, data.user);
            showAlert('register-alert', 'Registration successful! Redirecting...', 'success');
            setTimeout(() => redirectByRole(data.user.role), 1000);
        } else {
            showAlert('register-alert', data.error || 'Registration failed', 'error');
        }
    } catch {
        showAlert('register-alert', 'Network error. Please try again.', 'error');
    } finally {
        btnText.classList.remove('hidden');
        spinner.classList.add('hidden');
    }
});

// ============================================================
// PAGE LOAD
// ============================================================
window.onload = async function () {
    // Render the custom Google Sign-In button
    const googleBtn = document.getElementById('google-btn');
    if (googleBtn) {
        googleBtn.innerHTML = `
            <button onclick="signInWithGoogle()" class="google-signin-btn">
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Sign in with Google
            </button>`;
    }

    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        const handled = await handleSupabaseCallback();
        if (!handled) {
            checkAuth();
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('error') === 'auth_failed') {
                showAlert('login-alert',
                    'Google authentication failed. Please use your SUST institutional email.',
                    'error');
            }
            const rememberedEmail = localStorage.getItem('rememberedEmail');
            if (rememberedEmail) {
                const emailInput = document.getElementById('login-email');
                const rememberCheckbox = document.getElementById('remember-me');
                if (emailInput) emailInput.value = rememberedEmail;
                if (rememberCheckbox) rememberCheckbox.checked = true;
            }
        }
    }
};
