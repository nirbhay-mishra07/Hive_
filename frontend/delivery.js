// ==========================================================
// delivery.js — Delivery feed, new request, order details
// ==========================================================

// Set to true while backend endpoints aren't wired up yet.
// Switch to false once OrdersAPI calls actually work.
const USE_MOCK_DATA = true;

let currentUser = { name: "Nirbhay", phone: "+91 90000 00000", gender: "Male" };
let feedData = [];
let currentLocation = null;

// ---------- Mock data (remove once backend integrated) ----------
function getMockFeed() {
  return [
    {
      id: "1",
      platform: "Swiggy",
      title: "Pick up my Swiggy order from gate",
      pickupLocation: "Main Gate",
      dropLocation: "Hostel H4, Room 212",
      reward: 30,
      estimatedTime: "20 mins",
      postedTime: "5 mins ago",
      preferredGender: "",
      status: "POSTED",
      postedBy: { name: "Aman", phone: "+91 98765 43210", gender: "Male" },
    },
    {
      id: "2",
      platform: "Blinkit",
      title: "Groceries drop needed",
      pickupLocation: "Blinkit Store, Sector 128",
      dropLocation: "Hostel G2",
      reward: 25,
      estimatedTime: "15 mins",
      postedTime: "12 mins ago",
      preferredGender: "Female",
      status: "POSTED",
      postedBy: { name: "Riya", phone: "+91 91234 56780", gender: "Female" },
    },
  ];
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  loadStats();
  loadFeed();
  requestLocation();
  bindEvents();
});

function bindEvents() {
  document.getElementById("openNewRequestBtn").addEventListener("click", () => toggleModal("newRequestOverlay", true));
  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => toggleModal(btn.dataset.close, false));
  });
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) toggleModal(overlay.id, false);
    });
  });

  document.getElementById("newRequestForm").addEventListener("submit", handleNewRequestSubmit);
  document.getElementById("searchInput").addEventListener("input", renderFeed);
  document.getElementById("platformFilter").addEventListener("change", renderFeed);
  document.getElementById("sortFilter").addEventListener("change", renderFeed);
  document.getElementById("genderFilter").addEventListener("change", renderFeed);
}

function toggleModal(id, show) {
  if (show) {
    document.querySelectorAll(".modal-overlay").forEach(overlay => {
      if (overlay.id !== id) overlay.hidden = true;
    });
  }
  document.getElementById(id).hidden = !show;
}

// ---------- Stats ----------
async function loadStats() {
  try {
    const stats = USE_MOCK_DATA
      ? { requestsPosted: 4, deliveriesCompleted: 9, totalEarnings: 210, activeRequests: 1 }
      : await OrdersAPI.getStats();

    document.getElementById("statPosted").textContent = stats.requestsPosted;
    document.getElementById("statCompleted").textContent = stats.deliveriesCompleted;
    document.getElementById("statEarnings").textContent = `₹${stats.totalEarnings}`;
    document.getElementById("statActive").textContent = stats.activeRequests;
  } catch (err) {
    console.error("Stats load failed:", err);
  }
}

// ---------- Feed ----------
async function loadFeed() {
  try {
    feedData = USE_MOCK_DATA ? getMockFeed() : await OrdersAPI.getFeed();
    renderFeed();
  } catch (err) {
    showToast(err.message || "Failed to load feed");
  }
}

function renderFeed() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const platform = document.getElementById("platformFilter").value;
  const sort = document.getElementById("sortFilter").value;
  const gender = document.getElementById("genderFilter").value;

  let list = feedData.filter(o => o.status !== "COMPLETED");

  if (search) {
    list = list.filter(o =>
      o.title.toLowerCase().includes(search) ||
      o.pickupLocation.toLowerCase().includes(search) ||
      o.dropLocation.toLowerCase().includes(search)
    );
  }
  if (platform) list = list.filter(o => o.platform === platform);
  if (gender) list = list.filter(o => !o.preferredGender || o.preferredGender === gender);

  if (sort === "reward") list = [...list].sort((a, b) => b.reward - a.reward);
  // "latest" is default order from backend; "nearby" needs lat/lng from backend — left as-is for mock

  const grid = document.getElementById("feedGrid");
  const emptyState = document.getElementById("emptyState");
  grid.innerHTML = "";

  if (list.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  list.forEach(order => grid.appendChild(buildCard(order)));
  lucide.createIcons();
}

