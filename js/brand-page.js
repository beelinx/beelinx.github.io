/* =========================================
   BEELINX BRAND PAGE
   Dynamic brand template
========================================= */


/* =========================================
   GET BRAND FROM URL
========================================= */

const urlParams =
    new URLSearchParams(window.location.search);

const brandName =
    urlParams.get("brand");


/* =========================================
   FIND BRAND
========================================= */

const brand =
    brands[brandName];


/* =========================================
   PAGE ELEMENTS
========================================= */

const brandLogo =
    document.getElementById("brand-logo");

const brandNameElement =
    document.getElementById("brand-name");

const productsContainer =
    document.getElementById("products-container");

const brandWebsite =
    document.getElementById("brand-website");

const brandSlogan =
    document.getElementById("brand-slogan");

const socialContainer =
    document.getElementById("brand-socials");

const pageTitle =
    document.getElementById("page-title");


/* =========================================
   CHECK BRAND
========================================= */

if (!brand) {

    if (brandNameElement) {

        brandNameElement.textContent =
            "Brand Not Found";

    }

} else {


    /* =========================================
       BRAND INFORMATION
    ========================================= */


    /* Page title */

    if (pageTitle) {

        pageTitle.textContent =
            `Beelinx | ${brand.name}`;

    }


    /* Brand logo */

    if (brandLogo) {

        brandLogo.src =
            brand.logo;

        brandLogo.alt =
            `${brand.name} Logo`;

    }


    /* Brand name */

    if (brandNameElement) {

        brandNameElement.textContent =
            brand.name.toUpperCase();

    }


    /* Official website */

    if (brandWebsite) {

        brandWebsite.href =
            brand.website;

        brandWebsite.textContent =
            `${brand.name} Official website`;

    }


    /* Brand slogan */

    if (brandSlogan) {

        brandSlogan.textContent =
            brand.slogan;

    }


    /* =========================================
       FIND BRAND PRODUCTS
    ========================================= */

    const brandProducts =
        Object.entries(products).filter(
            ([id, product]) => {

                return product.brand === brand.name;

            }
        );


    /* =========================================
       CREATE PRODUCT CARDS
    ========================================= */

    if (productsContainer) {

        brandProducts.forEach(
            ([id, product]) => {

                const productCard =
                    document.createElement("div");

                productCard.className =
                    "products";


                productCard.innerHTML = `

                    <a href="product-template.html?id=${id}">

                        <img
                            class="clothe-image"
                            src="${product.image}"
                            alt="${product.name}"
                            loading="lazy">

                    </a>


                    <p class="clothe-text">

                        <a
                            class="brand-page-link"
                            href="brandpage-template.html?brand=${encodeURIComponent(brand.name)}">

                            <strong>
                                ${brand.name}
                            </strong>

                        </a>

                        <br>

                        ${product.name}


                    </p>


                    <p class="price">

                        ${product.price}

                    </p>

                `;


                productsContainer.appendChild(
                    productCard
                );

            }
        );

    }


    /* =========================================
       SOCIAL MEDIA
    ========================================= */

    if (
        socialContainer &&
        brand.social
    ) {


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


                    socialLink.innerHTML =
                        `<i class="${socialIcons[platform]}"></i>`;


                    socialContainer.appendChild(
                        socialLink
                    );

                }

            }
        );

    }

}