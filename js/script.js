lucide.createIcons();

const modal = document.getElementById("hours-modal");

document.querySelector(".hours-link").addEventListener("click", () => {
  modal.showModal();
  requestAnimationFrame(() => modal.classList.add("is-open"));
});

document.querySelector(".modal-ok").addEventListener("click", () => {
  modal.classList.remove("is-open");
  modal.addEventListener("transitionend", () => modal.close(), { once: true });
});
