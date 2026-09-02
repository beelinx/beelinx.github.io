/* =========================================
   HOMEPAGE PRODUCT DISPLAY
   Brand products are grouped by row.

   Desktop:
   6 products per row

   Tablet / Mobile:
   3 products per row

   Brands rotate between rows so the same
   brand does not appear twice in a row.
========================================= */


const productsContainer =
    document.getElementById("products-container");


if (productsContainer) {


    /* =========================================
       GROUP PRODUCTS BY BRAND
    ========================================= */

    const productsByBrand = {};


    for (const id in products) {

        const product =
            products[id];


        if (!productsByBrand[product.brand]) {

            productsByBrand[product.brand] = [];

        }


        productsByBrand[product.brand].push({

            id: id,

            product: product

        });

    }


    /* =========================================
       GET BRAND ORDER
    ========================================= */

    const brandNames =
        Object.keys(productsByBrand);


    /* =========================================
       DETERMINE PRODUCTS PER ROW
    ========================================= */

    function getProductsPerRow() {

        if (window.innerWidth <= 768) {

            return 3;

        }

        return 6;

    }


    /* =========================================
       CREATE PRODUCT CARD
    ========================================= */

    function createProductCard(id, product) {


        const productCard =
            document.createElement("div");


        productCard.classList.add(
            "products"
        );


        /* =====================================
           PRODUCT LINK
        ===================================== */

        const productLink =
            document.createElement("a");


        productLink.href =
            `product-template.html?id=${id}`;


        /* =====================================
           PRODUCT IMAGE
        ===================================== */

        const productImage =
            document.createElement("img");


        productImage.classList.add(
            "clothe-image"
        );


        productImage.src =
            product.image;


        productImage.alt =
            product.name;


        productImage.loading =
            "lazy";


        productLink.appendChild(
            productImage
        );


        /* =====================================
           PRODUCT TEXT
        ===================================== */

        const productText =
            document.createElement("div");


        productText.classList.add(
            "clothe-text"
        );


        /* =====================================
           BRAND LINK
        ===================================== */

        const brandLink =
            document.createElement("a");


        brandLink.classList.add(
            "brand-page-link"
        );


        brandLink.href =
            product.brandLink;


        const brandName =
            document.createElement("strong");


        brandName.textContent =
            product.brand;


        brandLink.appendChild(
            brandName
        );


        /* =====================================
           PRODUCT NAME
        ===================================== */

        const productName =
            document.createTextNode(
                product.name
            );


        /* =====================================
           PRICE
        ===================================== */

        const price =
            document.createElement("p");


        price.classList.add(
            "price"
        );


        price.textContent =
            product.price;


        /* =====================================
           BUILD TEXT
        ===================================== */

        productText.appendChild(
            brandLink
        );


        productText.appendChild(
            document.createElement("br")
        );


        productText.appendChild(
            productName
        );


        productText.appendChild(
            price
        );


        /* =====================================
           BUILD CARD
        ===================================== */

        productCard.appendChild(
            productLink
        );


        productCard.appendChild(
            productText
        );


        return productCard;

    }


    /* =========================================
       DISPLAY PRODUCTS
    ========================================= */

    function displayProducts() {


        /* Clear existing products */

        productsContainer.innerHTML = "";


        const productsPerRow =
            getProductsPerRow();


        /* =====================================
           KEEP TRACK OF CURRENT PRODUCT
           FOR EACH BRAND
        ===================================== */

        const brandPositions = {};


        brandNames.forEach(
            brand => {

                brandPositions[brand] = 0;

            }
        );


        /* =====================================
           KEEP TRACK OF WHICH BRAND IS NEXT
        ===================================== */

        let currentBrandIndex = 0;


        /* =====================================
           CONTINUE UNTIL ALL PRODUCTS
           HAVE BEEN DISPLAYED
        ===================================== */

        let productsRemaining = true;


        while (productsRemaining) {


            productsRemaining = false;


            /* =================================
               FIND NEXT BRAND WITH PRODUCTS
            ================================= */

            let brandsChecked = 0;


            while (
                brandsChecked < brandNames.length
            ) {


                const brand =
                    brandNames[
                        currentBrandIndex
                    ];


                const position =
                    brandPositions[brand];


                const brandProducts =
                    productsByBrand[brand];


                if (
                    position <
                    brandProducts.length
                ) {

                    break;

                }


                currentBrandIndex =
                    (
                        currentBrandIndex + 1
                    ) %
                    brandNames.length;


                brandsChecked++;

            }


            /* =================================
               IF NO PRODUCTS ARE LEFT
            ================================= */

            if (
                brandsChecked >=
                brandNames.length
            ) {

                break;

            }


            /* =================================
               GET CURRENT BRAND
            ================================= */

            const currentBrand =
                brandNames[
                    currentBrandIndex
                ];


            const brandProducts =
                productsByBrand[
                    currentBrand
                ];


            let productsAdded =
                0;


            /* =================================
               ADD ONE FULL ROW FROM THIS BRAND
            ================================= */

            while (
                productsAdded <
                productsPerRow &&
                brandPositions[currentBrand] <
                brandProducts.length
            ) {


                const item =
                    brandProducts[
                        brandPositions[currentBrand]
                    ];


                const productCard =
                    createProductCard(
                        item.id,
                        item.product
                    );


                productsContainer.appendChild(
                    productCard
                );


                brandPositions[currentBrand]++;


                productsAdded++;


                productsRemaining =
                    true;

            }


            /* =================================
               MOVE TO NEXT BRAND
            ================================= */

            currentBrandIndex =
                (
                    currentBrandIndex + 1
                ) %
                brandNames.length;

        }

    }


    /* =========================================
       INITIAL DISPLAY
    ========================================= */

    displayProducts();


    /* =========================================
       RESPONSIVE UPDATE
       
       Rebuild the order when crossing the
       768px breakpoint.
    ========================================= */

    let lastProductsPerRow =
        getProductsPerRow();


    window.addEventListener(
        "resize",
        function () {


            const currentProductsPerRow =
                getProductsPerRow();


            if (
                currentProductsPerRow !==
                lastProductsPerRow
            ) {


                lastProductsPerRow =
                    currentProductsPerRow;


                displayProducts();

            }

        }
    );

}