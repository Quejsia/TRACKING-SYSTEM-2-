// FindTrack v2 — Complete App Script
const LS_REPORTS = "reports";
const LS_PROFILE = "userProfile";
const LS_SESSION = "sessionUser";
const LS_PINNED  = "pinnedItems";

const lsRead  = (k) => { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; } };
const lsWrite = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const nowStr  = (t) => new Date(t || Date.now()).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
const genId   = () => "r_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
// Offline avatar data URIs — no internet required
const OFFLINE_AVATARS = [
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%230ea5e9'/%3E%3Ccircle cx='50' cy='37' r='19' fill='%23fff'/%3E%3Cellipse cx='50' cy='84' rx='29' ry='23' fill='%23fff'/%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%230d9488'/%3E%3Ccircle cx='50' cy='37' r='19' fill='%23fff'/%3E%3Cellipse cx='50' cy='84' rx='29' ry='23' fill='%23fff'/%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%238b5cf6'/%3E%3Ccircle cx='50' cy='37' r='19' fill='%23fff'/%3E%3Cellipse cx='50' cy='84' rx='29' ry='23' fill='%23fff'/%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23f59e0b'/%3E%3Ccircle cx='50' cy='37' r='19' fill='%23fff'/%3E%3Cellipse cx='50' cy='84' rx='29' ry='23' fill='%23fff'/%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23ec4899'/%3E%3Ccircle cx='50' cy='37' r='19' fill='%23fff'/%3E%3Cellipse cx='50' cy='84' rx='29' ry='23' fill='%23fff'/%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%2310b981'/%3E%3Ccircle cx='50' cy='37' r='19' fill='%23fff'/%3E%3Cellipse cx='50' cy='84' rx='29' ry='23' fill='%23fff'/%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23ef4444'/%3E%3Ccircle cx='50' cy='37' r='19' fill='%23fff'/%3E%3Cellipse cx='50' cy='84' rx='29' ry='23' fill='%23fff'/%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%230c1f3a'/%3E%3Ccircle cx='50' cy='37' r='19' fill='%23fff'/%3E%3Cellipse cx='50' cy='84' rx='29' ry='23' fill='%23fff'/%3E%3C/svg%3E"
];
const DEFAULT_AVATAR = OFFLINE_AVATARS[0];

const escapeHtml = (s) => {
  if (!s) return "";
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
};

function isLoggedIn() {
  try { const s = JSON.parse(localStorage.getItem(LS_SESSION) || "null"); return s !== null && s.id; }
  catch { return false; }
}

// ── TOAST ──────────────────────────────────────────────────────
function showToast(msg, type = "success") {
  // Ensure container exists (APK WebView safety)
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    container.style.cssText = "position:fixed;bottom:80px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;";
    document.body.appendChild(container);
  }
  const el = document.createElement("div");
  el.className = "toast-msg " + type;
  // Inline styles as APK fallback in case CSS didn't load
  el.style.cssText = "background:white;border-radius:12px;padding:12px 16px;box-shadow:0 4px 20px rgba(0,0,0,0.18);font-size:14px;font-weight:600;display:flex;align-items:center;gap:8px;pointer-events:all;max-width:300px;border-left:4px solid " + (type === "error" ? "#f87171" : "#10b981") + ";font-family:system-ui,sans-serif;";
  el.textContent = msg;
  container.appendChild(el);
  // Animate in
  el.style.opacity = "0";
  el.style.transform = "translateX(20px)";
  el.style.transition = "all 0.3s cubic-bezier(.34,1.56,.64,1)";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.opacity = "1";
      el.style.transform = "translateX(0)";
    });
  });
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateX(20px)";
    setTimeout(() => { if (el.parentNode) el.remove(); }, 320);
  }, 3200);
}

// ── MODAL ──────────────────────────────────────────────────────
function showGuestModal() { document.getElementById("guestModal")?.classList.remove("hidden"); }
function closeGuestModal() { document.getElementById("guestModal")?.classList.add("hidden"); }
function requireLogin(cb) { if (!isLoggedIn()) { showGuestModal(); return false; } cb(); return true; }

// ── SWITCH PANEL ──────────────────────────────────────────────
// Uses window.render* so they can be defined inside DOMContentLoaded
function switchPanel(name) {
  document.querySelectorAll(".panel").forEach(p => { p.classList.remove("active"); p.style.display = "none"; });
  const el = document.getElementById(name);
  if (el) { el.classList.add("active"); el.style.display = "block"; }
  document.querySelectorAll(".tab-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.tab === name);
  });
  if (name === "analytics" && window.renderAnalytics) window.renderAnalytics();
  if (name === "myitems"   && window.renderMyItems)   window.renderMyItems();
  if (name === "pinned"    && window.renderPinned)    window.renderPinned();
}

