const AUTH_BASE = "http://127.0.0.1:8000"; 
const API_BASE  = "http://127.0.0.1:8000"; 

function openLogin() {
  document.getElementById("login-modal").style.display = "flex";
}

function closeLogin() {
  document.getElementById("login-modal").style.display = "none";
}

async function handleLogin(e) {
  if (e && e.preventDefault) e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  const error = document.getElementById("login-error");
  const spinner = document.getElementById("login-spinner");
  const btn = document.getElementById("login-submit-btn");

  if (spinner) spinner.style.display = "inline-block";
  if (btn) { btn.disabled = true; btn.style.display = "none"; }

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
        window.location.href = "upload.html";
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
    sessionStorage.setItem('uploadFileName', file.name);
    sessionStorage.setItem('uploadTimestamp', Date.now().toString());
  
    localStorage.removeItem('redactedFileUrl');
    localStorage.removeItem('piiCount');
    
    
    const downloadWin = window.open("download.html", "_blank");
    
   
    const form = new FormData();
    form.append("file", file, file.name);

    fetch(`${API_BASE}/upload-doc/`, {
      method: "POST",
      body: form
    })
    .then(resp => {
      if (!resp.ok) {
        return resp.json().then(data => {
          throw new Error(data.detail || "Upload failed");
        });
      }
      return resp.json();
    })
    .then(data => {
      const url = data.redacted_url;
      const fullUrl = `${API_BASE}${url}`;
      const piiCount = data.pii_count !== undefined ? data.pii_count : 0;
      
      
      localStorage.setItem('redactedFileUrl', fullUrl);
      localStorage.setItem('piiCount', piiCount.toString());
      localStorage.setItem('uploadSessionId', sessionStorage.getItem('uploadTimestamp') || Date.now().toString());
      sessionStorage.removeItem('pendingUpload');
      sessionStorage.removeItem('uploadError');
      
      console.log('Upload completed in background:', fullUrl, piiCount);
      
      try { downloadWin && downloadWin.postMessage({ type: 'redactionComplete', fileUrl: fullUrl, piiCount }, "*"); } catch (_) {}
    })
    .catch(err => {
      console.error('Upload/Redaction error:', err);
      sessionStorage.setItem('uploadError', err.message || "Failed to upload/redact");
      sessionStorage.removeItem('pendingUpload');
    });
  };

  redactBtn.addEventListener("click", uploadDoc);
});
