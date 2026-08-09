let hiveLenis;
const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

function createIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function initLoader() {
  const loader = qs("#loader");
  if (!loader) return;

  if (!window.gsap) {
    setTimeout(() => loader.remove(), 800);
    return;
  }

  gsap.timeline({ defaults: { ease: "power3.out" } })
    .from(".loader-logo", { opacity: 0, scale: .78, y: 16, duration: .55 })
    .from(".loader-glow", { opacity: 0, scale: .65, duration: .6 }, "<")
    .from(".loader-ring", { opacity: 0, scale: .7, rotate: -18, duration: .7 }, "<")
    .to(".loader-ring", { rotate: 16, scale: 1.05, duration: 1.2, ease: "sine.inOut" }, "-=.2")
    .to(".loader-line span", { width: "100%", duration: 1.25, ease: "power2.inOut" }, "-=1.05")
    .to(loader, { opacity: 0, scale: 1.015, duration: .62, delay: .2, onComplete: () => loader.remove() });
}

function initNavigation() {
  const header = qs("#siteHeader");
  const menuToggle = qs(".menu-toggle");
  const navPanel = qs("#navPanel");

  const updateHeader = () => header?.classList.toggle("scrolled", window.scrollY > 12);
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  menuToggle?.addEventListener("click", () => {
    const isOpen = navPanel.classList.toggle("open");
    document.body.classList.toggle("menu-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.innerHTML = isOpen ? '<i data-lucide="x"></i>' : '<i data-lucide="menu"></i>';
    createIcons();
  });

  qsa("a", navPanel).forEach((link) => {
    link.addEventListener("click", () => {
      navPanel.classList.remove("open");
      document.body.classList.remove("menu-open");
    hiveLenis?.start();
      menuToggle?.setAttribute("aria-expanded", "false");
      if (menuToggle) menuToggle.innerHTML = '<i data-lucide="menu"></i>';
      createIcons();
    });
  });
}

function initSmoothScroll() {
  if (!window.Lenis) return;
  const lenis = new Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: .9 });
  hiveLenis = lenis;
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

function initRipples() {
  qsa(".ripple").forEach((button) => {
    button.addEventListener("click", (event) => {
      const rect = button.getBoundingClientRect();
      const dot = document.createElement("span");
      dot.className = "ripple-dot";
      dot.style.left = `${event.clientX - rect.left}px`;
      dot.style.top = `${event.clientY - rect.top}px`;
      button.appendChild(dot);
      dot.addEventListener("animationend", () => dot.remove());
    });
  });
}


