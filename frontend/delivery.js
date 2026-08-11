// ==========================================================
// delivery.js — Delivery feed, new request, order details
// ==========================================================

// Set to true while backend endpoints aren't wired up yet.
// Switch to false once OrdersAPI calls actually work.
const USE_MOCK_DATA = false;

let feedData = [];
let currentLocation = null;
let isLoadingFeed = false;
let currentUserId = null;
let currentDeliveryFilter = "all";


// ---------- Init ----------
document.addEventListener("DOMContentLoaded", async () => {
  if (!getToken()) {
    showToast("Please login to access Delivery.");
    setTimeout(() => { window.location.href = "index.html"; }, 900);
    return;
  }
  try {
    const profile = await ProfileAPI.getProfile();
    currentUserId = profile && (profile.id || profile._id || profile.userId) ? (profile.id || profile._id || profile.userId) : null;
    populateSidebarProfile(profile);
  } catch (e) {
    // ignore — we'll default to hiding accepted orders for anonymous viewers
    currentUserId = null;
  }

  await Promise.all([loadStats(), loadFeed()]);
  requestLocation();
  bindEvents();

  const shouldOpenNewRequest = new URLSearchParams(window.location.search).get("openNewRequest") === "true";
  if (shouldOpenNewRequest) {
    setTimeout(() => toggleModal("newRequestOverlay", true), 250);
  }
});

function bindEvents() {
  document.getElementById("openNewRequestBtn")?.addEventListener("click", () => toggleModal("newRequestOverlay", true));
  document.getElementById("profileBtn")?.addEventListener("click", openProfile);
  document.getElementById("sidebarProfile")?.addEventListener("click", openProfile);
  document.querySelectorAll("[data-delivery-filter]").forEach(btn => {
    btn.addEventListener("click", () => setDeliveryFilter(btn.dataset.deliveryFilter));
  });
  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => toggleModal(btn.dataset.close, false));
  });
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) toggleModal(overlay.id, false);
    });
  });

  document.getElementById("newRequestForm")?.addEventListener("submit", handleNewRequestSubmit);
  document.getElementById("searchInput")?.addEventListener("input", renderFeed);
  document.getElementById("platformFilter")?.addEventListener("change", renderFeed);
  document.getElementById("sortFilter")?.addEventListener("change", loadFeed);
  document.getElementById("genderFilter")?.addEventListener("change", renderFeed);
}

function populateSidebarProfile(user) {
  const name = user.username || user.name || user.email || "Student";
  const sidebarName = document.getElementById("sidebarName");
  const sidebarAvatar = document.getElementById("sidebarAvatar");
  if (sidebarName) sidebarName.textContent = name;
  if (sidebarAvatar) sidebarAvatar.textContent = name.trim().charAt(0).toUpperCase() || "?";
}

function setDeliveryFilter(filter) {
  currentDeliveryFilter = filter || "all";
  document.querySelectorAll("[data-delivery-filter]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.deliveryFilter === currentDeliveryFilter);
  });

  const sortFilter = document.getElementById("sortFilter");
  if (sortFilter) sortFilter.value = currentDeliveryFilter === "nearby" ? "nearby" : "latest";
  loadFeed();
}

function toggleModal(id, show) {
  if (show) {
    document.querySelectorAll(".modal-overlay").forEach(overlay => {
      if (overlay.id !== id) overlay.hidden = true;
    });
  }
  const modal = document.getElementById(id);
  if (modal) modal.hidden = !show;
}

