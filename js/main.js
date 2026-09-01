/* =========================================================
   BEELINX MAIN JAVASCRIPT
========================================================= */


/* =========================================================
   1. SEARCH FUNCTION
========================================================= */

function searchFunction() {

    const input =
        document.getElementById("searchInput");

    if (!input) return;

    const filter =
        input.value.toLowerCase().trim();

    const products =
        document.getElementsByClassName("products");

    for (
        let i = 0;
        i < products.length;
        i++
    ) {

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

let lightbox = null;

if (typeof GLightbox !== "undefined") {

    let scrollPosition = 0;

    lightbox = GLightbox({

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
   4. FEATURED PRODUCT CAROUSEL
========================================================= */

let featuredTrack = null;

let featuredSlides = [];

let featuredIndex = 0;

let featuredAutoSlider = null;

let featuredScrollTimer = null;

let featuredIsResetting = false;


/*
   Keeps the automatic slider from fighting
   the user's manual swipe/scroll.
*/

let featuredIsUserScrolling = false;

let featuredResumeTimer = null;

let featuredScrollStartTimer = null;


/* =========================================================
   BUILD FEATURED CARDS
========================================================= */

function buildFeaturedCarousel() {

    const track =
        document.getElementById(
            "featuredTrack"
        );

    if (!track) return;


    if (
        typeof featuredProducts ===
        "undefined"
    ) {

        console.error(
            "Beelinx: featuredProducts was not found in products.js."
        );

        return;

    }


    if (
        !Array.isArray(featuredProducts) ||
        featuredProducts.length === 0
    ) {

        console.warn(
            "Beelinx: No featured products found."
        );

        return;

    }


    track.innerHTML = "";


    featuredProducts.forEach(
        (product) => {

            const slide =
                document.createElement("div");

            slide.className =
                "featured-slide";


            /* =================================================
               COLLECTION / BRAND TITLE
            ================================================= */

            const welcome =
                document.createElement("div");

            welcome.className =
                "welcome-section";


            const brandLink =
                document.createElement("a");

            brandLink.href =
                product.brandLink || "#";

            brandLink.className =
                "logo-link";


            const collectionName =
                document.createElement("p");

            collectionName.className =
                "collection-name";

            collectionName.textContent =
                product.collection ||
                `${product.brand || ""} COLLECTION`;


            brandLink.appendChild(
                collectionName
            );

            welcome.appendChild(
                brandLink
            );


            /* =================================================
               PRODUCT IMAGE
            ================================================= */

            const imageLink =
                document.createElement("a");

            imageLink.href =
                product.image;

            imageLink.className =
                "glightbox";

            imageLink.setAttribute(
                "data-gallery",
                "featured"
            );


            const image =
                document.createElement("img");

            image.className =
                "clothe-image";

            image.src =
                product.image;

            image.alt =
                product.name ||
                "Featured product";

            image.loading =
                "lazy";


            imageLink.appendChild(
                image
            );


            /* =================================================
               PRODUCT TEXT
            ================================================= */

            const text =
                document.createElement("div");

            text.className =
                "featured-text";


            const productName =
                document.createElement("span");

            productName.className =
                "featured-product-name";

            productName.textContent =
                product.name || "";


            const productInfo =
                document.createElement("span");

            productInfo.className =
                "featured-product-info";


            const price =
                product.price || "";

            const description =
                product.description || "";


            productInfo.innerHTML =
                `<strong>At ${price}</strong><br><br>${description}`;


            /* =================================================
               PRODUCT LINK
            ================================================= */

            const productLink =
                document.createElement("a");

            productLink.className =
                "featured-product-link";


            /*
               Use the productId to send the user
               to Beelinx's own product template.

               Example:
               productId: "legacy-jorst"

               becomes:
               product-template.html?id=legacy-jorst
            */

            if (product.productId) {

                productLink.href =
                    `product-template.html?id=${encodeURIComponent(product.productId)}`;

            } else {

                /*
                   Fallback to the original orderLink
                   if a featured product doesn't have
                   a productId.
                */

                productLink.href =
                    product.orderLink || "#";

            }


            productLink.textContent =
                "View Product";


            productLink.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                }
            );


            text.appendChild(
                productName
            );

            text.appendChild(
                document.createElement("br")
            );

            text.appendChild(
                document.createElement("br")
            );

            text.appendChild(
                productInfo
            );

            text.appendChild(
                document.createElement("br")
            );

            text.appendChild(
                document.createElement("br")
            );

            text.appendChild(
                productLink
            );


            /* =================================================
               BUILD SLIDE
            ================================================= */

            slide.appendChild(
                welcome
            );

            slide.appendChild(
                imageLink
            );

            slide.appendChild(
                text
            );


            track.appendChild(
                slide
            );

        }
    );

}


/* =========================================================
   SETUP TRUE INFINITE FEATURED CAROUSEL
========================================================= */

function setupFeaturedCarousel() {

    featuredTrack =
        document.getElementById(
            "featuredTrack"
        );

    if (!featuredTrack) return;


    const originalSlides =
        Array.from(
            featuredTrack.querySelectorAll(
                ".featured-slide"
            )
        );


    if (
        originalSlides.length === 0
    ) {

        return;

    }


    /* =====================================================
       ONLY ONE PRODUCT
    ===================================================== */

    if (
        originalSlides.length === 1
    ) {

        featuredSlides =
            originalSlides;

        featuredIndex = 0;


        requestAnimationFrame(() => {

            featuredTrack.scrollLeft = 0;

        });


        return;

    }


    /* =====================================================
       TRUE INFINITE LOOP
    ===================================================== */

    const originalHTML =
        originalSlides.map(
            slide => slide.outerHTML
        );


    featuredTrack.innerHTML = "";


    const numberOfCopies = 7;


    for (
        let copy = 0;
        copy < numberOfCopies;
        copy++
    ) {

        originalHTML.forEach(
            (html, originalIndex) => {

                const wrapper =
                    document.createElement("div");

                wrapper.innerHTML =
                    html;


                const slide =
                    wrapper.firstElementChild;


                if (slide) {

                    slide.classList.add(
                        "featured-infinite-slide"
                    );

                    slide.dataset.originalIndex =
                        originalIndex;


                    featuredTrack.appendChild(
                        slide
                    );

                }

            }
        );

    }


    featuredSlides =
        Array.from(
            featuredTrack.querySelectorAll(
                ".featured-slide"
            )
        );


    const count =
        originalSlides.length;


    /* =====================================================
       START IN COPY 3
    ===================================================== */

    requestAnimationFrame(() => {

        const startingSlide =
            featuredSlides[
                count * 3
            ];


        if (startingSlide) {

            featuredTrack.scrollLeft =
                startingSlide.offsetLeft;

        }

    });

}


/* =========================================================
   GET CURRENT FEATURED SLIDE
========================================================= */

function getCurrentFeaturedSlide() {

    if (
        !featuredTrack ||
        !featuredSlides.length
    ) {

        return 0;

    }


    const scrollPosition =
        featuredTrack.scrollLeft;


    let closestIndex = 0;

    let closestDistance =
        Infinity;


    featuredSlides.forEach(
        (slide, index) => {

            const distance =
                Math.abs(
                    slide.offsetLeft -
                    scrollPosition
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


    const realCount =
        getFeaturedOriginalCount();


    if (
        realCount <= 0
    ) {

        return 0;

    }


    return (
        closestIndex %
        realCount
    );

}


/* =========================================================
   GET ORIGINAL FEATURED COUNT
========================================================= */

function getFeaturedOriginalCount() {

    if (
        !featuredSlides.length
    ) {

        return 0;

    }


    const firstOriginalIndex =
        featuredSlides.findIndex(
            slide =>
                slide.dataset.originalIndex === "0"
        );


    if (
        firstOriginalIndex === -1
    ) {

        return featuredSlides.length;

    }


    let count = 0;


    for (
        let i = firstOriginalIndex;
        i < featuredSlides.length;
        i++
    ) {

        const originalIndex =
            featuredSlides[i].dataset.originalIndex;


        if (
            originalIndex ===
            String(count)
        ) {

            count++;

        } else {

            break;

        }

    }


    return count || 1;

}


/* =========================================================
   UPDATE FEATURED INDEX
========================================================= */

function updateFeaturedIndex() {

    if (
        !featuredTrack ||
        !featuredSlides.length
    ) {

        return;

    }


    featuredIndex =
        getCurrentFeaturedSlide();

}


/* =========================================================
   MOVE TO FEATURED SLIDE
========================================================= */

function scrollToFeaturedSlide(
    realIndex,
    smooth = true
) {

    if (
        !featuredTrack ||
        featuredSlides.length === 0
    ) {

        return;

    }


    const realCount =
        getFeaturedOriginalCount();


    if (
        realCount <= 0
    ) {

        return;

    }


    realIndex =
        (
            realIndex +
            realCount
        ) %
        realCount;


    const currentPosition =
        featuredTrack.scrollLeft;


    let bestSlide = null;

    let bestDistance =
        Infinity;


    featuredSlides.forEach(
        slide => {

            if (
                Number(
                    slide.dataset.originalIndex
                ) !== realIndex
            ) {

                return;

            }


            const distance =
                Math.abs(
                    slide.offsetLeft -
                    currentPosition
                );


            if (
                distance <
                bestDistance
            ) {

                bestDistance =
                    distance;

                bestSlide =
                    slide;

            }

        }
    );


    if (!bestSlide) return;


    featuredIndex =
        realIndex;


    featuredTrack.scrollTo({

        left:
            bestSlide.offsetLeft,

        behavior:
            smooth
                ? "smooth"
                : "auto"

    });

}


/* =========================================================
   NEXT FEATURED SLIDE
========================================================= */

function nextSlide() {

    if (
        !featuredTrack ||
        featuredSlides.length < 2
    ) {

        return;

    }


    if (
        featuredIsUserScrolling
    ) {

        return;

    }


    const currentIndex =
        getCurrentFeaturedSlide();


    const realCount =
        getFeaturedOriginalCount();


    if (
        realCount <= 1
    ) {

        return;

    }


    const nextIndex =
        (
            currentIndex + 1
        ) %
        realCount;


    scrollToFeaturedSlide(
        nextIndex,
        true
    );

}


/* =========================================================
   PREVIOUS FEATURED SLIDE
========================================================= */

function prevSlide() {

    if (
        !featuredTrack ||
        featuredSlides.length < 2
    ) {

        return;

    }


    const currentIndex =
        getCurrentFeaturedSlide();


    const realCount =
        getFeaturedOriginalCount();


    if (
        realCount <= 1
    ) {

        return;

    }


    const previousIndex =
        (
            currentIndex -
            1 +
            realCount
        ) %
        realCount;


    scrollToFeaturedSlide(
        previousIndex,
        true
    );

}


/* =========================================================
   FIX TRUE FEATURED INFINITE LOOP
========================================================= */

function fixFeaturedLoop() {

    if (
        !featuredTrack ||
        featuredIsResetting ||
        featuredSlides.length < 2
    ) {

        return;

    }


    const realCount =
        getFeaturedOriginalCount();


    if (
        realCount <= 0
    ) {

        return;

    }


    const middleStart =
        featuredSlides[
            realCount * 3
        ];


    const nextCopyStart =
        featuredSlides[
            realCount * 4
        ];


    if (
        !middleStart ||
        !nextCopyStart
    ) {

        return;

    }


    const copyWidth =
        nextCopyStart.offsetLeft -
        middleStart.offsetLeft;


    if (
        copyWidth <= 0
    ) {

        return;

    }


    const currentScroll =
        featuredTrack.scrollLeft;


    const rightLimit =
        middleStart.offsetLeft +
        copyWidth * 2;


    const leftLimit =
        middleStart.offsetLeft -
        copyWidth * 2;


    if (
        currentScroll >
        rightLimit
    ) {

        featuredIsResetting = true;


        featuredTrack.scrollLeft =
            currentScroll -
            copyWidth;


        requestAnimationFrame(() => {

            featuredIsResetting =
                false;

        });


        return;

    }


    if (
        currentScroll <
        leftLimit
    ) {

        featuredIsResetting = true;


        featuredTrack.scrollLeft =
            currentScroll +
            copyWidth;


        requestAnimationFrame(() => {

            featuredIsResetting =
                false;

        });

    }

}


/* =========================================================
   FEATURED SCROLL DETECTION
========================================================= */

function initializeFeaturedScroll() {

    if (!featuredTrack) return;


    featuredTrack.addEventListener(
        "scroll",
        () => {

            fixFeaturedLoop();


            clearTimeout(
                featuredScrollTimer
            );


            featuredScrollTimer =
                setTimeout(() => {

                    updateFeaturedIndex();

                }, 80);

        },
        {
            passive: true
        }
    );


    /* =====================================================
       TOUCH START
    ===================================================== */

    featuredTrack.addEventListener(
        "touchstart",
        () => {

            featuredIsUserScrolling =
                true;


            clearInterval(
                featuredAutoSlider
            );


            clearTimeout(
                featuredResumeTimer
            );

        },
        {
            passive: true
        }
    );


    /* =====================================================
       TOUCH END
    ===================================================== */

    featuredTrack.addEventListener(
        "touchend",
        () => {

            clearTimeout(
                featuredResumeTimer
            );


            featuredResumeTimer =
                setTimeout(() => {

                    featuredIsUserScrolling =
                        false;

                    startFeaturedSlider();

                }, 3500);

        },
        {
            passive: true
        }
    );


    /* =====================================================
       TOUCH CANCEL
    ===================================================== */

    featuredTrack.addEventListener(
        "touchcancel",
        () => {

            clearTimeout(
                featuredResumeTimer
            );


            featuredResumeTimer =
                setTimeout(() => {

                    featuredIsUserScrolling =
                        false;

                    startFeaturedSlider();

                }, 3500);

        },
        {
            passive: true
        }
    );


    /* =====================================================
       DESKTOP WHEEL / TRACKPAD
    ===================================================== */

    featuredTrack.addEventListener(
        "wheel",
        () => {

            featuredIsUserScrolling =
                true;


            clearInterval(
                featuredAutoSlider
            );


            clearTimeout(
                featuredResumeTimer
            );


            featuredResumeTimer =
                setTimeout(() => {

                    featuredIsUserScrolling =
                        false;

                    startFeaturedSlider();

                }, 3500);

        },
        {
            passive: true
        }
    );

}


/* =========================================================
   FEATURED AUTO SLIDER
========================================================= */

function startFeaturedSlider() {

    if (
        featuredSlides.length < 2
    ) {

        return;

    }


    if (
        featuredIsUserScrolling
    ) {

        return;

    }


    clearInterval(
        featuredAutoSlider
    );


    featuredAutoSlider =
        setInterval(() => {

            if (
                !featuredIsUserScrolling
            ) {

                nextSlide();

            }

        }, 7000);

}


/* =========================================================
   RESTART FEATURED SLIDER
========================================================= */

function restartFeaturedSlider() {

    clearInterval(
        featuredAutoSlider
    );


    if (
        !featuredIsUserScrolling
    ) {

        startFeaturedSlider();

    }

}


/* =========================================================
   FEATURED HOVER
========================================================= */

function initializeFeaturedHover() {

    if (!featuredTrack) return;


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

            if (
                !featuredIsUserScrolling
            ) {

                startFeaturedSlider();

            }

        }
    );

}


/* =========================================================
   5. BRAND AD SLIDER
========================================================= */

let brandAdSlider = null;

let brandAdSlides = [];

let brandAdIndex = 0;

let brandAdInterval = null;

let brandAdScrollTimer = null;

let brandAdIsResetting = false;


/* =========================================================
   BUILD BRAND ADVERTISEMENTS
========================================================= */

function buildBrandAds() {

    const slider =
        document.getElementById(
            "brandAdSlider"
        );


    if (!slider) return;


    if (
        typeof brandAds ===
        "undefined"
    ) {

        console.error(
            "Beelinx: brandAds was not found in products.js."
        );

        return;

    }


    if (
        !Array.isArray(brandAds) ||
        brandAds.length === 0
    ) {

        console.warn(
            "Beelinx: No brand advertisements found."
        );

        return;

    }


    slider.innerHTML = "";


    brandAds.forEach(
        (ad) => {

            /*
               Find the brand automatically
               from the brands database.
            */

            const brandData =
                typeof brands !== "undefined"
                    ? brands[ad.brand]
                    : null;


            const slide =
                document.createElement("div");

            slide.className =
                "brand-ad-slide";


            /* =================================================
               BRAND LINK
            ================================================= */

            const link =
                document.createElement("a");


            link.href =
                ad.link ||
                (brandData
                    ? brandData.page
                    : "#");


            /* =================================================
               IMAGE
            ================================================= */

            const image =
                document.createElement("img");


            image.src =
                ad.image;


            image.alt =
                ad.alt ||
                `${ad.brand || "Brand"} collection`;


            image.loading =
                "lazy";


            /* =================================================
               CONTENT
            ================================================= */

            const content =
                document.createElement("div");


            content.className =
                "brand-ad-content";


            const title =
                document.createElement("p");


            title.className =
                "brand-ad-title";


            title.textContent =
                ad.title ||
                ad.brand ||
                "";


            const subtitle =
                document.createElement("p");


            subtitle.className =
                "brand-ad-subtitle";


            subtitle.textContent =
                ad.subtitle ||
                "EXPLORE THE COLLECTION";


            /* =================================================
               BUILD AD
            ================================================= */

            content.appendChild(
                title
            );


            content.appendChild(
                subtitle
            );


            link.appendChild(
                image
            );


            link.appendChild(
                content
            );


            slide.appendChild(
                link
            );


            slider.appendChild(
                slide
            );

        }
    );

}


/* =========================================================
   SETUP TRUE INFINITE BRAND AD CAROUSEL
========================================================= */

function setupBrandAdCarousel() {

    brandAdSlider =
        document.getElementById(
            "brandAdSlider"
        );


    if (!brandAdSlider) return;


    const originalSlides =
        Array.from(
            brandAdSlider.querySelectorAll(
                ".brand-ad-slide"
            )
        );


    if (
        originalSlides.length === 0
    ) {

        return;

    }


    /* =====================================================
       ONLY ONE AD
    ===================================================== */

    if (
        originalSlides.length === 1
    ) {

        brandAdSlides =
            originalSlides;

        brandAdIndex = 0;


        requestAnimationFrame(() => {

            brandAdSlider.scrollLeft =
                0;

        });


        return;

    }


    /* =====================================================
       TRUE INFINITE LOOP
    ===================================================== */

    const originalHTML =
        originalSlides.map(
            slide => slide.outerHTML
        );


    brandAdSlider.innerHTML = "";


    const numberOfCopies = 7;


    for (
        let copy = 0;
        copy < numberOfCopies;
        copy++
    ) {

        originalHTML.forEach(
            (html, originalIndex) => {

                const wrapper =
                    document.createElement("div");


                wrapper.innerHTML =
                    html;


                const slide =
                    wrapper.firstElementChild;


                if (slide) {

                    slide.classList.add(
                        "brand-ad-infinite-slide"
                    );


                    slide.dataset.originalIndex =
                        originalIndex;


                    brandAdSlider.appendChild(
                        slide
                    );

                }

            }
        );

    }


    brandAdSlides =
        Array.from(
            brandAdSlider.querySelectorAll(
                ".brand-ad-slide"
            )
        );


    const count =
        originalSlides.length;


    /* =====================================================
       START IN COPY 3
    ===================================================== */

    requestAnimationFrame(() => {

        const startingSlide =
            brandAdSlides[
                count * 3
            ];


        if (startingSlide) {

            brandAdSlider.scrollLeft =
                startingSlide.offsetLeft;

        }

    });

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


    const scrollPosition =
        brandAdSlider.scrollLeft;


    let closestIndex = 0;

    let closestDistance =
        Infinity;


    brandAdSlides.forEach(
        (slide, index) => {

            const distance =
                Math.abs(
                    slide.offsetLeft -
                    scrollPosition
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


    const realCount =
        getBrandAdOriginalCount();


    if (
        realCount <= 0
    ) {

        return 0;

    }


    return (
        closestIndex %
        realCount
    );

}


/* =========================================================
   GET ORIGINAL BRAND AD COUNT
========================================================= */

function getBrandAdOriginalCount() {

    if (
        !brandAdSlides.length
    ) {

        return 0;

    }


    const firstOriginal =
        brandAdSlides.findIndex(
            slide =>
                slide.dataset.originalIndex === "0"
        );


    if (
        firstOriginal === -1
    ) {

        return brandAdSlides.length;

    }


    let count = 0;


    for (
        let i = firstOriginal;
        i < brandAdSlides.length;
        i++
    ) {

        const originalIndex =
            brandAdSlides[i].dataset.originalIndex;


        if (
            originalIndex ===
            String(count)
        ) {

            count++;

        } else {

            break;

        }

    }


    return count || 1;

}


/* =========================================================
   MOVE TO BRAND AD
========================================================= */

function scrollToBrandAd(
    realIndex,
    smooth = true
) {

    if (
        !brandAdSlider ||
        brandAdSlides.length === 0
    ) {

        return;

    }


    const count =
        getBrandAdOriginalCount();


    if (
        count <= 0
    ) {

        return;

    }


    realIndex =
        (
            realIndex +
            count
        ) %
        count;


    const currentPosition =
        brandAdSlider.scrollLeft;


    let bestSlide = null;

    let bestDistance =
        Infinity;


    brandAdSlides.forEach(
        slide => {

            if (
                Number(
                    slide.dataset.originalIndex
                ) !== realIndex
            ) {

                return;

            }


            const distance =
                Math.abs(
                    slide.offsetLeft -
                    currentPosition
                );


            if (
                distance <
                bestDistance
            ) {

                bestDistance =
                    distance;

                bestSlide =
                    slide;

            }

        }
    );


    if (!bestSlide) return;


    brandAdIndex =
        realIndex;


    brandAdSlider.scrollTo({

        left:
            bestSlide.offsetLeft,

        behavior:
            smooth
                ? "smooth"
                : "auto"

    });

}


/* =========================================================
   GO TO BRAND AD
========================================================= */

function goToBrandAd(index) {

    if (
        !brandAdSlides.length
    ) {

        return;

    }


    const count =
        getBrandAdOriginalCount();


    if (
        count <= 0
    ) {

        return;

    }


    index =
        (
            index +
            count
        ) %
        count;


    scrollToBrandAd(
        index,
        true
    );


    restartBrandAdSlider();

}


/* =========================================================
   SHOW BRAND AD
========================================================= */

function showBrandAd(index) {

    goToBrandAd(index);

}


/* =========================================================
   NEXT BRAND AD
========================================================= */

function nextBrandAd() {

    if (
        !brandAdSlider ||
        brandAdSlides.length < 2
    ) {

        return;

    }


    const count =
        getBrandAdOriginalCount();


    if (
        count <= 1
    ) {

        return;

    }


    const currentIndex =
        getCurrentBrandAd();


    const nextIndex =
        (
            currentIndex + 1
        ) %
        count;


    scrollToBrandAd(
        nextIndex,
        true
    );

}


/* =========================================================
   PREVIOUS BRAND AD
========================================================= */

function prevBrandAd() {

    if (
        !brandAdSlider ||
        brandAdSlides.length < 2
    ) {

        return;

    }


    const count =
        getBrandAdOriginalCount();


    if (
        count <= 1
    ) {

        return;

    }


    const currentIndex =
        getCurrentBrandAd();


    const previousIndex =
        (
            currentIndex -
            1 +
            count
        ) %
        count;


    scrollToBrandAd(
        previousIndex,
        true
    );

}


/* =========================================================
   FIX TRUE BRAND AD INFINITE LOOP
========================================================= */

function fixBrandAdLoop() {

    if (
        !brandAdSlider ||
        brandAdIsResetting ||
        brandAdSlides.length < 2
    ) {

        return;

    }


    const count =
        getBrandAdOriginalCount();


    if (
        count <= 0
    ) {

        return;

    }


    const middleStart =
        brandAdSlides[
            count * 3
        ];


    const nextCopyStart =
        brandAdSlides[
            count * 4
        ];


    if (
        !middleStart ||
        !nextCopyStart
    ) {

        return;

    }


    const copyWidth =
        nextCopyStart.offsetLeft -
        middleStart.offsetLeft;


    if (
        copyWidth <= 0
    ) {

        return;

    }


    const currentScroll =
        brandAdSlider.scrollLeft;


    const rightLimit =
        middleStart.offsetLeft +
        copyWidth * 2;


    const leftLimit =
        middleStart.offsetLeft -
        copyWidth * 2;


    if (
        currentScroll >
        rightLimit
    ) {

        brandAdIsResetting = true;


        brandAdSlider.scrollLeft =
            currentScroll -
            copyWidth;


        requestAnimationFrame(() => {

            brandAdIsResetting =
                false;

        });


        return;

    }


    if (
        currentScroll <
        leftLimit
    ) {

        brandAdIsResetting = true;


        brandAdSlider.scrollLeft =
            currentScroll +
            copyWidth;


        requestAnimationFrame(() => {

            brandAdIsResetting =
                false;

        });

    }

}


/* =========================================================
   BRAND AD SCROLL DETECTION
========================================================= */

function initializeBrandAdScroll() {

    if (!brandAdSlider) return;


    brandAdSlider.addEventListener(
        "scroll",
        () => {

            fixBrandAdLoop();


            clearTimeout(
                brandAdScrollTimer
            );


            brandAdScrollTimer =
                setTimeout(() => {

                    brandAdIndex =
                        getCurrentBrandAd();

                }, 80);

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

    if (
        brandAdSlides.length < 2
    ) {

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
   BRAND AD HOVER
========================================================= */

function initializeBrandAdHover() {

    if (!brandAdSlider) return;


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
   6. INITIALIZE EVERYTHING
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {


        /* =================================================
           FEATURED PRODUCTS
        ================================================= */

        buildFeaturedCarousel();

        setupFeaturedCarousel();

        initializeFeaturedScroll();

        initializeFeaturedHover();

        startFeaturedSlider();



        /* =================================================
           BRAND ADS
        ================================================= */

        buildBrandAds();

        setupBrandAdCarousel();

        initializeBrandAdScroll();

        initializeBrandAdHover();

        startBrandAdSlider();


    }
);