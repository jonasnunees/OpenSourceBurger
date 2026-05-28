lucide.createIcons();

// ── Modal de horários ──
const modal = document.getElementById("hours-modal");

document.querySelector(".hours-link").addEventListener("click", () => {
  modal.showModal();
  requestAnimationFrame(() => modal.classList.add("is-open"));
});

document.querySelector(".modal-ok").addEventListener("click", () => {
  modal.classList.remove("is-open");
  modal.addEventListener("transitionend", () => modal.close(), { once: true });
});

// ── Drawer ──
const drawer = document.getElementById("drawer");
const overlay = document.getElementById("drawer-overlay");
const menuBtn = document.getElementById("menu-btn");

function openDrawer() {
  drawer.classList.add("is-open");
  overlay.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeDrawer() {
  drawer.classList.remove("is-open");
  overlay.classList.remove("is-open");
  document.body.style.overflow = "";
}

menuBtn.addEventListener("click", openDrawer);
overlay.addEventListener("click", closeDrawer);