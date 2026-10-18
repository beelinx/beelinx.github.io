/* =========================================
   BEELINX DATA (replaces products.js)

   Loads brands, products, featured products and
   brand ads from Supabase, then rebuilds the same
   four objects the site already uses:
     brands, products, featuredProducts, brandAds
   so hero.js, home-products.js, brand-page.js,
   more-info.js, main.js, engagement.js and the
   catalogue page keep working unchanged.

   It uses one synchronous request on purpose, so the
   data is ready before the next script runs and the
   existing script order does not need to change.
========================================= */

var BEELINX_SUPABASE_URL = "https://zjzygjflcjqvouitblne.supabase.co";
var BEELINX_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenlnamZsY2pxdm91aXRibG5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MzU4ODEsImV4cCI6MjEwNzMxMTg4MX0.4eL9sedABpdvthy3v7t_V1WtcxeoQ7rxe1z38VQ3N48";


/* =========================================
   SHARED PRICE FORMATTER (moved from products.js, unchanged)
========================================= */
function formatPrice(price) {
    if (price === null || price === undefined || price === "") {
        return "";
    }

    if (typeof price === "string") {
        const trimmedPrice = price.trim();

        if (!trimmedPrice) return "";

        // Prevent adding the naira sign twice.
        if (trimmedPrice.includes("₦")) {
            return trimmedPrice;
        }

        // Remove thousands separators before converting to a number.
        price = trimmedPrice.replace(/,/g, "");
    }

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice)) {
        return String(price);
    }

    return "₦" + new Intl.NumberFormat("en-NG", {
        maximumFractionDigits: 2
    }).format(numericPrice);
}


/* =========================================
   LOAD FROM SUPABASE
========================================= */
(function () {
    "use strict";

    window.brands = {};
    window.products = {};
    window.featuredProducts = [];
    window.brandAds = [];

    /* Speed: the site data is remembered on this device. A visit uses the
       saved copy straight away (no waiting), and a newer copy is fetched in
       the background for next time. Only the very first visit has to wait. */
    const CACHE_KEY = "beelinx_site_data_v1";
    const REFRESH_AFTER_MS = 2 * 60 * 1000;
    const KEEP_FOR_MS = 24 * 60 * 60 * 1000;

    function readCache() {
        try {
            const saved = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
            if (saved && saved.data && Date.now() - saved.time < KEEP_FOR_MS) return saved;
        } catch (error) { /* ignore */ }
        return null;
    }

    function writeCache(value) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), data: value }));
        } catch (error) { /* storage full or blocked: fine */ }
    }

    function refreshInBackground() {
        fetch(BEELINX_SUPABASE_URL + "/rest/v1/rpc/get_site_data", {
            method: "POST",
            headers: {
                "apikey": BEELINX_SUPABASE_KEY,
                "Authorization": "Bearer " + BEELINX_SUPABASE_KEY,
                "Content-Type": "application/json"
            },
            body: "{}"
        })
            .then(function (response) { return response.ok ? response.json() : null; })
            .then(function (fresh) { if (fresh) writeCache(fresh); })
            .catch(function () { /* offline: keep the saved copy */ });
    }

    let data = null;

    const saved = readCache();

    if (saved) {
        data = saved.data;
        if (Date.now() - saved.time > REFRESH_AFTER_MS) refreshInBackground();
    } else {
        try {
            const request = new XMLHttpRequest();
            request.open("POST", BEELINX_SUPABASE_URL + "/rest/v1/rpc/get_site_data", false);
            request.setRequestHeader("apikey", BEELINX_SUPABASE_KEY);
            request.setRequestHeader("Authorization", "Bearer " + BEELINX_SUPABASE_KEY);
            request.setRequestHeader("Content-Type", "application/json");
            request.send("{}");

            if (request.status >= 200 && request.status < 300) {
                data = JSON.parse(request.responseText);
                writeCache(data);
            } else {
                console.error("Beelinx: database request failed", request.status, request.responseText);
            }
        } catch (error) {
            console.error("Beelinx: could not reach the database.", error);
        }
    }

    if (!data) return;

    function brandPage(name) {
        return "brandpage-template.html?brand=" + encodeURIComponent(name);
    }

    const brandNameById = {};

    (data.brands || []).forEach(function (row) {
        brandNameById[row.id] = row.name;
        window.brands[row.name] = {
            name: row.name,
            logo: row.logo,
            page: brandPage(row.name),
            website: row.website,
            slogan: row.slogan,
            social: row.social || {}
        };
    });

    (data.products || []).forEach(function (row) {
        const brandName = brandNameById[row.brand_id] || "";
        window.products[row.id] = {
            name: row.name,
            price: row.price,
            image: row.image,
            brand: brandName,
            brandLink: brandPage(brandName),
            orderLink: row.order_link
        };
    });

    (data.featured || []).forEach(function (row) {
        const product = window.products[row.product_id];
        if (!product) return;

        window.featuredProducts.push({
            productId: row.product_id,
            name: product.name,
            price: product.price,
            image: row.image || product.image,
            brand: product.brand,
            collection: row.collection,
            brandLink: product.brandLink,
            description: row.description
        });
    });

    (data.ads || []).forEach(function (row) {
        window.brandAds.push({
            brand: brandNameById[row.brand_id] || "",
            image: row.image,
            title: row.title,
            subtitle: row.subtitle,
            alt: row.alt
        });
    });
})();