document.addEventListener("DOMContentLoaded", () => {

  // Close modal
  document.getElementById("closeModal")?.addEventListener("click", closeGuestModal);
  document.getElementById("guestModal")?.addEventListener("click", (e) => { if (e.target.id === "guestModal") closeGuestModal(); });

  // ── TABS ──────────────────────────────────────────────────────
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      const restricted = ["report", "notifications", "profile"];
      if (restricted.includes(tab) && !isLoggedIn()) { showGuestModal(); return; }
      switchPanel(tab);
    });
  });

  // ── DRAWER ────────────────────────────────────────────────────
  const drawer  = document.getElementById("sidebarDrawer");
  const overlay = document.getElementById("sidebarOverlay");

  const openDrawer  = () => { drawer?.classList.remove("hidden"); drawer?.classList.add("show"); overlay?.classList.remove("hidden"); document.body.style.overflow = "hidden"; };
  const closeDrawer = () => { drawer?.classList.add("hidden"); drawer?.classList.remove("show"); overlay?.classList.add("hidden"); document.body.style.overflow = ""; };

  document.getElementById("burgerBtn")?.addEventListener("click", openDrawer);
  document.getElementById("closeDrawer")?.addEventListener("click", closeDrawer);
  overlay?.addEventListener("click", closeDrawer);

  document.querySelectorAll(".drawer-item").forEach(li => {
    li.addEventListener("click", () => {
      const section = li.dataset.section;
      const restricted = ["report", "notifications", "profile", "myitems", "pinned"];
      if (restricted.includes(section) && !isLoggedIn()) { closeDrawer(); showGuestModal(); return; }
      switchPanel(section);
      closeDrawer();
    });
  });

  // ── PROFILE ───────────────────────────────────────────────────
  const avatar      = document.getElementById("pf_avatar");
  const avatarFile  = document.getElementById("pf_avatar_file");
  const uploadBtn   = document.getElementById("uploadBtn");
  const randomBtn   = document.getElementById("randomAvatar");
  const nameInput   = document.getElementById("pf_name");
  const emailInput  = document.getElementById("pf_email");
  const contactInput = document.getElementById("pf_contact");
  const saveProfileBtn = document.getElementById("saveProfile");

  function loadProfile() {
    const p = JSON.parse(localStorage.getItem(LS_PROFILE) || "null");
    const welcome = document.getElementById("welcomeUser");
    if (p) {
      if (avatar) avatar.src = p.avatar || DEFAULT_AVATAR;
      if (nameInput) nameInput.value = p.name || "";
      if (emailInput) emailInput.value = p.email || "";
      if (contactInput) contactInput.value = p.contact || "";
      if (welcome) welcome.textContent = `Hello, ${(p.name || "Student").split(" ")[0]}! 👋`;
    } else {
      if (welcome) welcome.textContent = "Hello, Student! 👋";
    }
  }
  loadProfile();

  uploadBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    requireLogin(() => {
      if (avatarFile) {
        avatarFile.value = ""; // reset so same file re-triggers change
        avatarFile.click();
      }
    });
  });

  avatarFile?.addEventListener("change", e => {
    if (!isLoggedIn()) return;
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 3 * 1024 * 1024) { showToast("⚠️ Photo too large. Max 3MB.", "error"); return; }
    const r = new FileReader();
    r.onerror = () => showToast("⚠️ Could not load image.", "error");
    r.onload = () => { if (avatar) avatar.src = r.result; showToast("✅ Avatar updated!", "success"); };
    r.readAsDataURL(f);
  });

  randomBtn?.addEventListener("click", () => {
    requireLogin(() => {
      const seed = Math.random().toString(36).slice(2, 8);
      const styles = ["avataaars", "bottts", "fun-emoji", "lorelei", "pixel-art"];
      const style = styles[Math.floor(Math.random() * styles.length)];
      const randomPick = OFFLINE_AVATARS[Math.floor(Math.random() * OFFLINE_AVATARS.length)];
      if (avatar) avatar.src = randomPick;
    });
  });

  saveProfileBtn?.addEventListener("click", () => {
    requireLogin(() => {
      const prof = {
        name: nameInput?.value || "",
        email: emailInput?.value || "",
        contact: contactInput?.value || "",
        avatar: avatar?.src || ""
      };
      localStorage.setItem(LS_PROFILE, JSON.stringify(prof));
      loadProfile();
      showToast("✅ Profile saved successfully!", "success");
    });
  });

  // ── REPORT FORM ───────────────────────────────────────────────
  const reportForm   = document.getElementById("reportForm");
  const imageInput   = document.getElementById("r_image");
  const imagePreview = document.getElementById("imagePreview");

  // APK-safe file input handler
  function handleFileInput(file, previewEl) {
    if (!file) return;
    // Size guard — some APK WebViews choke on huge base64
    if (file.size > 5 * 1024 * 1024) {
      showToast("⚠️ Photo too large. Please use an image under 5MB.", "error");
      return false;
    }
    const r = new FileReader();
    r.onerror = () => showToast("⚠️ Could not read image. Try a different photo.", "error");
    r.onload = () => {
      if (previewEl) { previewEl.src = r.result; previewEl.style.display = "block"; }
    };
    r.readAsDataURL(file);
    return true;
  }

  // APK-safe: use a visible trigger button instead of relying on label click
  // which is often blocked in WebView
  const triggerBtn = document.getElementById("triggerImageBtn");
  if (triggerBtn && imageInput) {
    triggerBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Force click on the actual file input
      imageInput.value = ""; // reset so same file can be re-selected
      imageInput.click();
    });
  }

  imageInput?.addEventListener("change", e => {
    const f = e.target.files && e.target.files[0];
    if (f) handleFileInput(f, imagePreview);
  });

  // Also support drag-drop on desktop
  const fileLabel = imageInput?.closest(".form-group");
  if (fileLabel) {
    fileLabel.addEventListener("dragover", e => { e.preventDefault(); fileLabel.style.background = "#eff6ff"; });
    fileLabel.addEventListener("dragleave", () => { fileLabel.style.background = ""; });
    fileLabel.addEventListener("drop", e => {
      e.preventDefault(); fileLabel.style.background = "";
      const f = e.dataTransfer.files[0];
      if (f && f.type.startsWith("image/")) { imageInput.files = e.dataTransfer.files; handleFileInput(f, imagePreview); }
    });
  }

  reportForm?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    if (!requireLogin(() => {})) return;

    const title    = document.getElementById("r_title")?.value?.trim() || "";
    const location = document.getElementById("r_location")?.value?.trim() || "";
    const desc     = document.getElementById("r_desc")?.value?.trim() || "";
    const type     = document.getElementById("r_type")?.value || "lost";
    const id       = genId();

    function saveReport(imgData) {
      const arr = lsRead(LS_REPORTS);
      arr.push({ id, title, location, desc, type, image: imgData || "", createdAt: Date.now(), claimed: false });
      lsWrite(LS_REPORTS, arr);
      renderCounts(); renderRecent(); runSearch();
      showToast("✅ Report submitted successfully!", "success");
      reportForm.reset();
      imagePreview.style.display = "none";
      imagePreview.src = "";
    }

    if (imageInput?.files?.[0]) {
      const file = imageInput.files[0];
      if (file.size > 5 * 1024 * 1024) {
        showToast("⚠️ Image too large (max 5MB). Submitting without photo.", "error");
        saveReport("");
        return;
      }
      const fr = new FileReader();
      fr.onerror = () => { showToast("⚠️ Could not read image. Saving without photo.", "error"); saveReport(""); };
      fr.onload = () => saveReport(fr.result);
      fr.readAsDataURL(file);
    } else {
      saveReport("");
    }
  });

  // ── COUNTS ────────────────────────────────────────────────────
  function renderCounts() {
    const reports = lsRead(LS_REPORTS);
    const animNum = (id, val) => {
      const el = document.getElementById(id); if (!el) return;
      const start = parseInt(el.textContent) || 0;
      const step = Math.ceil(Math.abs(val - start) / 15);
      let cur = start;
      const go = () => {
        if (cur === val) return;
        cur = val > cur ? Math.min(cur + step, val) : Math.max(cur - step, val);
        el.textContent = cur;
        if (cur !== val) requestAnimationFrame(go);
      };
      requestAnimationFrame(go);
    };

    if (!isLoggedIn()) { animNum("countLost", 0); animNum("countFound", 0); animNum("countClaimed", 0); return; }
    animNum("countLost",    reports.filter(r => r.type === "lost" && !r.claimed).length);
    animNum("countFound",   reports.filter(r => r.type === "found").length);
    animNum("countClaimed", reports.filter(r => r.claimed).length);
  }

  // ── RECENT ────────────────────────────────────────────────────
  function renderRecent() {
    const out = document.getElementById("recentList"); if (!out) return;

    if (!isLoggedIn()) {
      out.innerHTML = `<div style="text-align:center;padding:24px;color:#94a3b8;font-size:14px">Please login to view your recent reports</div>`;
      return;
    }

    const list = lsRead(LS_REPORTS).sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
    if (list.length === 0) {
      out.innerHTML = `<div style="text-align:center;padding:24px;color:#94a3b8;font-size:14px">No reports yet — start by reporting an item! 📦</div>`;
      return;
    }
    out.innerHTML = "";
    list.forEach(r => {
      const item = document.createElement("div");
      item.className = "recent-item";
      item.onclick = () => showItemDetail(r.id);
      item.innerHTML = `
        <div class="recent-thumb">
          ${r.image ? `<img src="${r.image}" alt="">` : (r.type === "lost" ? "📍" : "🔍")}
        </div>
        <div class="recent-info">
          <div class="recent-title">${escapeHtml(r.title)}</div>
          <div class="recent-meta">${escapeHtml(r.location || "Location unknown")} · ${nowStr(r.createdAt)}</div>
        </div>
        <div class="badge ${r.claimed ? "claimed" : r.type}">${r.claimed ? "CLAIMED" : r.type.toUpperCase()}</div>
      `;
      out.appendChild(item);
    });
  }

  // ── SEARCH ────────────────────────────────────────────────────
  const sQuery = document.getElementById("s_query");
  const sFilter = document.getElementById("s_filter");
  const sLoc   = document.getElementById("filterLocation");
  const sDate  = document.getElementById("filterDate");
  const resultsDiv = document.getElementById("searchResults");
  const noResults  = document.getElementById("noResults");

  document.getElementById("toggleFilters")?.addEventListener("click", () => {
    document.getElementById("advancedFilters")?.classList.toggle("hidden");
  });

  function makeCard(r) {
    const card = document.createElement("div");
    card.className = "card-item clickable";
    card.onclick = () => showItemDetail(r.id);
    const pinned = isPinned(r.id);
    card.innerHTML = `
      <div style="position:relative">
        <div class="card-media">
          ${r.image ? `<img src="${r.image}" alt="">` : `<div style="font-size:52px;opacity:.35">📷</div>`}
        </div>
        <button class="pin-toggle ${pinned ? "pinned" : ""}" onclick="event.stopPropagation();togglePin('${r.id}')" title="${pinned ? "Unpin" : "Pin"}">${pinned ? "📌" : "📍"}</button>
      </div>
      <div class="card-title">${escapeHtml(r.title)}</div>
      <div class="card-desc">${escapeHtml(r.desc || r.location || "No description")}</div>
      <div class="card-footer">
        <div>
          <small style="display:block;color:#64748b">${escapeHtml(r.location || "Unknown location")}</small>
          <small style="color:#94a3b8">${nowStr(r.createdAt)}</small>
        </div>
        <div class="badge ${r.claimed ? "claimed" : r.type}">${r.claimed ? "CLAIMED" : r.type.toUpperCase()}</div>
      </div>
    `;
    return card;
  }

  function runSearch() {
    const kw   = (sQuery?.value || "").trim().toLowerCase();
    const filt = sFilter?.value || "all";
    const loc  = (sLoc?.value || "").trim().toLowerCase();
    const date = sDate?.value || "";
    const reports = lsRead(LS_REPORTS);

    const results = reports.filter(r => {
      const text = `${r.title} ${r.desc} ${r.location}`.toLowerCase();
      const okKw   = !kw   || text.includes(kw);
      let okType = true;
      if (filt === "lost")    okType = r.type === "lost" && !r.claimed;
      else if (filt === "found")    okType = r.type === "found";
      else if (filt === "claimed") okType = r.claimed;
      const okLoc  = !loc  || (r.location || "").toLowerCase().includes(loc);
      const okDate = !date || new Date(r.createdAt).toISOString().slice(0, 10) === date;
      return okKw && okType && okLoc && okDate;
    });

    if (!resultsDiv || !noResults) return;
    resultsDiv.innerHTML = "";

    if (results.length === 0) {
      noResults.classList.remove("hidden");
      noResults.textContent = kw ? `No items found for "${kw}". Try different keywords.` : "No items match the current filters.";
      return;
    }
    noResults.classList.add("hidden");
    results.forEach(r => resultsDiv.appendChild(makeCard(r)));
  }

  sQuery?.addEventListener("input", runSearch);
  sFilter?.addEventListener("change", runSearch);
  sLoc?.addEventListener("input", runSearch);
  sDate?.addEventListener("change", runSearch);

  // ── ITEM DETAIL ────────────────────────────────────────────────
  window.showItemDetail = (itemId) => {
    const reports = lsRead(LS_REPORTS);
    const r = reports.find(x => x.id === itemId);
    if (!r) return;

    document.querySelectorAll(".panel").forEach(p => { p.classList.remove("active"); p.style.display = "none"; });
    const el = document.getElementById("itemDetail");
    if (el) { el.classList.add("active"); el.style.display = "block"; }

    const pinned = isPinned(r.id);
    document.getElementById("detailContent").innerHTML = `
      ${r.image ? `<img src="${r.image}" class="detail-image" alt="${escapeHtml(r.title)}">` : `<div class="detail-image" style="display:flex;align-items:center;justify-content:center;font-size:80px;opacity:.3">📷</div>`}
      <div class="detail-body">
        <div class="detail-title">${escapeHtml(r.title)}</div>
        <div class="detail-meta">
          <span class="detail-meta-item">📍 ${escapeHtml(r.location || "Unknown location")}</span>
          <span class="detail-meta-item">🕐 ${nowStr(r.createdAt)}</span>
          <span class="badge ${r.claimed ? "claimed" : r.type}" style="margin-left:4px">${r.claimed ? "CLAIMED" : r.type.toUpperCase()}</span>
        </div>
        <div class="detail-desc">${escapeHtml(r.desc || "No additional description provided.")}</div>
        <div class="detail-actions">
          ${!r.claimed ? `<button class="primary-btn" onclick="claimItem('${r.id}')">✅ Mark as Claimed</button>` : ""}
          <button class="secondary-btn" onclick="togglePin('${r.id}')">${pinned ? "📌 Unpin" : "📍 Pin Item"}</button>
          <button class="delete-btn" style="width:auto" onclick="deleteItem('${r.id}')">🗑️ Delete</button>
        </div>
      </div>
    `;
  };

  document.getElementById("backToSearch")?.addEventListener("click", () => switchPanel("search"));

  // ── PIN ────────────────────────────────────────────────────────
  window.togglePin = (itemId) => {
    if (!requireLogin(() => {})) return;
    const pinned = lsRead(LS_PINNED);
    const idx = pinned.indexOf(itemId);
    if (idx > -1) { pinned.splice(idx, 1); showToast("📍 Item unpinned", "success"); }
    else          { pinned.push(itemId);   showToast("📌 Item pinned!", "success"); }
    lsWrite(LS_PINNED, pinned);
    runSearch(); renderPinned();
  };

  window.isPinned = (id) => lsRead(LS_PINNED).includes(id);

  // ── CLAIM ──────────────────────────────────────────────────────
  window.claimItem = (itemId) => {
    if (!requireLogin(() => {})) return;
    if (!confirm("Mark this item as claimed/found?")) return;
    const reports = lsRead(LS_REPORTS);
    const item = reports.find(r => r.id === itemId);
    if (!item) return;
    item.claimed = true; item.type = "found";
    lsWrite(LS_REPORTS, reports);
    renderCounts(); renderRecent(); runSearch();
    showToast("✅ Item marked as claimed!", "success");
    showItemDetail(itemId);
  };

  // ── DELETE ─────────────────────────────────────────────────────
  window.deleteItem = (itemId) => {
    if (!requireLogin(() => {})) return;
    if (!confirm("Delete this item? This cannot be undone.")) return;
    let reports = lsRead(LS_REPORTS).filter(r => r.id !== itemId);
    lsWrite(LS_REPORTS, reports);
    let pinned = lsRead(LS_PINNED).filter(id => id !== itemId);
    lsWrite(LS_PINNED, pinned);
    renderCounts(); renderRecent(); renderMyItems(); renderPinned(); runSearch();
    showToast("🗑️ Item deleted", "error");
    switchPanel("search");
  };

  // ── MY ITEMS ───────────────────────────────────────────────────
  window.renderMyItems = function renderMyItems() {
    const out   = document.getElementById("myItemsList");
    const empty = document.getElementById("myItemsEmpty");
    if (!out || !empty) return;

    if (!isLoggedIn()) {
      out.innerHTML = ""; empty.textContent = "Please login to view your items."; empty.style.display = "block"; return;
    }
    const reports = lsRead(LS_REPORTS).sort((a, b) => b.createdAt - a.createdAt);
    if (reports.length === 0) {
      out.innerHTML = ""; empty.textContent = "You haven't reported any items yet."; empty.style.display = "block"; return;
    }
    empty.style.display = "none"; out.innerHTML = "";
    reports.forEach(r => {
      const el = document.createElement("div");
      el.className = "card-item";
      const pinned = isPinned(r.id);
      el.innerHTML = `
        <div style="position:relative;cursor:pointer" onclick="showItemDetail('${r.id}')">
          <div class="card-media">${r.image ? `<img src="${r.image}" alt="">` : `<div style="font-size:52px;opacity:.35">📷</div>`}</div>
          <button class="pin-toggle ${pinned ? "pinned" : ""}" onclick="event.stopPropagation();togglePin('${r.id}')">${pinned ? "📌" : "📍"}</button>
        </div>
        <div onclick="showItemDetail('${r.id}')" style="cursor:pointer">
          <div class="card-title">${escapeHtml(r.title)}</div>
          <div class="card-desc">${escapeHtml(r.location || "")}</div>
        </div>
        <div class="card-footer">
          <small style="color:#94a3b8">${nowStr(r.createdAt)}</small>
          <div class="badge ${r.claimed ? "claimed" : r.type}">${r.claimed ? "CLAIMED" : r.type.toUpperCase()}</div>
        </div>
        <button class="delete-btn" onclick="event.stopPropagation();deleteItem('${r.id}')">🗑️ Delete</button>
      `;
      out.appendChild(el);
    });
  }

  // ── PINNED ─────────────────────────────────────────────────────
  window.renderPinned = function renderPinned() {
    const out   = document.getElementById("pinnedList");
    const empty = document.getElementById("pinnedEmpty");
    if (!out || !empty) return;
    if (!isLoggedIn()) { out.innerHTML = ""; empty.textContent = "Please login to pin items."; empty.style.display = "block"; return; }

    const pinnedIds = lsRead(LS_PINNED);
    const items = lsRead(LS_REPORTS).filter(r => pinnedIds.includes(r.id));

    if (items.length === 0) { out.innerHTML = ""; empty.textContent = "No pinned items yet. Pin items from search!"; empty.style.display = "block"; return; }
    empty.style.display = "none"; out.innerHTML = "";
    items.forEach(r => out.appendChild(makeCard(r)));
  }

  // ── ANALYTICS ──────────────────────────────────────────────────
  window.renderAnalytics = function renderAnalytics() {
    const reports  = lsRead(LS_REPORTS);
    const lost     = reports.filter(r => r.type === "lost" && !r.claimed).length;
    const found    = reports.filter(r => r.type === "found").length;
    const claimed  = reports.filter(r => r.claimed).length;
    const total    = reports.length;

    const grid = document.getElementById("analyticsGrid");
    if (grid) {
      grid.innerHTML = `
        <div class="analytics-card">
          <div class="big-num" style="color:#ef4444">${lost}</div>
          <div class="big-label">Active Lost</div>
        </div>
        <div class="analytics-card">
          <div class="big-num" style="color:#0ea5e9">${found}</div>
          <div class="big-label">Found Items</div>
        </div>
        <div class="analytics-card">
          <div class="big-num" style="color:#10b981">${claimed}</div>
          <div class="big-label">Claimed</div>
        </div>
        <div class="analytics-card">
          <div class="big-num" style="color:#8b5cf6">${total}</div>
          <div class="big-label">Total Reports</div>
        </div>
      `;
    }

    const canvas = document.getElementById("chartCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const data = [
      { value: lost,   color: "#ef4444", label: "Lost" },
      { value: found,  color: "#0ea5e9", label: "Found" },
      { value: claimed, color: "#10b981", label: "Claimed" }
    ];
    const tot = Math.max(1, lost + found + claimed);
    const cx = canvas.width / 2, cy = (canvas.height - 50) / 2 + 10;
    const radius = Math.min(cx, cy) * 0.72;
    let angle = -Math.PI / 2;

    if (tot === 1 && lost === 0 && found === 0 && claimed === 0) {
      ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#f1f5f9"; ctx.fill();
    } else {
      data.forEach(item => {
        if (item.value === 0) return;
        const slice = (item.value / tot) * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, angle, angle + slice);
        ctx.closePath(); ctx.fillStyle = item.color; ctx.fill();
        angle += slice;
      });
    }

    // Donut hole
    ctx.beginPath(); ctx.arc(cx, cy, radius * 0.52, 0, Math.PI * 2);
    ctx.fillStyle = "white"; ctx.fill();

    // Center text
    ctx.fillStyle = "#0f172a";
    ctx.font = `bold 22px 'DM Sans', sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(total, cx, cy - 8);
    ctx.font = `12px 'DM Sans', sans-serif`;
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("total", cx, cy + 12);

    // Legend
    const lx = 20, ly = canvas.height - 34;
    data.forEach((item, i) => {
      const x = lx + i * 120;
      ctx.fillStyle = item.color;
      ctx.fillRect(x, ly, 10, 10); // use fillRect for broad browser compat
      ctx.fillStyle = "#374151"; ctx.font = "11px DM Sans, sans-serif"; ctx.textAlign = "left";
      ctx.fillText(`${item.label}: ${item.value}`, x + 14, ly + 8);
    });
  }

  // ── CATEGORY FILTER ───────────────────────────────────────────
  window.filterByCategory = (category) => {
    const keywords = {
      bags: ["bag", "backpack", "purse", "wallet", "luggage", "suitcase", "handbag"],
      electronics: ["phone", "laptop", "tablet", "charger", "headphone", "earphone", "computer", "iphone", "samsung", "ipad", "macbook"],
      books: ["book", "notebook", "textbook", "pen", "pencil", "id", "card", "stationery", "notes"],
      clothing: ["jacket", "shirt", "pants", "uniform", "glasses", "watch", "coat", "shoes", "hat", "scarf"]
    };
    const kws = keywords[category] || [];
    switchPanel("search");
    const reports = lsRead(LS_REPORTS);
    const results = reports.filter(r => {
      if (r.type !== "lost" || r.claimed) return false;
      return kws.some(kw => `${r.title} ${r.desc} ${r.location}`.toLowerCase().includes(kw));
    });
    if (!resultsDiv || !noResults) return;
    resultsDiv.innerHTML = "";
    if (results.length === 0) {
      noResults.textContent = "No lost items found in this category.";
      noResults.classList.remove("hidden"); return;
    }
    noResults.classList.add("hidden");
    results.forEach(r => resultsDiv.appendChild(makeCard(r)));
  };

  // ── INIT ───────────────────────────────────────────────────────
  renderCounts();
  renderRecent();
  runSearch();
});

// ═══════════════════════════════════════════
// FINDTRACK v3 — NEW FEATURES
// ═══════════════════════════════════════════

// ── ONBOARDING ────────────────────────────────────────────────
const ONBOARD_KEY = "ft_onboarded";
const ONBOARD_STEPS = [
  {
    icon: "🔎",
    label: "Step 1 of 4",
    title: "Welcome to FindTrack!",
    desc: "Your campus lost & found platform. Report missing items, search for found ones, and get reunited with your belongings — fast."
  },
  {
    icon: "📦",
    label: "Step 2 of 4",
    title: "Report Lost or Found Items",
    desc: "Tap the Report tab to submit an item. Add a photo, title, and location for the best chance of recovery. The more detail, the better!"
  },
  {
    icon: "🤖",
    label: "Step 3 of 4",
    title: "Smart Match Suggestions",
    desc: "Our smart system automatically compares your reports against others and highlights possible matches — so you can claim your item faster."
  },
  {
    icon: "📌",
    label: "Step 4 of 4",
    title: "Pin & Track Items",
    desc: "Bookmark items you're watching with the pin button. Check Pinned Items in the menu for quick access anytime. You're all set — good luck! 🎉"
  }
];

function initOnboarding() {
  if (localStorage.getItem(ONBOARD_KEY)) return;
  let step = 0;

  const overlay  = document.getElementById("onboardOverlay");
  const progress = document.getElementById("onboardProgress");
  const icon     = document.getElementById("onboardIcon");
  const label    = document.getElementById("onboardLabel");
  const title    = document.getElementById("onboardTitle");
  const desc     = document.getElementById("onboardDesc");
  const nextBtn  = document.getElementById("onboardNext");
  const skipBtn  = document.getElementById("onboardSkip");
  if (!overlay) return;

  function renderStep(i) {
    const s = ONBOARD_STEPS[i];
    // Progress pips
    progress.innerHTML = ONBOARD_STEPS.map((_, idx) =>
      `<div class="onboard-pip ${idx < i ? 'done' : idx === i ? 'active' : ''}"></div>`
    ).join("");
    icon.textContent  = s.icon;
    label.textContent = s.label;
    title.textContent = s.title;
    desc.textContent  = s.desc;
    nextBtn.textContent = i === ONBOARD_STEPS.length - 1 ? "Get Started 🚀" : "Next →";
    // Animate card swap
    const card = document.getElementById("onboardCard");
    card.style.animation = "none";
    card.offsetHeight; // reflow
    card.style.animation = "onboardPop 0.35s cubic-bezier(.34,1.56,.64,1) both";
  }

  function finish() {
    overlay.classList.add("hidden");
    localStorage.setItem(ONBOARD_KEY, "1");
  }

  renderStep(0);
  overlay.classList.remove("hidden");

  nextBtn.addEventListener("click", () => {
    if (step < ONBOARD_STEPS.length - 1) { step++; renderStep(step); }
    else finish();
  });
  skipBtn.addEventListener("click", finish);
}

document.addEventListener("DOMContentLoaded", () => {
  // Small delay so the page renders first
  setTimeout(initOnboarding, 600);
});

// ── IMAGE ZOOM ─────────────────────────────────────────────────
function initZoom() {
  const overlay = document.getElementById("zoomOverlay");
  const zoomImg = document.getElementById("zoomImg");
  const closeBtn = document.getElementById("zoomClose");
  if (!overlay || !zoomImg) return;

  window.openZoom = (src) => {
    zoomImg.src = src;
    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  };

  const closeZoom = () => {
    overlay.classList.add("hidden");
    document.body.style.overflow = "";
    setTimeout(() => { zoomImg.src = ""; }, 200);
  };

  overlay.addEventListener("click", (e) => { if (e.target !== zoomImg) closeZoom(); });
  closeBtn.addEventListener("click", closeZoom);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeZoom(); });
}
document.addEventListener("DOMContentLoaded", initZoom);

// Patch showItemDetail to add zoom support — called after script.js loads
document.addEventListener("DOMContentLoaded", () => {
  const _orig = window.showItemDetail;
  window.showItemDetail = (itemId) => {
    _orig(itemId);
    // After detail renders, make image zoomable
    setTimeout(() => {
      const img = document.querySelector("#detailContent .detail-image");
      if (img && img.tagName === "IMG") {
        img.classList.add("zoomable-img");
        img.title = "Tap to zoom";
        img.addEventListener("click", () => window.openZoom(img.src));
      }
    }, 50);
  };
});

// ── MOBILE BOTTOM NAV ──────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const bottomNav = document.getElementById("bottomNav");
  const fab = document.getElementById("reportFab");
  if (!bottomNav) return;

  bottomNav.querySelectorAll(".bnav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      const restricted = ["notifications", "profile"];
      if (restricted.includes(tab) && !isLoggedIn()) { showGuestModal(); return; }
      switchPanel(tab);
      bottomNav.querySelectorAll(".bnav-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // Sync bottom nav active state when top tabs are used
  const origSwitch = window.switchPanelOrig || switchPanel;
  const origSwitchPanel = switchPanel;
  // Hook into panel switches to sync bottom nav
  const syncBottomNav = (name) => {
    bottomNav.querySelectorAll(".bnav-btn").forEach(b =>
      b.classList.toggle("active", b.dataset.tab === name)
    );
  };
  // Override switchPanel to also sync bottom nav
  const patchedSwitch = (name) => {
    origSwitchPanel(name);
    syncBottomNav(name);
  };
  // Patch all tab-btn clicks to also sync bottom nav
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => syncBottomNav(btn.dataset.tab));
  });

  // FAB → report
  fab?.addEventListener("click", () => {
    if (!isLoggedIn()) { showGuestModal(); return; }
    switchPanel("report");
    syncBottomNav("report");
  });
});

// ── SMART ITEM MATCHING ────────────────────────────────────────
function computeMatchScore(a, b) {
  // Only match lost vs found (or found vs lost)
  if (a.type === b.type) return 0;
  if (a.claimed || b.claimed) return 0;

  const textA = `${a.title} ${a.desc} ${a.location}`.toLowerCase();
  const textB = `${b.title} ${b.desc} ${b.location}`.toLowerCase();

  // Tokenise — strip common stop words
  const stopWords = new Set(["a","an","the","my","i","is","at","in","on","of","and","or","was","it","this","that","with","for","to"]);
  const tokenise = (t) => t.replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));

  const tA = new Set(tokenise(textA));
  const tB = new Set(tokenise(textB));
  if (tA.size === 0 || tB.size === 0) return 0;

  let shared = 0;
  tA.forEach(w => { if (tB.has(w)) shared++; });

  // Jaccard similarity
  const union = new Set([...tA, ...tB]).size;
  const jaccard = shared / union;

  // Location bonus
  const locA = (a.location || "").toLowerCase();
  const locB = (b.location || "").toLowerCase();
  const locBonus = (locA && locB && (locA.includes(locB.slice(0,5)) || locB.includes(locA.slice(0,5)))) ? 0.15 : 0;

  // Recency bonus (within 7 days of each other)
  const daysDiff = Math.abs(a.createdAt - b.createdAt) / (1000 * 60 * 60 * 24);
  const recencyBonus = daysDiff < 7 ? 0.1 : 0;

  return Math.min(1, jaccard + locBonus + recencyBonus);
}

function getSmartMatches(targetItem, allReports, topN = 4) {
  return allReports
    .filter(r => r.id !== targetItem.id)
    .map(r => ({ report: r, score: computeMatchScore(targetItem, r) }))
    .filter(x => x.score > 0.12)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

// Show match banner when a report is submitted or when searching
function renderMatchBanner(sourceItem) {
  const banner   = document.getElementById("matchBanner");
  const cards    = document.getElementById("matchCards");
  if (!banner || !cards) return;

  const allReports = lsRead(LS_REPORTS);
  const matches = getSmartMatches(sourceItem, allReports);

  if (matches.length === 0) { banner.classList.remove("show"); return; }

  cards.innerHTML = "";
  matches.forEach(({ report: r, score }) => {
    const pct = Math.round(score * 100);
    const chip = document.createElement("div");
    chip.className = "match-chip";
    chip.onclick = () => window.showItemDetail(r.id);
    chip.innerHTML = `
      <div class="match-chip-title">${escapeHtml(r.title)}</div>
      <div class="match-chip-meta">📍 ${escapeHtml(r.location || "Unknown")} · ${r.type.toUpperCase()}</div>
      <div class="match-score">🎯 ${pct}% match</div>
    `;
    cards.appendChild(chip);
  });
  banner.classList.add("show");
}

// Show match suggestions after report submit
document.addEventListener("DOMContentLoaded", () => {
  const reportForm = document.getElementById("reportForm");
  reportForm?.addEventListener("submit", () => {
    // After a tiny delay so the new report is saved
    setTimeout(() => {
      const reports = lsRead(LS_REPORTS);
      if (reports.length < 2) return;
      const latest = reports[reports.length - 1];
      switchPanel("search");
      renderMatchBanner(latest);
    }, 300);
  }, true); // capture phase so it fires before the existing handler resets the form
});

// Also run match check on search input so logged-in users see suggestions
document.addEventListener("DOMContentLoaded", () => {
  const sq = document.getElementById("s_query");
  sq?.addEventListener("input", () => {
    const kw = sq.value.trim();
    if (kw.length < 3) { document.getElementById("matchBanner")?.classList.remove("show"); return; }
    const reports = lsRead(LS_REPORTS);
    const fake = { id: "__search__", title: kw, desc: "", location: "", type: "lost", createdAt: Date.now(), claimed: false };
    renderMatchBanner(fake);
  });
});

// ── ANIMATED EYE — replaces plain toggle buttons ───────────────
function buildEyeSVG(btnEl) {
  btnEl.innerHTML = `
    <svg class="eye-svg" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <!-- Outer eye shape -->
      <path class="eye-lid-top" d="M1 12 C5 5, 19 5, 23 12"/>
      <path class="eye-lid-bot" d="M23 12 C19 19, 5 19, 1 12"/>
      <!-- Iris -->
      <circle class="eye-iris" cx="12" cy="12" r="3.5"/>
      <!-- Slash (shown when closed) -->
      <line class="eye-slash" x1="3" y1="3" x2="21" y2="21"
            stroke-width="2.5"/>
    </svg>`;
  btnEl.classList.add("eye-btn");
  btnEl.style.color = "#94a3b8";
  btnEl.style.right = "10px";

  let open = true;
  btnEl.addEventListener("click", () => {
    open = !open;
    // Find sibling input
    const input = btnEl.closest(".field-wrap, .field")?.querySelector("input[type='password'], input[type='text']");
    if (input) input.type = open ? "text" : "password";
    if (open) { btnEl.classList.remove("closed"); }
    else      { btnEl.classList.add("closed"); }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Replace all toggle-pass / eye buttons with animated SVG eye
  document.querySelectorAll(".toggle-pass, #togglePassBtn").forEach(btn => {
    buildEyeSVG(btn);
  });
});

// ── SKELETON REVEAL ────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Reveal home content after a short simulated load delay
  const skeleton    = document.getElementById("homeSkeleton");
  const homeContent = document.getElementById("homeContent");
  if (skeleton && homeContent) {
    setTimeout(() => {
      skeleton.style.transition = "opacity 0.3s";
      skeleton.style.opacity = "0";
      setTimeout(() => {
        skeleton.style.display = "none";
        homeContent.style.display = "block";
        homeContent.style.animation = "panelIn 0.35s ease both";
      }, 300);
    }, 700); // 700ms skeleton shimmer
  }
});

// ── SEARCH SKELETON ────────────────────────────────────────────
function showSearchSkeleton() {
  const rd = document.getElementById("searchResults");
  if (!rd) return;
  rd.innerHTML = Array(6).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-media"></div>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-desc"></div>
      <div class="skeleton skeleton-desc2"></div>
      <div class="skeleton skeleton-footer"></div>
    </div>`).join("");
}

