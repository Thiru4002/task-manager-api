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
  
  if (!projectId) {
    renderErrorState("No project ID provided");
    return;
  }

  try {
    showLoader();
    clearMessages();

    const res = await apiGet(`/projects/public/${projectId}`);
    const project = res.data;

    currentProjectId = project._id;

    // Render project info
    renderProjectDetails(project);
    renderAction();

  } catch (err) {
    console.error("❌ Failed to load project:", err.message);
    renderErrorState(err.message);
  } finally {
    hideLoader();
  }
}

/* ==============================
   RENDER PROJECT DETAILS
================================ */
function renderProjectDetails(project) {
  setText("projectTitle", project.name);
  setText("projectDescription", project.description || "No description available");
  setText("projectOwner", project.owner?.username || "Unknown");

  const membersCount = project.membersCount ?? 
    (Array.isArray(project.members) ? project.members.length : "—");
  setText("projectMembers", membersCount);

  const createdDate = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      })
    : "—";
  setText("projectCreated", createdDate);
}

/* ==============================
   RENDER ERROR STATE
================================ */
function renderErrorState(message) {
  setText("projectTitle", "Project Not Accessible");
  setText("projectDescription", "This project may be private or no longer available.");
  
  const actionEl = document.getElementById("projectAction");
  if (actionEl) {
    actionEl.innerHTML = `
      <a href="index.html" class="btn btn-secondary">
        ← Back to Projects
      </a>
    `;
  }

  showError("errorMessage", message || "Failed to load project details");
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
      <a href="index.html" class="btn btn-secondary">
        ← Back to Projects
      </a>
    `;
    return;
  }

  if (isRequestPending) {
    actionEl.innerHTML = `
      <button class="btn btn-secondary" disabled>
        ✓ Request Pending
      </button>
      <a href="dashboard.html" class="btn btn-secondary">
        Go to Dashboard
      </a>
    `;
    return;
  }

  actionEl.innerHTML = `
    <button class="btn btn-success" onclick="requestToJoin()">
      Request to Join
    </button>
    <a href="index.html" class="btn btn-secondary">
      ← Back to Projects
    </a>
  `;
}

/* ==============================
   JOIN REQUEST HANDLER
================================ */
async function requestToJoin() {
  if (!currentProjectId) return;

  const btn = event?.target;
  const originalText = btn?.textContent;

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Sending...";
    }

    isRequestPending = true;

    await apiPost(`/membership/projects/${currentProjectId}/join-request`);

    showSuccess("successMessage", "Join request sent successfully! The project owner will review your request.");
    renderAction();

  } catch (err) {
    const msg = err.message?.toLowerCase() || "";

    // Backend already has request → treat as success
    if (msg.includes("already") || msg.includes("pending")) {
      showSuccess("successMessage", "Your join request is already pending approval.");
      isRequestPending = true;
      renderAction();
      return;
    }

    // Real failure
    isRequestPending = false;
    
    if (btn) {
      btn.disabled = false;
      btn.textContent = originalText;
    }

    showError("errorMessage", err.message || "Failed to send join request. Please try again.");
    renderAction();
  }
}

/* ==============================
   DOM HELPERS
================================ */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function showLoader() {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "block";

  const content = document.getElementById("projectContent");
  if (content) content.style.display = "none";
}

function hideLoader() {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";

  const content = document.getElementById("projectContent");
  if (content) content.style.display = "block";
}

function showSuccess(elementId, message) {
  clearMessages();
  const el = document.getElementById(elementId);
  if (!el) return;

  el.className = "message success";
  el.textContent = message;
  el.style.display = "block";

  // Auto-hide after 5 seconds
  setTimeout(() => {
    el.style.display = "none";
  }, 5000);
}

function showError(elementId, message) {
  clearMessages();
  const el = document.getElementById(elementId);
  if (!el) return;

  el.className = "message error";
  el.textContent = message;
  el.style.display = "block";
}

function clearMessages() {
  const successMsg = document.getElementById("successMessage");
  const errorMsg = document.getElementById("errorMessage");
  
  if (successMsg) successMsg.style.display = "none";
  if (errorMsg) errorMsg.style.display = "none";
}

/* ==============================
   AUTH CHECK HELPER
================================ */
function isAuthenticated() {
  // Check if user has auth token in localStorage
  return !!localStorage.getItem("token");
}