function initFeatureShowcase() {
  const viewport = qs("[data-feature-showcase]");
  if (!viewport || !window.gsap) return;

  const track = qs(".showcase-track", viewport);
  const cards = qsa(".showcase-card", viewport);
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!track || !cards.length || !canHover) return;

  const clamp = gsap.utils.clamp;
  let maxShift = 0;

  const measure = () => {
    maxShift = Math.max(0, track.scrollWidth - viewport.clientWidth + 40);
  };

  const resetCards = () => {
    cards.forEach((card) => {
      card.classList.remove("is-near");
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        z: 0,
        boxShadow: "0 18px 54px rgba(0,0,0,.18)",
        duration: .75,
        ease: "elastic.out(1, .72)",
        overwrite: true
      });
    });
  };

  measure();
  window.addEventListener("resize", measure, { passive: true });

  viewport.addEventListener("mouseenter", () => {
    measure();
    viewport.classList.add("is-active");
  });

  viewport.addEventListener("mousemove", (event) => {
    const bounds = viewport.getBoundingClientRect();
    const progress = clamp(0, 1, (event.clientX - bounds.left) / bounds.width);
    const targetX = -maxShift * progress;

    gsap.to(track, {
      x: targetX,
      duration: .85,
      ease: "power3.out",
      overwrite: true
    });

    cards.forEach((card) => {
      const cardBounds = card.getBoundingClientRect();
      const centerX = cardBounds.left + cardBounds.width / 2;
      const centerY = cardBounds.top + cardBounds.height / 2;
      const distance = Math.abs(event.clientX - centerX);
      const influence = clamp(0, 1, 1 - distance / 360);
      const localX = clamp(0, 1, (event.clientX - cardBounds.left) / cardBounds.width);
      const localY = clamp(0, 1, (event.clientY - cardBounds.top) / cardBounds.height);
      const rotateY = (localX - .5) * 10 * influence;
      const rotateX = (.5 - localY) * 8 * influence;
      const scale = .965 + influence * .075;

      card.style.setProperty("--glow-x", `${localX * 100}%`);
      card.style.setProperty("--glow-y", `${localY * 100}%`);
      card.classList.toggle("is-near", influence > .45);

      gsap.to(card, {
        rotateX,
        rotateY,
        scale,
        z: influence * 26,
        boxShadow: influence > .45 ? "0 30px 92px rgba(244,180,0,.20), 0 24px 80px rgba(0,0,0,.32)" : "0 16px 46px rgba(0,0,0,.18)",
        duration: .55,
        ease: "power3.out",
        overwrite: true
      });
    });
  });

  viewport.addEventListener("mouseleave", () => {
    viewport.classList.remove("is-active");
    gsap.to(track, { x: 0, duration: .9, ease: "elastic.out(1, .78)", overwrite: true });
    resetCards();
  });
}
function initAnimations() {
  if (!window.gsap) return;
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  gsap.from(".site-header", { y: -28, opacity: 0, duration: .7, ease: "power3.out", delay: 2.1 });
  gsap.from(".hero-copy > *", { y: 28, opacity: 0, duration: .95, stagger: .09, ease: "power3.out", delay: 1.55 });
  gsap.to(".brand-logo, .loader-logo", { y: -2, rotate: .6, duration: 2.4, repeat: -1, yoyo: true, ease: "sine.inOut" });
  gsap.to(".student-illustration", { y: -14, duration: 3.4, repeat: -1, yoyo: true, ease: "sine.inOut" });
  gsap.to(".floating-card, .mini-card", { y: -18, rotate: (i) => [-1.4, 1.2, -.8, .8, -1][i] || 0, duration: 3.8, repeat: -1, yoyo: true, stagger: .28, ease: "sine.inOut" });
  gsap.to(".board-post", { y: -8, duration: 3.2, repeat: -1, yoyo: true, stagger: .18, ease: "sine.inOut" });
  gsap.to(".connect-orbit", { rotate: 360, duration: 18, repeat: -1, ease: "none", stagger: 1.8 });
  gsap.to(".connect-node", { y: -12, duration: 3.4, repeat: -1, yoyo: true, stagger: .2, ease: "sine.inOut" });

  qsa(".feature-card, .roadmap-grid article").forEach((card) => {
    gsap.from(card, {
      scrollTrigger: window.ScrollTrigger ? { trigger: card, start: "top 84%" } : undefined,
      y: 28,
      opacity: 0,
      duration: .7,
      ease: "power3.out"
    });
  });

  qsa(".story-copy, .spotlight-visual, .community-board, .connect-visual").forEach((element) => {
    gsap.from(element, {
      scrollTrigger: window.ScrollTrigger ? { trigger: element, start: "top 80%" } : undefined,
      y: 34,
      opacity: 0,
      duration: .8,
      ease: "power3.out"
    });
  });


  window.addEventListener("mousemove", (event) => {
    if (window.innerWidth < 900) return;
    const x = (event.clientX / window.innerWidth - .5) * 16;
    const y = (event.clientY / window.innerHeight - .5) * 16;
    gsap.to("[data-parallax-root]", { x, y, duration: .8, ease: "power2.out" });
  }, { passive: true });
}

window.addEventListener("DOMContentLoaded", () => {
  createIcons();
  initLoader();
  initNavigation();
  initSmoothScroll();
  initRipples();
  initAuthModal();
  initFeatureShowcase();
  initAnimations();
});





const AUTH_API_BASE_URL = window.__HIVE_API_BASE_URL__ || localStorage.getItem("hive-api-base-url") || "http://localhost:8080";
const AUTH_TOKEN_KEY = "hive_token";
const AUTH_DASHBOARD_URL = "delivery.html";
const authState = { view: "login", pendingEmail: "", forgotStep: "email", countdownTimer: null, countdown: 60 };

function authEndpoint(path) {
  return `${AUTH_API_BASE_URL}${path}`;
}

