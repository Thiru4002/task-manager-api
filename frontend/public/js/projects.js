/**
 * Projects Page Logic
 * Shows projects where user is owner or member
 */

let projects = [];

document.addEventListener("DOMContentLoaded", () => {
    requireAuth();
    loadProjects();

    const form = document.getElementById("createProjectForm");
    if (form) {
        form.addEventListener("submit", handleCreateProject);
    }
});

/* ===============================
   LOAD PROJECTS
================================ */
async function loadProjects() {
    const loader = document.getElementById("loader");
    const empty = document.getElementById("emptyState");
    const error = document.getElementById("errorMessage");
    const grid = document.getElementById("projectsGrid");

    loader.style.display = "block";
    grid.innerHTML = "";
    empty.style.display = "none";
    error.style.display = "none";

    try {
        const res = await apiGet("/projects");
        projects = res.data || [];

        loader.style.display = "none";

        if (!projects.length) {
            empty.style.display = "block";
            return;
        }

        renderProjects();
    } catch (err) {
        loader.style.display = "none";
        error.textContent = err.message || "Failed to load projects";
        error.style.display = "block";
    }
}

/* ===============================
   RENDER PROJECTS
================================ */
function renderProjects() {
    const grid = document.getElementById("projectsGrid");
    const currentUserId = getCurrentUserId();

    grid.innerHTML = projects.map(project => {
        const isOwner =
            project.owner?._id === currentUserId ||
            project.owner === currentUserId;

        const role = isOwner ? "owner" : "member";

        return `
            <div class="project-card" onclick="openProject('${project._id}')">
                <h3>${escapeHtml(project.name)}</h3>
                <p>${escapeHtml(project.description || "No description")}</p>

                <div class="project-meta">
                    <span class="project-role role-${role}">
                        ${role.toUpperCase()}
                    </span>
                    <span>${project.members?.length || 0} members</span>
                </div>
            </div>
        `;
    }).join("");
}

/* ===============================
   CREATE PROJECT
================================ */
function openCreateProjectModal() {
    document.getElementById("createProjectForm").reset();
    document.getElementById("createProjectModal").style.display = "flex";
}

function closeCreateProjectModal() {
    document.getElementById("createProjectModal").style.display = "none";
}

async function handleCreateProject(e) {
    e.preventDefault();

    const btn = document.getElementById("createProjectBtn");
    const name = document.getElementById("projectName").value.trim();
    const description = document.getElementById("projectDescription").value.trim();

    if (!name) {
        showError("errorMessage", "Project name is required");
        return;
    }

    btn.disabled = true;
    btn.textContent = "Creating...";

    try {
        await apiPost("/projects", { name, description });
        closeCreateProjectModal();
        loadProjects();
        showSuccess("successMessage", "Project created successfully");
    } catch (err) {
        showError("errorMessage", err.message || "Create failed");
    } finally {
        btn.disabled = false;
        btn.textContent = "Create Project";
    }
}

/* ===============================
   HELPERS
================================ */
function openProject(id) {
    window.location.href = `project.html?id=${id}`;
}

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

function escapeHtml(text = "") {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
