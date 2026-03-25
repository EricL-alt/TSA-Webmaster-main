// ============================================================
//  events.js  –  City of Miami Events Page
// ============================================================

// ----------------------------------------------------------
// PLACEHOLDER EVENT DATA
// ----------------------------------------------------------
const EVENTS = [
    {
        id: 1,
        title: "Register now for Fine Arts Camp!",
        date: new Date(2026, 2, 6),           // March 6
        timeLabel: "March 6 @ 9:00am – June 1 @ 3:00pm EST",
        location: "Bayfront Park Community Center",
        address: "301 Biscayne Blvd, Miami FL",
        description:
            "Kids draw and sing at this amazing arts camp — so much fun for infants, toddlers, children, teenagers, and adults. You will definitely want to join this event. It is going to be a fantastic time for the whole family and a wonderful way to explore creativity in our community.",
        image: "images/ev4.webp"
    },
    {
        id: 2,
        title: "Community Clean-Up Drive",
        date: new Date(2026, 2, 6),           // March 6
        timeLabel: "March 6 @ 8:00am – 12:00pm EST",
        location: "Virginia Key Beach Park",
        address: "4020 Virginia Beach Dr, Miami FL",
        description:
            "Help us keep Miami beautiful. Join volunteers from across the city for a morning of cleanup at our beloved parks and beaches. Supplies and refreshments provided. This is a great way to give back and meet your neighbors.",
        image: "images/ed5.jpg"
    },
    {
        id: 3,
        title: "Tech for All Workshop",
        date: new Date(2026, 2, 20),          // March 20
        timeLabel: "March 20 @ 10:00am – 2:00pm EST",
        location: "Miami Public Library",
        address: "101 W Flagler St, Miami FL",
        description:
            "A free digital literacy workshop designed for seniors and youth in our community. Learn how to use computers, smartphones, and the internet safely and effectively. All skill levels are welcome — no prior experience necessary.",
        image: "images/te1.jpg"
    },
    {
        id: 4,
        title: "Spring Food Drive",
        date: new Date(2026, 3, 5),           // April 5
        timeLabel: "April 5 @ 9:00am – 5:00pm EST",
        location: "Miami-Dade Food Bank",
        address: "550 NW 84th Ave, Miami FL",
        description:
            "Support local families in need this spring. Drop off canned goods and non-perishables at any of our collection points across the city. Every donation makes a real difference. Volunteers also needed throughout the day.",
        image: "images/fo4.jpg"
    },
    {
        id: 5,
        title: "Music in the Park",
        date: new Date(2026, 3, 18),          // April 18
        timeLabel: "April 18 @ 5:00pm – 9:00pm EST",
        location: "Bayfront Park Amphitheater",
        address: "301 Biscayne Blvd, Miami FL",
        description:
            "Enjoy a free evening concert featuring talented local Miami artists at the beautiful Bayfront Park Amphitheater. Bring a blanket and enjoy the Miami sunset with your family and friends. Food trucks will be on-site.",
        image: "images/ed5.jpg"
    },
    {
        id: 6,
        title: "Neighborhood Safety Forum",
        date: new Date(2026, 4, 2),           // May 2
        timeLabel: "May 2 @ 6:00pm – 8:00pm EST",
        location: "Miami City Hall",
        address: "3500 Pan American Dr, Miami FL",
        description:
            "An open forum for Miami residents to discuss public safety improvements across our neighborhoods. City officials and law enforcement will be present to answer questions, hear your concerns, and outline upcoming initiatives.",
        image: "images/ev4.webp"
    }
];

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ordinalSuffix(n) {
    const v = n % 100;
    if (v >= 11 && v <= 13) return "th";
    switch (v % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
    }
}

/** Return the Monday of the week containing `date`. */
function getWeekStart(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();                 // 0 = Sun
    const diff = day === 0 ? -6 : 1 - day; // shift to Monday
    d.setDate(d.getDate() + diff);
    return d;
}

