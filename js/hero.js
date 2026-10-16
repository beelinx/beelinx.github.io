/* =========================================
   BEELINX HOMEPAGE HERO SPOTLIGHT
   Editorial one-product-at-a-time showcase.

   Reads featuredProducts from products.js
   (same data the old carousel used, nothing
   in products.js needs to change).

   The slides sit in a real horizontal scroll track
   (scroll-snap), so it works like any native slider:
   swipe on phones, sideways trackpad scroll, shift +
   wheel, click-and-drag with a mouse, arrows, keyboard.
   Slow autoplay with progress lines pauses on hover,
   focus and touch, and is off for people who prefer
   reduced motion.
========================================= */

(function () {
    "use strict";

    const root = document.getElementById("heroSpotlight");
    if (!root) return;

    if (
        typeof featuredProducts === "undefined" ||
        !Array.isArray(featuredProducts) ||
        featuredProducts.length === 0
    ) {
        root.style.display = "none";
        return;
    }

    const AUTOPLAY_MS = 7000;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = featuredProducts;

    let index = 0;
    let slides = [];
    let segments = [];
    let currentLabel = null;


    /* =========================================
       SMALL HELPERS
    ========================================= */

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    function pad(number) {
        return String(number).padStart(2, "0");
    }

    function formatMoney(price) {
        return typeof formatPrice === "function" ? formatPrice(price) : (price || "");
    }

    function productUrl(item) {
        if (item.productId) return "product-template.html?id=" + encodeURIComponent(item.productId);
        return item.orderLink || "#";
    }


    /* =========================================
       BUILD ONE SLIDE
    ========================================= */

    function buildSlide(item, position) {
        const slide = el("div", "hero-slide");
        slide.setAttribute("role", "group");
        slide.setAttribute("aria-roledescription", "slide");
        slide.setAttribute("aria-label", (position + 1) + " of " + items.length);

        /* Big faint brand name behind the product */
        const brandText = String(item.brand || item.collection || "").toUpperCase();
        const ghost = el("div", "hero-ghost", brandText);
        ghost.setAttribute("aria-hidden", "true");
        ghost.style.fontSize = Math.min(18, 115 / Math.max(brandText.length, 5)) + "vw";

        /* Product on its grey studio panel */
        const media = el("div", "hero-media");
        const plate = el("a", "hero-plate");
        plate.href = productUrl(item);
        plate.setAttribute("aria-label", "View " + (item.name || "product"));

        const image = document.createElement("img");
        image.src = item.image || "";
        image.alt = item.name || "Featured product";
        image.loading = position === 0 ? "eager" : "lazy";
        plate.appendChild(image);
        media.appendChild(plate);

        /* Bookmark (Save to My List) if engagement.js is loaded */
        if (item.productId && typeof BeelinxEngage !== "undefined") {
            media.appendChild(BeelinxEngage.createSaveButton(item.productId));
        }

        /* Left: collection, name, price, button */
        const info = el("div", "hero-info");

        const kicker = el("a", "hero-kicker", item.collection || ((item.brand || "") + " COLLECTION"));
        kicker.href = item.brandLink || "#";

        const title = el("h2", "hero-title", item.name || "");
        const price = el("p", "hero-price", formatMoney(item.price));

        const cta = el("a", "hero-cta");
        cta.href = productUrl(item);
        cta.append(document.createTextNode("View product"), el("span", "hero-cta-arrow", "\u2192"));

        info.append(kicker, title, price, cta);

        /* Right: description */
        const desc = el("p", "hero-desc", item.description || "");

        slide.append(ghost, media, info, desc);
        return slide;
    }


    /* =========================================
       SHOW / SCROLL TO A SLIDE
       setActive only updates the interface.
       scrollToIndex moves the track; the scroll
       listener then calls setActive.
    ========================================= */

    let stage = null;

    function setActive(newIndex) {
        index = newIndex;

        slides.forEach(function (slide, i) {
            const active = i === index;
            slide.classList.toggle("is-active", active);
            slide.setAttribute("aria-hidden", String(!active));
            slide.querySelectorAll("a, button").forEach(function (control) {
                control.tabIndex = active ? 0 : -1;
            });
        });

        segments.forEach(function (segment, i) {
            segment.classList.toggle("is-done", i < index);
            segment.classList.toggle("is-active", i === index);
            segment.setAttribute("aria-current", i === index ? "true" : "false");
        });

        if (currentLabel) currentLabel.textContent = pad(index + 1);
    }

    function scrollToIndex(target, instant) {
        if (!stage) return;
        stage.scrollTo({
            left: target * stage.clientWidth,
            behavior: (instant || reduceMotion) ? "auto" : "smooth"
        });
    }

    function next() {
        const wraps = index === items.length - 1;
        scrollToIndex(wraps ? 0 : index + 1, wraps);
    }

    function previous() {
        const wraps = index === 0;
        scrollToIndex(wraps ? items.length - 1 : index - 1, wraps);
    }


    /* =========================================
       BUILD THE HERO
    ========================================= */

    root.style.setProperty("--hero-ms", AUTOPLAY_MS + "ms");
    if (reduceMotion) root.classList.add("no-autoplay");
    root.replaceChildren();

    stage = el("div", "hero-stage");
    items.forEach(function (item, position) {
        const slide = buildSlide(item, position);
        slides.push(slide);
        stage.appendChild(slide);
    });
    root.appendChild(stage);

    if (items.length > 1) {

        /* Counter, top-left */
        const counter = el("div", "hero-counter");
        currentLabel = el("span", "hero-count-current", "01");
        counter.append(currentLabel, el("span", "hero-count-sep"), el("span", "hero-count-total", pad(items.length)));

        /* Arrows, top-right */
        const arrows = el("div", "hero-arrows");

        const prevButton = el("button", "hero-arrow");
        prevButton.type = "button";
        prevButton.setAttribute("aria-label", "Previous product");
        prevButton.innerHTML = '<i class="fa-solid fa-arrow-left"></i>';
        prevButton.addEventListener("click", previous);

        const nextButton = el("button", "hero-arrow");
        nextButton.type = "button";
        nextButton.setAttribute("aria-label", "Next product");
        nextButton.innerHTML = '<i class="fa-solid fa-arrow-right"></i>';
        nextButton.addEventListener("click", next);

        arrows.append(prevButton, nextButton);

        /* Progress lines, bottom. When a line finishes filling, advance. */
        const progress = el("div", "hero-progress");
        items.forEach(function (item, i) {
            const segment = el("button", "hero-seg");
            segment.type = "button";
            segment.setAttribute("aria-label", "Go to product " + (i + 1));
            const fill = el("span", "hero-seg-fill");

            /* Invisible timer: when its animation ends, autoplay moves on.
               (The visible line shows position only, never "progress".) */
            const timer = el("span", "hero-seg-timer");
            timer.addEventListener("animationend", function () {
                if (segment.classList.contains("is-active")) next();
            });

            segment.append(fill, timer);
            segment.addEventListener("click", function () { scrollToIndex(i); });
            segments.push(segment);
            progress.appendChild(segment);
        });

        root.append(counter, arrows, progress);


        /* Pause autoplay while someone is reading or interacting */
        const pauseReasons = new Set();

        function setPaused(reason, on) {
            if (on) pauseReasons.add(reason); else pauseReasons.delete(reason);
            root.classList.toggle("is-paused", pauseReasons.size > 0);
        }

        root.addEventListener("mouseenter", function () { setPaused("hover", true); });
        root.addEventListener("mouseleave", function () { setPaused("hover", false); });
        /* Pause for keyboard focus only, so clicking an arrow with a
           mouse doesn't leave autoplay stuck on pause. */
        root.addEventListener("focusin", function (event) {
            if (event.target.matches && event.target.matches(":focus-visible")) {
                setPaused("focus", true);
            }
        });
        root.addEventListener("focusout", function () { setPaused("focus", false); });
        document.addEventListener("visibilitychange", function () { setPaused("hidden", document.hidden); });

        if ("IntersectionObserver" in window) {
            new IntersectionObserver(function (entries) {
                setPaused("offscreen", !entries[0].isIntersecting);
            }, { threshold: 0.25 }).observe(root);
        }


        /* Keep the interface in step with the scroll position.
           This runs for swipes, trackpad scrolling, dragging,
           arrows and autoplay alike. */
        let scrollTicking = false;

        stage.addEventListener("scroll", function () {
            if (scrollTicking) return;
            scrollTicking = true;
            requestAnimationFrame(function () {
                scrollTicking = false;
                const nearest = Math.round(stage.scrollLeft / stage.clientWidth);
                const clamped = Math.max(0, Math.min(items.length - 1, nearest));
                if (clamped !== index) setActive(clamped);
            });
        }, { passive: true });

        window.addEventListener("resize", function () {
            stage.scrollTo({ left: index * stage.clientWidth, behavior: "auto" });
        });


        /* Touch: native swipe does the moving, we only pause autoplay */
        stage.addEventListener("touchstart", function () { setPaused("touch", true); }, { passive: true });
        stage.addEventListener("touchend", function () { setPaused("touch", false); }, { passive: true });
        stage.addEventListener("touchcancel", function () { setPaused("touch", false); }, { passive: true });


        /* Mouse: click and drag to scroll (a mouse has no sideways swipe) */
        let drag = null;
        let suppressClick = false;

        stage.addEventListener("pointerdown", function (event) {
            if (event.pointerType !== "mouse" || event.button !== 0) return;
            drag = { x: event.clientX, left: stage.scrollLeft, start: index, moved: false };
        });

        window.addEventListener("pointermove", function (event) {
            if (!drag) return;
            const dx = event.clientX - drag.x;

            if (!drag.moved && Math.abs(dx) > 5) {
                drag.moved = true;
                stage.classList.add("is-dragging");
                stage.style.scrollSnapType = "none";
                setPaused("drag", true);
            }

            if (drag.moved) stage.scrollLeft = drag.left - dx;
        });

        window.addEventListener("pointerup", function (event) {
            if (!drag) return;
            const finished = drag;
            drag = null;
            if (!finished.moved) return;

            const dx = event.clientX - finished.x;
            let target = finished.start;
            if (dx < -50) target = Math.min(items.length - 1, finished.start + 1);
            if (dx > 50) target = Math.max(0, finished.start - 1);

            stage.classList.remove("is-dragging");
            stage.style.scrollSnapType = "";
            setPaused("drag", false);
            scrollToIndex(target);

            /* a drag should not count as a click on the product link */
            suppressClick = true;
            setTimeout(function () { suppressClick = false; }, 60);
        });

        stage.addEventListener("click", function (event) {
            if (suppressClick) {
                event.preventDefault();
                event.stopPropagation();
            }
        }, true);

        /* Stop the browser dragging the image or link ghost */
        stage.addEventListener("dragstart", function (event) {
            event.preventDefault();
        });


        /* Arrow keys while the hero has focus */
        root.addEventListener("keydown", function (event) {
            if (event.key === "ArrowRight") next();
            if (event.key === "ArrowLeft") previous();
        });
    }

    setActive(0);

})();