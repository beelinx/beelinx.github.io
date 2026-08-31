/* =========================================
HOMEPAGE PRODUCT DISPLAY
========================================= */

const productsContainer =
document.getElementById("products-container");

if (productsContainer) {


for (const id in products) {


    const product =
        products[id];


    /* =========================================
       PRODUCT CARD
    ========================================= */

    const productCard =
        document.createElement("div");

    productCard.classList.add("products");


    /* =========================================
       PRODUCT LINK
    ========================================= */

    const productLink =
        document.createElement("a");


    /*
       IMPORTANT:

       index.html and product-template.html
       are now in the SAME "pages" folder.

       Therefore:

       product-template.html?id=...

       NOT:

       ../pages-more-info/product-template.html
    */

    productLink.href =
        `product-template.html?id=${id}`;


    /* =========================================
       PRODUCT IMAGE
    ========================================= */

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


    /* Put image inside link */

    productLink.appendChild(
        productImage
    );


    /* =========================================
       PRODUCT TEXT
    ========================================= */

    const productText =
        document.createElement("div");


    productText.classList.add(
        "clothe-text"
    );


    /* =========================================
       BRAND LINK
    ========================================= */

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


    /* =========================================
       PRODUCT NAME
    ========================================= */

    const productName =
        document.createTextNode(
            product.name
        );


    /* =========================================
       PRICE
    ========================================= */

    const price =
        document.createElement("p");


    price.classList.add(
        "price"
    );


    price.textContent =
        product.price;


    /* =========================================
       BUILD TEXT SECTION
    ========================================= */

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


    /* =========================================
       BUILD CARD
    ========================================= */

    productCard.appendChild(
        productLink
    );


    productCard.appendChild(
        productText
    );


    /* =========================================
       ADD CARD TO HOMEPAGE
    ========================================= */

    productsContainer.appendChild(
        productCard
    );
}

}

