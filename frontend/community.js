let currentUserEmail = "";
let currentFilter = "all";
let loadedPosts = [];
let activePostId = null;

document.addEventListener("DOMContentLoaded", async () => {
  if (!getToken()) {
    showToast("Please login to access Community.");
    setTimeout(() => { window.location.href = "index.html"; }, 900);
    return;
  }

  bindEvents();
  try {
    const user = await ProfileAPI.getProfile();
    currentUserEmail = user.email || "";
    populateSidebarProfile(user);
  } catch (err) {
    handleApiError(err, "Failed to load profile");
    return;
  }
  renderFeed("all");
});

function bindEvents() {
  document.getElementById("openCreatePostBtn")?.addEventListener("click", () => toggleModal("createPostOverlay", true));
  document.getElementById("profileBtn")?.addEventListener("click", () => window.location.href = "delivery.html");
  document.getElementById("sidebarProfile")?.addEventListener("click", () => window.location.href = "delivery.html");
  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => toggleModal(btn.dataset.close, false));
  });
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) toggleModal(overlay.id, false);
    });
  });
  document.querySelectorAll("[data-filter]").forEach(btn => {
    btn.addEventListener("click", () => renderFeed(btn.dataset.filter));
  });
  document.getElementById("createPostForm")?.addEventListener("submit", handleCreatePost);
  document.getElementById("postSearchInput")?.addEventListener("input", renderLoadedPosts);
  document.getElementById("postContentInput")?.addEventListener("input", updateCharCounter);
  document.getElementById("postCommentBtn")?.addEventListener("click", handleCommentSubmit);
}

function populateSidebarProfile(user) {
  const name = user.username || user.name || user.email || "Student";
  const sidebarName = document.getElementById("sidebarName");
  const sidebarAvatar = document.getElementById("sidebarAvatar");
  if (sidebarName) sidebarName.textContent = name;
  if (sidebarAvatar) sidebarAvatar.textContent = name.trim().charAt(0).toUpperCase() || "?";
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

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value == null ? "" : String(value);
  return div.innerHTML;
}

async function renderFeed(filter) {
  const unsupportedFilters = ["latest", "trending", "saved"];
  const effectiveFilter = unsupportedFilters.includes(filter) ? "all" : filter;
  if (unsupportedFilters.includes(filter)) showToast("Coming soon");

  currentFilter = effectiveFilter;
  document.querySelectorAll("[data-filter]").forEach(btn => btn.classList.toggle("active", btn.dataset.filter === effectiveFilter));
  try {
    if (effectiveFilter === "me" || effectiveFilter === "my") loadedPosts = await PostsAPI.getMyPosts();
    else if (effectiveFilter === "all") loadedPosts = await PostsAPI.getAll();
    else loadedPosts = await PostsAPI.getByType(effectiveFilter);
    renderLoadedPosts();
  } catch (err) {
    handleApiError(err, "Failed to load posts");
  }
}

function renderLoadedPosts() {
  const query = (document.getElementById("postSearchInput")?.value || "").toLowerCase();
  const posts = loadedPosts.filter(post => String(post.content || "").toLowerCase().includes(query));
  const feed = document.getElementById("postsFeed");
  const empty = document.getElementById("postsEmptyState");
  feed.innerHTML = "";
  if (!posts.length) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  posts.forEach(post => feed.appendChild(buildPostCard(post)));
  if (window.lucide) lucide.createIcons();
}

function buildPostCard(post) {
  const card = document.createElement("article");
  card.className = "delivery-card glass post-card";
  card.dataset.postId = post.id;
  const liked = (post.likedBy || []).includes(currentUserEmail);
  const name = post.anonymous && currentFilter !== "my" ? "Anonymous Student" : (post.postedByName || "Student");
  card.innerHTML = `
    <div class="card-top">
      <span class="platform-tag">${typeLabel(post.type)}</span>
      <span class="card-meta">${formatTime(post.createdAt)}</span>
    </div>
    <div class="post-author">${escapeHtml(name)}</div>
    <p class="post-content">${escapeHtml(post.content || "")}</p>
    <div class="post-stats">
      <button class="post-action ${liked ? "active" : ""}" data-like="${escapeHtml(post.id)}"><i data-lucide="heart"></i><span data-like-count>${(post.likedBy || []).length}</span></button>
      <button class="post-action" data-comments="${escapeHtml(post.id)}"><i data-lucide="message-circle"></i><span data-comment-count>${(post.comments || []).length}</span></button>
      <span class="post-action"><i data-lucide="eye"></i>${post.views || 0}</span>
      ${post.postedByEmail === currentUserEmail ? `<button class="post-action danger" data-delete="${escapeHtml(post.id)}"><i data-lucide="trash-2"></i></button>` : ""}
    </div>
  `;
  card.querySelector("[data-like]")?.addEventListener("click", (event) => handleLike(post.id, event.currentTarget));
  card.querySelector("[data-comments]")?.addEventListener("click", () => openComments(post));
  card.querySelector("[data-delete]")?.addEventListener("click", () => handleDelete(post.id));
  return card;
}

