// =========================================
// BEELINX SHARED NAVBAR
// =========================================

document.addEventListener("DOMContentLoaded", async function () {

    const navbarPlaceholder =
        document.getElementById("navbar-placeholder");

    if (!navbarPlaceholder) {
        console.error("Navbar placeholder not found.");
        return;
    }

    try {

        // LOAD SHARED NAVBAR HTML
        const response = await fetch("navbar.html");

        if (!response.ok) {
            throw new Error(
                "Failed to load navbar.html: " + response.status
            );
        }

        const navbarHTML = await response.text();

        navbarPlaceholder.innerHTML = navbarHTML;

        // INITIALIZE NAVIGATION AFTER HTML LOADS
        initializeNavbar();

    } catch (error) {

        console.error("Navbar loading error:", error);

    }

});


// =========================================
// INITIALIZE NAVBAR INTERACTIONS
// =========================================

function initializeNavbar() {

    initializeSearch();
    initializeSearchIcon();
    initializeNavbarScroll();
    initializeDock();
    initializeRail();

}


// =========================================
// 0. NAVBAR SCROLL STATE
//    Adds .navbar-scrolled once the page has
//    scrolled past SOLID_AFTER pixels. The css
//    uses it to make the bar solid (it is
//    invisible at the top of dark-hero pages).
//    The top bar itself is always visible.
// =========================================

function initializeNavbarScroll() {

    const navbar =
        document.querySelector(".navbar");

    if (!navbar) return;

    // pixels scrolled before the bar turns solid
    const SOLID_AFTER = 40;

    function updateNavbar() {

        const scrolled =
            window.scrollY ||
            document.documentElement.scrollTop ||
            0;

        navbar.classList.toggle(
            "navbar-scrolled",
            scrolled > SOLID_AFTER
        );

    }

    // run once now (page may load already scrolled)
    updateNavbar();

    window.addEventListener(
        "scroll",
        updateNavbar,
        { passive: true }
    );

}


// =========================================
// 1. SEARCH FUNCTION
// =========================================

function searchFunction() {

    const input =
        document.getElementById("searchInput");

    if (!input) return;

    const filter =
        input.value.toLowerCase().trim();

    const products =
        document.getElementsByClassName("products");

    for (let i = 0; i < products.length; i++) {

        const text =
            products[i].textContent.toLowerCase();

        if (text.includes(filter)) {

            products[i].style.display = "";

        } else {

            products[i].style.display = "none";

        }

    }

}


// =========================================
// 2. SEARCH INPUT INITIALIZATION
// =========================================

function initializeSearch() {

    const searchInput =
        document.getElementById("searchInput");

    if (!searchInput) return;

    searchInput.addEventListener("keyup", searchFunction);

}


// =========================================
// 3. SEARCH ICON TOGGLE
// =========================================

function initializeSearchIcon() {

    const searchInput =
        document.getElementById("searchInput");

    const searchIcon =
        document.querySelector(".search-btn");

    if (!searchInput || !searchIcon) return;

    let closingTimer;

    searchIcon.addEventListener("click", function (event) {

        event.preventDefault();
        event.stopPropagation();

        clearTimeout(closingTimer);

        if (searchInput.classList.contains("search-open")) {

            searchInput.classList.remove("search-open");

            closingTimer = setTimeout(function () {

                searchInput.blur();

            }, 400);

        } else {

            searchInput.classList.add("search-open");

            searchInput.focus();

        }

    });

}


// =========================================
// 4. NAVIGATION DOCK
//    a) marks the icon of the page you are on
//    b) phones only: the bottom bar shrinks to a
//       small pill when you scroll down and
//       expands again when you tap it or scroll
//       back up (like Safari on iPhone).
//       The side bar on computers never shrinks.
// =========================================

