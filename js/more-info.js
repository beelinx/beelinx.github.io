/* =========================================
   MORE INFO PAGE
   Reads product information from products.js
========================================= */

const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");
const product = typeof products !== "undefined" ? products[productId] : null;
const brand = product && typeof brands !== "undefined" ? brands[product.brand] : null;

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value == null ? "" : value;
    return element;
}

if (product) {
    const productImage = document.getElementById("product-image");
    if (productImage) {
        productImage.src = product.image || "";
        productImage.alt = product.name || "Product image";
    }

    const productImageLink = document.getElementById("product-image-link");
    if (productImageLink) productImageLink.href = product.image || "#";

    setText("product-name", product.name || "");
    setText("product-price", typeof formatPrice === "function" ? formatPrice(product.price) : (product.price || ""));

    if (brand) {
        const brandLogo = document.getElementById("brand-logo");
        if (brandLogo) {
            brandLogo.src = brand.logo || "";
            brandLogo.alt = `${brand.name} Logo`;
        }

        const brandLink = document.getElementById("brand-link");
        if (brandLink) brandLink.href = brand.page || `brandpage-template.html?brand=${encodeURIComponent(brand.name)}`;
    }

    const orderLink = document.getElementById("order-link");
    if (orderLink) {
        orderLink.href = product.orderLink || "#";
        if (!product.orderLink) orderLink.setAttribute("aria-disabled", "true");
        else orderLink.removeAttribute("aria-disabled");
    }
} else {
    setText("product-name", "Product Not Found");
}

/* =========================================
   MORE BY BRAND
========================================= */

const moreProductsTitle = document.getElementById("more-products-title");
const moreProductsContainer = document.getElementById("more-products-container");

if (product && brand && moreProductsContainer) {
    if (moreProductsTitle) moreProductsTitle.textContent = `More by ${brand.name}`;
    moreProductsContainer.replaceChildren();

    const relatedProducts = Object.entries(products).filter(
        ([id, item]) => item.brand === product.brand && id !== productId
    );

    relatedProducts.forEach(([id, item]) => {
        const productCard = document.createElement("div");
        productCard.className = "more-product-card";

        const imageLink = document.createElement("a");
        imageLink.href = `product-template.html?id=${encodeURIComponent(id)}`;

        const image = document.createElement("img");
        image.src = item.image || "";
        image.alt = item.name || "Product image";
        image.loading = "lazy";
        imageLink.appendChild(image);

        const info = document.createElement("div");
        info.className = "more-product-info";

        const brandName = document.createElement("p");
        brandName.className = "more-product-brand";
        brandName.textContent = brand.name;

        const name = document.createElement("p");
        name.className = "more-product-name";
        name.textContent = item.name || "";

        const price = document.createElement("p");
        price.className = "more-product-price";
        price.textContent = typeof formatPrice === "function" ? formatPrice(item.price) : (item.price || "");

        info.append(brandName, name, price);
        productCard.append(imageLink, info);
        moreProductsContainer.appendChild(productCard);
    });
}

/* =========================================
   BRAND WEBSITE + SLOGAN
========================================= */

const brandWebsite = document.getElementById("productBrandWebsite");
const brandSlogan = document.getElementById("productBrandSlogan");

if (brand) {
    if (brandWebsite && brand.website) {
        brandWebsite.href = brand.website;
        brandWebsite.textContent = `${brand.name} Official Website`;
        brandWebsite.target = "_blank";
        brandWebsite.rel = "noopener noreferrer";
    }

    if (brandSlogan) brandSlogan.textContent = brand.slogan || "";
}

/* =========================================
   BRAND SOCIAL MEDIA
========================================= */

const socialContainer = document.getElementById("brand-socials");

if (brand && socialContainer && brand.social) {
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
        socialLink.className = "brand-social-link";
        socialLink.setAttribute("aria-label", platform);

        const icon = document.createElement("i");
        icon.className = socialIcons[platform];
        socialLink.appendChild(icon);
        socialContainer.appendChild(socialLink);
    });
}
