// FILTERING
const filterButtons = document.querySelectorAll(".filter-btn");
const cards = document.querySelectorAll(".service-card");
var filters = new Set();
filters.add("all")

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    //filterButtons.forEach(b => b.classList.remove("active"));
    if (!btn.classList.contains("active")){
      if (btn.dataset.filter == "all"){
        filterButtons.forEach(b => b.classList.remove("active"));
        filters.clear();
      }
      else{
        filters.delete("all");
        filterButtons.forEach(b => {
          if (b.dataset.filter == "all"){
          b.classList.remove("active")
          }
        });
      }
      btn.classList.add("active");
      filters.add(btn.dataset.filter);
    }
    else if(!(btn.dataset.filter == "all")){
      btn.classList.remove("active");
      filters.delete(btn.dataset.filter);

      if (filters.size === 0){
        filterButtons.forEach(b => {
          if (b.dataset.filter == "all"){
          b.classList.add("active")
          }
        });
        filters.add("all");
      }
    }

	searchBar.value='';

    cards.forEach(card => {
      var included = false;
      if(filters.has("all")){
        card.classList.remove('hidden');
        included = true;
      }

      const attributes=JSON.parse(card.dataset.categories);

      attributes.forEach(i => {
        if (filters.has(i)) {
          card.classList.remove('hidden');
          included = true;
        }
      });

      if(!included) {
        card.classList.add('hidden');
      }
    });
  });
});

function filterSuggestions() {
const searchTerm = document.getElementById('searchBar').value.toLowerCase();
const noResults = document.getElementById('noResults');

let visibleCount = 0;

cards.forEach(card => {
                const text = card.textContent.toLowerCase();

                const matchesSearch = text.includes(searchTerm);

                const attributes=JSON.parse(card.dataset.categories);

                var included = false;

                if(filters.has("all")){
                included = true;
                }

                attributes.forEach(i => {
                if (filters.has(i)) {
                included = true;
                }
                });

                if (matchesSearch) {
					        if (included == true) {
                    card.classList.remove('hidden');
                    visibleCount++;
					        }
					        else{
					        card.classList.add('hidden');
					        }
                }
                else {
                    card.classList.add('hidden');
                }
            });

			            // Show/hide no results message
            if (visibleCount === 0) {
                noResults.classList.remove('hidden');
            } else {
                noResults.classList.add('hidden');
            }
}


// READ MORE
document.querySelectorAll(".read-more").forEach(btn => {
  btn.addEventListener("click", () => {
    const more = btn.nextElementSibling;
    const open = more.style.display === "block";
    more.style.display = open ? "none" : "block";
    btn.textContent = open ? "READ MORE" : "READ LESS";
  });
});

// LOAD MORE (demo)
document.getElementById("loadMore").addEventListener("click", () => {
  alert("Load more would fetch more services from backend.");
});