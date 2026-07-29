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

    return {

        id: order.id,

        platform: "Helpify",

        title: order.title,

        pickupLocation: order.location,

        dropLocation: "Student Hostel",

        reward: order.reward,

        estimatedTime: "15-20 mins",

        postedTime: new Date(order.createdAt).toLocaleString(),

        preferredGender: order.preferredGender,

        status: order.status,

        postedBy: {

            name: order.postedByName,

            phone: order.postedByPhone,

            gender: order.postedByGender

        }

    };

}

function toBackendOrder(payload) {

    return {

        title: payload.title,

        location: payload.pickupLocation,

        reward: payload.reward,

        preferredGender: payload.preferredGender,

        status: "POSTED",

        lat: payload.latitude || 0,

        lng: payload.longitude || 0

    };

}
// ---------- Orders / Delivery API ----------

const OrdersAPI = {

    // Load all orders
    async getFeed() {

        const orders = await apiRequest("/orders");

        return orders.map(normalizeOrder);
    },

    // Dashboard stats
    getStats() {
        return apiRequest("/orders/stats");
    },

    // Create order
    createRequest(payload) {

        return apiRequest("/orders", {
            method: "POST",
            body: toBackendOrder(payload)
        });

    },

    // Accept
    acceptRequest(id) {
        return apiRequest(`/orders/${id}/accept`, {
            method: "PUT"
        });
    },

    // Cancel
    cancelRequest(id) {
        return apiRequest(`/orders/${id}/cancel`, {
            method: "PUT"
        });
    },

    // Complete
    completeRequest(id) {
        return apiRequest(`/orders/${id}/complete`, {
            method: "PUT"
        });
    },

    // Until backend endpoint exists
    getOrderDetails(id) {

        return apiRequest("/orders");

    }

};

const ProfileAPI = {
  getProfile() {
    return apiRequest(`/user/profile`);
  },
};
