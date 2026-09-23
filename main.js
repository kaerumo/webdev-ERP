// ============================================================
// ERP scripts for CSITPC — built feature by feature.
// Every function below only runs if the elements it needs exist
// on the current page, so this ONE file is safely shared by all
// 4 pages (login, dashboard, inventory, officers).
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  highlightActiveNav();
  applyRoleVisibility();
  setupLoginForm();
  setupFilters();
  setupViewModal();
  setupAddItemForm();
  setupAddOfficerForm();
  setupDeleteButtons();
});

// ------------------------------------------------------------
// FEATURE 1: Active nav highlighting
// ------------------------------------------------------------
function highlightActiveNav() {
  const currentPage =
    window.location.pathname.split("/").pop() || "dashboard.html";

  document.querySelectorAll(".sidebar-nav a").forEach((link) => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("is-active");
    }
  });
}

// ------------------------------------------------------------
// FEATURE 5: Role-based view (Admin vs Member)
// ------------------------------------------------------------
function applyRoleVisibility() {
  const role = sessionStorage.getItem("userRole") || "member";

  if (role === "admin") {
    document.querySelectorAll(".admin-only").forEach((el) => {
      // Must set an actual value (not ""), otherwise the .admin-only
      // CSS rule (display: none) keeps winning over the cleared inline
      // style, and the element stays hidden even for admins.
      el.style.display = "inline-block";
    });
  }
}

// Dummy accounts for demo/testing purposes only — this is NOT real
// authentication (there's no backend), just enough to show role-based
// access working. See the "Demo accounts" hint on the login page.
const DUMMY_ACCOUNTS = [
  { username: "admin", password: "admin123", role: "admin" },
  { username: "member", password: "member123", role: "member" },
];

function setupLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorEl = document.getElementById("loginError");

    const matchedAccount = DUMMY_ACCOUNTS.find(
      (account) =>
        account.username === username && account.password === password,
    );

    if (!matchedAccount) {
      errorEl.textContent = "Invalid username or password.";
      errorEl.hidden = false;
      return;
    }

    errorEl.hidden = true;
    sessionStorage.setItem("userRole", matchedAccount.role);
    window.location.href = "dashboard.html";
  });
}

// ------------------------------------------------------------
// FEATURE 2: Search + filter
// ------------------------------------------------------------
function setupFilters() {
  const searchInput = document.getElementById("searchInput");
  const tableBody =
    document.getElementById("inventoryTableBody") ||
    document.getElementById("officerTableBody");

  if (!searchInput || !tableBody) return;

  const filterSelects = document.querySelectorAll(".toolbar-filters select");

  function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const rows = tableBody.querySelectorAll("tr");

    rows.forEach((row) => {
      const matchesSearch = row.textContent.toLowerCase().includes(searchTerm);

      const matchesAllFilters = Array.from(filterSelects).every((select) => {
        if (!select.value) return true;
        const key = select.id.replace("Filter", "");
        return row.dataset[key] === select.value;
      });

      row.style.display = matchesSearch && matchesAllFilters ? "" : "none";
    });
  }

  searchInput.addEventListener("input", applyFilters);
  filterSelects.forEach((select) =>
    select.addEventListener("change", applyFilters),
  );
}

// ------------------------------------------------------------
// FEATURE 3: Click-to-view detail modal
// ------------------------------------------------------------
function setupViewModal() {
  const modal = document.getElementById("viewModal");
  if (!modal) return;

  const modalBody = document.getElementById("viewModalBody");
  const closeBtn = document.getElementById("viewModalClose");

  document.querySelectorAll(".view-link").forEach((link) => {
    if (link.dataset.viewBound) return;
    link.dataset.viewBound = "true";

    link.addEventListener("click", (event) => {
      event.preventDefault();
      const row = event.target.closest("tr");
      const cells = row.querySelectorAll("td");

      let html = "<ul>";
      cells.forEach((cell, index) => {
        if (index === cells.length - 1) return;
        html += `<li>${cell.textContent.trim()}</li>`;
      });
      html += "</ul>";

      modalBody.innerHTML = html;
      modal.classList.add("is-open");
    });
  });

  closeBtn.addEventListener("click", () => modal.classList.remove("is-open"));
  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.classList.remove("is-open");
  });
}

