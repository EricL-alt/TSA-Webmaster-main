/* FILTERING */
const filterButtons = document.querySelectorAll(".filter-btn");
const cards = document.querySelectorAll(".resource-card");

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const filter = btn.dataset.filter;

    cards.forEach(card => {
      card.style.display =
        filter === "all" || card.dataset.category === filter
          ? "block"
          : "none";
    });
  });
});

/* READ MORE */
document.querySelectorAll(".read-more").forEach(btn => {
  btn.addEventListener("click", () => {
    const more = btn.nextElementSibling;
    const open = more.style.display === "block";
    more.style.display = open ? "none" : "block";
    btn.textContent = open ? "READ MORE" : "READ LESS";
  });
});