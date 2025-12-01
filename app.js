// Simple front-end "database" using localStorage
const STORAGE_KEY_USERS = "careerfolio_users";
const STORAGE_KEY_SESSION = "careerfolio_current_user";

const ETSU_DOMAIN = "@etsu.edu";
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB for resume
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB for intro video

// Helpers
function getUsers() {
  const raw = localStorage.getItem(STORAGE_KEY_USERS);
  return raw ? JSON.parse(raw) : [];
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
}

function setCurrentUser(email) {
  localStorage.setItem(STORAGE_KEY_SESSION, email);
}

function getCurrentUserEmail() {
  return localStorage.getItem(STORAGE_KEY_SESSION);
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY_SESSION);
}

// Notification elements
const notification = document.getElementById("notification");
const notificationMessage = document.getElementById("notification-message");
const notificationClose = document.getElementById("notification-close");
let notificationTimeoutId = null;

function showNotification(message, type = "success") {
  notificationMessage.textContent = message;
  notification.classList.remove("hidden", "success", "error");
  notification.classList.add(type);

  if (notificationTimeoutId) {
    clearTimeout(notificationTimeoutId);
  }

  notificationTimeoutId = setTimeout(() => {
    hideNotification();
  }, 10000);
}

function hideNotification() {
  notification.classList.add("hidden");
  notification.classList.remove("success", "error");
  if (notificationTimeoutId) {
    clearTimeout(notificationTimeoutId);
    notificationTimeoutId = null;
  }
}

notificationClose.addEventListener("click", () => {
  hideNotification();
});

// UI elements
const loginCard = document.getElementById("login-card");
const signupCard = document.getElementById("signup-card");
const authSection = document.getElementById("auth-section");
const dashboardSection = document.getElementById("dashboard-section");

const goToSignupBtn = document.getElementById("go-to-signup");
const goToLoginBtn = document.getElementById("go-to-login");
const logoutBtn = document.getElementById("logout-btn");

const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const resumeForm = document.getElementById("resume-form");
const videoForm = document.getElementById("video-form");

const loginError = document.getElementById("login-error");
const signupError = document.getElementById("signup-error");
const signupSuccess = document.getElementById("signup-success");
const resumeError = document.getElementById("resume-error");
const resumeSuccess = document.getElementById("resume-success");
const videoError = document.getElementById("video-error");
const videoSuccess = document.getElementById("video-success");

const welcomeText = document.getElementById("welcome-text");
const resumeFilenameSpan = document.getElementById("resume-filename");
const resumeStatusSpan = document.getElementById("resume-status");
const resumeUpdatedSpan = document.getElementById("resume-updated");
const resumeFileInput = document.getElementById("resume-file");
const resumeCancelBtn = document.getElementById("resume-cancel-btn");

const videoFilenameSpan = document.getElementById("video-filename");
const videoStatusSpan = document.getElementById("video-status");
const videoUpdatedSpan = document.getElementById("video-updated");
const videoFileInput = document.getElementById("video-file");
const videoCancelBtn = document.getElementById("video-cancel-btn");

// Tabs
const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");

// Navigation between login and signup
goToSignupBtn.addEventListener("click", () => {
  loginCard.classList.add("hidden");
  signupCard.classList.remove("hidden");
  loginError.textContent = "";
});

goToLoginBtn.addEventListener("click", () => {
  signupCard.classList.add("hidden");
  loginCard.classList.remove("hidden");
  signupError.textContent = "";
  signupSuccess.textContent = "";
});

