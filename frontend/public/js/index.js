/**
 * Public Projects Page Logic
 * Displays all public projects and handles join requests
 */

let projects = [];
let pendingRequests = new Set();

document.addEventListener('DOMContentLoaded', () => {
    loadPublicProjects();
});

/**
 * Load public projects from API
 */
async function loadPublicProjects() {
    showLoader();

    try {
        const response = await apiGet('/projects/public');

        // ✅ FIX: backend returns `projects`, not `data`
        projects = response.projects || [];

        hideLoader();
        renderProjects();

    } catch (error) {
        hideLoader();
        showError('errorMessage', error.message || 'Failed to load projects');
    }
}

/**
 * Render projects
 */
function renderProjects() {
    const grid = document.getElementById('projectsGrid');
    const emptyState = document.getElementById('emptyState');

    if (!grid) return;

    if (!projects.length) {
        grid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    grid.style.display = 'grid';

    grid.innerHTML = projects.map(project => `
        <div class="project-card">
            <h3>${escapeHtml(project.name)}</h3>
            <p>${escapeHtml(project.description || 'No description available')}</p>

            <div class="project-owner">
                <span>👤</span>
                <span>
                  Owner: ${escapeHtml(project.owner?.username || 'Unknown')}
                </span>
            </div>

            <div class="project-actions">
                ${renderJoinButton(project)}
            </div>
        </div>
    `).join('');

    attachJoinButtonListeners();
}

/**
 * Render join button
 */
function renderJoinButton(project) {
    if (!isAuthenticated()) {
        return `<a href="login.html" class="btn btn-primary btn-sm">Login to Join</a>`;
    }

    if (pendingRequests.has(project._id)) {
        return `<button class="btn btn-secondary btn-sm" disabled>Request Pending</button>`;
    }

    return `
      <button
        class="btn btn-primary btn-sm join-btn"
        data-project-id="${project._id}">
        Request to Join
      </button>
    `;
}

/**
 * Attach join button listeners
 */
function attachJoinButtonListeners() {
    document.querySelectorAll('.join-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            handleJoinRequest(
                btn.getAttribute('data-project-id'),
                btn
            );
        });
    });
}

/**
 * Handle join request
 */
async function handleJoinRequest(projectId, btn) {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Sending...';

    try {
        await apiPost(`/membership/projects/${projectId}/join-request`, {});
        pendingRequests.add(projectId);

        btn.textContent = 'Request Pending';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');

        showSuccess('successMessage', 'Join request sent successfully');

    } catch (error) {
        btn.disabled = false;
        btn.textContent = 'Request to Join';
        showError('errorMessage', error.message || 'Failed to send join request');
    }
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
