/**
 * Project Details Page Logic
 * Handles project display, editing, and activity
 */

let currentProject = null;
let projectId = null;
let isOwnerOrAdmin = false;

document.addEventListener("DOMContentLoaded", () => {
  requireAuth();

  const params = new URLSearchParams(window.location.search);
  projectId = params.get("id");

  if (!projectId) {
    showError("errorMessage", "No project ID provided");
    return;
  }

  loadProjectDetails();

  const editForm = document.getElementById("editProjectForm");
  if (editForm) {
    editForm.addEventListener("submit", handleEditProject);
  }
});

/* ===============================
   LOAD PROJECT
================================ */
async function loadProjectDetails() {
  showLoader();

  try {
    const response = await apiGet(`/projects/${projectId}`);
    currentProject = response.data;

    hideLoader();

    if (!currentProject) {
      showError("errorMessage", "Project not found");
      return;
    }

    displayProject(currentProject);
  } catch (err) {
    hideLoader();
    showError("errorMessage", err.message || "Failed to load project");
  }
}

/* ===============================
   DISPLAY PROJECT
================================ */
function displayProject(project) {
  document.getElementById("projectDetails").style.display = "block";

  document.getElementById("projectName").textContent = project.name;
  document.getElementById("projectDescription").textContent =
    project.description || "No description";

  const ownerName = project.owner?.username || "Unknown";

  document.getElementById("projectOwnerName").textContent =
    `Owner: ${ownerName}`;

  document.getElementById("ownerName").textContent = ownerName;

  document.getElementById("createdDate").textContent = new Date(
    project.createdAt
  ).toLocaleDateString();

  const currentUserId = getCurrentUserId();
  isOwnerOrAdmin =
    project.owner &&
    project.owner._id &&
    project.owner._id.toString() === currentUserId;

  setupActionButtons();

  // Correct buttons (match HTML)
  const viewAllTasksBtn = document.getElementById("viewAllTasksBtn");
  if (viewAllTasksBtn) {
    viewAllTasksBtn.href = `tasks.html?projectId=${projectId}`;
  }

  const manageTeamBtn = document.getElementById("manageTeamBtn");
  if (manageTeamBtn) {
    manageTeamBtn.href = `team.html?projectId=${projectId}`;
  }
}

/* ===============================
   ACTION BUTTONS
================================ */
function setupActionButtons() {
  const container = document.getElementById("projectActions");
  if (!container) return;

  container.innerHTML = "";

  if (isOwnerOrAdmin) {
    container.innerHTML = `
      <button class="btn btn-primary btn-sm" onclick="openEditModal()">Edit Project</button>
      <button class="btn btn-danger btn-sm" onclick="handleDeleteProject()">Delete Project</button>
    `;
  }
}

/* ===============================
   TAB HANDLING
================================ */
function showTab(tab) {
  document.querySelectorAll(".tab-btn").forEach(btn =>
    btn.classList.remove("active")
  );
  document.querySelectorAll(".tab-pane").forEach(p =>
    p.classList.remove("active")
  );

  event.target.classList.add("active");
  document.getElementById(`${tab}Tab`).classList.add("active");

  if (tab === "activity") loadProjectActivity();
  if (tab === "tasks") loadTaskPreview();
  if (tab === "team") loadTeamPreview();
}

/* ===============================
   TASK PREVIEW
================================ */
async function loadTaskPreview() {
  const container = document.getElementById("taskPreview");
  if (!container) return;

  container.innerHTML = "<p>Loading tasks...</p>";

  try {
    const res = await apiGet(`/tasks?projectId=${projectId}&limit=2`);
    const tasks = res.data || [];

    if (!tasks.length) {
      container.innerHTML = "<p>No tasks yet.</p>";
      return;
    }

    container.innerHTML = tasks
      .map(
        task => `
        <div class="task-preview-item">
          <span class="task-title">${escapeHtml(task.title)}</span>
          <span class="task-status status-${task.status}">
            ${task.status}
          </span>
        </div>
      `
      )
      .join("");
  } catch {
    container.innerHTML = "<p>Failed to load tasks.</p>";
  }
}

/* ===============================
   TEAM PREVIEW
================================ */
function loadTeamPreview() {
  const container = document.getElementById("teamPreview");
  if (!container) return;

  const members = currentProject.members || [];

  if (!members.length) {
    container.innerHTML = "<p>No members yet.</p>";
    return;
  }

  const previewMembers = members.slice(0, 3);

  container.innerHTML = previewMembers
    .map(member => {
      const isOwner =
        member._id?.toString() === currentProject.owner?._id?.toString();

      return `
        <div class="team-member-item">
          <span>👤</span>
          <span>
            ${escapeHtml(member.username || "User")}
            ${isOwner ? "<strong>(Owner)</strong>" : ""}
          </span>
        </div>
      `;
    })
    .join("");
}

/* ===============================
   EDIT PROJECT
================================ */
function openEditModal() {
  document.getElementById("editName").value = currentProject.name;
  document.getElementById("editDescription").value =
    currentProject.description || "";
  document.getElementById("editModal").style.display = "flex";
}

function closeEditModal() {
  document.getElementById("editModal").style.display = "none";
}

async function handleEditProject(e) {
  e.preventDefault();

  const btn = document.getElementById("saveEditBtn");
  btn.disabled = true;
  btn.textContent = "Saving...";

  try {
    const response = await apiPatch(`/projects/${projectId}`, {
      name: document.getElementById("editName").value.trim(),
      description: document.getElementById("editDescription").value.trim(),
    });

    currentProject = response.data;
    displayProject(currentProject);
    closeEditModal();
    showSuccess("successMessage", "Project updated");
  } catch (err) {
    showError("errorMessage", err.message || "Update failed");
  } finally {
    btn.disabled = false;
    btn.textContent = "Save Changes";
  }
}

/* ===============================
   DELETE PROJECT
================================ */
async function handleDeleteProject() {
  if (!confirm("Delete this project permanently?")) return;

  try {
    await apiDelete(`/projects/${projectId}`);
    showSuccess("successMessage", "Project deleted");

    setTimeout(() => {
      window.location.href = "projects.html";
    }, 1200);
  } catch (err) {
    showError("errorMessage", err.message || "Delete failed");
  }
}

/* ===============================
   HELPERS
================================ */
function getCurrentUserId() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id;
  } catch {
    return null;
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatTimeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  if (hrs < 24) return `${hrs} hr ago`;
  if (days < 7) return `${days} day ago`;
  return new Date(date).toLocaleDateString();
}