// Signup handler
signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  signupError.textContent = "";
  signupSuccess.textContent = "";

  const first = document.getElementById("signup-first").value.trim();
  const last = document.getElementById("signup-last").value.trim();
  const email = document.getElementById("signup-email").value.trim().toLowerCase();
  const password = document.getElementById("signup-password").value;
  const confirm = document.getElementById("signup-confirm").value;

  if (!first || !last) {
    signupError.textContent = "Please enter your first and last name.";
    return;
  }

  if (!email.endsWith(ETSU_DOMAIN)) {
    signupError.textContent = `You must use an ETSU email ending in ${ETSU_DOMAIN}.`;
    return;
  }

  if (password !== confirm) {
    signupError.textContent = "Passwords do not match.";
    return;
  }

  let users = getUsers();
  const existing = users.find((u) => u.email === email);
  if (existing) {
    signupError.textContent = "An account with this email already exists. Please log in.";
    return;
  }

  const newUser = {
    first,
    last,
    email,
    password, // demo only
    resume: null, // { filename, status, updatedAt }
    video: null,  // { filename, status, updatedAt }
  };

  users.push(newUser);
  saveUsers(users);

  signupSuccess.textContent = "Account created successfully. You can now log in.";
  signupForm.reset();
});

// Login handler
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  loginError.textContent = "";

  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;

  const users = getUsers();
  const user = users.find((u) => u.email === email);

  if (!user) {
    loginError.textContent = "No account found for this email. Please create an account first.";
    return;
  }

  if (user.password !== password) {
    loginError.textContent = "Incorrect password. Please try again.";
    return;
  }

  setCurrentUser(email);
  loginForm.reset();
  showDashboard();
});

// Logout handler
logoutBtn.addEventListener("click", () => {
  clearSession();
  showAuth();
});

// Show auth UI
function showAuth() {
  authSection.classList.remove("hidden");
  dashboardSection.classList.add("hidden");
}

// Show dashboard UI
function showDashboard() {
  const email = getCurrentUserEmail();
  if (!email) {
    showAuth();
    return;
  }

  const users = getUsers();
  const user = users.find((u) => u.email === email);
  if (!user) {
    clearSession();
    showAuth();
    return;
  }

  welcomeText.textContent = `Welcome, ${user.first} ${user.last}`;
  populateResumeSection(user);
  populateVideoSection(user);

  activateTab("progress");

  authSection.classList.add("hidden");
  dashboardSection.classList.remove("hidden");
}

// Populate resume display
function populateResumeSection(user) {
  if (user.resume) {
    resumeFilenameSpan.textContent = user.resume.filename;
    resumeStatusSpan.textContent = user.resume.status;
    resumeUpdatedSpan.textContent = user.resume.updatedAt;

    if (user.resume.status === "Pending review") {
      resumeCancelBtn.classList.remove("hidden");
    } else {
      resumeCancelBtn.classList.add("hidden");
    }
  } else {
    resumeFilenameSpan.textContent = "None uploaded";
    resumeStatusSpan.textContent = "N/A";
    resumeUpdatedSpan.textContent = "N/A";
    resumeCancelBtn.classList.add("hidden");
  }
  resumeError.textContent = "";
  resumeSuccess.textContent = "";
  resumeFileInput.value = "";
}

// Populate video display
function populateVideoSection(user) {
  if (user.video) {
    videoFilenameSpan.textContent = user.video.filename;
    videoStatusSpan.textContent = user.video.status;
    videoUpdatedSpan.textContent = user.video.updatedAt;

    if (user.video.status === "Pending review") {
      videoCancelBtn.classList.remove("hidden");
    } else {
      videoCancelBtn.classList.add("hidden");
    }
  } else {
    videoFilenameSpan.textContent = "None uploaded";
    videoStatusSpan.textContent = "N/A";
    videoUpdatedSpan.textContent = "N/A";
    videoCancelBtn.classList.add("hidden");
  }
  videoError.textContent = "";
  videoSuccess.textContent = "";
  videoFileInput.value = "";
}

