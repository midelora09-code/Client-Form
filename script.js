/* ==========================================================================
   CONFIGURATIONS
   ========================================================================== */
const EMAILJS_PUBLIC_KEY = "8-oL03bPAfiCqVtpe";
const EMAILJS_SERVICE_ID = "service_rm19xwd";
const EMAILJS_TEMPLATE_ID = "template_scxioh7";

const WHATSAPP_OWNER_NUMBER = "919091824475"; 

// Initialize EmailJS
(function () {
  if (typeof emailjs !== "undefined" && EMAILJS_PUBLIC_KEY) {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }
})();

// DOM Elements
const formSection = document.getElementById("formSection");
const adminSection = document.getElementById("adminSection");
const clientForm = document.getElementById("clientForm");
const submitBtn = document.getElementById("submitBtn");
const btnText = submitBtn ? submitBtn.querySelector(".btn-text") : null;
const spinner = submitBtn ? submitBtn.querySelector(".spinner") : null;
const successCard = document.getElementById("successCard");
const whatsappBtn = document.getElementById("whatsappBtn");
const resetFormBtn = document.getElementById("resetFormBtn");
const toastContainer = document.getElementById("toastContainer");

const fullNameInput = document.getElementById("fullName");
const phoneInput = document.getElementById("phoneNumber");
const businessInput = document.getElementById("businessName");
const addressInput = document.getElementById("address");
const noteInput = document.getElementById("note");
const addressCount = document.getElementById("addressCount");
const noteCount = document.getElementById("noteCount");

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  checkAdminMode();
  setupCharacterCounters();
});

function checkAdminMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const isAdmin = urlParams.get("admin") === "true";

  if (isAdmin && adminSection && formSection) {
    formSection.classList.add("hidden");
    adminSection.classList.remove("hidden");
    loadAdminDashboard();
  }
}

/* ==========================================================================
   TOAST NOTIFICATION SYSTEM
   ========================================================================== */
