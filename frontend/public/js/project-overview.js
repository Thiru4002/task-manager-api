/**
 * Project Overview Page Logic
 * Shows single public project details and handles join request
 */

let currentProjectId = null;
let isRequestPending = false;

document.addEventListener("DOMContentLoaded", loadProjectOverview);

/* ==============================
   LOAD PROJECT OVERVIEW
================================ */
async function loadProjectOverview() {
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get("id");
  if (!projectId) return;

  try {
    showLoader();

    const res = await apiGet(`/projects/public/${projectId}`);
    const project = res.data;

    currentProjectId = project._id;

    // ===== Render project info =====
    setText("projectTitle", project.name);
    setText(
      "projectDescription",
      project.description || "No description available"
    );
    setText(
      "projectOwner",
      project.owner?.username || "Unknown"
    );

    const membersCount =
      project.membersCount ??
      (Array.isArray(project.members) ? project.members.length : "—");

    setText("projectMembers", membersCount);

    setText(
      "projectCreated",
      project.createdAt
        ? new Date(project.createdAt).toLocaleDateString()
        : "—"
    );

    renderAction();

  } catch (err) {
    console.error("❌ Failed to load project:", err.message);

    setText("projectTitle", "Project not accessible");
    setText(
      "projectDescription",
      "Login or request access to view this project."
    );
  } finally {
    hideLoader();
  }
}

/* ==============================
   ACTION BUTTON RENDERER
================================ */
function renderAction() {
  const actionEl = document.getElementById("projectAction");
  if (!actionEl) return;

  if (!isAuthenticated()) {
    actionEl.innerHTML = `
      <a href="login.html" class="btn btn-primary">
        Login to Join Project
      </a>
    `;
    return;
  }

  if (isRequestPending) {
    actionEl.innerHTML = `
      <button class="btn btn-secondary" disabled>
        Request Pending
      </button>
    `;
    return;
  }

  actionEl.innerHTML = `
    <button class="btn btn-success" onclick="requestToJoin()">
      Request to Join
    </button>
  `;
}

/* ==============================
   JOIN REQUEST HANDLER
================================ */
async function requestToJoin() {
  if (!currentProjectId) return;

  try {
    isRequestPending = true;
    renderAction();

    await apiPost(
      `/membership/projects/${currentProjectId}/join-request`
    );

    showSuccess(
      "successMessage",
      "Join request sent successfully"
    );

  } catch (err) {
    const msg = err.message?.toLowerCase() || "";

    // Backend already has request → UX success
    if (msg.includes("already") || msg.includes("pending")) {
      showSuccess(
        "successMessage",
        "Your join request is already pending for approval"
      );
      isRequestPending = true;
      renderAction();
      return;
    }

    // Real failure
    isRequestPending = false;
    renderAction();

    showError(
      "errorMessage",
      err.message || "Failed to send join request"
    );
  }
}

/* ==============================
   SAFE DOM HELPER
================================ */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
