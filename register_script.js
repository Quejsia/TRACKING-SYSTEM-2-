/* FindTrack — Auth Script (APK/WebView Safe) */

// ── APK-SAFE TOAST (standalone, no external deps) ─────────────
function authToast(msg, type) {
  var old = document.getElementById("authToastEl");
  if (old) old.remove();

  var el = document.createElement("div");
  el.id = "authToastEl";

  var color = type === "success" ? "#10b981" : type === "warn" ? "#f59e0b" : "#ef4444";
  var bg    = type === "success" ? "#f0fdf4" : type === "warn" ? "#fffbeb" : "#fef2f2";

  el.style.cssText = [
    "position:fixed","top:20px","left:50%",
    "transform:translateX(-50%) translateY(-20px)",
    "background:" + bg,
    "color:#0f172a",
    "border:1.5px solid " + color,
    "border-left:4px solid " + color,
    "border-radius:12px",
    "padding:13px 20px",
    "font-size:14px","font-weight:600",
    "font-family:-apple-system,'SF Pro Text','Segoe UI',system-ui,sans-serif",
    "box-shadow:0 8px 30px rgba(0,0,0,0.18)",
    "z-index:99999",
    "max-width:320px","width:calc(100% - 40px)",
    "text-align:center","opacity:0",
    "transition:all 0.35s cubic-bezier(.34,1.56,.64,1)",
    "pointer-events:none"
  ].join(";");

  el.textContent = msg;
  document.body.appendChild(el);

  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      el.style.opacity = "1";
      el.style.transform = "translateX(-50%) translateY(0)";
    });
  });

  var delay = type === "success" ? 2000 : 3000;
  setTimeout(function() {
    el.style.opacity = "0";
    el.style.transform = "translateX(-50%) translateY(-16px)";
    setTimeout(function() { if (el.parentNode) el.remove(); }, 380);
  }, delay);
}

// ── FIELD ERROR HELPER ─────────────────────────────────────────
function setFieldError(inputId, errId, show) {
  var inp = document.getElementById(inputId);
  var err = document.getElementById(errId);
  if (inp) {
    inp.style.borderColor = show ? "#ef4444" : "";
    inp.style.background  = show ? "rgba(239,68,68,0.07)" : "";
  }
  if (err) err.style.display = show ? "block" : "none";
}

function clearErrors(pairs) {
  pairs.forEach(function(p) { setFieldError(p[0], p[1], false); });
}

// ── BUTTON LOADING STATE ───────────────────────────────────────
function setBtnLoading(btn, loading, label) {
  if (!btn) return;
  btn.disabled = loading;
  btn.style.opacity = loading ? "0.7" : "1";
  btn.textContent = loading ? "Please wait..." : label;
}