// ── SECURITY SECTION ────────────────────────────────────────────

// Toggle expand/collapse
function secToggle(bodyId) {
  const body = document.getElementById(bodyId);
  const chevronId = bodyId.replace("Body", "Chevron");
  const chevron = document.getElementById(chevronId);
  if (!body) return;
  const isHidden = body.classList.contains("hidden");
  body.classList.toggle("hidden", !isHidden);
  if (chevron) chevron.classList.toggle("open", isHidden);
}

// ── CHANGE PASSWORD ──────────────────────────────────────────────
const secNewPassInput = document.getElementById ? document.getElementById("sec_new_pass") : null;
document.addEventListener("DOMContentLoaded", () => {
  const newPass = document.getElementById("sec_new_pass");
  if (newPass) newPass.addEventListener("input", () => secCheckStrength(newPass.value));
});

function secCheckStrength(pw) {
  const fill = document.getElementById("secStrengthFill");
  const label = document.getElementById("secStrengthLabel");
  if (!fill || !label) return;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { w: "0%",   color: "#e2e8f0", text: "" },
    { w: "25%",  color: "#ef4444", text: "Weak" },
    { w: "50%",  color: "#f97316", text: "Fair" },
    { w: "75%",  color: "#eab308", text: "Good" },
    { w: "100%", color: "#22c55e", text: "Strong" }
  ];
  const lvl = pw.length === 0 ? levels[0] : levels[score];
  fill.style.width = lvl.w;
  fill.style.background = lvl.color;
  label.textContent = lvl.text;
  label.style.color = lvl.color;
}

