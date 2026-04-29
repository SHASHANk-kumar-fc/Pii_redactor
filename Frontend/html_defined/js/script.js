const REMOTE_BASE = "https://pii-redactor-3.onrender.com";

// Deployed backend only (no localhost routing).
const AUTH_BASE = REMOTE_BASE;
const API_BASE = REMOTE_BASE;

async function fetchWithFallback(path, init) {
  const resp = await fetch(`${REMOTE_BASE}${path}`, init);
  return resp;
}

// Offline demo credentials (frontend-only).
// This lets you test the UI flow without Firebase/auth setup.
const DUMMY_LOGIN = {
  email: "demo@hide.ai",
  password: "demo12345"
};

const CRED_STORAGE_KEY = "savedCredentials";
const PENDING_DEMO_KEY = "pendingDemoAfterLogin";

function getSavedCredentials() {
  try {
    const raw = localStorage.getItem(CRED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function setSavedCredentials(creds) {
  try {
    if (!creds) localStorage.removeItem(CRED_STORAGE_KEY);
    else localStorage.setItem(CRED_STORAGE_KEY, JSON.stringify(creds));
  } catch (_) {}
}

function openLogin() {
  document.getElementById("login-modal").style.display = "flex";
  try {
    const creds = getSavedCredentials();
    const emailEl = document.getElementById("login-email");
    const passEl = document.getElementById("login-password");
    const rememberEl = document.getElementById("remember-credentials");

    if (creds && creds.email) {
      if (emailEl) emailEl.value = creds.email || "";
      if (passEl) passEl.value = creds.password || "";
      if (rememberEl) rememberEl.checked = true;
      return;
    }

    // Default: prefill demo credentials so user can just click Submit.
    if (emailEl && !emailEl.value) emailEl.value = DUMMY_LOGIN.email;
    if (passEl && !passEl.value) passEl.value = DUMMY_LOGIN.password;
    if (rememberEl && rememberEl.checked === false) rememberEl.checked = true;
  } catch (_) {}
}
function runDemo() {
  if (isLoggedIn()) {
    window.location.href = "upload.html?demo=local";
    return;
  }
  try { sessionStorage.setItem(PENDING_DEMO_KEY, "true"); } catch (_) {}
  openLogin();
}
document.addEventListener("DOMContentLoaded", async () => {

  const params = new URLSearchParams(window.location.search);
  const inputFile = document.getElementById("input-file");
  const imgView = document.getElementById("img-view");

  if (params.get("demo") === "true") {

    const response = await fetch("../demo/demo_pii.docx");
    const blob = await response.blob();

    const file = new File([blob], "demo_pii.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    inputFile.files = dataTransfer.files;

    imgView.innerHTML =
      `<p>demo_pii.docx</p><span>Demo document loaded</span>`;
  }

  if (params.get("demo") === "local") {
    const response = await fetchWithFallback(`/demo-doc`);
    const blob = await response.blob();
    const disposition = response.headers.get("content-disposition") || "";
    const match = disposition.match(/filename="?([^"]+)"?/i);
    const name = match?.[1] || "demo.docx";

    const file = new File([blob], name, {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    inputFile.files = dataTransfer.files;
    imgView.innerHTML =
      `<p>${name}</p><span>Demo document loaded</span>`;
  }

  // If user logged in via demo credentials, auto-load demo.docx by default.
  try {
    const hasFile = !!(inputFile && inputFile.files && inputFile.files.length);
    if (!hasFile) {
      const userRaw = localStorage.getItem("authUser");
      const user = userRaw ? JSON.parse(userRaw) : null;
      if (user && user.demo === true && inputFile && imgView) {
        const response = await fetchWithFallback(`/demo-doc`).catch(() => null);
        if (response && response.ok) {
          const blob = await response.blob();
          const disposition = response.headers.get("content-disposition") || "";
          const match = disposition.match(/filename="?([^"]+)"?/i);
          const name = match?.[1] || "demo.docx";
          const file = new File([blob], name, {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          inputFile.files = dataTransfer.files;
          imgView.innerHTML = `<p>${name}</p><span>Demo document loaded</span>`;
        } else {
          imgView.innerHTML = `<p>Demo document</p><span style="color:#b00020;">Could not auto-load demo.docx (backend not reachable)</span>`;
        }
      }
    }
  } catch (_) {}

});
function closeLogin() {
  document.getElementById("login-modal").style.display = "none";
}

async function handleLogin(e) {
  if (e && e.preventDefault) e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  const remember = document.getElementById("remember-credentials");
  const error = document.getElementById("login-error");
  const spinner = document.getElementById("login-spinner");
  const btn = document.getElementById("login-submit-btn");

  if (spinner) spinner.style.display = "inline-block";
  if (btn) { btn.disabled = true; btn.style.display = "none"; }

  // Demo login path (no network).
  if ((email || "").trim().toLowerCase() === DUMMY_LOGIN.email && password === DUMMY_LOGIN.password) {
    try {
      if (remember && remember.checked) setSavedCredentials({ email, password });
      else setSavedCredentials(null);
    } catch (_) {}
    try {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('authUser', JSON.stringify({ email, name: "Demo User", demo: true }));
    } catch (_) {}

    let goToDemo = false;
    try {
      goToDemo = sessionStorage.getItem(PENDING_DEMO_KEY) === "true";
      sessionStorage.removeItem(PENDING_DEMO_KEY);
    } catch (_) {}
    window.location.href = goToDemo ? "upload.html?demo=local" : "upload.html";
    return;
  }

  const bases = [AUTH_BASE];
  let lastErr;
  for (const base of bases) {
    try {
      const response = await fetch(`${base}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (response.ok) {
        try {
          if (remember && remember.checked) setSavedCredentials({ email, password });
          else setSavedCredentials(null);
        } catch (_) {}

        try {
          const token = result.token || result.access_token || result.jwt || null;
          if (token) {
            localStorage.setItem('authToken', token);
          } else {
            localStorage.setItem('isAuthenticated', 'true');
          }
          if (result.user || result.email || email) {
            localStorage.setItem('authUser', JSON.stringify(result.user || { email }));
          }
        } catch (_) {}
        let goToDemo = false;
        try {
          goToDemo = sessionStorage.getItem(PENDING_DEMO_KEY) === "true";
          sessionStorage.removeItem(PENDING_DEMO_KEY);
        } catch (_) {}
        window.location.href = goToDemo ? "upload.html?demo=local" : "upload.html";
        return;
      }
      error.style.display = "block";
      error.textContent = result.detail;
      if (spinner) spinner.style.display = "none";
      if (btn) { btn.disabled = false; btn.style.display = ""; }
      return;
    } catch (err) {
      lastErr = err;
    }
  }
  console.error("Login error:", lastErr);
  error.style.display = "block";
  error.textContent = "Failed to connect to auth server.";
  if (spinner) spinner.style.display = "none";
  if (btn) { btn.disabled = false; btn.style.display = ""; }
}
function isLoggedIn() {
  return !!localStorage.getItem('authToken') || localStorage.getItem('isAuthenticated') === 'true';
}

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('authUser');
  sessionStorage.removeItem('pendingUpload');
  sessionStorage.removeItem('uploadError');
  window.location.href = 'main.html';
}

document.addEventListener("DOMContentLoaded", () => {
  const onUploadPage = !!document.getElementById('drop-box');
  if (onUploadPage && !isLoggedIn()) {
    window.location.href = 'main.html';
    return;
  }
});
function openSignup() {
  document.getElementById("signupModal").style.display = "flex";
}

function closeSignup() {
  document.getElementById("signupModal").style.display = "none";
}

async function submitSignup(e) {
  if (e && e.preventDefault) e.preventDefault();
  const name = document.getElementById("signup-name").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const confirm = document.getElementById("confirm").value;
  const msg = document.getElementById("signup-response");
  const progressFill = document.getElementById("progress-fill");
  const spinner = document.getElementById("signup-spinner");
  const btn = document.getElementById("signup-submit-btn");
  const altBtn = document.getElementById("signup-alt-signin-btn");

 
  document.getElementById("signup-password").addEventListener("focus", () => {
    msg.textContent = "";
  });

  document.getElementById("confirm").addEventListener("focus", () => {
    msg.textContent = "";
  });

  msg.style.display = "block";


  if (confirm !== password) {
    msg.style.color = "red";
    msg.textContent = "Passwords do not match!";
    return;
  }

  if (confirm.length < 8) {
    msg.style.color = "red";
    msg.textContent = "Password must be at least 8 characters long!";
    return;
  }

 
  let progress = 0;
  const interval = setInterval(() => {
    if (progress < 90) {
      progress += 10;
      if (progressFill) progressFill.style.width = `${progress}%`;  // optional element
    }
  }, 300);

  
  if (spinner) spinner.style.display = "inline-block";
  if (btn) { btn.disabled = true; btn.style.display = "none"; }
  if (altBtn) { altBtn.disabled = true; altBtn.style.display = "none"; }
  const bases = [AUTH_BASE];
  let success = false;
  let lastErr;
  for (const base of bases) {
    try {
      const response = await fetch(`${base}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      clearInterval(interval);
      if (progressFill) progressFill.style.width = "100%";
      const result = await response.json();
      if (response.ok) {
        msg.style.color = "lightgreen";
        msg.textContent = result.message;
        success = true;
        break;
      } else {
        msg.style.color = "red";
        msg.textContent = result.detail;
        success = true;
        break;
      }
    } catch (err) {
      lastErr = err;
    }
  }
  if (!success) {
    msg.style.color = "red";
    msg.textContent = "Failed to connect to auth server.";
    console.error("Signup error:", lastErr);
  }
  if (spinner) spinner.style.display = "none";
  if (btn) { btn.disabled = false; btn.style.display = ""; }
  if (altBtn) { altBtn.disabled = false; altBtn.style.display = ""; }
}

// -------------------- Upload & Redaction --------------------
document.addEventListener("DOMContentLoaded", () => {
  const dropArea = document.getElementById("drop-area");
  const inputFile = document.getElementById("input-file");
  const imgView = document.getElementById("img-view");
  const redactBtn = document.getElementById("redact-btn") || document.querySelector(".Redact");
  const previewBtn = document.getElementById("preview-btn");

  if (!dropArea || !inputFile || !imgView || !redactBtn) return;

  const setPreview = (file) => {
    if (!file) return;
    imgView.innerHTML = `<p>${file.name}</p><span>${(file.size/1024/1024).toFixed(2)} MB</span>`;
  };

  dropArea.addEventListener("click", () => inputFile.click());
  inputFile.addEventListener("change", () => setPreview(inputFile.files[0]));

  ;["dragover", "dragenter"].forEach(evt => {
    dropArea.addEventListener(evt, (e) => { e.preventDefault(); });
  });
  dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      inputFile.files = e.dataTransfer.files;
      setPreview(inputFile.files[0]);
    }
  });

  const uploadDoc = async () => {
    const file = inputFile.files && inputFile.files[0];
    if (!file) {
      alert("Please select a .doc or .docx file.");
      return;
    }
    const allowed = [".doc", ".docx"];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowed.includes(ext)) {
      alert("Only .doc or .docx files are allowed.");
      return;
    }

   
    sessionStorage.setItem('pendingUpload', 'true');
    localStorage.setItem('pendingUpload', 'true');
    sessionStorage.setItem('uploadFileName', file.name);
    sessionStorage.setItem('uploadTimestamp', Date.now().toString());
  
    localStorage.removeItem('redactedFileUrl');
    localStorage.removeItem('piiCount');
    localStorage.removeItem('uploadError');
    
    
    const downloadWin = window.open("download.html", "_blank");
    
   
    const form = new FormData();
    form.append("file", file, file.name);

    (async () => {
      try {
        const resp = await fetchWithFallback(`/upload-doc/`, { method: "POST", body: form });
        if (!resp.ok) {
          let msg = "Upload failed";
          try {
            const data = await resp.json();
            msg = data.detail || msg;
          } catch (_) {}
          throw new Error(msg);
        }
        const data = await resp.json();
        const url = data.redacted_url;
        const apiOrigin = (() => {
          try { return new URL(resp.url).origin; } catch (_) { return API_BASE; }
        })();
        const fullUrl = `${apiOrigin}${url}`;
        const piiCount = data.pii_count !== undefined ? data.pii_count : 0;

        localStorage.setItem('redactedFileUrl', fullUrl);
        localStorage.setItem('piiCount', piiCount.toString());
        localStorage.setItem('uploadSessionId', sessionStorage.getItem('uploadTimestamp') || Date.now().toString());
        sessionStorage.removeItem('pendingUpload');
        sessionStorage.removeItem('uploadError');
        localStorage.removeItem('pendingUpload');
        localStorage.removeItem('uploadError');

        console.log('Upload completed in background:', fullUrl, piiCount);
        try { downloadWin && downloadWin.postMessage({ type: 'redactionComplete', fileUrl: fullUrl, piiCount }, "*"); } catch (_) {}
      } catch (err) {
        console.error('Upload/Redaction error:', err);
        const message = (err && err.message) ? err.message : "Failed to upload/redact";
        // sessionStorage isn't shared with download.html tab, so use localStorage + postMessage.
        localStorage.setItem('uploadError', message);
        try { downloadWin && downloadWin.postMessage({ type: 'redactionError', message }, "*"); } catch (_) {}
        sessionStorage.setItem('uploadError', message);
        sessionStorage.removeItem('pendingUpload');
        localStorage.removeItem('pendingUpload');
      }
    })();
  };

  redactBtn.addEventListener("click", uploadDoc);

  const modal = document.getElementById("preview-modal");
  const content = document.getElementById("preview-content");
  const close1 = document.getElementById("preview-close");
  const close2 = document.getElementById("preview-close-2");
  const hideModal = () => { if (modal) modal.style.display = "none"; };
  if (close1) close1.addEventListener("click", hideModal);
  if (close2) close2.addEventListener("click", hideModal);
  if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) hideModal(); });

  const renderPreview = async () => {
    const file = inputFile.files && inputFile.files[0];
    if (!file) { alert("Please select a document first."); return; }
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!modal || !content) return;
    modal.style.display = "flex";
    content.innerHTML = `<p style="color:#444;">Loading preview…</p>`;

    if (ext !== ".docx") {
      content.innerHTML = `<p style="color:#b00020;"><b>Preview is available for .docx only.</b> You can still redact .doc files.</p>`;
      return;
    }

    try {
      const ab = await file.arrayBuffer();
      if (!window.mammoth || !window.mammoth.convertToHtml) {
        content.innerHTML = `<p style="color:#b00020;"><b>Preview library failed to load.</b></p>`;
        return;
      }
      const result = await window.mammoth.convertToHtml({ arrayBuffer: ab });
      const html = result?.value || "<p>(No preview content)</p>";
      content.innerHTML = `<div style="line-height:1.55;">${html}</div>`;
    } catch (err) {
      console.error("Preview error:", err);
      content.innerHTML = `<p style="color:#b00020;"><b>Failed to render preview.</b> ${String(err?.message || err)}</p>`;
    }
  };

  if (previewBtn) previewBtn.addEventListener("click", renderPreview);
});
