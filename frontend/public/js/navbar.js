/**
 * Dynamic Navigation Bar
 * Shows different links based on authentication status
 */

document.addEventListener('DOMContentLoaded', function() {
    renderNavbar();
});

/**
 * Render navbar based on authentication status
 */
function renderNavbar() {
    const navLinks = document.getElementById('navLinks');
    
    if (!navLinks) return;

    const authenticated = isAuthenticated();

    if (authenticated) {
        // Authenticated user navigation
        navLinks.innerHTML = `
            <a href="index.html">Projects</a>
            <a href="dashboard.html">Dashboard</a>
            <button onclick="handleLogout()">Logout</button>
        `;
    } else {
        // Guest navigation
        navLinks.innerHTML = `
            <a href="index.html">Projects</a>
            <a href="login.html">Login</a>
            <a href="register.html">Register</a>
        `;
    }
}

/**
 * Handle user logout
 */
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        removeToken();
        showSuccess('successMessage', 'Logged out successfully');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}