// ── MAIN ───────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function() {

  var signupForm = document.getElementById("signupForm");
  var loginForm  = document.getElementById("loginForm");

  // ── SIGNUP ────────────────────────────────────────────────────
  if (signupForm) {
    signupForm.addEventListener("submit", function(e) {
      e.preventDefault();

      // Support both split-name fields (v2) and single name field (legacy)
      var firstEl  = document.getElementById("signupFirst");
      var lastEl   = document.getElementById("signupLast");
      var nameEl   = document.getElementById("signupName");
      var emailEl  = document.getElementById("signupEmail");
      var contactEl= document.getElementById("signupContact");
      var passEl   = document.getElementById("signupPass");

      var name = "";
      if (firstEl && lastEl) {
        name = (firstEl.value.trim() + " " + lastEl.value.trim()).trim();
      } else if (nameEl) {
        name = nameEl.value.trim();
      }

      var email   = emailEl   ? emailEl.value.trim().toLowerCase() : "";
      var contact = contactEl ? contactEl.value.trim()             : "";
      var pass    = passEl    ? passEl.value                       : "";

      clearErrors([
        ["signupFirst","firstErr"],["signupLast","lastErr"],
        ["signupName","nameErr"],["signupEmail","emailErr"],
        ["signupContact","contactErr"],["signupPass","passErr"]
      ]);

      var valid = true;

      // Name
      if (name.split(" ").filter(function(w){ return w.length > 0; }).length < 2) {
        if (firstEl) setFieldError("signupFirst","firstErr",true);
        if (lastEl)  setFieldError("signupLast","lastErr",true);
        if (nameEl)  setFieldError("signupName","nameErr",true);
        authToast("❌ Please enter your first and last name","error");
        valid = false;
      }

      // Email
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setFieldError("signupEmail","emailErr",true);
        if (valid) authToast("❌ Please enter a valid email address","error");
        valid = false;
      }

      // Phone (optional)
      if (contact && contact.replace(/\D/g,"").length < 10) {
        setFieldError("signupContact","contactErr",true);
        if (valid) authToast("❌ Phone must be at least 10 digits","error");
        valid = false;
      }

      // Password
      if (pass.length < 6) {
        setFieldError("signupPass","passErr",true);
        if (valid) authToast("❌ Password must be at least 6 characters","error");
        valid = false;
      }

      if (!valid) return;

      var users = [];
      try { users = JSON.parse(localStorage.getItem("users")||"[]"); } catch(ex) { users=[]; }

      if (users.find(function(u){ return u.email===email; })) {
        setFieldError("signupEmail","emailErr",true);
        authToast("❌ Email already registered. Please login.","error");
        return;
      }

      var btn = signupForm.querySelector("button[type='submit']");
      setBtnLoading(btn, true, "📝 Create Account");

      setTimeout(function() {
        var user = { id:"u"+Date.now(), name:name, email:email, contact:contact, pass:pass };
        users.push(user);
        try {
          localStorage.setItem("users", JSON.stringify(users));
          localStorage.setItem("sessionUser", JSON.stringify({ id:user.id, name:user.name, email:user.email }));
          localStorage.setItem("userProfile", JSON.stringify({ name:user.name, email:user.email, contact:user.contact, avatar:"" }));
        } catch(ex) {
          setBtnLoading(btn, false, "📝 Create Account");
          authToast("❌ Storage error. Please try again.","error");
          return;
        }
        authToast("✅ Account created! Welcome to FindTrack!","success");
        setTimeout(function() { window.location.href = "dashboard.html"; }, 1100);
      }, 400);
    });
  }

  // ── LOGIN ─────────────────────────────────────────────────────
  if (loginForm) {
    loginForm.addEventListener("submit", function(e) {
      e.preventDefault();

      var emailEl = document.getElementById("loginEmail");
      var passEl  = document.getElementById("loginPass");
      var email   = emailEl ? emailEl.value.trim().toLowerCase() : "";
      var pass    = passEl  ? passEl.value                       : "";

      clearErrors([["loginEmail","emailErr"],["loginPass","passErr"]]);

      var valid = true;

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setFieldError("loginEmail","emailErr",true);
        authToast("❌ Please enter a valid email address","error");
        valid = false;
      }
      if (!pass) {
        setFieldError("loginPass","passErr",true);
        if (valid) authToast("❌ Please enter your password","error");
        valid = false;
      }
      if (!valid) return;

      var btn = loginForm.querySelector("button[type='submit']");
      setBtnLoading(btn, true, "🔐 Sign In");

      setTimeout(function() {
        var users = [];
        try { users = JSON.parse(localStorage.getItem("users")||"[]"); } catch(ex) { users=[]; }

        var matched = users.find(function(u){ return u.email===email && u.pass===pass; });

        if (matched) {
          try {
            localStorage.setItem("sessionUser", JSON.stringify({ id:matched.id, name:matched.name, email:matched.email }));
            localStorage.setItem("userProfile", JSON.stringify({ name:matched.name, email:matched.email, contact:matched.contact||"", avatar:matched.avatar||"" }));
          } catch(ex) {
            setBtnLoading(btn, false, "🔐 Sign In");
            authToast("❌ Storage error. Please try again.","error");
            return;
          }
          authToast("✅ Login successful! Welcome back!","success");
          setTimeout(function() { window.location.href = "dashboard.html"; }, 1000);
        } else {
          setBtnLoading(btn, false, "🔐 Sign In");
          setFieldError("loginEmail","emailErr",true);
          setFieldError("loginPass","passErr",true);
          authToast("❌ Wrong email or password. Try again.","error");
        }
      }, 400);
    });
  }

});
