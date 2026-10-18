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

    let data = null;

    try {
        const request = new XMLHttpRequest();
        request.open("POST", BEELINX_SUPABASE_URL + "/rest/v1/rpc/get_site_data", false);
        request.setRequestHeader("apikey", BEELINX_SUPABASE_KEY);
        request.setRequestHeader("Authorization", "Bearer " + BEELINX_SUPABASE_KEY);
        request.setRequestHeader("Content-Type", "application/json");
        request.send("{}");

        if (request.status >= 200 && request.status < 300) {
            data = JSON.parse(request.responseText);
        } else {
            console.error("Beelinx: database request failed", request.status, request.responseText);
        }
    } catch (error) {
        console.error("Beelinx: could not reach the database.", error);
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