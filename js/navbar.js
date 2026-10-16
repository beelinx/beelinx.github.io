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
// 4. MENU TOGGLE
// =========================================

function toggleMenu() {

    const menu =
        document.getElementById("sideMenu");

    if (menu) {

        menu.classList.add("active");

    }

}


// =========================================
// 5. CLOSE MENU
// =========================================

function closeMenu() {

    const menu =
        document.getElementById("sideMenu");

    if (menu) {

        menu.classList.remove("active");

    }

}