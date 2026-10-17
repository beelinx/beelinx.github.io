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
//    Marks the icon of the page you are on.
//    The bar always stays fully open (it no longer
//    shrinks when you scroll).
// =========================================

function initializeDock() {

    const dock =
        document.querySelector(".dock");

    if (!dock) return;

    const links =
        dock.querySelectorAll(".dock-link");


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

}