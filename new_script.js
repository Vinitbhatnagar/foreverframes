// ✅ Attach ASAP so share-target messages aren't missed
if ("serviceWorker" in navigator && navigator.serviceWorker) {
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type !== "SHARED_FILES") return;
    window.__MB_SHARED_FILES__ = event.data.files || [];
  });
}

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

window.addEventListener("DOMContentLoaded", () => {
  /* ======================================================
     SUPABASE
  ====================================================== */

  const supabase = createClient(
    "https://dhjgqadhjxvruyvkxdss.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoamdxYWRoanh2cnV5dmt4ZHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNzg4ODEsImV4cCI6MjA2OTk1NDg4MX0.t2fy8PixY3Od508Pzv-KGZbai0IotRqt9FOFPPkiQk0",
  );

  /* ======================================================
     LIMITS
  ====================================================== */
  const MAX_UPLOAD_BYTES = 300 * 1024 * 1024; // 300MB per item

  /* ======================================================
     ELEMENTS
  ====================================================== */

  const authSection = document.getElementById("authSection");
  const authTitle = document.getElementById("authTitle");
  const authButton = document.getElementById("authButton");
  const toggleAuth = document.getElementById("toggleAuth");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const togglePasswordBtn = document.getElementById("togglePassword");

  const app = document.getElementById("app");
  const toast = document.getElementById("toast");
  const gallery = document.getElementById("gallery");
  const uploadButton = document.getElementById("uploadButton");

  const profileMenu = document.getElementById("profileMenu");
  const profileOptions = document.getElementById("profileOptions");
  const signoutButton = document.getElementById("signoutButton");

  const imageModal = document.getElementById("imageModal");
  const modalImage = document.getElementById("modalImage");
  const modalVideo = document.getElementById("modalVideo");

  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const rotateBtn = document.getElementById("rotateBtn");
  const shareBtn = document.getElementById("shareBtn");
  const deleteBtn = document.getElementById("deleteBtn");

  const privacyToggle = document.getElementById("privacyToggle");

  const filterBar = document.getElementById("filterBar");
  const underline = document.getElementById("filterUnderline");
  const filterButtons = filterBar
    ? [...filterBar.querySelectorAll(".filter-btn")]
    : [];
  const scrollTopButton = document.getElementById("scrollTopButton");

  const selectionBar = document.getElementById("selectionBar");
  const selectedCount = document.getElementById("selectedCount");
  const shareSelectedBtn = document.getElementById("shareSelected");
  const downloadSelectedBtn = document.getElementById("downloadSelected");
  const cancelBtn = document.getElementById("cancelSelection");

  const pinGate = document.getElementById("pinGate");
  const pinTitle = document.getElementById("pinTitle");
  const pinHint = document.getElementById("pinHint");
  const pinInput = document.getElementById("pinInput");
  const pinSubmit = document.getElementById("pinSubmit");
  const pinReset = document.getElementById("pinReset");

  // Promise-based PIN modal
  const pinGateModal = document.getElementById("pinGateModal");
  const pinGateTitle = document.getElementById("pinGateTitle");
  const pinGateDesc = document.getElementById("pinGateDesc");
  const pinGateInput = document.getElementById("pinGateInput");
  const pinGateError = document.getElementById("pinGateError");
  const pinGateConfirm = document.getElementById("pinGateConfirm");
  const pinGateCancel = document.getElementById("pinGateCancel");
  const pinGateClose = document.getElementById("pinGateClose");
  const pinGateToggle = document.getElementById("pinGateToggle");

  // Reset PIN (Email OTP) UI
  const resetOtpModal = document.getElementById("resetOtpModal");
  const resetOtpEmail = document.getElementById("resetOtpEmail");
  const resetOtpCode = document.getElementById("resetOtpCode");
  const resetOtpError = document.getElementById("resetOtpError");
  const resetOtpStepSend = document.getElementById("resetOtpStepSend");
  const resetOtpStepVerify = document.getElementById("resetOtpStepVerify");
  const resetOtpSendBtn = document.getElementById("resetOtpSendBtn");
  const resetOtpVerifyBtn = document.getElementById("resetOtpVerifyBtn");
  const resetOtpResend = document.getElementById("resetOtpResend");
  const resetOtpClose = document.getElementById("resetOtpClose");
  const resetOtpCancel1 = document.getElementById("resetOtpCancel1");
  const resetOtpBack = document.getElementById("resetOtpBack");

  /* ======================================================
     STATE
  ====================================================== */

  let isLogin = true;
  let mediaList = [];
  let currentIndex = -1;
  let currentRotation = 0;

  let privacyEnabled = true;
  let currentFilter = "all";

  let selectionMode = false;
  let selectedItems = new Set();
  let pressTimer;

  let galleryUnlocked = false;

  // ✅ share-target queue (so user can login and still upload)
  let pendingSharedFiles = [];

  /* ======================================================
     HARD BLOCKS (optional, your choice)
  ====================================================== */
  document.addEventListener("contextmenu", (e) => e.preventDefault());
  document.addEventListener("dragstart", (e) => {
    if (e.target.tagName === "IMG") e.preventDefault();
  });
  document.addEventListener("selectstart", (e) => e.preventDefault());

  /* ======================================================
     HELPERS
  ====================================================== */
  async function ensureHeic2Any() {
    if (window.heic2any) return;

    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/heic2any/dist/heic2any.min.js";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.style.opacity = "1";
    setTimeout(() => (toast.style.opacity = "0"), 1200);
  }

  function setPrivacy(enabled) {
    privacyEnabled = enabled;
    document.body.classList.toggle("privacy-on", privacyEnabled);
  }

  function stopVideo() {
    if (!modalVideo) return;
    modalVideo.pause();
    modalVideo.currentTime = 0;
    modalVideo.removeAttribute("src");
    modalVideo.load();
  }

  function padNumber(num, size = 3) {
    return String(num).padStart(size, "0");
  }

  function extractIndex(name) {
    const match = name.match(/memories-of-us-(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
  }

  async function sha256(text) {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return [...new Uint8Array(buf)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function reversePin(pin) {
    return String(pin).split("").reverse().join("");
  }

  function normalizePin(raw) {
    return String(raw || "")
      .trim()
      .replace(/\s+/g, "");
  }

  function showPinGate(show) {
    if (!pinGate) return;
    if (show) {
      pinGate.classList.remove("hidden");
      pinGate.style.display = "flex";
    } else {
      pinGate.classList.add("hidden");
      pinGate.style.display = "none";
    }
  }

  /* ======================================================
     AUTH READY (important for share-target)
     - When app is opened via share, auth restoration can lag.
  ====================================================== */
  async function waitForSessionRestore(timeoutMs = 2500) {
    const started = Date.now();

    // try immediately
    const s1 = await supabase.auth.getSession();
    if (s1?.data?.session) return s1.data.session;

    // wait for onAuthStateChange OR timeout
    return await new Promise((resolve) => {
      const { data: sub } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (session) {
            sub.subscription?.unsubscribe?.();
            resolve(session);
          }
        },
      );

      const tick = setInterval(async () => {
        const s = await supabase.auth.getSession();
        if (s?.data?.session) {
          clearInterval(tick);
          sub.subscription?.unsubscribe?.();
          resolve(s.data.session);
        } else if (Date.now() - started > timeoutMs) {
          clearInterval(tick);
          sub.subscription?.unsubscribe?.();
          resolve(null);
        }
      }, 150);
    });
  }

  async function getUserSafe() {
    // wait a bit for session restore (helps share-target)
    await waitForSessionRestore(2500);
    const { data } = await supabase.auth.getUser();
    return data?.user || null;
  }

  /* ======================================================
     RESET PIN MODAL
  ====================================================== */

  function openResetOtpModal(email) {
    if (!resetOtpModal) return;
    resetOtpEmail.value = email || "";
    resetOtpCode.value = "";
    resetOtpError.classList.add("hidden");
    resetOtpError.textContent = "";

    resetOtpStepSend.classList.remove("hidden");
    resetOtpStepVerify.classList.add("hidden");

    resetOtpModal.classList.remove("hidden");
    resetOtpModal.classList.add("flex");
  }

  function closeResetOtpModal() {
    resetOtpModal?.classList.add("hidden");
    resetOtpModal?.classList.remove("flex");
  }

  function showResetOtpError(msg) {
    resetOtpError.textContent = msg;
    resetOtpError.classList.remove("hidden");
  }

  resetOtpClose?.addEventListener("click", closeResetOtpModal);
  resetOtpCancel1?.addEventListener("click", closeResetOtpModal);
  resetOtpModal?.addEventListener("click", (e) => {
    if (e.target === resetOtpModal) closeResetOtpModal();
  });

  resetOtpBack?.addEventListener("click", () => {
    resetOtpError.classList.add("hidden");
    resetOtpStepVerify.classList.add("hidden");
    resetOtpStepSend.classList.remove("hidden");
  });

  async function sendResetOtp(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) throw error;

    resetOtpStepSend.classList.add("hidden");
    resetOtpStepVerify.classList.remove("hidden");
    resetOtpCode.value = "";
    resetOtpCode.focus();
  }

  async function verifyResetOtpAndReset(email, code) {
    const token = (code || "").trim();
    if (!/^\d{6}$/.test(token)) {
      showResetOtpError("Enter the 6-digit code.");
      return;
    }

    const { error: verifyErr } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (verifyErr) {
      showResetOtpError("Invalid or expired code. Try again.");
      return;
    }

    const user = await getUserSafe();
    if (!user) {
      showResetOtpError("Session missing. Please login again.");
      return;
    }

    const { error: delErr } = await supabase
      .from("user_pins")
      .delete()
      .eq("user_id", user.id);

    if (delErr) {
      showResetOtpError("Reset failed: " + delErr.message);
      return;
    }

    closeResetOtpModal();
    showToast("✅ PIN reset. Set a new PIN.");
    await requirePinAndUnlock(user);
  }

  pinReset?.addEventListener("click", async (e) => {
    e.preventDefault();
    const user = await getUserSafe();
    if (!user?.email) return showToast("Please login first.");
    openResetOtpModal(user.email);
  });

  resetOtpSendBtn?.addEventListener("click", async () => {
    try {
      resetOtpSendBtn.disabled = true;
      await sendResetOtp(resetOtpEmail.value);
      showToast("📩 Code sent to your email");
    } catch (err) {
      showToast(err.message || "Failed to send code");
    } finally {
      resetOtpSendBtn.disabled = false;
    }
  });

  resetOtpResend?.addEventListener("click", async () => {
    try {
      await sendResetOtp(resetOtpEmail.value);
      showToast("📩 Code re-sent");
    } catch (err) {
      showToast(err.message || "Failed to resend");
    }
  });

  resetOtpVerifyBtn?.addEventListener("click", async () => {
    await verifyResetOtpAndReset(resetOtpEmail.value, resetOtpCode.value);
  });

  /* ======================================================
     PIN GATE MODAL (promise)
  ====================================================== */

  function openPinGateModal({
    title = "Enter PIN",
    desc = "",
    confirmText = "Confirm",
  } = {}) {
    return new Promise((resolve) => {
      if (
        !pinGateModal ||
        !pinGateTitle ||
        !pinGateDesc ||
        !pinGateConfirm ||
        !pinGateCancel ||
        !pinGateClose ||
        !pinGateToggle ||
        !pinGateError ||
        !pinGateInput
      ) {
        showToast("UI error: PIN modal missing");
        return resolve(null);
      }

      pinGateTitle.textContent = title;
      pinGateDesc.textContent = desc;
      pinGateConfirm.textContent = confirmText;

      pinGateInput.value = "";
      pinGateInput.type = "password";
      pinGateToggle.textContent = "👁️";
      pinGateError.classList.add("hidden");
      pinGateError.textContent = "";

      pinGateModal.classList.remove("hidden");
      pinGateModal.classList.add("flex");
      setTimeout(() => pinGateInput.focus(), 50);

      let done = false;
      const finish = (value) => {
        if (done) return;
        done = true;

        pinGateModal.classList.add("hidden");
        pinGateModal.classList.remove("flex");

        pinGateConfirm.onclick = null;
        pinGateCancel.onclick = null;
        pinGateClose.onclick = null;
        pinGateModal.onclick = null;
        document.removeEventListener("keydown", onKeyDown);

        resolve(value);
      };

      const onKeyDown = (e) => {
        if (e.key === "Escape") finish(null);
        if (e.key === "Enter") pinGateConfirm.click();
      };
      document.addEventListener("keydown", onKeyDown);

      pinGateToggle.onclick = () => {
        const isPwd = pinGateInput.type === "password";
        pinGateInput.type = isPwd ? "text" : "password";
        pinGateToggle.textContent = isPwd ? "🙈" : "👁️";
      };

      pinGateConfirm.onclick = () => finish(pinGateInput.value.trim());
      pinGateCancel.onclick = () => finish(null);
      pinGateClose.onclick = () => finish(null);

      pinGateModal.onclick = (e) => {
        if (e.target === pinGateModal) finish(null);
      };
    });
  }

  function pinGateSetError(msg) {
    if (!pinGateError) return;
    pinGateError.textContent = msg;
    pinGateError.classList.remove("hidden");
  }

  /* ======================================================
     PIN SYNC (DB)
  ====================================================== */

  async function getUserPins(userId) {
    const { data, error } = await supabase
      .from("user_pins")
      .select("view_pin_hash, delete_pin_hash")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data; // null if not set
  }

  async function setUserPins(userId, viewPin) {
    const viewHash = await sha256(viewPin);
    const delHash = await sha256(reversePin(viewPin));

    const { error } = await supabase.from("user_pins").upsert({
      user_id: userId,
      view_pin_hash: viewHash,
      delete_pin_hash: delHash,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  }

  async function requirePinAndUnlock(user) {
    galleryUnlocked = false;

    const pins = await getUserPins(user.id);

    showPinGate(true);
    pinInput.value = "";

    // First-time setup
    if (!pins) {
      pinTitle.textContent = "Create PIN";
      pinHint.textContent =
        "Set a 4-digit PIN to view memories (delete PIN will be its reverse).";
      pinSubmit.textContent = "Set PIN";

      pinSubmit.onclick = async () => {
        const pin = normalizePin(pinInput.value);
        if (!/^\d{4}$/.test(pin)) return showToast("Enter exactly 4 digits");

        await setUserPins(user.id, pin);

        showToast("✅ PIN set & synced");
        showPinGate(false);
        galleryUnlocked = true;
        await loadGallery();
      };

      return;
    }

    // Normal unlock
    pinTitle.textContent = "Enter PIN";
    pinHint.textContent = "Enter your 4-digit PIN to view memories.";
    pinSubmit.textContent = "Unlock";

    pinSubmit.onclick = async () => {
      const pin = normalizePin(pinInput.value);
      if (!/^\d{4}$/.test(pin)) return showToast("Enter exactly 4 digits");

      const h = await sha256(pin);
      if (h !== pins.view_pin_hash) return showToast("❌ Wrong PIN");

      showToast("🔓 Unlocked");
      showPinGate(false);
      galleryUnlocked = true;
      await loadGallery();
    };
  }

  /* ======================================================
     AUTH UI
  ====================================================== */

  toggleAuth.onclick = () => {
    isLogin = !isLogin;
    authTitle.textContent = isLogin ? "Login" : "Sign Up";
    authButton.textContent = isLogin ? "Login" : "Sign Up";
    toggleAuth.textContent = isLogin
      ? "Don't have an account? Sign up"
      : "Already have an account? Login";
  };

  togglePasswordBtn.onclick = () => {
    const hidden = passwordInput.type === "password";
    passwordInput.type = hidden ? "text" : "password";
    togglePasswordBtn.textContent = hidden ? "🙈" : "🧿";
  };

  authButton.onclick = async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) return showToast("Fill all fields");

    const { data, error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) return showToast(error.message);

    // ✅ init + upload queued share files after login
    if (data.user) await initApp();
  };

  signoutButton.onclick = async () => {
    await supabase.auth.signOut();
    location.reload();
  };

  profileMenu.onclick = () => {
    profileOptions.classList.toggle("opacity-0");
    profileOptions.classList.toggle("invisible");
    profileOptions.classList.toggle("pointer-events-none");
  };

  /* ======================================================
     PRIVACY + FILTER UI
  ====================================================== */

  privacyToggle?.addEventListener("click", () => {
    setPrivacy(!privacyEnabled);
  });

  function setActive(activeBtn) {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    activeBtn.classList.add("active");
    moveUnderline(activeBtn);
  }

  function moveUnderline(btn) {
    if (!underline || !filterBar) return;
    const rect = btn.getBoundingClientRect();
    const parentRect = filterBar.getBoundingClientRect();
    underline.style.width = `${rect.width}px`;
    underline.style.transform = `translateX(${rect.left - parentRect.left}px)`;
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentFilter = btn.dataset.filter;
      setActive(btn);
      loadGallery();
    });
  });

  /* ======================================================
     SCROLL TOP
  ====================================================== */
  window.addEventListener("scroll", () => {
    if (!scrollTopButton) return;
    if (window.scrollY > 300) {
      scrollTopButton.style.opacity = "1";
      scrollTopButton.style.pointerEvents = "auto";
    } else {
      scrollTopButton.style.opacity = "0";
      scrollTopButton.style.pointerEvents = "none";
    }
  });

  scrollTopButton?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ======================================================
     UPLOAD (manual + share-target)
  ====================================================== */

  uploadButton.onclick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";
    input.multiple = true;
    input.onchange = () => input.files.length && handleFiles(input.files);
    input.click();
  };

  async function getNextIndex(userId) {
    const { data: files, error } = await supabase.storage
      .from("memories")
      .list(`${userId}/`, { limit: 1000 });

    if (error || !files) return 1;

    let maxIndex = 0;
    for (const file of files) {
      const idx = extractIndex(file.name);
      if (idx) maxIndex = Math.max(maxIndex, idx);
    }
    return maxIndex + 1;
  }

  async function handleFiles(filesLike) {
    const files = Array.from(filesLike || []);
    if (!files.length) return;

    const user = await getUserSafe();
    if (!user) {
      // queue for after login
      pendingSharedFiles.push(...files);
      showToast("Login first — your shared files are ready ✅");
      return;
    }

    let counter = await getNextIndex(user.id);

    for (const file of files) {
      if (file.size > MAX_UPLOAD_BYTES) {
        showToast(`❌ ${file.name}: over 300MB`);
        continue;
      }

      let uploadFile = file;

      // HEIC → JPEG
      if (file.name.toLowerCase().endsWith(".heic")) {
        try {
          await ensureHeic2Any(); // lazy load only when needed

          const result = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.9,
          });

          // heic2any can return array or single blob
          const convertedBlob = Array.isArray(result) ? result[0] : result;

          // preserve original filename
          const newName = file.name.replace(/\.heic$/i, ".jpg");

          uploadFile = new File([convertedBlob], newName, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
        } catch (err) {
          console.error("HEIC conversion error:", err);
          showToast(`❌ HEIC convert failed: ${file.name}`);
          continue;
        }
      }

      const ext = uploadFile.name.split(".").pop().toLowerCase();
      const filename = `memories-of-us-${padNumber(counter)}.${ext}`;
      counter++;

      const path = `${user.id}/${filename}`;

      const { error } = await supabase.storage
        .from("memories")
        .upload(path, uploadFile, { upsert: false });

      if (error) {
        showToast(`❌ Failed: ${filename}`);
      } else {
        showToast(`✅ Uploaded ${filename}`);

        navigator.serviceWorker?.controller?.postMessage({
          type: "SHOW_NOTIFICATION",
          message: "Memory uploaded successfully 🚀",
        });
      }
    }

    // refresh only if gallery already unlocked
    if (galleryUnlocked) await loadGallery();
  }

  /* ======================================================
     PUBLIC URL (NO SIGNED URL)
  ====================================================== */
  function getPublicMediaUrl(userId, fileName) {
    const { data } = supabase.storage
      .from("memories")
      .getPublicUrl(`${userId}/${fileName}`);
    return data?.publicUrl || "";
  }

  /* ======================================================
     GALLERY (date grouped)
  ====================================================== */

  async function loadGallery() {
    if (!galleryUnlocked) return;
    gallery.innerHTML = "";
    mediaList = [];

    const user = await getUserSafe();
    if (!user) return;

    const { data: files, error } = await supabase.storage
      .from("memories")
      .list(`${user.id}/`, { limit: 1000 });

    if (error || !files) return;

    files.sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
    );

    const groups = {};
    for (const file of files) {
      const date = new Date(file.created_at || Date.now()).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(file);
    }

    for (const [date, items] of Object.entries(groups)) {
      const section = document.createElement("div");
      section.className = "gallery-section";

      let hasVisibleItems = false;

      for (const file of items) {
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (!ext) continue;

        const isVideo = ["mp4", "webm", "mov"].includes(ext);

        // filter first
        if (
          (currentFilter === "image" && isVideo) ||
          (currentFilter === "video" && !isVideo)
        ) {
          continue;
        }

        hasVisibleItems = true;

        const url = getPublicMediaUrl(user.id, file.name);
        if (!url) continue;

        const index =
          mediaList.push({
            url,
            isVideo,
            name: file.name,
            createdAt: file.created_at,
          }) - 1;

        const card = document.createElement("div");
        card.className = "image-card";
        card.dataset.type = isVideo ? "video" : "image";

        const startPress = () => {
          pressTimer = setTimeout(() => {
            enableSelectionMode();
            toggleSelect(index, card);
          }, 500);
        };
        const cancelPress = () => clearTimeout(pressTimer);

        card.addEventListener("touchstart", startPress);
        card.addEventListener("touchend", cancelPress);
        card.addEventListener("mousedown", startPress);
        card.addEventListener("mouseup", cancelPress);

        card.addEventListener("click", () => {
          if (selectionMode) toggleSelect(index, card);
          else openModal(index);
        });

        const media = document.createElement(isVideo ? "video" : "img");
        media.src = url;
        media.loading = "lazy";
        media.draggable = false;

        if (isVideo) {
          media.muted = true;
          media.playsInline = true;
          media.preload = "metadata";
        }

        card.appendChild(media);

        const time = document.createElement("div");
        time.className = "timestamp";
        time.textContent = new Date(file.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        card.appendChild(time);
        section.appendChild(card);
      }

      if (hasVisibleItems) {
        const header = document.createElement("h2");
        header.className = "date-header";
        header.textContent = date;
        gallery.appendChild(header);
        gallery.appendChild(section);
      }
    }

    const emptyPlaceholder = document.getElementById("emptyFolderPlaceholder");
    if (emptyPlaceholder) {
      emptyPlaceholder.style.display =
        gallery.children.length === 0 ? "flex" : "none";
    }
  }

  /* ======================================================
     MODAL
  ====================================================== */

  function openModal(index) {
    stopVideo();
    currentIndex = index;
    currentRotation = 0;

    const item = mediaList[index];
    if (!item) return;

    imageModal.classList.add("open");

    modalImage.style.display = item.isVideo ? "none" : "block";
    modalVideo.style.display = item.isVideo ? "block" : "none";

    modalImage.style.transform = "rotate(0deg)";
    modalVideo.style.transform = "rotate(0deg)";

    if (item.isVideo) {
      modalVideo.src = item.url;
      modalVideo.play().catch(() => {});
    } else {
      modalImage.src = item.url;
    }

    if (prevBtn) prevBtn.style.display = index === 0 ? "none" : "flex";
    if (nextBtn)
      nextBtn.style.display = index === mediaList.length - 1 ? "none" : "flex";
  }

  function closeModal() {
    stopVideo();
    imageModal.classList.remove("open");
    setPrivacy(privacyEnabled);
  }

  imageModal?.addEventListener("click", (e) => {
    if (e.target === imageModal) closeModal();
  });

  prevBtn?.addEventListener(
    "click",
    () => currentIndex > 0 && openModal(currentIndex - 1),
  );
  nextBtn?.addEventListener(
    "click",
    () => currentIndex < mediaList.length - 1 && openModal(currentIndex + 1),
  );

  rotateBtn?.addEventListener("click", () => {
    currentRotation += 90;
    const activeMedia =
      modalImage.style.display === "none" ? modalVideo : modalImage;
    activeMedia.style.transform = `rotate(${currentRotation}deg)`;
    if (Math.abs(currentRotation / 90) % 2 === 1) {
      activeMedia.style.maxWidth = "85vh";
      activeMedia.style.maxHeight = "90vw";
    } else {
      activeMedia.style.maxWidth = "90vw";
      activeMedia.style.maxHeight = "85vh";
    }
  });

  downloadBtn?.addEventListener("click", async () => {
    if (currentIndex < 0) return showToast("❌ Nothing selected");
    const item = mediaList[currentIndex];
    if (!item) return showToast("❌ Media missing");

    try {
      const res = await fetch(item.url);
      const blob = await res.blob();
      const a = document.createElement("a");
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      showToast(`⬇ Downloaded ${item.name}`);
    } catch {
      showToast("❌ Download failed");
    }
  });

  shareBtn?.addEventListener("click", async () => {
    if (currentIndex < 0) return;
    const item = mediaList[currentIndex];
    if (!item) return;

    try {
      const res = await fetch(item.url);
      const blob = await res.blob();
      const file = new File([blob], item.name, { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Shared from MemoryBox",
          files: [file],
        });
      } else {
        showToast("Sharing not supported");
      }
    } catch {
      showToast("Share failed");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!imageModal?.classList.contains("open")) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowLeft") prevBtn?.click();
    if (e.key === "ArrowRight") nextBtn?.click();
  });

  /* ======================================================
     DELETE (reverse PIN)
  ====================================================== */

  deleteBtn?.addEventListener("click", async () => {
    const user = await getUserSafe();
    if (!user) return showToast("Please login");

    const pins = await getUserPins(user.id);
    if (!pins) return showToast("PIN not set");

    const enteredRaw = await openPinGateModal({
      title: "Delete memory",
      desc: "Enter your DELETE PIN.",
      confirmText: "Delete",
    });

    if (enteredRaw === null) return;

    const entered = normalizePin(enteredRaw);
    if (!/^\d{4}$/.test(entered)) {
      pinGateSetError("Enter exactly 4 digits.");
      return;
    }

    const enteredHash = await sha256(entered);
    if (enteredHash !== pins.delete_pin_hash)
      return showToast("❌ Wrong delete PIN");

    const item = mediaList[currentIndex];
    if (!item?.name) return showToast("❌ Missing file");

    const path = `${user.id}/${item.name}`;
    const { error } = await supabase.storage.from("memories").remove([path]);
    if (error) return showToast("❌ Delete failed");

    showToast("🗑 Deleted");
    closeModal();
    await loadGallery();
  });

  /* ======================================================
     SELECTION MODE (unchanged)
  ====================================================== */

  function enableSelectionMode() {
    if (selectionMode) return;
    selectionMode = true;
    selectedItems.clear();
    selectionBar?.classList.add("active");
  }

  function exitSelectionMode() {
    selectionMode = false;
    selectedItems.clear();
    document
      .querySelectorAll(".image-card.selected")
      .forEach((card) => card.classList.remove("selected"));
    selectionBar?.classList.remove("active");
    if (selectedCount) selectedCount.textContent = "0 selected";
  }

  function toggleSelect(index, card) {
    if (selectedItems.has(index)) {
      selectedItems.delete(index);
      card.classList.remove("selected");
    } else {
      selectedItems.add(index);
      card.classList.add("selected");
    }

    const count = selectedItems.size;
    if (selectedCount) selectedCount.textContent = `${count} selected`;
    if (count === 0) exitSelectionMode();
    else selectionBar?.classList.add("active");
  }

  downloadSelectedBtn?.addEventListener("click", async () => {
    if (selectedItems.size === 0) return;

    for (const index of selectedItems) {
      const item = mediaList[index];
      const res = await fetch(item.url);
      const blob = await res.blob();

      const a = document.createElement("a");
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    }

    showToast("⬇ Downloaded selected");
    exitSelectionMode();
  });

  shareSelectedBtn?.addEventListener("click", async () => {
    if (selectedItems.size === 0) return;

    const filesToShare = [];
    for (const index of selectedItems) {
      const item = mediaList[index];
      const res = await fetch(item.url);
      const blob = await res.blob();
      filesToShare.push(new File([blob], item.name, { type: blob.type }));
    }

    if (navigator.canShare && navigator.canShare({ files: filesToShare })) {
      await navigator.share({
        title: "Shared from MemoryBox",
        files: filesToShare,
      });
    } else {
      showToast("Sharing not supported");
    }

    exitSelectionMode();
  });

  cancelBtn?.addEventListener("click", exitSelectionMode);

  /* ======================================================
     SHARE TARGET RECEIVE (FIXED: single listener)
  ====================================================== */
  if ("serviceWorker" in navigator && navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener("message", async (event) => {
      if (event.data?.type !== "SHARED_FILES") return;
      const files = event.data.files || [];
      if (!files.length) return;

      // Try upload immediately; if not logged in -> queued
      await handleFiles(files);
    });
  }

  /* ======================================================
     INIT
  ====================================================== */

  async function initApp() {
    authSection?.classList.add("hidden");
    app?.classList.remove("hidden");

    // Ask notifications once
    if ("Notification" in window && Notification.permission !== "granted") {
      try {
        await Notification.requestPermission();
      } catch {}
    }

    setPrivacy(true);

    const user = await getUserSafe();
    if (user) {
      await requirePinAndUnlock(user);

      // ✅ if share files were queued while logged out, upload now
      if (pendingSharedFiles.length) {
        const batch = pendingSharedFiles.slice();
        pendingSharedFiles = [];
        await handleFiles(batch);
      }
    }
  }

  // Auto init if already logged in (Supabase session is stored in localStorage by default)
  supabase.auth.getUser().then(async ({ data: { user } }) => {
    if (user) await initApp();
  });

  // If app opened from shortcut “Upload Memory”
  (async () => {
    const params = new URLSearchParams(location.search);
    if (params.get("action") === "upload") {
      const user = await getUserSafe();
      if (user) {
        // Don’t force unlock gate just to upload
        uploadButton?.click();
      }
    }
  })();
  // ✅ Consume any share files captured early
  if (window.__MB_SHARED_FILES__?.length) {
    const files = window.__MB_SHARED_FILES__;
    window.__MB_SHARED_FILES__ = [];
    handleFiles(files);
  }
});