function setButtonLoading(button, isLoading, label = "Working...") {
  if (!button) return;
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = label;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

function handleApiError(err, fallback) {
  const message = err?.message || fallback;
  showToast(message);
  if (/401|not logged in|unauthorized|forbidden/i.test(message)) {
    localStorage.removeItem("hive_token");
    setTimeout(() => { window.location.href = "index.html"; }, 900);
  }
}

async function handleLogout() {
  try {
    await fetch(`${CONFIG.BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  } catch (_) {
    // The backend logout endpoint is stateless; local token removal is the important part.
  } finally {
    localStorage.removeItem("hive_token");
    showToast("Logged out");
    setTimeout(() => { window.location.href = "index.html"; }, 500);
  }
}

// ---------- Stats ----------
async function loadStats() {
  try {
    const stats = await OrdersAPI.getStats();
    document.getElementById("statPosted").textContent = stats.requestsPosted;
    document.getElementById("statCompleted").textContent = stats.deliveriesCompleted;
    document.getElementById("statEarnings").textContent = `Rs ${stats.totalEarnings}`;
    document.getElementById("statActive").textContent = stats.activeRequests;
  } catch (err) {
    console.error("Stats load failed:", err);
    handleApiError(err, "Failed to load dashboard stats");
  }
}

async function loadFeed() {
  const grid = document.getElementById("feedGrid");
  const emptyState = document.getElementById("emptyState");
  try {
    isLoadingFeed = true;
    if (grid) grid.innerHTML = "";
    if (emptyState) {
      emptyState.hidden = false;
      emptyState.textContent = "Loading delivery requests...";
    }
    feedData = document.getElementById("sortFilter")?.value === "nearby" ? await OrdersAPI.getNearby() : await OrdersAPI.getFeed();
    renderFeed();
  } catch (err) {
    if (emptyState) {
      emptyState.hidden = false;
      emptyState.textContent = "Unable to load delivery requests right now.";
    }
    handleApiError(err, "Failed to load feed");
  } finally {
    isLoadingFeed = false;
  }
}

function renderFeed() {
  const search = (document.getElementById("searchInput")?.value || "").toLowerCase();
  const platform = document.getElementById("platformFilter")?.value || "";
  const sort = document.getElementById("sortFilter")?.value || "latest";
  const gender = document.getElementById("genderFilter")?.value || "";

  let list = feedData.filter(o => o.status !== "DELIVERED");

  // Hide orders that are already accepted from other users.
  // Show ACCEPTED orders only if current user is the poster or the accepter.
  if (currentUserId) {
    list = list.filter(o => {
      if (o.status !== "ACCEPTED") return true;
      const postedId = o.postedById || (o.postedBy && o.postedBy.id) || null;
      const acceptedId = o.acceptedById || (o.acceptedBy && o.acceptedBy.id) || null;
      return String(postedId) === String(currentUserId) || String(acceptedId) === String(currentUserId);
    });
  } else {
    // If we don't know current user, be conservative and hide accepted orders
    list = list.filter(o => o.status !== "ACCEPTED");
  }

  if (search) {
    list = list.filter(o =>
      String(o.title || "").toLowerCase().includes(search) ||
      String(o.pickupLocation || "").toLowerCase().includes(search) ||
      String(o.dropLocation || "").toLowerCase().includes(search)
    );
  }
  if (platform) list = list.filter(o => o.platform === platform);
  if (gender) list = list.filter(o => !o.preferredGender || o.preferredGender === "Any" || o.preferredGender === gender);
  if (currentDeliveryFilter === "active") {
    list = list.filter(o => o.status === "ACCEPTED" && isUserRelatedOrder(o));
  } else if (currentDeliveryFilter === "mine") {
    list = list.filter(o => isUserPostedOrder(o));
  }

  if (sort === "reward") list = [...list].sort((a, b) => Number(b.reward || 0) - Number(a.reward || 0));

  const grid = document.getElementById("feedGrid");
  const emptyState = document.getElementById("emptyState");
  if (!grid || !emptyState) return;
  grid.innerHTML = "";

  if (list.length === 0) {
    emptyState.hidden = false;
    emptyState.textContent = isLoadingFeed ? "Loading delivery requests..." : "No delivery requests right now. Be the first to post one!";
    return;
  }
  emptyState.hidden = true;

  list.forEach(order => grid.appendChild(buildCard(order)));
  if (window.lucide) lucide.createIcons();
}

function isUserPostedOrder(order) {
  if (!currentUserId) return false;
  const postedId = order.postedById || (order.postedBy && (order.postedBy.id || order.postedBy._id || order.postedBy.userId)) || null;
  return String(postedId) === String(currentUserId);
}

function isUserAcceptedOrder(order) {
  if (!currentUserId) return false;
  const acceptedId = order.acceptedById || (order.acceptedBy && (order.acceptedBy.id || order.acceptedBy._id || order.acceptedBy.userId)) || null;
  return String(acceptedId) === String(currentUserId);
}

function isUserRelatedOrder(order) {
  return isUserPostedOrder(order) || isUserAcceptedOrder(order);
}

function buildCard(order) {
  const card = document.createElement("div");
  card.className = "delivery-card glass";

  const statusClass = order.status === "POSTED" ? "status-posted"
    : order.status === "ACCEPTED" ? "status-accepted" : "status-completed";

  card.innerHTML = `
    <div class="card-top">
      <span class="platform-tag">${escapeHtml(order.platform || "Campus")}</span>
      <span class="status-tag ${statusClass}">${escapeHtml(order.status || "POSTED")}</span>
    </div>
    <div class="card-title">${escapeHtml(order.title)}</div>
    <div class="route">
      <span><i data-lucide="map-pin"></i> Pickup: <b>${escapeHtml(order.pickupLocation)}</b></span>
      <span><i data-lucide="navigation"></i> Drop: <b>${escapeHtml(order.dropLocation)}</b></span>
    </div>
    <div class="card-meta">
      <span>⏱ ${escapeHtml(order.estimatedTime || "N/A")}</span>
      <span>${escapeHtml(order.postedTime)}</span>
    </div>
    <div class="card-meta">
      <span class="reward">₹${escapeHtml(String(order.reward || 0))}</span>
      <span>${order.preferredGender && order.preferredGender !== "Any" ? `Prefers: ${escapeHtml(order.preferredGender)}` : "Any gender"}</span>
    </div>
    <div class="card-actions"></div>
  `;

  const actions = card.querySelector(".card-actions");

  if (order.status === "POSTED") {
    const acceptBtn = document.createElement("button");
    acceptBtn.className = "btn-primary";
    acceptBtn.textContent = "Accept";
    acceptBtn.addEventListener("click", () => handleAccept(order.id, acceptBtn));
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
    completeBtn.addEventListener("click", () => handleComplete(order.id, completeBtn));
    actions.appendChild(completeBtn);
  }

  return card;
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value == null ? "" : String(value);
  return div.innerHTML;
}

function replaceOrder(updatedOrder) {
  const index = feedData.findIndex(o => o.id === updatedOrder.id);
  if (index >= 0) feedData[index] = updatedOrder;
  else feedData.unshift(updatedOrder);
}

// ---------- Actions ----------
async function handleAccept(orderId, button) {
  try {
    setButtonLoading(button, true, "Accepting...");
    const updatedOrder = await OrdersAPI.acceptRequest(orderId);
    replaceOrder(updatedOrder);
    await Promise.all([loadFeed(), loadStats()]);
    openOrderDetails(updatedOrder);
    showToast("Request accepted!");
  } catch (err) {
    handleApiError(err, "Failed to accept request");
  } finally {
    setButtonLoading(button, false);
  }
}

async function handleComplete(orderId, button) {
  try {
    setButtonLoading(button, true, "Completing...");
    await OrdersAPI.completeRequest(orderId);
    await Promise.all([loadFeed(), loadStats()]);
    showToast("Delivery marked complete!");
  } catch (err) {
    handleApiError(err, "Failed to complete delivery");
  } finally {
    setButtonLoading(button, false);
  }
}

function openOrderDetails(order) {
  document.getElementById("orderDetailsTitle").textContent = order.title || "Order Details";
  const poster = order.postedBy || {};
  const accepter = order.acceptedBy || {};
  document.getElementById("orderDetailsBody").innerHTML = `
    <div class="contact-block">
      <h4>Posted By</h4>
      <div class="contact-row"><span>Name</span><span>${escapeHtml(poster.name)}</span></div>
      <div class="contact-row"><span>Phone</span><span>${escapeHtml(poster.phone)}</span></div>
      <div class="contact-row"><span>Gender</span><span>${escapeHtml(poster.gender)}</span></div>
    </div>
    <div class="contact-block">
      <h4>Accepted By</h4>
      <div class="contact-row"><span>Name</span><span>${escapeHtml(accepter.name)}</span></div>
      <div class="contact-row"><span>Phone</span><span>${escapeHtml(accepter.phone)}</span></div>
      <div class="contact-row"><span>Gender</span><span>${escapeHtml(accepter.gender)}</span></div>
    </div>
    ${order.instructions ? `<div class="contact-block"><h4>Instructions</h4><p>${escapeHtml(order.instructions)}</p></div>` : ""}
    <button class="btn-danger full-width" id="cancelOrderBtn">Cancel Delivery</button>
  `;
  if (window.lucide) lucide.createIcons();
  document.getElementById("cancelOrderBtn").addEventListener("click", async (event) => {
    await handleCancel(order.id, event.currentTarget);
    toggleModal("orderDetailsOverlay", false);
  });
  toggleModal("orderDetailsOverlay", true);
}

async function openProfile() {
  try {
    const [user, stats] = await Promise.all([ProfileAPI.getProfile(), OrdersAPI.getStats()]);
    document.getElementById("profileBody").innerHTML = `
      <div class="contact-block">
        <div class="contact-row"><span>Name</span><span>${escapeHtml(user.username || "")}</span></div>
        <div class="contact-row"><span>Email</span><span>${escapeHtml(user.email || "")}</span></div>
        <div class="contact-row"><span>Phone</span><span>${escapeHtml(user.phone || "")}</span></div>
        <div class="contact-row"><span>Gender</span><span>${escapeHtml(user.gender || "")}</span></div>
      </div>
      <div class="stats-grid">
        <div class="stat-card glass"><span class="stat-label">Requests Posted</span><span class="stat-value">${stats.requestsPosted}</span></div>
        <div class="stat-card glass"><span class="stat-label">Deliveries Completed</span><span class="stat-value">${stats.deliveriesCompleted}</span></div>
        <div class="stat-card glass"><span class="stat-label">Total Earnings</span><span class="stat-value">${stats.totalEarnings}</span></div>
      </div>
      <button class="btn-danger full-width" id="logoutBtn">Logout</button>
    `;
    if (window.lucide) lucide.createIcons();
    document.getElementById("logoutBtn").addEventListener("click", handleLogout);
    toggleModal("profileOverlay", true);
  } catch (err) {
    handleApiError(err, "Failed to load profile");
  }
}

async function handleCancel(orderId, button) {
  try {
    setButtonLoading(button, true, "Cancelling...");
    await OrdersAPI.cancelRequest(orderId);
    await Promise.all([loadFeed(), loadStats()]);
    showToast("Request cancelled");
  } catch (err) {
    handleApiError(err, "Failed to cancel request");
  } finally {
    setButtonLoading(button, false);
  }
}

// ---------- New Request ----------
async function handleNewRequestSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submit = form.querySelector("button[type='submit']");
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
    setButtonLoading(submit, true, "Posting...");
    await OrdersAPI.createRequest(payload);
    await Promise.all([loadFeed(), loadStats()]);

    form.reset();

    toggleModal("newRequestOverlay", false);

    showToast("Delivery request posted!");
  } catch (err) {
    handleApiError(err, "Failed to post request");
  } finally {
    setButtonLoading(submit, false);
  }
}

// ---------- Geolocation ----------
function requestLocation() {
  const statusEl = document.getElementById("locationStatus");
  if (!statusEl) return;
  if (!navigator.geolocation) {
    statusEl.innerHTML = '<i data-lucide="map-pin-off"></i> Location not supported on this device';
    if (window.lucide) lucide.createIcons();
    statusEl.classList.add("error");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      currentLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      LocationAPI.updateLocation(currentLocation.lat, currentLocation.lng).catch(() => {});
      statusEl.innerHTML = '<i data-lucide="map-pin-check"></i> Location captured';
      if (window.lucide) lucide.createIcons();
      statusEl.classList.add("ok");
    },
    () => {
      statusEl.innerHTML = '<i data-lucide="map-pin-x"></i> Location permission denied - request can still be posted';
      if (window.lucide) lucide.createIcons();
      statusEl.classList.add("error");
    }
  );
}

// ---------- Toast ----------
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { toast.hidden = true; }, 3000);
}