function secChangePassword() {
  const curr = document.getElementById("sec_curr_pass").value.trim();
  const nw   = document.getElementById("sec_new_pass").value.trim();
  const conf = document.getElementById("sec_conf_pass").value.trim();
  if (!curr || !nw || !conf) { showToast("Please fill in all fields."); return; }
  if (nw !== conf) { showToast("New passwords do not match."); return; }
  if (nw.length < 6)  { showToast("Password must be at least 6 characters."); return; }
  // Simulate success
  document.getElementById("sec_curr_pass").value = "";
  document.getElementById("sec_new_pass").value = "";
  document.getElementById("sec_conf_pass").value = "";
  secCheckStrength("");
  showToast("✅ Password updated successfully!");
}

// ── LOGIN WITH PIN ───────────────────────────────────────────────
let secPinValue = "";
let secPinSaved = "";

function secPinToggle(cb) {
  const setup = document.getElementById("secPinSetup");
  if (!setup) return;
  if (cb.checked) {
    setup.classList.remove("hidden");
    secPinValue = "";
    secRefreshDots();
  } else {
    setup.classList.add("hidden");
    secPinSaved = "";
    secPinValue = "";
    localStorage.removeItem("secPin"); // clear persisted PIN
    showToast("PIN login disabled.");
  }
}

