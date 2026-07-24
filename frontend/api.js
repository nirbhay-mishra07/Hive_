// ==========================================================
// api.js — central place for backend config + API calls
// Nirbhay: yahan sirf BASE_URL change karna hai jab backend
// deploy ho ya localhost pe test karna ho.
// ==========================================================

const CONFIG = {
  // TODO: apne backend ka actual base URL yahan daal do
  BASE_URL: window.HIVE_API_BASE_URL || "http://localhost:8080/api",
};

function getToken() {
  return localStorage.getItem("hive_token");
}

async function apiRequest(endpoint, { method = "GET", body = null, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${CONFIG.BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try { data = await res.json(); } catch (_) { /* empty response */ }

  if (!res.ok) {
    const message = (data && (data.message || data.error)) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

function normalizeOrder(order) {
  const created = order.createdAt ? new Date(order.createdAt) : null;
  return {
    id: order.id,
    platform: "Campus",
    title: order.title || "Delivery request",
    pickupLocation: order.location || "Campus gate",
    dropLocation: order.dropLocation || "Campus",
    reward: order.reward || 0,
    estimatedTime: order.estimatedTime || "N/A",
    postedTime: created && !Number.isNaN(created.getTime()) ? created.toLocaleString() : "recently",
    preferredGender: order.preferredGender || "",
    status: order.status === "DELIVERED" ? "COMPLETED" : (order.status || "POSTED"),
    postedBy: {
      name: order.postedByName || order.postedBy || "Student",
      phone: order.postedByPhone || "Not shared",
      gender: order.postedByGender || "Not shared",
    },
  };
}

function toBackendOrder(payload) {
  return {
    title: payload.title,
    location: payload.pickupLocation,
    reward: payload.reward,
    status: "POSTED",
    lat: payload.latitude || 0,
    lng: payload.longitude || 0,
    preferredGender: payload.preferredGender || "Any",
  };
}
// ---------- Orders / Delivery API ----------

const OrdersAPI = {
  // GET nearby / feed requests
  getFeed(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/orders/feed${query ? `?${query}` : ""}`);
  },

  // GET dashboard stats
  getStats() {
    return apiRequest(`/orders/stats`);
  },

  // POST create new delivery request
  createRequest(payload) {
    return apiRequest(`/orders/create`, { method: "POST", body: payload });
  },

  // POST accept a request
  acceptRequest(orderId) {
    return apiRequest(`/orders/${orderId}/accept`, { method: "PUT" });
  },

  // POST cancel an accepted request
  cancelRequest(orderId) {
    return apiRequest(`/orders/${orderId}/cancel`, { method: "PUT" });
  },

  // POST mark delivery complete
  completeRequest(orderId) {
    return apiRequest(`/orders/${orderId}/complete`, { method: "PUT" });
  },

  // GET order details (contact info shown only after acceptance)
  getOrderDetails(orderId) {
    return apiRequest(`/orders/${orderId}`);
  },
};

const ProfileAPI = {
  getProfile() {
    return apiRequest(`/user/profile`);
  },
};
