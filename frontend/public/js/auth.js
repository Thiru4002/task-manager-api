/**
 * Authentication Logic
 * Handles login and registration
 */

document.addEventListener('DOMContentLoaded', function() {
    // Redirect if already logged in
    if (isAuthenticated() && (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html'))) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Handle Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Handle Register Form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

/**
 * Handle login form submission
 */
async function handleLogin(e) {
    e.preventDefault();

    const loginBtn = document.getElementById('loginBtn');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Validate inputs
    if (!email || !password) {
        showError('errorMessage', 'Please fill in all fields');
        return;
    }

    // Disable button
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';

    try {
        const response = await apiPost('/auth/login', {
            email,
            password
        });

        // Save token
        if (response.data && response.data.token) {
            setToken(response.data.token);
            window.location.href = 'dashboard.html';
        } else {
            throw new Error('No token received');
        }


    } catch (error) {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
        showError('errorMessage', error.message || 'Login failed. Please check your credentials.');
    }
}

/**
 * Handle register form submission
 */
async function handleRegister(e) {
    e.preventDefault();

    const registerBtn = document.getElementById('registerBtn');
    const username = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Validate inputs
    if (!username || !email || !password) {
        showError('errorMessage', 'Please fill in all fields');
        return;
    }

    if (password.length < 6) {
        showError('errorMessage', 'Password must be at least 6 characters');
        return;
    }

    // Disable button
    registerBtn.disabled = true;
    registerBtn.textContent = 'Creating account...';

    try {
        const response = await apiPost('/auth/register', {
            username,
            email,
            password
        });

        // Save token
        if (response.data && response.data.token) {
            setToken(response.data.token);
            window.location.href = 'dashboard.html';
        } else {
            throw new Error('No token received');
        }

    } catch (error) {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Register';
        showError('errorMessage', error.message || 'Registration failed. Please try again.');
    }
}