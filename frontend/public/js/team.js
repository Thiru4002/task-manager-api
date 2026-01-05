/**
 * Team Management Page Logic
 * Handles members and join requests
 */

let projectId = null;
let currentProject = null;
let members = [];
let joinRequests = [];

document.addEventListener("DOMContentLoaded", () => {
  requireAuth();

  const params = new URLSearchParams(window.location.search);
  projectId = params.get("projectId");

  if (!projectId) {
    showError("errorMessage", "No project ID provided");
    return;
  }

  loadTeamData();

  const addMemberForm = document.getElementById("addMemberForm");
  if (addMemberForm) {
    addMemberForm.addEventListener("submit", handleAddMember);
  }
});

/* ===============================
   LOAD TEAM DATA
================================ */
async function loadTeamData() {
  showLoader();

  try {
    const projectRes = await apiGet(`/projects/${projectId}`);
    currentProject = projectRes.data;

    document.getElementById(
      "pageTitle"
    ).textContent = `Team – ${currentProject.name}`;

    members = currentProject.members || [];

    // Owner-only Add button
    const currentUserId = getCurrentUserId();
    const addBtn = document.querySelector(".card-header .btn-primary");

    if (addBtn) {
      addBtn.style.display =
        currentProject.owner?._id === currentUserId ? "inline-flex" : "none";
    }

    await loadJoinRequests();

    hideLoader();
    document.getElementById("teamContent").style.display = "block";

    renderMembers();
  } catch (err) {
    hideLoader();
    showError("errorMessage", err.message || "Failed to load team");
  }
}

/* ===============================
   JOIN REQUESTS
================================ */
async function loadJoinRequests() {
  try {
    const res = await apiGet(
      `/membership/projects/${projectId}/join-requests`
    );

    joinRequests = res.data || [];

    const count = document.getElementById("requestCount");
    if (count) count.textContent = joinRequests.length;

    renderJoinRequests();
  } catch {
    document.getElementById("requestsEmpty").style.display = "block";
  }
}

/* ===============================
   RENDER MEMBERS
================================ */
function renderMembers() {
  const list = document.getElementById("membersList");
  const empty = document.getElementById("membersEmpty");

  if (!list) return;

  if (!members.length) {
    list.innerHTML = "";
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  const ownerId = currentProject.owner?._id;

  list.innerHTML = members
    .map((member) => {
      const name =
        member.username ||
        member.email?.split("@")[0] ||
        "Unknown";

      const avatar = name.charAt(0).toUpperCase();
      const isOwner = member._id === ownerId;

      return `
        <div class="member-item">
          <div class="member-info">
            <div class="member-avatar">${avatar}</div>
            <div class="member-details">
              <div class="member-name">${escapeHtml(name)}</div>
              <div class="member-email">${escapeHtml(member.email || "")}</div>
            </div>
          </div>

          <div class="member-actions">
            <span class="member-role ${
              isOwner ? "role-owner" : "role-member"
            }">
              ${isOwner ? "Owner" : "Member"}
            </span>

            ${
              !isOwner
                ? `<button class="btn btn-danger btn-sm"
                     onclick="handleRemoveMember('${member._id}')">
                     Remove
                   </button>`
                : ""
            }
          </div>
        </div>
      `;
    })
    .join("");
}

/* ===============================
   RENDER JOIN REQUESTS
================================ */
function renderJoinRequests() {
  const list = document.getElementById("requestsList");
  const empty = document.getElementById("requestsEmpty");

  if (!list) return;

  if (!joinRequests.length) {
    list.innerHTML = "";
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  list.innerHTML = joinRequests
    .map((req) => {
      const user = req.userId || {};
      const name =
        user.username ||
        user.email?.split("@")[0] ||
        "Unknown";

      const avatar = name.charAt(0).toUpperCase();

      return `
        <div class="request-item">
          <div class="member-info">
            <div class="member-avatar">${avatar}</div>
            <div class="member-details">
              <div class="member-name">${escapeHtml(name)}</div>
              <div class="member-email">${escapeHtml(user.email || "")}</div>
              <div class="request-time">
                ${formatTimeAgo(req.createdAt)}
              </div>
            </div>
          </div>

          <div class="request-actions">
            <button class="btn btn-success btn-sm"
              onclick="handleJoinRequest('${req._id}','approve')">
              Approve
            </button>

            <button class="btn btn-danger btn-sm"
              onclick="handleJoinRequest('${req._id}','reject')">
              Reject
            </button>
          </div>
        </div>
      `;
    })
    .join("");
}

/* ===============================
   HANDLE JOIN REQUEST
================================ */
async function handleJoinRequest(requestId, action) {
  try {
    await apiPatch(
      `/membership/projects/${projectId}/join-requests/${requestId}`,
      { action }
    );

    showSuccess("successMessage", "Request processed");
    loadTeamData();
  } catch (err) {
    showError("errorMessage", err.message || "Action failed");
  }
}

/* ===============================
   ADD MEMBER
================================ */
async function handleAddMember(e) {
  e.preventDefault();

  const addBtn = document.getElementById("addMemberBtn");
  const emailInput = document.getElementById("memberEmail");
  const email = emailInput.value.trim().toLowerCase();

  if (!email) {
    showError("errorMessage", "Email is required");
    return;
  }

  // Prevent duplicate
  const alreadyMember = members.some(
    (m) => m.email?.toLowerCase() === email
  );

  if (alreadyMember) {
    showError("errorMessage", "User already exists in project");
    return;
  }

  addBtn.disabled = true;
  addBtn.textContent = "Adding...";

  try {
    // Find user by email
    const userRes = await apiGet(`/users/by-email?email=${email}`);
    const userId = userRes.data._id;

    await apiPatch(
      `/membership/projects/${projectId}/add-member`,
      { userId }
    );

    showSuccess("successMessage", "Member added successfully");
    closeAddMemberModal();
    emailInput.value = "";

    loadTeamData();
  } catch (err) {
    showError("errorMessage", err.message || "Failed to add member");
  } finally {
    addBtn.disabled = false;
    addBtn.textContent = "Add Member";
  }
}

/* ===============================
   REMOVE MEMBER
================================ */
async function handleRemoveMember(userId) {
  if (!confirm("Remove this member?")) return;

  try {
    await apiPatch(
      `/membership/projects/${projectId}/remove-member`,
      { userId }
    );

    showSuccess("successMessage", "Member removed");
    loadTeamData();
  } catch (err) {
    showError("errorMessage", err.message || "Failed to remove member");
  }
}

/* ===============================
   MODAL HELPERS
================================ */
function openAddMemberModal() {
  document.getElementById("addMemberModal").style.display = "flex";
}

function closeAddMemberModal() {
  document.getElementById("addMemberModal").style.display = "none";
}

/* ===============================
   UTILITIES
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

function escapeHtml(text = "") {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