function initializeDock() {

    const dock =
        document.querySelector(".dock");

    if (!dock) return;

    const links =
        dock.querySelectorAll(".dock-link");

    const grip =
        dock.querySelector(".dock-grip");


    // ---- a) current page ----

    const currentPage =
        (window.location.pathname.split("/").pop() ||
            "index.html").toLowerCase();

    links.forEach(function (link) {

        const target =
            (link.getAttribute("href") || "")
                .split("?")[0]
                .split("#")[0]
                .split("/")
                .pop()
                .toLowerCase();

        if (target === currentPage) {

            link.classList.add("active");
            link.setAttribute("aria-current", "page");

        }

    });


    // ---- b) shrink on scroll down, expand on scroll up / tap ----

    let minimized = false;
    let lastY = window.scrollY || 0;
    let travelled = 0;      // pixels scrolled in the current direction
    let lockUntil = 0;      // brief pause after a tap so it doesn't snap shut again

    // how far you must scroll before the bar reacts
    const SHRINK_AFTER = 16;
    const EXPAND_AFTER = 16;

    // the bar always stays open this close to the top of the page
    const ALWAYS_OPEN_ABOVE = 40;

    // on computers the dock is a side bar and never shrinks
    const desktop =
        window.matchMedia("(min-width: 769px)");

    desktop.addEventListener("change", function () {
        setMinimized(false);
    });

    function setMinimized(value) {

        if (desktop.matches) value = false;

        if (value === minimized) return;

        minimized = value;

        dock.classList.toggle("dock-min", value);

        // keep hidden controls out of the keyboard tab order
        links.forEach(function (link) {
            link.tabIndex = value ? -1 : 0;
        });

        if (grip) grip.tabIndex = value ? 0 : -1;

    }

    window.addEventListener("scroll", function () {

        const y = Math.max(
            0,
            window.scrollY ||
            document.documentElement.scrollTop ||
            0
        );

        const delta = y - lastY;
        lastY = y;

        if (y <= ALWAYS_OPEN_ABOVE) {

            travelled = 0;
            setMinimized(false);
            return;

        }

        if (!delta) return;

        // direction changed: start counting again
        if (Math.sign(delta) !== Math.sign(travelled)) {
            travelled = 0;
        }

        travelled += delta;

        if (travelled > SHRINK_AFTER && Date.now() > lockUntil) {

            setMinimized(true);

        } else if (travelled < -EXPAND_AFTER) {

            setMinimized(false);

        }

    }, { passive: true });

    // tapping the small pill brings the full bar back
    dock.addEventListener("click", function (event) {

        if (!minimized) return;

        event.preventDefault();

        setMinimized(false);

        travelled = 0;
        lockUntil = Date.now() + 800;

    });

}


// =========================================
// 5. SIDE BAR OPEN / CLOSE (computers only)
//    The side bar opens when the mouse:
//      - hovers the arrow icon next to "Beelinx"
//      - hovers the side bar itself
//      - touches the left edge of the screen
//    and closes by itself shortly after the
//    mouse moves away. Clicking the icon keeps
//    the bar open until you click it again.
//    The page is pushed across, not covered
//    (see html.rail-open in the css).
// =========================================

function initializeRail() {

    const toggle =
        document.getElementById("railToggle");

    const dock =
        document.querySelector(".dock");

    if (!toggle || !dock) return;

    const root =
        document.documentElement;

    const desktop =
        window.matchMedia("(min-width: 769px)");

    // pause (ms) before closing, so the mouse can travel
    // from the icon down to the side bar without it shutting
    const CLOSE_DELAY = 300;

    // how close (px) the mouse must get to the left edge of
    // the screen to open the side bar
    const EDGE_ZONE = 10;

    let isOpen = false;
    let pinned = false;     // true after a click: stays open until clicked again
    let closeTimer = null;

    function setOpen(value) {

        if (value === isOpen) return;

        isOpen = value;

        root.classList.toggle("rail-open", value);

        toggle.setAttribute("aria-expanded", String(value));

        toggle.setAttribute(
            "aria-label",
            value ? "Close navigation" : "Open navigation"
        );

    }

    function openRail() {

        clearTimeout(closeTimer);
        closeTimer = null;

        setOpen(true);

    }

    function scheduleClose() {

        // keep the countdown that is already running
        if (pinned || !isOpen || closeTimer) return;

        closeTimer = setTimeout(function () {

            closeTimer = null;
            setOpen(false);

        }, CLOSE_DELAY);

    }

    // follow the mouse: inside the "hover area" opens, outside closes
    document.addEventListener("mousemove", function (event) {

        if (!desktop.matches) return;

        const target = event.target;

        const overBar =
            target &&
            target.closest &&
            target.closest(".dock, #railToggle");

        if (event.clientX <= EDGE_ZONE || overBar) {

            openRail();

        } else {

            scheduleClose();

        }

    }, { passive: true });

    // mouse left the browser window
    document.documentElement.addEventListener("mouseleave", function () {

        if (desktop.matches) scheduleClose();

    });

    toggle.addEventListener("click", function () {

        if (!desktop.matches) return;

        pinned = !pinned;

        if (pinned) {

            openRail();

        } else {

            clearTimeout(closeTimer);
            closeTimer = null;
            setOpen(false);

        }

    });

    // switching between phone and computer layouts resets everything
    desktop.addEventListener("change", function () {

        pinned = false;
        clearTimeout(closeTimer);
        closeTimer = null;
        setOpen(false);

    });

}