function showToast(message, type = "info") {
  if (!toastContainer) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  const iconMap = {
    success: '<i class="fa-solid fa-circle-check"></i>',
    error: '<i class="fa-solid fa-circle-exclamation"></i>',
    info: '<i class="fa-solid fa-circle-info"></i>'
  };

  toast.innerHTML = `${iconMap[type] || iconMap.info} <span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => toast.remove(), 3500);
}

/* ==========================================================================
   VALIDATION & COUNTERS
   ========================================================================== */
function setupCharacterCounters() {
  if (addressInput && addressCount) {
    addressInput.addEventListener("input", () => {
      addressCount.textContent = addressInput.value.length;
      validateForm();
    });
  }

  if (noteInput && noteCount) {
    noteInput.addEventListener("input", () => {
      noteCount.textContent = noteInput.value.length;
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
      validateForm();
    });
  }

  [fullNameInput, businessInput].forEach(input => {
    if (input) input.addEventListener("input", validateForm);
  });
}

function validateForm() {
  if (!submitBtn) return false;
  let isValid = true;

  if (!fullNameInput || !fullNameInput.value.trim()) isValid = false;

  const phoneVal = phoneInput ? phoneInput.value.trim() : "";
  const phoneGroup = phoneInput ? phoneInput.closest(".input-group") : null;
  
  if (phoneVal.length !== 10) {
    isValid = false;
    if (phoneGroup && phoneVal.length > 0) phoneGroup.classList.add("invalid");
    if (phoneGroup) phoneGroup.classList.remove("valid");
  } else if (phoneGroup) {
    phoneGroup.classList.remove("invalid");
    phoneGroup.classList.add("valid");
  }

  if (!businessInput || !businessInput.value.trim()) isValid = false;
  if (!addressInput || !addressInput.value.trim()) isValid = false;

  submitBtn.disabled = !isValid;
  return isValid;
}

/* ==========================================================================
   SUBMISSION LOGIC
   ========================================================================== */
if (clientForm) {
  clientForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const phoneVal = phoneInput.value.trim();
    const existingClients = getStoredClients();

    if (existingClients.some(c => c.phone === phoneVal)) {
      showToast("Yeh mobile number pehle se registered hai!", "error");
      return;
    }

    setLoadingState(true);

    const now = new Date();
    const formattedTime = now.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

    const formData = {
      id: Date.now(),
      name: fullNameInput.value.trim(),
      phone: phoneVal,
      business: businessInput.value.trim(),
      address: addressInput.value.trim(),
      note: noteInput.value.trim() || "N/A",
      createdAt: formattedTime,
      rawDate: now.toISOString().split('T')[0]
    };

    try {
      if (typeof emailjs !== "undefined") {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
          name: formData.name,
          phone: formData.phone,
          business: formData.business,
          address: formData.address,
          note: formData.note,
          time: formData.createdAt
        });
      }

      saveClientToStorage(formData);
      showToast("Details successfully submit ho gaye!", "success");
      renderSuccessView(formData.name);

    } catch (error) {
      console.error("Submission error:", error);
      showToast("Email send karne me error aaya, par data local save hua hai.", "error");
      saveClientToStorage(formData);
      renderSuccessView(formData.name);
    } finally {
      setLoadingState(false);
    }
  });
}

function setLoadingState(isLoading) {
  if (!submitBtn) return;
  submitBtn.disabled = isLoading;
  if (btnText && spinner) {
    btnText.classList.toggle("hidden", isLoading);
    spinner.classList.toggle("hidden", !isLoading);
  }
}

function saveClientToStorage(clientObj) {
  const clients = getStoredClients();
  clients.unshift(clientObj);
  localStorage.setItem("minu_clients", JSON.stringify(clients));
}

function getStoredClients() {
  const stored = localStorage.getItem("minu_clients");
  return stored ? JSON.parse(stored) : [];
}

function renderSuccessView(clientName) {
  if (clientForm) clientForm.classList.add("hidden");
  if (successCard) successCard.classList.remove("hidden");

  if (whatsappBtn) {
    const encodedText = encodeURIComponent(`Hello! Main ${clientName} hu. Maine apni client form submit kar di hai.`);
    whatsappBtn.href = `https://wa.me/${WHATSAPP_OWNER_NUMBER}?text=${encodedText}`;
  }
}

if (resetFormBtn) {
  resetFormBtn.addEventListener("click", () => {
    clientForm.reset();
    if (addressCount) addressCount.textContent = "0";
    if (noteCount) noteCount.textContent = "0";
    document.querySelectorAll(".input-group").forEach(el => el.classList.remove("valid", "invalid"));
    if (successCard) successCard.classList.add("hidden");
    if (clientForm) clientForm.classList.remove("hidden");
    validateForm();
  });
}

/* ==========================================================================
   ADMIN DASHBOARD
   ========================================================================== */
const clientTableBody = document.getElementById("clientTableBody");
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearch");
const noDataMsg = document.getElementById("noDataMsg");

let adminInitialized = false;

function loadAdminDashboard() {
  const clients = getStoredClients();
  updateAnalytics(clients);
  renderAdminTable(clients);

  if (adminInitialized) return;
  adminInitialized = true;

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const currentClients = getStoredClients();
      const query = e.target.value.toLowerCase();
      if (clearSearchBtn) clearSearchBtn.classList.toggle("hidden", query === "");

      const filtered = currentClients.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.phone.includes(query) ||
        c.business.toLowerCase().includes(query)
      );
      renderAdminTable(filtered);
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      clearSearchBtn.classList.add("hidden");
      renderAdminTable(getStoredClients());
    });
  }

  const exportCsvBtn = document.getElementById("exportCsvBtn");
  if (exportCsvBtn) exportCsvBtn.addEventListener("click", () => exportToCsv(getStoredClients()));
  
  const exportJsonBtn = document.getElementById("exportJsonBtn");
  if (exportJsonBtn) exportJsonBtn.addEventListener("click", () => exportToJson(getStoredClients()));

  const clearAllBtn = document.getElementById("clearAllBtn");
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      if (confirm("Kya aap sach me SARI client entries delete karna chahte hain?")) {
        localStorage.removeItem("minu_clients");
        loadAdminDashboard();
        showToast("Sare records clear kar diye gaye", "info");
      }
    });
  }
}

