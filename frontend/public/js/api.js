/**
 * API Configuration and Fetch Wrapper
 * Handles all API requests with JWT authentication
 */

// Base API URL - Update this to match your backend server
const API_BASE_URL = 'http://localhost:5000/api/v1';

/**
 * Get JWT token from localStorage
 */
function getToken() {
    return localStorage.getItem('token');
}

/**
 * Set JWT token in localStorage
 */
function setToken(token) {
    localStorage.setItem('token', token);
}

/**
 * Remove JWT token from localStorage
 */
function removeToken() {
    localStorage.removeItem('token');
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return !!getToken();
}

/**
 * Main API fetch wrapper
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {object} options - Fetch options
 * @returns {Promise<object>} Response data
 */
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    
    // Default headers
    const headers = {
        ...options.headers
    };

    // Add Authorization header if token exists
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Add Content-Type for JSON requests (unless it's FormData)
    if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        // Handle 401 Unauthorized - redirect to login
        if (response.status === 401) {
            removeToken();
            window.location.href = 'login.html';
            throw new Error('Unauthorized. Please login again.');
        }

        // Parse JSON response
        let data = null;
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = await response.text(); // prevent HTML crash
        }


        // Check if request was successful
        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API Request Error:', error);

        // ✅ Handle backend cold start
        if (error.message === "Failed to fetch") {
            throw new Error(
                "Server is waking up (cold start). Please wait a few seconds and try again."
            );
        }

        throw error;
    }

}

/**
 * GET request
 */
async function apiGet(endpoint) {
    return apiRequest(endpoint, {
        method: 'GET'
    });
}

/**
 * POST request
 */
async function apiPost(endpoint, body) {
    return apiRequest(endpoint, {
        method: 'POST',
        body: body instanceof FormData ? body : JSON.stringify(body)
    });
}

/**
 * PATCH request
 */
async function apiPatch(endpoint, body) {
    return apiRequest(endpoint, {
        method: 'PATCH',
        body: body instanceof FormData ? body : JSON.stringify(body)
    });
}

/**
 * DELETE request
 */
async function apiDelete(endpoint) {
    return apiRequest(endpoint, {
        method: 'DELETE'
    });
}

/**
 * Show error message
 * @param {string} elementId - ID of error message element
 * @param {string} message - Error message to display
 */
function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorEl.style.display = 'none';
        }, 5000);
    }
}

/**
 * Show success message
 * @param {string} elementId - ID of success message element
 * @param {string} message - Success message to display
 */
function showSuccess(elementId, message) {
    const successEl = document.getElementById(elementId);
    if (successEl) {
        successEl.textContent = message;
        successEl.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            successEl.style.display = 'none';
        }, 5000);
    }
}

/**
 * Show loader
 */
function showLoader(elementId = 'loader') {
    const loader = document.getElementById(elementId);
    if (loader) {
        loader.style.display = 'block';
    }
}

/**
 * Hide loader
 */
function hideLoader(elementId = 'loader') {
    const loader = document.getElementById(elementId);
    if (loader) {
        loader.style.display = 'none';
    }
}

/**
 * Redirect if not authenticated
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
    }
}