function secPinKey(digit) {
  if (secPinValue.length >= 4) return;
  secPinValue += digit;
  secRefreshDots();
}

function secPinDel() {
  if (secPinValue.length === 0) return;
  secPinValue = secPinValue.slice(0, -1);
  secRefreshDots();
}

function secRefreshDots() {
  for (let i = 0; i < 4; i++) {
    const dot = document.getElementById("pd" + i);
    if (dot) dot.classList.toggle("filled", i < secPinValue.length);
  }
}

function secSavePin() {
  if (secPinValue.length < 4) { showToast("Enter a full 4-digit PIN."); return; }
  secPinSaved = secPinValue;
  localStorage.setItem("secPin", secPinValue); // persist so login can read it
  secPinValue = "";
  secRefreshDots();
  showToast("✅ PIN saved successfully!");
}


// ── SESSION TIMEOUT ──────────────────────────────────────────────
let secTimeoutTimer = null;
let secWarnTimer = null;
let secTimeoutMins = 5;
let secTimeoutEnabled = false;

function secTimeoutToggle(cb) {
  const opts = document.getElementById("secTimeoutOptions");
  if (!opts) return;
  secTimeoutEnabled = cb.checked;
  if (cb.checked) {
    opts.classList.remove("hidden");
    secBindIdleEvents();
    secResetIdleTimer();
    showToast("⏱️ Auto-logout enabled.");
  } else {
    opts.classList.add("hidden");
    clearTimeout(secTimeoutTimer);
    clearTimeout(secWarnTimer);
    secUnbindIdleEvents();
    secHideIdleWarning();
    showToast("Auto-logout disabled.");
  }
}

