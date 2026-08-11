// ==========================================================
// api.js — central place for backend config + API calls
// Nirbhay: yahan sirf BASE_URL change karna hai jab backend
// deploy ho ya localhost pe test karna ho.
// ==========================================================

const API_BASE_ROOT = window.HIVE_API_BASE_URL || window.__HIVE_API_BASE_URL__ || "http://localhost:8080";
const CONFIG = {
  BASE_URL: API_BASE_ROOT.replace(/\/api\/?$/, "") + "/api",
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

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }

  if (!res.ok) {
    const message = (data && (data.message || data.error)) || (typeof data === "string" && data) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

function normalizeOrder(order) {
  const created = order.createdAt ? new Date(order.createdAt) : null;
  return {
    id: order.id,
    platform: order.platform || "Campus",
    title: order.title || "Delivery request",
    pickupLocation: order.location || "Not provided",
    dropLocation: order.dropLocation || "Not provided",
    reward: order.reward || 0,
    estimatedTime: order.estimatedTime || "N/A",
    instructions: order.instructions || "",
    postedTime: created && !Number.isNaN(created.getTime()) ? created.toLocaleString() : "recently",
    preferredGender: order.preferredGender || "",
    status: order.status === "DELIVERED" ? "COMPLETED" : (order.status || "POSTED"),
    postedBy: {
      id: order.postedBy || null,
      name: order.postedByName || order.postedBy || "Not shared",
      phone: order.postedByPhone || "Not shared",
      gender: order.postedByGender || "Not shared",
    },
    acceptedBy: {
      id: order.acceptedBy || null,
      name: order.acceptedByName || order.acceptedBy || "Not accepted yet",
      phone: order.acceptedByPhone || "Not shared",
      gender: order.acceptedByGender || "Not shared",
    },
    postedById: order.postedBy || null,
    acceptedById: order.acceptedBy || null,
  };
}

function normalizeStats(stats = {}) {
  return {
    requestsPosted: stats.totalRequests ?? stats.requestsPosted ?? 0,
    deliveriesCompleted: stats.delivered ?? stats.deliveriesCompleted ?? 0,
    totalEarnings: stats.earnings ?? stats.totalEarnings ?? 0,
    activeRequests: stats.active ?? stats.activeRequests ?? 0,
  };
}

function toBackendOrder(payload) {
  return {
    title: String(payload.title || "").trim(),
    location: String(payload.pickupLocation || "").trim(),
    dropLocation: payload.dropLocation,
    reward: Number(payload.reward) || 0,
    estimatedTime: payload.estimatedTime || "",
    status: "POSTED",
    lat: payload.latitude || 0,
    lng: payload.longitude || 0,
    preferredGender: payload.preferredGender || "Any",
    platform: payload.platform || "Other",
    instructions: payload.instructions || "",
  };
}

// ---------- Orders / Delivery API ----------

const OrdersAPI = {
  async getFeed(params = {}) {
    const query = new URLSearchParams(params).toString();
    const orders = await apiRequest(`/orders${query ? `?${query}` : ""}`);
    return (orders || []).map(normalizeOrder);
  },

  async getNearby() {
    const orders = await apiRequest(`/orders/nearby`);
    return (orders || []).map(normalizeOrder);
  },

  async getStats() {
    const stats = await apiRequest(`/orders/stats`);
    return normalizeStats(stats);
  },

  async createRequest(payload) {
    const created = await apiRequest(`/orders`, { method: "POST", body: toBackendOrder(payload) });
    return normalizeOrder(created);
  },

  async acceptRequest(orderId) {
    const updated = await apiRequest(`/orders/${orderId}/accept`, { method: "PUT" });
    return normalizeOrder(updated);
  },

  async cancelRequest(orderId) {
    const updated = await apiRequest(`/orders/${orderId}/cancel`, { method: "PUT" });
    return normalizeOrder(updated);
  },

  async completeRequest(orderId) {
    const updated = await apiRequest(`/orders/${orderId}/complete`, { method: "PUT" });
    return normalizeOrder(updated);
  },

  async getOrderDetails(id) {
    const orders = await apiRequest(`/orders`);
    return (orders || []).find(order => String(order.id) === String(id)) || null;
  },
};

const ProfileAPI = {
  getProfile() {
    return apiRequest(`/auth/me`);
  },
};

const LocationAPI = {
  updateLocation(lat, lng) {
    return apiRequest(`/auth/location`, { method: "PUT", body: { lat, lng } });
  },
};

const PostsAPI = {
  getAll() { return apiRequest("/posts"); },
  getMyPosts() { return apiRequest("/posts/me"); },
  getByType(type) { return apiRequest(`/posts/type/${type}`); },
  create(post) { return apiRequest("/posts", { method: "POST", body: post }); },
  toggleLike(id) { return apiRequest(`/posts/${id}/like`, { method: "PUT" }); },
  addComment(id, comment) { return apiRequest(`/posts/${id}/comment`, { method: "POST", body: { comment } }); },
  delete(id) { return apiRequest(`/posts/${id}`, { method: "DELETE" }); },
  view(id) { return apiRequest(`/posts/${id}/view`, { method: "PUT" }); },
};
