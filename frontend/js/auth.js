window.API_URL = 'https://attendance-api-backend.vercel.app/api';
// Show alert message
function showAlert(elementId, message, type) {
    const alertDiv = document.getElementById(elementId);
    alertDiv.innerHTML = `
    <div class="alert alert-${type}">
      ${message}
    </div>
  `;
    setTimeout(() => {
        alertDiv.innerHTML = '';
    }, 5000);
}

// Save user data to localStorage
function saveUserData(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

// Get user data from localStorage
function getUserData() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return { token, user: user ? JSON.parse(user) : null };
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
}

// Check if user is logged in and redirect
function checkAuth() {
    const { token, user } = getUserData();
    if (token && user) {
        if (user.role === 'student') {
            window.location.href = '/student-dashboard.html';
        } else if (user.role === 'teacher') {
            window.location.href = '/teacher-dashboard.html';
        }
    }
}

// Login form handler
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
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            saveUserData(data.token, data.user);

            // Save email for "Remember me" feature
            const rememberMe = document.getElementById('remember-me')?.checked;
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            showAlert('login-alert', 'Login successful! Redirecting...', 'success');

            setTimeout(() => {
                if (data.user.role === 'student') {
                    window.location.href = '/student-dashboard.html';
                } else {
                    window.location.href = '/teacher-dashboard.html';
                }
            }, 1000);
        } else {
            showAlert('login-alert', data.error || 'Login failed', 'error');
        }
    } catch (error) {
        showAlert('login-alert', 'Network error. Please try again.', 'error');
    } finally {
        btnText.classList.remove('hidden');
        spinner.classList.add('hidden');
    }
});

// Register form handler
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
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password, role })
        });

        const data = await response.json();

        if (response.ok) {
            saveUserData(data.token, data.user);
            showAlert('register-alert', 'Registration successful! Redirecting...', 'success');

            setTimeout(() => {
                if (data.user.role === 'student') {
                    window.location.href = '/student-dashboard.html';
                } else {
                    window.location.href = '/teacher-dashboard.html';
                }
            }, 1000);
        } else {
            showAlert('register-alert', data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        showAlert('register-alert', 'Network error. Please try again.', 'error');
    } finally {
        btnText.classList.remove('hidden');
        spinner.classList.add('hidden');
    }
});

// Google Sign-In handler
// Google Sign-In Initialization
window.onload = function () {
    // Check if on login page and google global is available
    const googleBtn = document.getElementById('google-btn');
    if (googleBtn && window.google) {
        google.accounts.id.initialize({
            client_id: "590867699522-0cobj67nq9m575n9h0enbvje0gs52nch.apps.googleusercontent.com",
            callback: handleGoogleLoginResponse
        });

        google.accounts.id.renderButton(
            googleBtn,
            { theme: "outline", size: "large", width: "400" }
        );
    }

    // Check auth status
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        checkAuth();

        // Prefill remembered email
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            const emailInput = document.getElementById('login-email');
            const rememberCheckbox = document.getElementById('remember-me');
            if (emailInput) emailInput.value = rememberedEmail;
            if (rememberCheckbox) rememberCheckbox.checked = true;
        }
    }
};

/**
 * Handle Google Login Response
 * @param {Object} response 
 */
async function handleGoogleLoginResponse(response) {
    try {
        const res = await fetch(`${API_URL}/auth/google`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: response.credential })
        });

        const data = await res.json();

        if (res.ok) {
            saveUserData(data.token, data.user);
            showAlert('login-alert', 'Login successful! Redirecting...', 'success');

            setTimeout(() => {
                if (data.user.role === 'student') {
                    window.location.href = '/student-dashboard.html';
                } else {
                    window.location.href = '/teacher-dashboard.html';
                }
            }, 1000);
        } else {
            showAlert('login-alert', data.error || 'Google login failed', 'error');
        }
    } catch (error) {
        console.error('Google login error:', error);
        showAlert('login-alert', 'Network error during Google login', 'error');
    }
}

// Check if already logged in on page load
if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    checkAuth();

    // Check for OAuth error in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('error') === 'auth_failed') {
        showAlert('login-alert',
            'Google authentication failed. Please use your SUST institutional email.',
            'error'
        );
    }

    // Prefill remembered email
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        const emailInput = document.getElementById('login-email');
        const rememberCheckbox = document.getElementById('remember-me');
        if (emailInput) emailInput.value = rememberedEmail;
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }
}