function secSelectTimeout(btn) {
  document.querySelectorAll(".sec-timeout-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  secTimeoutMins = parseInt(btn.dataset.mins);
  const label = secTimeoutMins >= 60 ? "1 hour" : secTimeoutMins + " minutes";
  const status = document.getElementById("secTimeoutStatus");
  if (status) status.textContent = "Auto-logout active: " + label;
  secResetIdleTimer();
  showToast("⏱️ Timeout set to " + label);
}

function secResetIdleTimer() {
  if (!secTimeoutEnabled) return;
  clearTimeout(secTimeoutTimer);
  clearTimeout(secWarnTimer);
  secHideIdleWarning();

  const warnAt = (secTimeoutMins * 60 - 30) * 1000; // warn 30s before logout
  const logoutAt = secTimeoutMins * 60 * 1000;

  // Show warning 30s before logout (but not if timeout < 1min)
  if (warnAt > 0) {
    secWarnTimer = setTimeout(() => secShowIdleWarning(30), warnAt);
  }
  secTimeoutTimer = setTimeout(() => secDoLogout(), logoutAt);
}

function secBindIdleEvents() {
  ["mousemove","mousedown","keypress","touchstart","scroll","click"].forEach(evt => {
    document.addEventListener(evt, secOnActivity, true);
  });
}

function secUnbindIdleEvents() {
  ["mousemove","mousedown","keypress","touchstart","scroll","click"].forEach(evt => {
    document.removeEventListener(evt, secOnActivity, true);
  });
}

function secOnActivity() {
  if (secTimeoutEnabled) secResetIdleTimer();
}

function secShowIdleWarning(secsLeft) {
  let overlay = document.getElementById("secIdleOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "secIdleOverlay";
    overlay.innerHTML = `
      <div class="sec-idle-box">
        <div class="sec-idle-icon">⏳</div>
        <h2>Still there?</h2>
        <p>You've been idle. You'll be logged out in <span id="secIdleCount">30</span> seconds.</p>
        <div class="sec-idle-btns">
          <button onclick="secStayLoggedIn()">Stay Logged In</button>
          <button class="logout-btn" onclick="secDoLogout()">Log Out Now</button>
        </div>
      </div>`;
    // Inline styles so no style.css dependency
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,0.82);backdrop-filter:blur(6px);z-index:99999;display:flex;align-items:center;justify-content:center;";
    overlay.querySelector(".sec-idle-box").style.cssText = "background:#fff;border-radius:20px;padding:36px 32px;width:320px;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.25);";
    overlay.querySelector(".sec-idle-icon").style.cssText = "font-size:2.5rem;margin-bottom:12px;";
    overlay.querySelector("h2").style.cssText = "font-size:1.3rem;font-weight:700;color:#0f172a;margin-bottom:8px;";
    overlay.querySelector("p").style.cssText = "font-size:.9rem;color:#64748b;margin-bottom:24px;line-height:1.5;";
    overlay.querySelector(".sec-idle-btns").style.cssText = "display:flex;gap:10px;justify-content:center;";
    overlay.querySelectorAll("button").forEach(b => {
      b.style.cssText = "padding:10px 20px;border-radius:10px;border:none;font-size:.9rem;font-weight:600;cursor:pointer;";
    });
    const [stay, logout] = overlay.querySelectorAll("button");
    stay.style.cssText += "background:#0ea5e9;color:#fff;";
    logout.style.cssText += "background:#f1f5f9;color:#64748b;";
    document.body.appendChild(overlay);
  }
  overlay.style.display = "flex";

  // Countdown
  let count = secsLeft;
  const counter = overlay.querySelector("#secIdleCount");
  overlay._countInterval = setInterval(() => {
    count--;
    if (counter) counter.textContent = count;
    if (count <= 0) clearInterval(overlay._countInterval);
  }, 1000);
}

function secHideIdleWarning() {
  const overlay = document.getElementById("secIdleOverlay");
  if (overlay) {
    overlay.style.display = "none";
    clearInterval(overlay._countInterval);
  }
}

function secStayLoggedIn() {
  secHideIdleWarning();
  secResetIdleTimer();
  showToast("✅ Session resumed.");
}

function secDoLogout() {
  secHideIdleWarning();
  secUnbindIdleEvents();
  clearTimeout(secTimeoutTimer);
  clearTimeout(secWarnTimer);
  showToast("🔒 Session expired. Logging out…");
  setTimeout(() => { window.location.href = "login.html"; }, 1500);
}

function secStartTimeout() {
  // Legacy stub — replaced by secResetIdleTimer
  secResetIdleTimer();
}


// ── DELETE ACCOUNT ───────────────────────────────────────────────
function secDeleteAccount() {
  const val = document.getElementById("sec_delete_confirm").value.trim();
  if (val !== "DELETE") { showToast('Type "DELETE" exactly to confirm.'); return; }
  showToast("🗑️ Account deleted. Redirecting…");
  setTimeout(() => { window.location.href = "login.html"; }, 2000);
}