/** Return the Sunday (end) of the week starting on `weekStart`. */
function getWeekEnd(weekStart) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
}

/** Build the HTML label shown inside the date-range bar. */
function buildRangeLabel(weekStart, weekEnd, isCurrentWeek) {
    const eMonth = MONTHS_LONG[weekEnd.getMonth()];
    const eDay = weekEnd.getDate();
    const eSuf = ordinalSuffix(eDay);

    if (isCurrentWeek) {
        return `Now &ndash; ${eMonth} ${eDay}<sup>${eSuf}</sup>`;
    }

    const sMonth = MONTHS_LONG[weekStart.getMonth()];
    const sDay = weekStart.getDate();
    const sSuf = ordinalSuffix(sDay);

    // Same month → "March 10th – 16th"
    if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${sMonth} ${sDay}<sup>${sSuf}</sup> &ndash; ${eDay}<sup>${eSuf}</sup>`;
    }
    return `${sMonth} ${sDay}<sup>${sSuf}</sup> &ndash; ${eMonth} ${eDay}<sup>${eSuf}</sup>`;
}

/** Get static-file base URL injected by Flask. */
function getStaticBase() {
    const el = document.getElementById("eventsPage");
    return el ? (el.dataset.static || "/static/") : "/static/";
}

// ----------------------------------------------------------
// STATE
// ----------------------------------------------------------
const today = new Date();
let currentWeekStart = getWeekStart(today);
let selectedDay = null;   // null = show whole week; Date = filter to that day
let dropdownOpen = false;

// ----------------------------------------------------------
// RENDER
// ----------------------------------------------------------
function render() {
    const weekEnd = getWeekEnd(currentWeekStart);
    const todayWeekStart = getWeekStart(today);
    const isCurrentWeek = currentWeekStart.getTime() === todayWeekStart.getTime();
    const staticBase = getStaticBase();

    // ── date range bar label ──────────────────────────────────
    document.getElementById("dateRangeText").innerHTML =
        buildRangeLabel(currentWeekStart, weekEnd, isCurrentWeek);

    // ── month label ───────────────────────────────────────────
    document.getElementById("monthLabel").textContent =
        `${MONTHS_LONG[currentWeekStart.getMonth()]} ${currentWeekStart.getFullYear()}`;

    // ── dropdown ──────────────────────────────────────────────
    renderDropdown(weekEnd);

    // ── filter events ─────────────────────────────────────────
    let visibleEvents;
    if (selectedDay) {
        // Single day filter
        visibleEvents = EVENTS.filter(ev =>
            ev.date.getFullYear() === selectedDay.getFullYear() &&
            ev.date.getMonth() === selectedDay.getMonth() &&
            ev.date.getDate() === selectedDay.getDate()
        );
    } else {
        // Full week
        visibleEvents = EVENTS.filter(ev => ev.date >= currentWeekStart && ev.date <= weekEnd);
    }

    // ── build event list HTML ─────────────────────────────────
    const list = document.getElementById("eventsList");

    if (visibleEvents.length === 0) {
        const label = selectedDay
            ? `${DAYS_SHORT[selectedDay.getDay()]}, ${MONTHS_LONG[selectedDay.getMonth()]} ${selectedDay.getDate()}`
            : "this week";
        list.innerHTML = `<div class="no-events">No events scheduled for ${label}.</div>`;
        return;
    }

    list.innerHTML = visibleEvents.map((ev, idx) => {
        const badgeClass = idx % 2 === 0 ? "badge-teal" : "badge-tan";
        const dayName = DAYS_SHORT[ev.date.getDay()];
        const dayNum = ev.date.getDate();
        const imgStyle = ev.image
            ? `background-image: url('${staticBase}${ev.image}');`
            : "";

        return `
      <div class="event-item ${badgeClass}">
        <div class="event-title-header">${ev.title}</div>
        <div class="event-body">
          <div class="event-day-badge">
            <span class="badge-day-name">${dayName}</span>
            <span class="badge-day-num">${dayNum}</span>
          </div>
          <div class="event-card">
            <div class="event-card-image" style="${imgStyle}"></div>
            <div class="event-card-details">
              <div class="event-time">${ev.timeLabel}</div>
              <div class="event-location">
                <strong>${ev.location}</strong> ${ev.address}
              </div>
              <div class="event-description">${ev.description}</div>
            </div>
          </div>
        </div>
      </div>
    `;
    }).join("");
}

// ----------------------------------------------------------
// DROPDOWN
// ----------------------------------------------------------
function renderDropdown(weekEnd) {
    // Remove any existing dropdown
    const existing = document.getElementById("weekDropdown");
    if (existing) existing.remove();

    if (!dropdownOpen) return;

    const bar = document.querySelector(".date-range-bar");
    const dropdown = document.createElement("div");
    dropdown.id = "weekDropdown";
    dropdown.className = "week-dropdown";

    // Build one row per day Mon–Sun
    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() + i);
        days.push(d);
    }

    // Count events per day for the dot indicator
    const dayEnd = new Date(weekEnd);

    days.forEach(d => {
        const hasEvents = EVENTS.some(ev =>
            ev.date.getFullYear() === d.getFullYear() &&
            ev.date.getMonth() === d.getMonth() &&
            ev.date.getDate() === d.getDate()
        );

        const isToday =
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate();

        const isSelected = selectedDay &&
            d.getFullYear() === selectedDay.getFullYear() &&
            d.getMonth() === selectedDay.getMonth() &&
            d.getDate() === selectedDay.getDate();

        const btn = document.createElement("button");
        btn.className = "week-dropdown-day" +
            (isToday ? " is-today" : "") +
            (isSelected ? " is-selected" : "");

        btn.innerHTML = `
      <span class="wd-day-name">${DAYS_SHORT[d.getDay()]}</span>
      <span class="wd-day-num">${d.getDate()}</span>
      ${hasEvents ? '<span class="wd-dot"></span>' : '<span class="wd-dot wd-dot--empty"></span>'}
    `;

        btn.addEventListener("click", () => {
            if (isSelected) {
                // clicking same day again → show whole week
                selectedDay = null;
            } else {
                selectedDay = new Date(d);
            }
            dropdownOpen = false;
            render();
        });

        dropdown.appendChild(btn);
    });

    // "All week" reset row
    const allBtn = document.createElement("button");
    allBtn.className = "week-dropdown-all" + (!selectedDay ? " is-selected" : "");
    allBtn.textContent = "All week";
    allBtn.addEventListener("click", () => {
        selectedDay = null;
        dropdownOpen = false;
        render();
    });
    dropdown.appendChild(allBtn);

    // Position below the bar
    bar.style.position = "relative";
    bar.appendChild(dropdown);
}

function closeDropdown() {
    dropdownOpen = false;
    const el = document.getElementById("weekDropdown");
    if (el) el.remove();
}

// ----------------------------------------------------------
// NAVIGATION
// ----------------------------------------------------------
document.getElementById("prevBtn").addEventListener("click", () => {
    currentWeekStart = new Date(currentWeekStart);
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    selectedDay = null;
    dropdownOpen = false;
    render();
});

document.getElementById("nextBtn").addEventListener("click", () => {
    currentWeekStart = new Date(currentWeekStart);
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    selectedDay = null;
    dropdownOpen = false;
    render();
});

document.getElementById("todayBtn").addEventListener("click", () => {
    currentWeekStart = getWeekStart(today);
    selectedDay = null;
    dropdownOpen = false;
    render();
});

document.getElementById("dropdownBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownOpen = !dropdownOpen;
    render();
});

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
    if (!e.target.closest(".date-range-bar")) {
        closeDropdown();
    }
});

// ----------------------------------------------------------
// INIT
// ----------------------------------------------------------
render();