async function authPost(path, payload, { asParams = false, auth = false } = {}) {
  const headers = asParams
    ? { "Content-Type": "application/x-www-form-urlencoded" }
    : { "Content-Type": "application/json" };
  if (auth) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(authEndpoint(path), {
    method: "POST",
    headers,
    body: asParams ? new URLSearchParams(payload).toString() : JSON.stringify(payload)
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }
  if (!response.ok) {
    throw new Error((data && (data.message || data.error)) || (typeof data === "string" && data) || "Request failed. Please try again.");
  }
  return data;
}

function setAuthStatus(form, message = "", type = "info") {
  const status = qs(".form-status", form);
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", type === "error");
}

function setAuthLoading(form, isLoading) {
  const submit = qs("button[type='submit']", form);
  qsa("input, select", form).forEach((field) => { field.disabled = isLoading; });
  if (submit) {
    submit.disabled = isLoading;
    submit.dataset.originalText ||= submit.innerHTML;
    submit.innerHTML = isLoading ? '<span>Working...</span><i data-lucide="loader-circle"></i>' : submit.dataset.originalText;
  }
  createIcons();
}

function validateAuthEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateAuthRequired(form) {
  const fields = qsa("[required]", form).filter((field) => !field.disabled && field.closest(".auth-form.active"));
  for (const field of fields) {
    if (!String(field.value || "").trim()) {
      field.focus();
      throw new Error("Please fill all required fields.");
    }
    if (field.type === "email" && !validateAuthEmail(field.value)) {
      field.focus();
      throw new Error("Please enter a valid email address.");
    }
  }
}

function switchAuthView(view) {
  const modal = qs("#authModal");
  const current = qs(".auth-form.active", modal);
  const next = qs(`[data-auth-form="${view}"]`, modal);
  if (!next || current === next) return;
  authState.view = view;
  qsa(".auth-tab", modal).forEach((tab) => {
    const active = tab.dataset.authTab === view;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  if (!window.gsap || !current) {
    current?.classList.remove("active");
    next.classList.add("active");
    return;
  }
  gsap.to(current, {
    opacity: 0,
    y: 12,
    duration: .2,
    ease: "power2.out",
    onComplete: () => {
      current.classList.remove("active");
      current.style.opacity = "";
      current.style.transform = "";
      next.classList.add("active");
      gsap.fromTo(next, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .32, ease: "power3.out" });
    }
  });
}

function openAuthModal(view = "login") {
  const modal = qs("#authModal");
  if (!modal) return;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("menu-open");
  hiveLenis?.stop();
  switchAuthView(view);
  qs("#navPanel")?.classList.remove("open");
  qs(".menu-toggle")?.setAttribute("aria-expanded", "false");
  if (window.gsap) gsap.fromTo(".auth-panel", { opacity: 0, y: 24, scale: .98 }, { opacity: 1, y: 0, scale: 1, duration: .36, ease: "power3.out" });
  setTimeout(() => qs("input", qs(`[data-auth-form="${view}"]`, modal))?.focus(), 80);
}

function closeAuthModal() {
  const modal = qs("#authModal");
  if (!modal || !modal.classList.contains("open")) return;
  const finish = () => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("menu-open");
    hiveLenis?.start();
  };
  if (window.gsap) gsap.to(".auth-panel", { opacity: 0, y: 18, scale: .98, duration: .2, ease: "power2.out", onComplete: finish });
  else finish();
}

function otpValue(container) {
  return qsa("input", container).map((input) => input.value).join("");
}

function clearOtp(container) {
  qsa("input", container).forEach((input) => { input.value = ""; });
}

function initAuthOtpInputs() {
  qsa(".auth-modal .otp-boxes").forEach((group) => {
    const inputs = qsa("input", group);
    inputs.forEach((input, index) => {
      input.addEventListener("input", () => {
        input.value = input.value.replace(/\D/g, "").slice(0, 1);
        if (input.value && inputs[index + 1]) inputs[index + 1].focus();
      });
      input.addEventListener("keydown", (event) => {
        if (event.key === "Backspace" && !input.value && inputs[index - 1]) inputs[index - 1].focus();
      });
      input.addEventListener("paste", (event) => {
        event.preventDefault();
        const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, inputs.length);
        pasted.split("").forEach((digit, pastedIndex) => { inputs[pastedIndex].value = digit; });
        inputs[Math.min(pasted.length, inputs.length) - 1]?.focus();
      });
    });
  });
}

function startAuthCountdown() {
  const modal = qs("#authModal");
  const label = qs("[data-countdown]", modal);
  const resend = qs("[data-resend]", modal);
  clearInterval(authState.countdownTimer);
  authState.countdown = 60;
  resend.disabled = true;
  label.textContent = `Resend in ${authState.countdown}s`;
  authState.countdownTimer = setInterval(() => {
    authState.countdown -= 1;
    if (authState.countdown <= 0) {
      clearInterval(authState.countdownTimer);
      label.textContent = "Didn't receive it?";
      resend.disabled = false;
      return;
    }
    label.textContent = `Resend in ${authState.countdown}s`;
  }, 1000);
}

function setForgotStep(step) {
  const modal = qs("#authModal");
  authState.forgotStep = step;
  qsa(".forgot-step", modal).forEach((panel) => panel.classList.toggle("active", panel.dataset.forgotStep === step));
  qs("[data-forgot-button]", modal).textContent = step === "email" ? "Send OTP" : "Reset Password";
  qs("[data-forgot-copy]", modal).textContent = step === "email" ? "Enter your Bennett email to receive an OTP." : "Enter the OTP and choose a new password.";
}