// ------------------------------------------------------------
// FEATURE 4: Add new item/officer with validation
// ------------------------------------------------------------
function setupAddItemForm() {
  const openBtn = document.getElementById("addItemBtn");
  const modal = document.getElementById("addItemModal");
  if (!openBtn || !modal) return;

  const closeBtn = document.getElementById("addItemModalClose");
  const form = document.getElementById("addItemForm");
  const errorEl = document.getElementById("addItemError");
  const tableBody = document.getElementById("inventoryTableBody");

  openBtn.addEventListener("click", () => modal.classList.add("is-open"));
  closeBtn.addEventListener("click", () => modal.classList.remove("is-open"));

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("itemName").value.trim();
    const categorySelect = document.getElementById("itemCategory");
    const quantity = document.getElementById("itemQuantity").value;

    if (!name || quantity === "") {
      errorEl.textContent = "Item name and quantity are required.";
      errorEl.hidden = false;
      return;
    }

    errorEl.hidden = true;

    const status = Number(quantity) <= 5 ? "low" : "in-stock";
    const statusLabel = status === "low" ? "Low Stock" : "In Stock";
    const statusClass = status === "low" ? "status-low" : "status-ok";
    const categoryLabel =
      categorySelect.options[categorySelect.selectedIndex].text;

    const newRow = document.createElement("tr");
    newRow.dataset.category = categorySelect.value;
    newRow.dataset.status = status;
    newRow.innerHTML = `
      <td>${name}</td>
      <td>${categoryLabel}</td>
      <td>${quantity}</td>
      <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
      <td>
        <a href="#" class="view-link">View</a>
        <a href="#" class="delete-link admin-only">Delete</a>
      </td>
    `;
    tableBody.appendChild(newRow);

    setupViewModal();
    setupDeleteButtons();
    applyRoleVisibility();

    form.reset();
    modal.classList.remove("is-open");
    showToast("Item added successfully.");
  });
}

function setupAddOfficerForm() {
  const openBtn = document.getElementById("addOfficerBtn");
  const modal = document.getElementById("addOfficerModal");
  if (!openBtn || !modal) return;

  const closeBtn = document.getElementById("addOfficerModalClose");
  const form = document.getElementById("addOfficerForm");
  const errorEl = document.getElementById("addOfficerError");
  const tableBody = document.getElementById("officerTableBody");

  openBtn.addEventListener("click", () => modal.classList.add("is-open"));
  closeBtn.addEventListener("click", () => modal.classList.remove("is-open"));

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("officerName").value.trim();
    const positionSelect = document.getElementById("officerPosition");
    const committee = document.getElementById("officerCommittee").value.trim();

    if (!name || !committee) {
      errorEl.textContent = "Name and committee are required.";
      errorEl.hidden = false;
      return;
    }

    errorEl.hidden = true;

    const positionLabel =
      positionSelect.options[positionSelect.selectedIndex].text;

    const newRow = document.createElement("tr");
    newRow.dataset.position = positionSelect.value;
    newRow.dataset.status = "active";
    newRow.innerHTML = `
      <td>${name}</td>
      <td>${positionLabel}</td>
      <td>${committee}</td>
      <td><span class="status-badge status-ok">Active</span></td>
      <td>
        <a href="#" class="view-link">View</a>
        <a href="#" class="delete-link admin-only">Delete</a>
      </td>
    `;
    tableBody.appendChild(newRow);

    setupViewModal();
    setupDeleteButtons();
    applyRoleVisibility();

    form.reset();
    modal.classList.remove("is-open");
    showToast("Officer added successfully.");
  });
}

// ------------------------------------------------------------
// FEATURE 6: Confirm-before-delete + toast messages
// ------------------------------------------------------------
function setupDeleteButtons() {
  document.querySelectorAll(".delete-link").forEach((link) => {
    if (link.dataset.deleteBound) return;
    link.dataset.deleteBound = "true";

    link.addEventListener("click", (event) => {
      event.preventDefault();
      const confirmed = window.confirm(
        "Are you sure you want to delete this row?",
      );
      if (!confirmed) return;

      const row = event.target.closest("tr");
      row.remove();
      showToast("Deleted successfully.");
    });
  });
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("is-visible");

  setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2500);
}

// d
