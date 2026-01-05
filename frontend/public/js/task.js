/**
 * Task Management Page Logic
 * Handles task CRUD, comments, and attachments
 */

let tasks = [];
let currentTask = null;
let projectId = null;
let filters = {
    search: '',
    status: '',
    priority: ''
};
let pageFilter = null;

document.addEventListener('DOMContentLoaded', function () {
    // Require authentication
    requireAuth();

    // Get params from URL
    const params = new URLSearchParams(window.location.search);
    projectId = params.get('projectId');

    // ✅ NEW: dashboard filter (assigned / created)
    pageFilter = params.get('filter'); 

    // Load tasks
    loadTasks();

    // Setup forms
    setupForms();

    // Setup filters
    setupFilters();
});


/**
 * Setup all forms
 */
function setupForms() {
    const createForm = document.getElementById('createTaskForm');
    if (createForm) {
        createForm.addEventListener('submit', handleCreateTask);
    }

    const editForm = document.getElementById('editTaskForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditTask);
    }
}

/**
 * Setup filters
 */
function setupFilters() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            filters.search = searchInput.value;
            applyFilters();
        }, 300));
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            filters.status = statusFilter.value;
            applyFilters();
        });
    }

    if (priorityFilter) {
        priorityFilter.addEventListener('change', () => {
            filters.priority = priorityFilter.value;
            applyFilters();
        });
    }
}

/**
 * Load tasks from API
 */
async function loadTasks() {
    showLoader();

    try {
        let endpoint = '/tasks';
        const queryParams = [];

        // Project specific tasks
        if (projectId) {
            queryParams.push(`projectId=${projectId}`);
        }

        // ✅ Dashboard filters
        if (pageFilter === 'assigned') {
            queryParams.push('assigned=true');
        }

        if (pageFilter === 'created') {
            queryParams.push('created=true');
        }

        // UI filters
        if (filters.status) {
            queryParams.push(`status=${filters.status}`);
        }

        if (filters.priority) {
            queryParams.push(`priority=${filters.priority}`);
        }

        if (filters.search) {
            queryParams.push(`search=${encodeURIComponent(filters.search)}`);
        }

        if (queryParams.length > 0) {
            endpoint += '?' + queryParams.join('&');
        }

        const response = await apiGet(endpoint);
        tasks = response.data || [];

        hideLoader();
        renderTasks();

    } catch (error) {
        hideLoader();
        showError('errorMessage', error.message || 'Failed to load tasks');
    }
}


/**
 * Render tasks to grid
 */
