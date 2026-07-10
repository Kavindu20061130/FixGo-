/* =========================================================
   FixGo AI — Dashboard interactions
   Numbers are driven by data-counter-target attributes that
   home.py fills in from the real database (see stats dict),
   not hardcoded values.
   ========================================================= */

// ---------- Animated Counters ----------
function animateCounter(id, endValue, duration = 1400) {
  const el = document.getElementById(id);
  if (!el) return;

  const end = Number(endValue);
  if (Number.isNaN(end)) return;

  const isDecimal = !Number.isInteger(end);
  const startTime = performance.now();

  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const value = end * eased;

    el.textContent = isDecimal ? value.toFixed(1) : Math.round(value);

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      // lock the exact final value (avoids rounding drift)
      el.textContent = isDecimal ? end.toFixed(1) : end;
    }
  }

  requestAnimationFrame(tick);
}

function initCounters() {
  document.querySelectorAll("[data-counter-target]").forEach((el) => {
    animateCounter(el.id, el.dataset.counterTarget);
  });
}

// ---------- Progress Bars (real booking-pipeline percentages) ----------
function initProgressBars() {
  document.querySelectorAll(".progress-bar").forEach((bar) => {
    const target = bar.dataset.width || "0";
    setTimeout(() => {
      bar.style.width = target + "%";
    }, 400);
  });
}

// ---------- Live Clock ----------
function updateClock() {
  const clockEl = document.getElementById("clock");
  if (!clockEl) return;
  clockEl.innerHTML = "🕒 " + new Date().toLocaleString();
}

// ---------- Welcome Popup ----------
function showWelcomePopup(message) {
  const popup = document.createElement("div");
  popup.textContent = message;

  Object.assign(popup.style, {
    position: "fixed",
    top: "30px",
    right: "30px",
    background: "#ff7a00",
    color: "white",
    padding: "15px 25px",
    borderRadius: "10px",
    boxShadow: "0 10px 30px rgba(0,0,0,.3)",
    zIndex: "9999",
    opacity: "0",
    transform: "translateY(-10px)",
    transition: "opacity .3s ease, transform .3s ease",
  });

  document.body.appendChild(popup);

  // fade in
  requestAnimationFrame(() => {
    popup.style.opacity = "1";
    popup.style.transform = "translateY(0)";
  });

  // fade out then remove
  setTimeout(() => {
    popup.style.opacity = "0";
    popup.style.transform = "translateY(-10px)";
    setTimeout(() => popup.remove(), 300);
  }, 4000);
}

// ---------- Recent Activity (real audit-log rows, no static list) ----------
function initActivityFeed() {
  const list = document.getElementById("activity-list");
  if (!list) return;

  // Rows are already server-rendered by home.html from stats.recent_activity;
  // if there's nothing yet, show an honest empty state instead of fake items.
  if (!list.children.length) {
    const li = document.createElement("li");
    li.textContent = "No activity yet — actions will show up here as they happen.";
    li.style.opacity = "0.6";
    list.appendChild(li);
  }
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  initCounters();
  initProgressBars();
  initActivityFeed();

  updateClock();
  setInterval(updateClock, 1000);

  setTimeout(() => {
    showWelcomePopup("🎉 Welcome back to FixGo AI");
  }, 1000);
});