// Handle resume upload
resumeForm.addEventListener("submit", (e) => {
  e.preventDefault();
  resumeError.textContent = "";
  resumeSuccess.textContent = "";

  const email = getCurrentUserEmail();
  if (!email) {
    resumeError.textContent = "Your session has expired. Please log in again.";
    showAuth();
    return;
  }

  const file = resumeFileInput.files[0];
  if (!file) {
    resumeError.textContent = "Please choose a PDF file before submitting.";
    return;
  }

  const isPdfByType = file.type === "application/pdf";
  const isPdfByName = file.name.toLowerCase().endsWith(".pdf");

  if (!isPdfByType && !isPdfByName) {
    resumeError.textContent = "Only PDF resumes are allowed.";
    return;
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    resumeError.textContent = "File is too large. Maximum allowed size is 2 MB.";
    return;
  }

  const users = getUsers();
  const userIndex = users.findIndex((u) => u.email === email);
  if (userIndex === -1) {
    resumeError.textContent = "User not found. Please log in again.";
    clearSession();
    showAuth();
    return;
  }

  const now = new Date();
  const updatedAt = now.toLocaleString();

  users[userIndex].resume = {
    filename: file.name,
    status: "Pending review",
    updatedAt,
  };

  saveUsers(users);

  resumeSuccess.textContent = "Resume uploaded successfully and sent for review.";
  populateResumeSection(users[userIndex]);
  showNotification("Resume submitted successfully. Awaiting approval from Admin.", "success");
});

// Handle video upload
videoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  videoError.textContent = "";
  videoSuccess.textContent = "";

  const email = getCurrentUserEmail();
  if (!email) {
    videoError.textContent = "Your session has expired. Please log in again.";
    showAuth();
    return;
  }

  const file = videoFileInput.files[0];
  if (!file) {
    videoError.textContent = "Please choose an MP4 video before submitting.";
    return;
  }

  const isMp4ByType = file.type === "video/mp4";
  const isMp4ByName = file.name.toLowerCase().endsWith(".mp4");

  if (!isMp4ByType && !isMp4ByName) {
    videoError.textContent = "Only MP4 videos are allowed.";
    return;
  }

  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    videoError.textContent = "File is too large. Maximum allowed size is 50 MB.";
    return;
  }

  const users = getUsers();
  const userIndex = users.findIndex((u) => u.email === email);
  if (userIndex === -1) {
    videoError.textContent = "User not found. Please log in again.";
    clearSession();
    showAuth();
    return;
  }

  const now = new Date();
  const updatedAt = now.toLocaleString();

  users[userIndex].video = {
    filename: file.name,
    status: "Pending review",
    updatedAt,
  };

  saveUsers(users);

  videoSuccess.textContent = "Introduction video uploaded successfully and sent for review.";
  populateVideoSection(users[userIndex]);
  showNotification("Introduction video submitted successfully. Awaiting approval from Admin.", "success");
});

// Cancel pending resume
resumeCancelBtn.addEventListener("click", () => {
  const email = getCurrentUserEmail();
  if (!email) {
    showNotification("Session expired. Please log in again.", "error");
    showAuth();
    return;
  }

  const users = getUsers();
  const userIndex = users.findIndex((u) => u.email === email);
  if (userIndex === -1) {
    showNotification("User not found. Please log in again.", "error");
    clearSession();
    showAuth();
    return;
  }

  users[userIndex].resume = null;
  saveUsers(users);
  populateResumeSection(users[userIndex]);
  showNotification("Pending resume has been cancelled.", "success");
});

// Cancel pending video
videoCancelBtn.addEventListener("click", () => {
  const email = getCurrentUserEmail();
  if (!email) {
    showNotification("Session expired. Please log in again.", "error");
    showAuth();
    return;
  }

  const users = getUsers();
  const userIndex = users.findIndex((u) => u.email === email);
  if (userIndex === -1) {
    showNotification("User not found. Please log in again.", "error");
    clearSession();
    showAuth();
    return;
  }

  users[userIndex].video = null;
  saveUsers(users);
  populateVideoSection(users[userIndex]);
  showNotification("Pending video has been cancelled.", "success");
});

// Tabs: Progress / Analytics / Inbox
function activateTab(tabName) {
  tabButtons.forEach((btn) => {
    if (btn.dataset.tab === tabName) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  tabPanels.forEach((panel) => {
    if (panel.id === `tab-${tabName}`) {
      panel.classList.add("active");
    } else {
      panel.classList.remove("active");
    }
  });
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tabName = btn.dataset.tab;
    activateTab(tabName);
  });
});

// Initialize app
(function init() {
  const email = getCurrentUserEmail();
  if (email) {
    showDashboard();
  } else {
    showAuth();
  }
})();