function renderTasks() {
    const grid = document.getElementById('tasksGrid');
    const emptyState = document.getElementById('emptyState');

    if (!grid) return;

    if (tasks.length === 0) {
        grid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    grid.style.display = 'grid';

    grid.innerHTML = tasks.map(task => `
        <div class="task-card" onclick="openTaskDetails('${task._id}')">
            <div class="task-card-header">
                <h3 class="task-title">${escapeHtml(task.title)}</h3>
            </div>
            ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
            <div class="task-meta">
                <span class="task-status-badge status-${task.status}">${task.status}</span>
                <span class="task-priority-badge priority-${task.priority}">${task.priority}</span>
            </div>
            <div class="task-footer">
                <span>${task.dueDate ? '📅 ' + formatDate(task.dueDate) : 'No due date'}</span>
                <span class="task-assignees">
                    👤 ${task.assignedTo?.length || 0} assigned
                </span>
            </div>
        </div>
    `).join('');
}

/**
 * Apply filters
 */
function applyFilters() {
    loadTasks();
}

/**
 * Open create task modal
 */
function openCreateTaskModal() {
    document.getElementById('createTaskModal').style.display = 'flex';
    document.getElementById('createTaskForm').reset();
}

/**
 * Close create task modal
 */
function closeCreateTaskModal() {
    document.getElementById('createTaskModal').style.display = 'none';
}

/**
 * Handle create task
 */
async function handleCreateTask(e) {
    e.preventDefault();

    const createBtn = document.getElementById('createTaskBtn');
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const status = document.getElementById('taskStatus').value;
    const priority = document.getElementById('taskPriority').value;
    const dueDate = document.getElementById('taskDueDate').value;

    if (!title) {
        showError('errorMessage', 'Task title is required');
        return;
    }

    createBtn.disabled = true;
    createBtn.textContent = 'Creating...';

    try {
        const taskData = {
            title,
            description,
            status,
            priority
        };

        if (projectId) {
            taskData.projectId = projectId;
        }

        if (dueDate) {
            taskData.dueDate = dueDate;
        }

        await apiPost('/tasks', taskData);

        showSuccess('successMessage', 'Task created successfully');
        closeCreateTaskModal();
        loadTasks();

    } catch (error) {
        showError('errorMessage', error.message || 'Failed to create task');
    } finally {
        createBtn.disabled = false;
        createBtn.textContent = 'Create Task';
    }
}

/**
 * Open task details modal
 */
async function openTaskDetails(taskId) {
    showLoader();

    try {
        const response = await apiGet(`/tasks/${taskId}`);
        currentTask = response.data;

        hideLoader();
        displayTaskDetails(currentTask);
        document.getElementById('taskDetailsModal').style.display = 'flex';

        // Load comments and attachments
        loadComments(taskId);
        loadAttachments(taskId);

    } catch (error) {
        hideLoader();
        showError('errorMessage', error.message || 'Failed to load task details');
    }
}

/**
 * Close task details modal
 */
function closeTaskDetailsModal() {
    document.getElementById('taskDetailsModal').style.display = 'none';
    currentTask = null;
}

/**
 * Display task details
 */
function displayTaskDetails(task) {
    const currentUserId = getCurrentUserId(); // ✅ ADD THIS LINE

    document.getElementById('taskDetailsTitle').textContent = task.title;
    document.getElementById('detailDescription').textContent =
        task.description || 'No description';
    
    // Status
    const statusEl = document.getElementById('detailStatus');
    statusEl.textContent = task.status;
    statusEl.className = `task-status-badge status-${task.status}`;

    // Priority
    const priorityEl = document.getElementById('detailPriority');
    priorityEl.textContent = task.priority;
    priorityEl.className = `task-priority-badge priority-${task.priority}`;

    // Creator
    document.getElementById('detailCreator').textContent =
        typeof task.creator === 'object'
            ? task.creator.username
            : 'Unknown';

    // Due date
    document.getElementById('detailDueDate').textContent =
        task.dueDate ? formatDate(task.dueDate) : 'No due date';

    const assigneesEl = document.getElementById("detailAssignees");

    if (task.assignees && task.assignees.length > 0) {
        assigneesEl.innerHTML = task.assignees
            .map(u => `
                <div class="assignee-row">
                    <span>${u.username}</span>
                    ${
                        currentUserId && task.creator?._id === currentUserId
                            ? `<button class="btn btn-danger btn-unassign"
                                onclick="unassignTask('${u._id}')">
                                Unassign
                              </button>`
                            : ""
                    }
                </div>
            `)
            .join("");
    } else {
        assigneesEl.textContent = "Not assigned";
    }

    setupTaskActions(task);
}


/**
 * Setup task actions
 */

async function openAssignModal() {
    const select = document.getElementById("assignUserSelect");
    select.innerHTML = "";

    const projectId = currentTask.projectId?._id || currentTask.projectId;

    const res = await apiGet(`/projects/${projectId}`);
    const members = res.data.members || [];

    members.forEach(user => {
        const opt = document.createElement("option");
        opt.value = user._id;
        opt.textContent = user.username;
        select.appendChild(opt);
    });

    document.getElementById("assignTaskModal").style.display = "flex";
    }

    function closeAssignModal() {
    document.getElementById("assignTaskModal").style.display = "none";
}

function setupTaskActions(task) {
    const actionsContainer = document.getElementById('taskActions');
    if (!actionsContainer) return;

    const currentUserId = getCurrentUserId(); // ✅ ADD
    if (!currentUserId) {
        actionsContainer.innerHTML = ""; // ✅ SAFE EXIT
        return;
    }

    const actions = [];

    // Status buttons
    if (task.status === 'todo') {
        actions.push(`
          <button class="btn btn-primary btn-sm"
            onclick="changeTaskStatus('in-progress')">
            Start Task
          </button>
        `);
    } else if (task.status === 'in-progress') {
        actions.push(`
          <button class="btn btn-success btn-sm"
            onclick="changeTaskStatus('done')">
            Complete Task
          </button>
        `);
    }

    // Edit
    actions.push(`
      <button class="btn btn-secondary btn-sm"
        onclick="openEditTaskModal()">
        Edit Task
      </button>
    `);

    // Delete
    actions.push(`
      <button class="btn btn-danger btn-sm"
        onclick="handleDeleteTask()">
        Delete Task
      </button>
    `);

    const ownerId =
        typeof task.projectId?.owner === "object"
            ? task.projectId.owner._id
            : task.projectId?.owner;

    const creatorId =
        typeof task.creator === "object"
            ? task.creator._id
            : task.creator;

    if (ownerId === currentUserId || creatorId === currentUserId) {
        actions.push(`
            <button class="btn btn-outline btn-sm"
              onclick="openAssignModal()">
              Assign Members
            </button>
        `);
    }

    actionsContainer.innerHTML = actions.join('');
}



async function assignTask() {
  const userId = document.getElementById("assignUserSelect").value;

  await apiPatch(`/tasks/${currentTask._id}/assign`, { userId });

  showSuccess("successMessage", "User assigned");
  closeAssignModal();
  openTaskDetails(currentTask._id);
}

async function unassignTask(userId) {
  await apiPatch(`/tasks/${currentTask._id}/unassign`, { userId });
  showSuccess("successMessage", "User unassigned");
  openTaskDetails(currentTask._id);
}


/**
 * Change task status
 */
async function changeTaskStatus(newStatus) {
    if (!currentTask) return;

    try {
        const response = await apiPatch(`/tasks/${currentTask._id}/status`, {
            status: newStatus
        });

        currentTask = response.data;
        displayTaskDetails(currentTask);
        showSuccess('successMessage', 'Task status updated successfully');
        
        // Reload tasks list
        loadTasks();

    } catch (error) {
        showError('errorMessage', error.message || 'Failed to update task status');
    }
}

/**
 * Open edit task modal
 */
function openEditTaskModal() {
    if (!currentTask) return;

    document.getElementById('editTaskTitle').value = currentTask.title;
    document.getElementById('editTaskDescription').value = currentTask.description || '';
    document.getElementById('editTaskStatus').value = currentTask.status;
    document.getElementById('editTaskPriority').value = currentTask.priority;
    document.getElementById('editTaskDueDate').value = currentTask.dueDate ? currentTask.dueDate.split('T')[0] : '';

    document.getElementById('editTaskModal').style.display = 'flex';
}

/**
 * Close edit task modal
 */
function closeEditTaskModal() {
    document.getElementById('editTaskModal').style.display = 'none';
}

/**
 * Handle edit task
 */
async function handleEditTask(e) {
    e.preventDefault();

    if (!currentTask) return;

    const editBtn = document.getElementById('editTaskBtn');
    const title = document.getElementById('editTaskTitle').value.trim();
    const description = document.getElementById('editTaskDescription').value.trim();
    const status = document.getElementById('editTaskStatus').value;
    const priority = document.getElementById('editTaskPriority').value;
    const dueDate = document.getElementById('editTaskDueDate').value;

    editBtn.disabled = true;
    editBtn.textContent = 'Saving...';

    try {
        const updateData = {
            title,
            description,
            status,
            priority
        };

        if (dueDate) {
            updateData.dueDate = dueDate;
        }

        const response = await apiPatch(`/tasks/${currentTask._id}`, updateData);
        currentTask = response.data;

        displayTaskDetails(currentTask);
        closeEditTaskModal();
        showSuccess('successMessage', 'Task updated successfully');
        loadTasks();

    } catch (error) {
        showError('errorMessage', error.message || 'Failed to update task');
    } finally {
        editBtn.disabled = false;
        editBtn.textContent = 'Save Changes';
    }
}

/**
 * Handle delete task
 */
async function handleDeleteTask() {
    if (!currentTask) return;

    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }

    try {
        await apiDelete(`/tasks/${currentTask._id}`);
        
        showSuccess('successMessage', 'Task deleted successfully');
        closeTaskDetailsModal();
        loadTasks();

    } catch (error) {
        showError('errorMessage', error.message || 'Failed to delete task');
    }
}

