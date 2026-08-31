javascript
/* =========================================================
   BEELINX MAIN JAVASCRIPT
   ========================================================= */


/* =========================================================
   1. SEARCH FUNCTION
   ========================================================= */

function searchFunction() {

    const input = document.getElementById("searchInput");

    if (!input) return;

    const filter = input.value.toLowerCase().trim();

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


/* =========================================================
   2. MENU TOGGLE
   ========================================================= */

function toggleMenu() {

    const menu =
        document.getElementById("sideMenu");

    if (menu) {

        menu.classList.add("active");

    }

}


function closeMenu() {

    const menu =
        document.getElementById("sideMenu");

    if (menu) {

        menu.classList.remove("active");

    }

}


/* =========================================================
   3. GLIGHTBOX
   ========================================================= */

if (typeof GLightbox !== "undefined") {

    let scrollPosition = 0;

    const lightbox = GLightbox({

        touchNavigation: true,
        loop: true

    });


    lightbox.on("open", () => {

        scrollPosition =
            window.scrollY;

        setTimeout(() => {

            window.scrollTo(
                0,
                scrollPosition
            );

        }, 10);

    });


    lightbox.on("close", () => {

        setTimeout(() => {

            window.scrollTo(
                0,
                scrollPosition
            );

        }, 10);

    });

}


/* =========================================================
   4. HERO CAROUSEL
   =========================================================

   IMPORTANT:

   The carousel is now controlled primarily by
   the browser's native horizontal scrolling.

   JavaScript only handles:
   - automatic sliding
   - dots
   - trackpad horizontal movement

   JavaScript NO LONGER reacts to touchend.

   This prevents the carousel from fighting
   the user's finger while they swipe.
*/


const featuredTrack =
    document.querySelector(".featured-track");


const featuredSlides =
    document.querySelectorAll(
        ".featured-slide"
    );


const featuredDots =
    document.querySelectorAll(".dot");


let featuredIndex = 0;

let featuredAutoSlider;


/* =========================================================
   UPDATE HERO DOTS
   ========================================================= */

function updateFeaturedDots(index) {

    featuredDots.forEach(
        (dot, i) => {

            dot.classList.toggle(
                "active",
                i === index
            );

        }
    );

}


/* =========================================================
   GET HERO SLIDE POSITION
   ========================================================= */

function getFeaturedSlidePosition(slide) {

    if (
        !featuredTrack ||
        !slide
    ) {

        return 0;

    }


    const trackRect =
        featuredTrack.getBoundingClientRect();

    const slideRect =
        slide.getBoundingClientRect();


    return (
        slideRect.left -
        trackRect.left +
        featuredTrack.scrollLeft
    );

}


/* =========================================================
   GET CURRENT HERO SLIDE
   ========================================================= */

function getCurrentFeaturedSlide() {

    if (
        !featuredTrack ||
        !featuredSlides.length
    ) {

        return 0;

    }


    const currentScroll =
        featuredTrack.scrollLeft;


    let closestIndex = 0;

    let closestDistance =
        Infinity;


    featuredSlides.forEach(
        (slide, index) => {

            const slidePosition =
                getFeaturedSlidePosition(
                    slide
                );


            const distance =
                Math.abs(
                    slidePosition -
                    currentScroll
                );


            if (
                distance <
                closestDistance
            ) {

                closestDistance =
                    distance;

                closestIndex =
                    index;

            }

        }
    );


    return closestIndex;

}


/* =========================================================
   SCROLL TO HERO SLIDE
   ========================================================= */

function scrollToFeaturedSlide(index) {

    if (
        !featuredTrack ||
        !featuredSlides.length
    ) {

        return;

    }


    if (index < 0) {

        index =
            featuredSlides.length - 1;

    }


    if (
        index >=
        featuredSlides.length
    ) {

        index = 0;

    }


    const slide =
        featuredSlides[index];


    const targetPosition =
        getFeaturedSlidePosition(
            slide
        );


    featuredTrack.scrollTo({

        left: targetPosition,

        behavior: "smooth"

    });


    featuredIndex =
        index;


    updateFeaturedDots(
        index
    );

}


/* =========================================================
   GO TO HERO SLIDE
   ========================================================= */

function goToSlide(index) {

    if (!featuredSlides.length) {

        return;

    }


    scrollToFeaturedSlide(
        index
    );


    restartFeaturedSlider();

}


/* =========================================================
   NEXT HERO SLIDE
   ========================================================= */

function nextSlide() {

    if (!featuredSlides.length) {

        return;

    }


    const currentIndex =
        getCurrentFeaturedSlide();


    let nextIndex =
        currentIndex + 1;


    if (
        nextIndex >=
        featuredSlides.length
    ) {

        nextIndex = 0;

    }


    scrollToFeaturedSlide(
        nextIndex
    );

}


/* =========================================================
   PREVIOUS HERO SLIDE
   ========================================================= */

function prevSlide() {

    if (!featuredSlides.length) {

        return;

    }


    const currentIndex =
        getCurrentFeaturedSlide();


    let previousIndex =
        currentIndex - 1;


    if (previousIndex < 0) {

        previousIndex =
            featuredSlides.length - 1;

    }


    scrollToFeaturedSlide(
        previousIndex
    );

}


/* =========================================================
   HERO AUTO SLIDER
   ========================================================= */

function startFeaturedSlider() {

    if (!featuredSlides.length) {

        return;

    }


    clearInterval(
        featuredAutoSlider
    );


    featuredAutoSlider =
        setInterval(() => {

            nextSlide();

        }, 7000);

}


function restartFeaturedSlider() {

    clearInterval(
        featuredAutoSlider
    );


    startFeaturedSlider();

}


/* =========================================================
   HERO MANUAL SCROLL DETECTION
   =========================================================

   IMPORTANT:

   We only UPDATE the dots here.

   We DO NOT call scrollTo().
   We DO NOT force the carousel
   to another position.

   Therefore the user's manual
   scrolling remains completely free.
*/

if (featuredTrack) {

    let featuredScrollTimer;


    featuredTrack.addEventListener(
        "scroll",
        () => {

            clearTimeout(
                featuredScrollTimer
            );


            featuredScrollTimer =
                setTimeout(() => {

                    const currentIndex =
                        getCurrentFeaturedSlide();


                    featuredIndex =
                        currentIndex;


                    updateFeaturedDots(
                        currentIndex
                    );

                }, 100);

        },
        {
            passive: true
        }
    );

}


/* =========================================================
   HERO TRACKPAD
   =========================================================

   Only horizontal trackpad gestures are
   intercepted.

   Normal vertical scrolling is untouched.
*/

if (featuredTrack) {

    let lastHeroWheel = 0;


    featuredTrack.addEventListener(
        "wheel",
        (event) => {

            if (
                Math.abs(event.deltaX) <=
                Math.abs(event.deltaY)
            ) {

                return;

            }


            const now =
                Date.now();


            if (
                now - lastHeroWheel <
                600
            ) {

                event.preventDefault();

                return;

            }


            event.preventDefault();


            if (event.deltaX > 0) {

                nextSlide();

            } else {

                prevSlide();

            }


            lastHeroWheel =
                now;

        },
        {
            passive: false
        }
    );

}


/* =========================================================
   PAUSE HERO WHEN HOVERED
   ========================================================= */

if (featuredTrack) {

    featuredTrack.addEventListener(
        "mouseenter",
        () => {

            clearInterval(
                featuredAutoSlider
            );

        }
    );


    featuredTrack.addEventListener(
        "mouseleave",
        () => {

            startFeaturedSlider();

        }
    );

}


/* =========================================================
   INITIAL HERO SLIDE
   ========================================================= */

if (featuredSlides.length) {

    featuredIndex = 0;


    updateFeaturedDots(0);


    if (featuredTrack) {

        featuredTrack.scrollLeft = 0;

    }


    startFeaturedSlider();

}


/* =========================================================
   5. BRAND AD SLIDER
   =========================================================

   Same philosophy as the hero carousel.

   The browser handles manual touch scrolling.

   JavaScript only handles:
   - automatic movement
   - dots
   - horizontal trackpad movement

   There is NO touchend handler.
*/


const brandAdSlider =
    document.querySelector(
        ".brand-ad-slider"
    );


const brandAdSlides =
    document.querySelectorAll(
        ".brand-ad-slide"
    );


const brandAdDots =
    document.querySelectorAll(
        ".brand-ad-dot"
    );


let brandAdIndex = 0;

let brandAdInterval;


/* =========================================================
   GET BRAND AD POSITION
   ========================================================= */

function getBrandAdSlidePosition(slide) {

    if (
        !brandAdSlider ||
        !slide
    ) {

        return 0;

    }


    const sliderRect =
        brandAdSlider.getBoundingClientRect();


    const slideRect =
        slide.getBoundingClientRect();


    return (
        slideRect.left -
        sliderRect.left +
        brandAdSlider.scrollLeft
    );

}


/* =========================================================
   UPDATE BRAND AD DOTS
   ========================================================= */

function updateBrandAdDots(index) {

    brandAdDots.forEach(
        (dot, i) => {

            dot.classList.toggle(
                "active",
                i === index
            );

        }
    );

}


/* =========================================================
   GET CURRENT BRAND AD
   ========================================================= */

function getCurrentBrandAd() {

    if (
        !brandAdSlider ||
        !brandAdSlides.length
    ) {

        return 0;

    }


    const currentScroll =
        brandAdSlider.scrollLeft;


    let closestIndex = 0;

    let closestDistance =
        Infinity;


    brandAdSlides.forEach(
        (slide, index) => {

            const slidePosition =
                getBrandAdSlidePosition(
                    slide
                );


            const distance =
                Math.abs(
                    slidePosition -
                    currentScroll
                );


            if (
                distance <
                closestDistance
            ) {

                closestDistance =
                    distance;

                closestIndex =
                    index;

            }

        }
    );


    return closestIndex;

}


/* =========================================================
   SCROLL TO BRAND AD
   ========================================================= */

function scrollToBrandAd(index) {

    if (
        !brandAdSlider ||
        !brandAdSlides.length
    ) {

        return;

    }


    if (index < 0) {

        index =
            brandAdSlides.length - 1;

    }


    if (
        index >=
        brandAdSlides.length
    ) {

        index = 0;

    }


    const slide =
        brandAdSlides[index];


    const targetPosition =
        getBrandAdSlidePosition(
            slide
        );


    brandAdSlider.scrollTo({

        left: targetPosition,

        behavior: "smooth"

    });


    brandAdIndex =
        index;


    updateBrandAdDots(
        index
    );

}


/* =========================================================
   SHOW BRAND AD
   ========================================================= */

function showBrandAd(index) {

    if (!brandAdSlides.length) {

        return;

    }


    scrollToBrandAd(
        index
    );

}


/* =========================================================
   NEXT BRAND AD
   ========================================================= */

function nextBrandAd() {

    if (!brandAdSlides.length) {

        return;

    }


    const currentIndex =
        getCurrentBrandAd();


    let nextIndex =
        currentIndex + 1;


    if (
        nextIndex >=
        brandAdSlides.length
    ) {

        nextIndex = 0;

    }


    scrollToBrandAd(
        nextIndex
    );

}


/* =========================================================
   PREVIOUS BRAND AD
   ========================================================= */

function prevBrandAd() {

    if (!brandAdSlides.length) {

        return;

    }


    const currentIndex =
        getCurrentBrandAd();


    let previousIndex =
        currentIndex - 1;


    if (previousIndex < 0) {

        previousIndex =
            brandAdSlides.length - 1;

    }


    scrollToBrandAd(
        previousIndex
    );

}


/* =========================================================
   GO TO BRAND AD
   ========================================================= */

function goToBrandAd(index) {

    if (!brandAdSlides.length) {

        return;

    }


    scrollToBrandAd(
        index
    );


    restartBrandAdSlider();

}


/* =========================================================
   BRAND AD SCROLL DETECTION
   =========================================================

   Only update the dots.

   Never force the slider back
   while the user is scrolling.
*/

if (brandAdSlider) {

    let brandAdScrollTimer;


    brandAdSlider.addEventListener(
        "scroll",
        () => {

            clearTimeout(
                brandAdScrollTimer
            );


            brandAdScrollTimer =
                setTimeout(() => {

                    const currentIndex =
                        getCurrentBrandAd();


                    brandAdIndex =
                        currentIndex;


                    updateBrandAdDots(
                        currentIndex
                    );

                }, 100);

        },
        {
            passive: true
        }
    );

}


/* =========================================================
   BRAND AD AUTO SLIDER
   ========================================================= */

function startBrandAdSlider() {

    if (!brandAdSlides.length) {

        return;

    }


    clearInterval(
        brandAdInterval
    );


    brandAdInterval =
        setInterval(() => {

            nextBrandAd();

        }, 10000);

}


function restartBrandAdSlider() {

    clearInterval(
        brandAdInterval
    );


    startBrandAdSlider();

}


/* =========================================================
   BRAND AD TRACKPAD
   ========================================================= */

if (brandAdSlider) {

    let lastBrandAdWheel = 0;


    brandAdSlider.addEventListener(
        "wheel",
        (event) => {

            if (
                Math.abs(event.deltaX) <=
                Math.abs(event.deltaY)
            ) {

                return;

            }


            const now =
                Date.now();


            if (
                now - lastBrandAdWheel <
                700
            ) {

                event.preventDefault();

                return;

            }


            event.preventDefault();


            if (event.deltaX > 0) {

                nextBrandAd();

            } else {

                prevBrandAd();

            }


            lastBrandAdWheel =
                now;

        },
        {
            passive: false
        }
    );

}


/* =========================================================
   PAUSE BRAND AD WHEN HOVERED
   ========================================================= */

if (brandAdSlider) {

    brandAdSlider.addEventListener(
        "mouseenter",
        () => {

            clearInterval(
                brandAdInterval
            );

        }
    );


    brandAdSlider.addEventListener(
        "mouseleave",
        () => {

            startBrandAdSlider();

        }
    );

}


/* =========================================================
   INITIAL BRAND AD
   ========================================================= */

if (brandAdSlides.length) {

    brandAdIndex = 0;


    updateBrandAdDots(0);


    if (brandAdSlider) {

        brandAdSlider.scrollLeft = 0;

    }


    startBrandAdSlider();

}