function initAuthModal() {
  const modal = qs("#authModal");
  if (!modal) return;

  qsa("[data-auth-open]").forEach((button) => button.addEventListener("click", () => openAuthModal(button.dataset.authView || "login")));
  qsa("[data-auth-close]").forEach((button) => button.addEventListener("click", closeAuthModal));
  window.addEventListener("keydown", (event) => { if (event.key === "Escape") closeAuthModal(); });
  qsa(".auth-tab", modal).forEach((tab) => tab.addEventListener("click", () => switchAuthView(tab.dataset.authTab)));
  qsa("[data-auth-trigger]", modal).forEach((button) => button.addEventListener("click", () => switchAuthView(button.dataset.authTrigger)));

  qsa(".password-toggle", modal).forEach((button) => {
    button.addEventListener("click", () => {
      const input = button.parentElement.querySelector("input");
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.setAttribute("aria-label", show ? "Hide password" : "Show password");
      button.innerHTML = show ? '<i data-lucide="eye-off"></i>' : '<i data-lucide="eye"></i>';
      createIcons();
    });
  });

  initAuthOtpInputs();

  qs('[data-auth-form="signup"]', modal).addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    setAuthStatus(form);
    try {
      validateAuthRequired(form);
      const payload = Object.fromEntries(new FormData(form).entries());
      setAuthLoading(form, true);
      await authPost("/api/auth/register", payload);
      authState.pendingEmail = payload.email;
      qs("[data-otp-email]", modal).textContent = payload.email;
      clearOtp(qs('[data-auth-form="otp"] .otp-boxes', modal));
      startAuthCountdown();
      switchAuthView("otp");
      setAuthStatus(qs('[data-auth-form="otp"]', modal), "OTP sent. Enter the code to verify your account.");
    } catch (error) {
      setAuthStatus(form, error.message, "error");
    } finally {
      setAuthLoading(form, false);
    }
  });

  qs('[data-auth-form="otp"]', modal).addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const otp = otpValue(qs(".otp-boxes", form));
    setAuthStatus(form);
    if (otp.length !== 6) return setAuthStatus(form, "Enter the 6 digit OTP.", "error");
    try {
      setAuthLoading(form, true);
      await authPost("/api/auth/verify", { email: authState.pendingEmail, otp }, { asParams: true });
      setAuthStatus(form, "Verified. Switching to login...");
      setTimeout(() => switchAuthView("login"), 700);
    } catch (error) {
      setAuthStatus(form, error.message, "error");
    } finally {
      setAuthLoading(form, false);
    }
  });

  qs("[data-resend]", modal).addEventListener("click", async () => {
    const form = qs('[data-auth-form="otp"]', modal);
    const signupForm = qs('[data-auth-form="signup"]', modal);
    try {
      await authPost("/api/auth/register", Object.fromEntries(new FormData(signupForm).entries()));
      startAuthCountdown();
      setAuthStatus(form, "OTP resent.");
    } catch (error) {
      setAuthStatus(form, error.message, "error");
    }
  });

  qs('[data-auth-form="login"]', modal).addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    setAuthStatus(form);
    try {
      validateAuthRequired(form);
      const { email, password, remember } = Object.fromEntries(new FormData(form).entries());
      setAuthLoading(form, true);
      const data = await authPost("/api/auth/login", { email, password, remember: Boolean(remember) });
      const token = data.token || data.jwt || data.accessToken;
      if (!token) throw new Error("Login succeeded but no token was returned.");
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      setAuthStatus(form, "Login successful. Redirecting...");
      closeAuthModal();
      setTimeout(() => { window.location.href = AUTH_DASHBOARD_URL; }, 260);
    } catch (error) {
      setAuthStatus(form, error.message, "error");
    } finally {
      setAuthLoading(form, false);
    }
  });

  qs('[data-auth-form="forgot"]', modal).addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = qs("#forgotEmail", form).value.trim();
    setAuthStatus(form);
    try {
      if (!validateAuthEmail(email)) throw new Error("Please enter a valid email address.");
      setAuthLoading(form, true);
      if (authState.forgotStep === "email") {
        await authPost("/api/auth/forgot-password", { email }, { asParams: true });
        setForgotStep("reset");
        setAuthStatus(form, "OTP sent. Enter it with your new password.");
        return;
      }
      const otp = otpValue(qs('.forgot-step[data-forgot-step="reset"] .otp-boxes', form));
      const password = qs("#newPassword", form).value;
      const confirmPassword = qs("#confirmPassword", form).value;
      if (otp.length !== 6) throw new Error("Enter the 6 digit OTP.");
      if (!password || password.length < 6) throw new Error("Password must be at least 6 characters.");
      if (password !== confirmPassword) throw new Error("Passwords do not match.");
      await authPost("/api/auth/reset-password", { email, otp, newPassword: password }, { asParams: true });
      setAuthStatus(form, "Password reset. Switching to login...");
      setTimeout(() => { setForgotStep("email"); switchAuthView("login"); }, 800);
    } catch (error) {
      setAuthStatus(form, error.message, "error");
    } finally {
      setAuthLoading(form, false);
    }
  });
}
