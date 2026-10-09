/* =========================================
   BEELINX BRAND PAGE
   Dynamic brand template
========================================= */

const urlParams = new URLSearchParams(window.location.search);
const brandName = urlParams.get("brand");
const brand = typeof brands !== "undefined" ? brands[brandName] : null;

const brandLogo = document.getElementById("brand-logo");
const brandNameElement = document.getElementById("brand-name");
const productsContainer = document.getElementById("products-container");
const brandWebsite = document.getElementById("brand-website");
const brandSlogan = document.getElementById("brand-slogan");
const socialContainer = document.getElementById("brand-socials");
const pageTitle = document.getElementById("page-title");

if (!brand) {
    if (brandNameElement) brandNameElement.textContent = "Brand Not Found";
    if (productsContainer) productsContainer.replaceChildren();
} else {
    if (pageTitle) pageTitle.textContent = `Beelinx | ${brand.name}`;

    if (brandLogo) {
        brandLogo.src = brand.logo || "";
        brandLogo.alt = `${brand.name} Logo`;
    }

    if (brandNameElement) brandNameElement.textContent = brand.name.toUpperCase();

    if (brandWebsite && brand.website) {
        brandWebsite.href = brand.website;
        brandWebsite.textContent = `${brand.name} Official website`;
        brandWebsite.target = "_blank";
        brandWebsite.rel = "noopener noreferrer";
    }

    if (brandSlogan) brandSlogan.textContent = brand.slogan || "";

    const brandProducts = Object.entries(products || {}).filter(
        ([, item]) => item.brand === brand.name
    );

    if (productsContainer) {
        productsContainer.replaceChildren();

        brandProducts.forEach(([id, item]) => {
            const productCard = document.createElement("div");
            productCard.className = "products";

            const imageLink = document.createElement("a");
            imageLink.href = `product-template.html?id=${encodeURIComponent(id)}`;

            const image = document.createElement("img");
            image.className = "clothe-image";
            image.src = item.image || "";
            image.alt = item.name || "Product image";
            image.loading = "lazy";
            imageLink.appendChild(image);

            const text = document.createElement("p");
            text.className = "clothe-text";

            const brandLink = document.createElement("a");
            brandLink.className = "brand-page-link";
            brandLink.href = brand.page || `brandpage-template.html?brand=${encodeURIComponent(brand.name)}`;

            const brandLabel = document.createElement("strong");
            brandLabel.textContent = brand.name;
            brandLink.appendChild(brandLabel);

            const productLabel = document.createTextNode(item.name || "");
            const price = document.createElement("p");
            price.className = "price";
            price.textContent = typeof formatPrice === "function" ? formatPrice(item.price) : (item.price || "");

            text.append(brandLink, document.createElement("br"), productLabel);
            productCard.append(imageLink, text, price);
            productsContainer.appendChild(productCard);
        });
    }

    if (socialContainer && brand.social) {
        const socialIcons = {
            instagram: "fab fa-instagram",
            tiktok: "fab fa-tiktok",
            twitter: "fab fa-x-twitter",
            facebook: "fab fa-facebook",
            youtube: "fab fa-youtube"
        };

        socialContainer.replaceChildren();
        Object.entries(brand.social).forEach(([platform, link]) => {
            if (!link || !socialIcons[platform]) return;

            const socialLink = document.createElement("a");
            socialLink.href = link;
            socialLink.target = "_blank";
            socialLink.rel = "noopener noreferrer";
            socialLink.setAttribute("aria-label", platform);

            const icon = document.createElement("i");
            icon.className = socialIcons[platform];
            socialLink.appendChild(icon);
            socialContainer.appendChild(socialLink);
        });
    }
}