function typeLabel(type) {
  return { campusTea: "Campus Tea", seniorGuidance: "Senior Guidance", randomQuestion: "Random Question" }[type] || type || "Post";
}

function formatTime(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "recently";
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

async function handleCreatePost(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = form.querySelector("button[type='submit']");
  const formData = new FormData(form);
  const content = String(formData.get("content") || "").trim();
  if (!content) {
    showToast("Post content is required");
    return;
  }
  try {
    setButtonLoading(submit, true, "Publishing...");
    await PostsAPI.create({ type: formData.get("type"), content, anonymous: formData.has("anonymous") });
    form.reset();
    updateCharCounter();
    toggleModal("createPostOverlay", false);
    showToast("Post published successfully!");
    renderFeed(currentFilter);
  } catch (err) {
    handleApiError(err, "Failed to publish post");
  } finally {
    setButtonLoading(submit, false);
  }
}

async function handleLike(id, button) {
  try {
    const updated = await PostsAPI.toggleLike(id);
    replacePost(updated);
    const liked = (updated.likedBy || []).includes(currentUserEmail);
    button.classList.toggle("active", liked);
    button.querySelector("[data-like-count]").textContent = (updated.likedBy || []).length;
  } catch (err) {
    handleApiError(err, "Failed to update like");
  }
}

function openComments(post) {
  activePostId = post.id;
  PostsAPI.view(post.id).catch(() => {});
  renderComments(post.comments || []);
  toggleModal("commentsOverlay", true);
}

function renderComments(comments) {
  const list = document.getElementById("commentsList");
  list.innerHTML = comments.length ? comments.map(comment => `
    <div class="comment-item">
      <strong>${escapeHtml(comment.username || "Student")}</strong>
      <p>${escapeHtml(comment.comment || "")}</p>
      <small>${formatTime(comment.commentedAt)}</small>
    </div>
  `).join("") : `<p class="empty-state">No comments yet.</p>`;
}

async function handleCommentSubmit(event) {
  const button = event.currentTarget;
  const input = document.getElementById("commentInput");
  const text = input.value.trim();
  if (!activePostId || !text) return showToast("Comment is required");
  try {
    setButtonLoading(button, true, "Posting...");
    const updated = await PostsAPI.addComment(activePostId, text);
    replacePost(updated);
    renderComments(updated.comments || []);
    updateCommentCount(updated);
    input.value = "";
  } catch (err) {
    handleApiError(err, "Failed to post comment");
  } finally {
    setButtonLoading(button, false);
  }
}

async function handleDelete(id) {
  if (!confirm("Delete this post?")) return;
  try {
    await PostsAPI.delete(id);
    loadedPosts = loadedPosts.filter(post => post.id !== id);
    renderLoadedPosts();
    showToast("Post deleted");
  } catch (err) {
    handleApiError(err, "Failed to delete post");
  }
}

function replacePost(updated) {
  const index = loadedPosts.findIndex(post => post.id === updated.id);
  if (index >= 0) loadedPosts[index] = updated;
}

function updateCommentCount(post) {
  const card = document.querySelector(`[data-post-id="${CSS.escape(post.id)}"]`);
  card?.querySelector("[data-comment-count]")?.replaceChildren(String((post.comments || []).length));
}

function updateCharCounter() {
  const input = document.getElementById("postContentInput");
  const counter = document.getElementById("postCharCounter");
  if (counter) counter.textContent = `${(input?.value || "").length}/1000`;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { toast.hidden = true; }, 3000);
}