function buildCard(order) {
  const card = document.createElement("div");
  card.className = "delivery-card glass";

  const statusClass = order.status === "POSTED" ? "status-posted"
    : order.status === "ACCEPTED" ? "status-accepted" : "status-completed";

  card.innerHTML = `
    <div class="card-top">
      <span class="platform-tag">${order.platform}</span>
      <span class="status-tag ${statusClass}">${order.status}</span>
    </div>
    <div class="card-title">${escapeHtml(order.title)}</div>
    <div class="route">
      <span><i data-lucide="map-pin"></i> Pickup: <b>${escapeHtml(order.pickupLocation)}</b></span>
      <span><i data-lucide="navigation"></i> Drop: <b>${escapeHtml(order.dropLocation)}</b></span>
    </div>
    <div class="card-meta">
      <span>⏱ ${order.estimatedTime || "N/A"}</span>
      <span>${order.postedTime}</span>
    </div>
    <div class="card-meta">
      <span class="reward">₹${order.reward}</span>
      <span>${order.preferredGender ? `Prefers: ${order.preferredGender}` : "Any gender"}</span>
    </div>
    <div class="card-actions"></div>
  `;

  const actions = card.querySelector(".card-actions");

  if (order.status === "POSTED") {
    const acceptBtn = document.createElement("button");
    acceptBtn.className = "btn-primary";
    acceptBtn.textContent = "Accept";
    acceptBtn.addEventListener("click", () => handleAccept(order.id));
    actions.appendChild(acceptBtn);
  } else if (order.status === "ACCEPTED") {
    const detailsBtn = document.createElement("button");
    detailsBtn.className = "btn-secondary";
    detailsBtn.textContent = "View Details";
    detailsBtn.addEventListener("click", () => openOrderDetails(order));
    actions.appendChild(detailsBtn);

    const completeBtn = document.createElement("button");
    completeBtn.className = "btn-primary";
    completeBtn.textContent = "Complete";
    completeBtn.addEventListener("click", () => handleComplete(order.id));
    actions.appendChild(completeBtn);
  }

  return card;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Actions ----------
async function handleAccept(orderId) {
  try {
    if (!USE_MOCK_DATA) await OrdersAPI.acceptRequest(orderId);
    const order = feedData.find(o => o.id === orderId);
    if (order) order.status = "ACCEPTED";
    renderFeed();
    showToast("Request accepted!");
  } catch (err) {
    showToast(err.message || "Failed to accept request");
  }
}

async function handleComplete(orderId) {
  try {
    if (!USE_MOCK_DATA) await OrdersAPI.completeRequest(orderId);
    const order = feedData.find(o => o.id === orderId);
    if (order) order.status = "COMPLETED";
    renderFeed();
    loadStats();
    showToast("Delivery marked complete!");
  } catch (err) {
    showToast(err.message || "Failed to complete delivery");
  }
}

function openOrderDetails(order) {
  document.getElementById("orderDetailsTitle").textContent = order.title;
  const contact = order.postedBy;
  document.getElementById("orderDetailsBody").innerHTML = `
    <div class="contact-block">
      <div class="contact-row"><span>Name</span><span>${escapeHtml(contact.name)}</span></div>
      <div class="contact-row"><span>Phone</span><span>${escapeHtml(contact.phone)}</span></div>
      <div class="contact-row"><span>Gender</span><span>${escapeHtml(contact.gender)}</span></div>
    </div>
    <button class="btn-danger full-width" id="cancelOrderBtn">Cancel Delivery</button>
  `;
  lucide.createIcons();
  document.getElementById("cancelOrderBtn").addEventListener("click", async () => {
    await handleCancel(order.id);
    toggleModal("orderDetailsOverlay", false);
  });
  toggleModal("orderDetailsOverlay", true);
}

async function handleCancel(orderId) {
  try {
    if (!USE_MOCK_DATA) await OrdersAPI.cancelRequest(orderId);
    const order = feedData.find(o => o.id === orderId);
    if (order) order.status = "POSTED";
    renderFeed();
    showToast("Request cancelled");
  } catch (err) {
    showToast(err.message || "Failed to cancel request");
  }
}

// ---------- New Request ----------
async function handleNewRequestSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  const payload = {
    platform: formData.get("platform"),
    title: formData.get("title"),
    pickupLocation: formData.get("pickupLocation"),
    dropLocation: formData.get("dropLocation"),
    reward: Number(formData.get("reward")),
    estimatedTime: formData.get("estimatedTime"),
    preferredGender: formData.get("preferredGender"),
    instructions: formData.get("instructions"),
    latitude: currentLocation ? currentLocation.lat : null,
    longitude: currentLocation ? currentLocation.lng : null,
  };

  try {
    if (USE_MOCK_DATA) {
      feedData.unshift({
        id: String(Date.now()),
        ...payload,
        postedTime: "just now",
        status: "POSTED",
        postedBy: currentUser,
      });
    } else {
      await OrdersAPI.createRequest(payload);
      await loadFeed();
    }
    renderFeed();
    loadStats();
    form.reset();
    toggleModal("newRequestOverlay", false);
    showToast("Delivery request posted!");
  } catch (err) {
    showToast(err.message || "Failed to post request");
  }
}

// ---------- Geolocation ----------
function requestLocation() {
  const statusEl = document.getElementById("locationStatus");
  if (!navigator.geolocation) {
    statusEl.innerHTML = '<i data-lucide="map-pin-off"></i> Location not supported on this device';
    lucide.createIcons();
    statusEl.classList.add("error");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      currentLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      statusEl.innerHTML = '<i data-lucide="map-pin-check"></i> Location captured';
      lucide.createIcons();
      statusEl.classList.add("ok");
    },
    () => {
      statusEl.innerHTML = '<i data-lucide="map-pin-x"></i> Location permission denied � request can still be posted';
      lucide.createIcons();
      statusEl.classList.add("error");
    }
  );
}

// ---------- Toast ----------
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { toast.hidden = true; }, 2500);
}