/**
 * Load comments
 */
async function loadComments(taskId) {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;

    try {
        const response = await apiGet(`/tasks/${taskId}`);
        const task = response.data;
        const comments = task.comments || [];

        if (comments.length === 0) {
            commentsList.innerHTML = '<div class="empty-comments">No comments yet</div>';
            return;
        }

        commentsList.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-author">${escapeHtml(comment.user?.name || 'Unknown')}</span>
                    <span class="comment-time">${formatTimeAgo(comment.createdAt)}</span>
                </div>
                <div class="comment-text">${escapeHtml(comment.text)}</div>
                ${comment.user?._id === getCurrentUserId() || comment.canDelete ? `
                    <div class="comment-actions">
                        <button class="btn btn-danger btn-sm" onclick="deleteComment('${comment._id}')">Delete</button>
                    </div>
                ` : ''}
            </div>
        `).join('');

    } catch (error) {
        console.error('Failed to load comments:', error);
    }
}

/**
 * Add comment
 */
async function addComment() {
    if (!currentTask) return;

    const commentText = document.getElementById('commentText').value.trim();

    if (!commentText) {
        showError('errorMessage', 'Comment text is required');
        return;
    }

    try {
        await apiPost(`/tasks/${currentTask._id}/comments`, {
            text: commentText
        });

        document.getElementById('commentText').value = '';
        showSuccess('successMessage', 'Comment added successfully');
        loadComments(currentTask._id);

    } catch (error) {
        showError('errorMessage', error.message || 'Failed to add comment');
    }
}

/**
 * Delete comment
 */
async function deleteComment(commentId) {
    if (!currentTask) return;

    if (!confirm('Are you sure you want to delete this comment?')) {
        return;
    }

    try {
        await apiDelete(`/tasks/${currentTask._id}/comments/${commentId}`);
        
        showSuccess('successMessage', 'Comment deleted successfully');
        loadComments(currentTask._id);

    } catch (error) {
        showError('errorMessage', error.message || 'Failed to delete comment');
    }
}

/**
 * Load attachments
 */
async function loadAttachments(taskId) {
    const attachmentsList = document.getElementById('attachmentsList');
    if (!attachmentsList) return;

    try {
        const response = await apiGet(`/tasks/${taskId}`);
        const task = response.data;
        const attachments = task.attachments || [];

        if (attachments.length === 0) {
            attachmentsList.innerHTML =
                '<div class="empty-attachments">No attachments</div>';
            return;
        }

        attachmentsList.innerHTML = attachments.map(attachment => {
            // ✅ Prefer stored original name, fallback to URL
            let fileName = attachment.name || "Attachment";
            if (!attachment.name && attachment.url) {
                try {
                    fileName = decodeURIComponent(
                        attachment.url.split("/").pop()
                    );
                } catch (e) {}
            }

            return `
                <div class="attachment-item">
                    <div class="attachment-info">
                        <span class="attachment-icon">📎</span>
                        <span class="attachment-name">
                            ${escapeHtml(fileName)}
                        </span>
                    </div>
                    <div class="attachment-actions">
                        <a href="${attachment.url}" target="_blank"
                           class="btn btn-secondary btn-sm">
                           Download
                        </a>
                        <button class="btn btn-danger btn-sm"
                          onclick="deleteAttachment('${attachment.url}')">
                          Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Failed to load attachments:', error);
    }
}



