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