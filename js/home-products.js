/* =========================================
   HOMEPAGE PRODUCT DISPLAY
   Brand products are grouped by row.

   Desktop: 6 products per row
   Tablet / Mobile: 3 products per row

   Brands rotate between rows so the same
   brand does not appear twice in a row.
========================================= */

const productsContainer = document.getElementById("products-container");

if (productsContainer && typeof products !== "undefined") {
    const productsByBrand = {};

    for (const id in products) {
        const product = products[id];
        if (!product || !product.brand) continue;

        if (!productsByBrand[product.brand]) productsByBrand[product.brand] = [];
        productsByBrand[product.brand].push({ id, product });
    }

    const brandNames = Object.keys(productsByBrand);

    function getProductsPerRow() {
        return window.innerWidth <= 768 ? 3 : 6;
    }

    function createProductCard(id, product) {
        const productCard = document.createElement("div");
        productCard.classList.add("products");

        const productLink = document.createElement("a");
        productLink.href = `product-template.html?id=${encodeURIComponent(id)}`;

        const productImage = document.createElement("img");
        productImage.classList.add("clothe-image");
        productImage.src = product.image || "";
        productImage.alt = product.name || "Product image";
        productImage.loading = "lazy";
        productLink.appendChild(productImage);

        const productText = document.createElement("div");
        productText.classList.add("clothe-text");

        const brandLink = document.createElement("a");
        brandLink.classList.add("brand-page-link");
        brandLink.href = product.brandLink || `brandpage-template.html?brand=${encodeURIComponent(product.brand || "")}`;

        const brandName = document.createElement("strong");
        brandName.textContent = product.brand || "";
        brandLink.appendChild(brandName);

        const productName = document.createTextNode(product.name || "");

        const price = document.createElement("p");
        price.classList.add("price");
        price.textContent = typeof formatPrice === "function" ? formatPrice(product.price) : (product.price || "");

        productText.append(brandLink, document.createElement("br"), productName, price);
        productCard.append(productLink, productText);
        return productCard;
    }

    function displayProducts() {
        productsContainer.replaceChildren();
        if (brandNames.length === 0) return;

        const productsPerRow = getProductsPerRow();
        const brandPositions = Object.fromEntries(brandNames.map(name => [name, 0]));
        let currentBrandIndex = 0;

        while (true) {
            let brandsChecked = 0;

            while (brandsChecked < brandNames.length) {
                const brand = brandNames[currentBrandIndex];
                if (brandPositions[brand] < productsByBrand[brand].length) break;
                currentBrandIndex = (currentBrandIndex + 1) % brandNames.length;
                brandsChecked++;
            }

            if (brandsChecked >= brandNames.length) break;

            const currentBrand = brandNames[currentBrandIndex];
            const brandProducts = productsByBrand[currentBrand];
            let productsAdded = 0;

            while (productsAdded < productsPerRow && brandPositions[currentBrand] < brandProducts.length) {
                const item = brandProducts[brandPositions[currentBrand]];
                productsContainer.appendChild(createProductCard(item.id, item.product));
                brandPositions[currentBrand]++;
                productsAdded++;
            }

            currentBrandIndex = (currentBrandIndex + 1) % brandNames.length;
        }
    }

    displayProducts();

    let lastProductsPerRow = getProductsPerRow();
    window.addEventListener("resize", function () {
        const currentProductsPerRow = getProductsPerRow();
        if (currentProductsPerRow !== lastProductsPerRow) {
            lastProductsPerRow = currentProductsPerRow;
            displayProducts();
        }
    });
}