/**
 * Upload attachment
 */
async function uploadAttachment() {
    if (!currentTask) return;

    const fileInput = document.getElementById('attachmentFile');
    const file = fileInput.files[0];

    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        await apiPost(`/tasks/${currentTask._id}/attachments`, formData);
        
        showSuccess('successMessage', 'File uploaded successfully');
        fileInput.value = '';
        loadAttachments(currentTask._id);

    } catch (error) {
        showError('errorMessage', error.message || 'Failed to upload file');
    }
}

/**
 * Delete attachment
 */
async function deleteAttachment(url) {
    if (!currentTask) return;

    if (!confirm("Are you sure you want to delete this attachment?")) {
        return;
    }

    try {
        await apiPatch(`/tasks/${currentTask._id}/attachments`, {
            url
        });

        showSuccess("successMessage", "Attachment deleted");
        loadAttachments(currentTask._id);

    } catch (error) {
        showError("errorMessage", error.message || "Failed to delete attachment");
    }
}



/**
 * Get current user ID (placeholder - implement based on your auth)
 */
function getCurrentUserId() {
    try {
        const token = localStorage.getItem("token");
        if (!token) return null;

        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload?.id || payload?._id || null;
    } catch (err) {
        return null;
    }
}

/**
 * Format date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format time ago
 */
function formatTimeAgo(date) {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return past.toLocaleDateString();
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}