function updateAnalytics(data) {
  const total = document.getElementById("statTotal");
  const today = document.getElementById("statToday");
  const biz = document.getElementById("statBusinesses");

  if (total) total.textContent = data.length;
  if (today) {
    const todayStr = new Date().toISOString().split('T')[0];
    today.textContent = data.filter(c => c.rawDate === todayStr).length;
  }
  if (biz) {
    biz.textContent = new Set(data.map(c => c.business.toLowerCase())).size;
  }
}

function renderAdminTable(data) {
  if (!clientTableBody) return;
  clientTableBody.innerHTML = "";

  if (data.length === 0) {
    if (noDataMsg) noDataMsg.classList.remove("hidden");
    return;
  }

  if (noDataMsg) noDataMsg.classList.add("hidden");

  data.forEach((client) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${client.createdAt}</td>
      <td><strong>${escapeHtml(client.name)}</strong></td>
      <td>${escapeHtml(client.phone)}</td>
      <td>${escapeHtml(client.business)}</td>
      <td>${escapeHtml(client.address)}</td>
      <td>${escapeHtml(client.note)}</td>
      <td>
        <div class="action-btns">
          <a class="icon-btn" title="Chat on WhatsApp" href="https://wa.me/91${client.phone}" target="_blank">
            <i class="fa-brands fa-whatsapp"></i>
          </a>
          <button class="icon-btn" title="Copy Info" onclick="copyClientData(${client.id})">
            <i class="fa-regular fa-copy"></i>
          </button>
          <button class="icon-btn" title="Delete" onclick="deleteClientEntry(${client.id})">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      </td>
    `;
    clientTableBody.appendChild(tr);
  });
}

/* Helper Utility Functions */
function exportToCsv(data) {
  if (!data.length) return showToast("Export ke liye koi data nahi hai", "error");
  const headers = ["ID", "Name", "Phone", "Business", "Address", "Note", "Submitted At"];
  const escapeCsv = (str) => `"${String(str).replace(/"/g, '""')}"`;
  const rows = data.map(c => [c.id, escapeCsv(c.name), escapeCsv(c.phone), escapeCsv(c.business), escapeCsv(c.address), escapeCsv(c.note), escapeCsv(c.createdAt)]);
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  downloadFile(encodeURI(csvContent), `clients_${Date.now()}.csv`);
}

function exportToJson(data) {
  if (!data.length) return showToast("Export ke liye koi data nahi hai", "error");
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
  downloadFile(dataStr, `clients_${Date.now()}.json`);
}

function downloadFile(content, fileName) {
  const link = document.createElement("a");
  link.href = content;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

window.copyClientData = function (id) {
  const client = getStoredClients().find(c => c.id === id);
  if (!client) return;
  const text = `Name: ${client.name}\nPhone: ${client.phone}\nBusiness: ${client.business}\nAddress: ${client.address}\nNote: ${client.note}`;
  navigator.clipboard.writeText(text).then(() => showToast("Client details copy ho gaye!", "success"));
};

window.deleteClientEntry = function (id) {
  if (!confirm("Is client entry ko delete karna chahte hain?")) return;
  const clients = getStoredClients().filter(c => c.id !== id);
  localStorage.setItem("minu_clients", JSON.stringify(clients));
  loadAdminDashboard();
  showToast("Record delete kar diya gaya", "info");
};

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}
