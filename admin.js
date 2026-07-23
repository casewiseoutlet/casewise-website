document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://script.google.com/macros/s/AKfycbwB6uBCca3eOkWixBr4fnjz7the6_HaJqv6hc1Nf7laXfqI3kd7ljUlVDv18elTmSyMFQ/exec";
  const state = {
    password: sessionStorage.getItem("cwAdminPassword") || "",
    applications: [],
    pendingAction: null
  };

  const $ = (id) => document.getElementById(id);
  const loginView = $("loginView");
  const dashboardView = $("dashboardView");
  const loginForm = $("loginForm");
  const loginButton = $("loginButton");
  const loginMessage = $("loginMessage");
  const dashboardMessage = $("dashboardMessage");
  const body = $("applicationsBody");
  const emptyState = $("emptyState");
  const modal = $("confirmModal");

  function message(element, text, type = "") {
    element.textContent = text || "";
    element.className = "message" + (type ? " " + type : "");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async function api(params, method = "GET") {
    if (method === "GET") {
      const query = new URLSearchParams({ ...params, adminPassword: state.password });
      const response = await fetch(`${API_URL}?${query.toString()}`, { cache: "no-store" });
      return response.json();
    }

    const formData = new FormData();
    Object.entries({ ...params, adminPassword: state.password }).forEach(([key, value]) => {
      formData.append(key, value);
    });
    const response = await fetch(API_URL, { method: "POST", body: formData });
    return response.json();
  }

  function setLoggedIn(loggedIn) {
    loginView.classList.toggle("hidden", loggedIn);
    dashboardView.classList.toggle("hidden", !loggedIn);
    $("logoutButton").classList.toggle("hidden", !loggedIn);
  }

  async function loadApplications() {
    message(dashboardMessage, "Loading...");
    try {
      const data = await api({ action: "adminList" });
      if (!data.success) throw new Error(data.message || "Access denied.");
      state.applications = data.applications || [];
      render();
      updateStats(data.stats || {});
      message(dashboardMessage, "");
      setLoggedIn(true);
    } catch (error) {
      state.password = "";
      sessionStorage.removeItem("cwAdminPassword");
      setLoggedIn(false);
      message(loginMessage, error.message || "Could not open dashboard.", "error");
    }
  }

  function updateStats(stats) {
    $("statTotal").textContent = stats.total || 0;
    $("statPending").textContent = stats.pending || 0;
    $("statActive").textContent = stats.active || 0;
    $("statCompleted").textContent = stats.completed || 0;
  }

  function render() {
    const q = $("searchInput").value.trim().toLowerCase();
    const filter = $("statusFilter").value;

    const rows = state.applications.filter((item) => {
      const text = [item.internshipId, item.name, item.email, item.program, item.duration]
        .join(" ").toLowerCase();
      return (!q || text.includes(q)) && (!filter || item.status === filter);
    });

    body.innerHTML = rows.map((item) => {
      const status = (item.status || "Pending");
      const statusClass = status.toLowerCase();
      const safeId = escapeHtml(item.internshipId);
      let actions = "";

      if (status === "Pending") {
        actions += `<button data-action="approve" data-id="${safeId}">Approve</button>`;
        actions += `<button class="reject" data-action="reject" data-id="${safeId}">Reject</button>`;
      }

      if (status === "Active" || status === "Approved") {
        actions += `<button class="complete" data-action="complete" data-id="${safeId}">Complete & Email PDF</button>`;
      }

      if (status === "Completed") {
        actions += `<button class="complete" data-action="resend" data-id="${safeId}">Resend Certificate</button>`;
      }

      return `
        <tr>
          <td><strong>${safeId}</strong></td>
          <td class="student">
            <strong>${escapeHtml(item.name)}</strong>
            <span>${escapeHtml(item.email)}</span>
          </td>
          <td>${escapeHtml(item.program)}</td>
          <td>${escapeHtml(item.duration)}</td>
          <td><span class="status ${statusClass}">${escapeHtml(status)}</span></td>
          <td><div class="actions">${actions || "—"}</div></td>
        </tr>
      `;
    }).join("");

    emptyState.classList.toggle("hidden", rows.length !== 0);
  }

  function openConfirm(action, id) {
    const student = state.applications.find((item) => item.internshipId === id);
    if (!student) return;

    const descriptions = {
      approve: ["Approve internship", `Set ${student.name} as Active?`],
      reject: ["Reject application", `Reject ${student.name}'s application?`],
      complete: ["Complete internship", `Generate a PDF completion certificate and email it to ${student.email}?`],
      resend: ["Resend certificate", `Generate and email the completion certificate again to ${student.email}?`]
    };

    state.pendingAction = { action, id };
    $("modalTitle").textContent = descriptions[action][0];
    $("modalText").textContent = descriptions[action][1];
    $("confirmAction").textContent = action === "complete" || action === "resend" ? "Generate & Send" : "Confirm";
    modal.classList.remove("hidden");
  }

  async function runAction() {
    if (!state.pendingAction) return;
    const { action, id } = state.pendingAction;
    $("confirmAction").disabled = true;
    $("confirmAction").textContent = "Working...";

    try {
      const data = await api({
        action: action === "resend" ? "resendCertificate" : action,
        internshipId: id
      }, "POST");

      if (!data.success) throw new Error(data.message || "Action failed.");
      modal.classList.add("hidden");
      message(dashboardMessage, data.message || "Done.", "success");
      await loadApplications();
    } catch (error) {
      modal.classList.add("hidden");
      message(dashboardMessage, error.message || "Action failed.", "error");
    } finally {
      $("confirmAction").disabled = false;
      state.pendingAction = null;
    }
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.password = $("adminPassword").value;
    loginButton.classList.add("loading");
    loginButton.disabled = true;
    message(loginMessage, "");

    try {
      sessionStorage.setItem("cwAdminPassword", state.password);
      await loadApplications();
    } finally {
      loginButton.classList.remove("loading");
      loginButton.disabled = false;
    }
  });

  body.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (button) openConfirm(button.dataset.action, button.dataset.id);
  });

  $("searchInput").addEventListener("input", render);
  $("statusFilter").addEventListener("change", render);
  $("refreshButton").addEventListener("click", loadApplications);
  $("cancelModal").addEventListener("click", () => modal.classList.add("hidden"));
  $("confirmAction").addEventListener("click", runAction);
  $("logoutButton").addEventListener("click", () => {
    state.password = "";
    sessionStorage.removeItem("cwAdminPassword");
    $("adminPassword").value = "";
    setLoggedIn(false);
  });

  if (state.password) loadApplications();
});
