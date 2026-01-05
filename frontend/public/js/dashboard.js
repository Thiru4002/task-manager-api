/**
 * Dashboard Page Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    requireAuth();
    loadDashboardStats();
});

/**
 * Fetch dashboard stats
 */
async function loadDashboardStats() {
    showLoader();

    try {
        const response = await apiGet('/auth/dashboard/stats');
        const stats = response.data || {};

        hideLoader();
        displayStats(stats);
        setupDashboardNavigation();

        const quickActions = document.getElementById('quickActions');
        if (quickActions) quickActions.style.display = 'block';

    } catch (error) {
        hideLoader();
        showError('errorMessage', 'Failed to load dashboard');
    }
}

/**
 * Display stat values
 */
function displayStats(stats) {
    document.getElementById('statsGrid').style.display = 'grid';

    updateStat('totalProjects', stats.totalProjects);
    updateStat('assignedTasks', stats.assignedTasks);
    updateStat('createdTasks', stats.createdTasks);
    updateStat('completedTasks', stats.completedTasks);
    updateStat('pendingTasks', stats.pendingTasks);
    updateStat('tasksToday', stats.tasksToday);
    updateStat('tasksThisWeek', stats.tasksThisWeek);
    updateStat('recentActivity', stats.recentActivity);
}

/**
 * Animate stat number
 */
function updateStat(id, value = 0) {
    const el = document.getElementById(id);
    if (!el) return;

    let start = 0;
    const end = value;
    const duration = 600;
    const step = Math.max(1, end / (duration / 16));

    const timer = setInterval(() => {
        start += step;
        if (start >= end) {
            start = end;
            clearInterval(timer);
        }
        el.textContent = Math.floor(start);
    }, 16);
}

/**
 * Dashboard card navigation
 */
function setupDashboardNavigation() {
    document.getElementById('card-total-projects')
        ?.addEventListener('click', () => location.href = 'projects.html');

    document.getElementById('card-assigned-tasks')
        ?.addEventListener('click', () => location.href = 'tasks.html?filter=assigned');

    document.getElementById('card-created-tasks')
        ?.addEventListener('click', () => location.href = 'tasks.html?filter=created');

    document.getElementById('card-completed-tasks')
        ?.addEventListener('click', () => location.href = 'tasks.html?status=done');

    document.getElementById('card-pending-tasks')
        ?.addEventListener('click', () => location.href = 'tasks.html?status=pending');
}
