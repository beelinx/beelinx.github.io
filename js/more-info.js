/* =========================================
   MORE INFO PAGE
   Reads product information from products.js
========================================= */


/* =========================================
   GET PRODUCT ID FROM URL
========================================= */

const urlParams =
    new URLSearchParams(window.location.search);

const productId =
    urlParams.get("id");


/* =========================================
   FIND PRODUCT
========================================= */

const product =
    products[productId];


/* =========================================
   FIND BRAND
========================================= */

const brand =
    product ? brands[product.brand] : null;


/* =========================================
   DISPLAY PRODUCT
========================================= */

if (product) {

    /* -----------------------------------------
       Product image
    ----------------------------------------- */

    document.getElementById("product-image").src =
        product.image;

    document.getElementById("product-image").alt =
        product.name;

    document.getElementById("product-image-link").href =
        product.image;


    /* -----------------------------------------
       Product name
    ----------------------------------------- */

    document.getElementById("product-name").textContent =
        product.name;


    /* -----------------------------------------
       Product price
    ----------------------------------------- */

    document.getElementById("product-price").textContent =
        product.price;


    /* -----------------------------------------
       Brand information
    ----------------------------------------- */

    if (brand) {

        /* Brand logo */

        document.getElementById("brand-logo").src =
            brand.logo;

        document.getElementById("brand-logo").alt =
            brand.name + " Logo";


        /* Brand page */

        document.getElementById("brand-link").href =
            brand.page;

    }


    /* -----------------------------------------
       Order link
    ----------------------------------------- */

    document.getElementById("order-link").href =
        product.orderLink;

}


/* =========================================
   MORE BY BRAND
========================================= */

const moreProductsTitle =
    document.getElementById("more-products-title");

const moreProductsContainer =
    document.getElementById("more-products-container");


if (
    product &&
    brand &&
    moreProductsContainer
) {

    /* -----------------------------------------
       Dynamic section title
    ----------------------------------------- */

    moreProductsTitle.textContent =
        `More by ${brand.name}`;


    /* -----------------------------------------
       FIND OTHER PRODUCTS FROM SAME BRAND
    ----------------------------------------- */

    const relatedProducts =
        Object.entries(products).filter(
            ([id, item]) => {

                return (
                    item.brand === product.brand &&
                    id !== productId
                );

            }
        );


    /* -----------------------------------------
       CREATE PRODUCT CARDS
    ----------------------------------------- */

    relatedProducts.forEach(
        ([id, item]) => {

            const productCard =
                document.createElement("div");

            productCard.className =
                "more-product-card";


            productCard.innerHTML = `

                <a href="product-template.html?id=${id}">

                    <img
                        src="${item.image}"
                        alt="${item.name}"
                        loading="lazy">

                </a>

                <div class="more-product-info">

                    <p class="more-product-brand">
                        ${brand.name}
                    </p>

                    <p class="more-product-name">
                        ${item.name}
                    </p>

                    <p class="more-product-price">
                        ${item.price}
                    </p>

                </div>

            `;


            moreProductsContainer.appendChild(
                productCard
            );

        }
    );

}


/* =========================================
   BRAND WEBSITE + SLOGAN
========================================= */

const brandWebsite =
    document.getElementById("productBrandWebsite");

const brandSlogan =
    document.getElementById("productBrandSlogan");


if (brand) {

    /* -----------------------------------------
       Official brand website
    ----------------------------------------- */

    if (
        brandWebsite &&
        brand.website
    ) {

        brandWebsite.href =
            brand.website;

        brandWebsite.textContent =
            `${brand.name} Official Website`;

    }


    /* -----------------------------------------
       Brand-specific slogan
    ----------------------------------------- */

    if (
        brandSlogan &&
        brand.slogan
    ) {

        brandSlogan.textContent =
            brand.slogan;

    }

}


/* =========================================
   BRAND SOCIAL MEDIA
========================================= */

const socialContainer =
    document.getElementById("brand-socials");


if (
    brand &&
    socialContainer &&
    brand.social
) {

    /* -----------------------------------------
       Font Awesome icons
    ----------------------------------------- */

    const socialIcons = {

        instagram:
            "fab fa-instagram",

        tiktok:
            "fab fa-tiktok",

        twitter:
            "fab fa-x-twitter",

        facebook:
            "fab fa-facebook",

        youtube:
            "fab fa-youtube"

    };


    /* -----------------------------------------
       CREATE SOCIAL LINKS
    ----------------------------------------- */

    Object.entries(brand.social).forEach(
        ([platform, link]) => {

            if (
                link &&
                socialIcons[platform]
            ) {

                const socialLink =
                    document.createElement("a");


                socialLink.href =
                    link;


                socialLink.target =
                    "_blank";


                socialLink.rel =
                    "noopener noreferrer";


                socialLink.className =
                    "brand-social-link";


                socialLink.innerHTML =
                    `<i class="${socialIcons[platform]}"></i>`;


                socialContainer.appendChild(
                    socialLink
                );

            }

        }
    );

}