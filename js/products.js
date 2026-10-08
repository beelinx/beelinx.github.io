/* =========================================
   BEELINX PRODUCT DATABASE
========================================= */


/* =========================================
   FEATURED CAROUSEL DATABASE

   THIS IS WHERE THE HOMEPAGE CAROUSEL
   GETS ITS INFORMATION.

   To add another carousel card:

   1. Copy one object.
   2. Change the information.
   3. Add a comma after the previous object.

   You can have 3, 5, 10, 20+ cards.
========================================= */

const featuredProducts = [

    /* =========================================
       FEATURED PRODUCT 1 (Great Legacy, LEGACY JORST)
    ========================================= */

    {

        productId: "legacy-jorst",

        name: "LEGACY JORST",

        price: "₦28,000",

        image:
            "../images-fsn/great-legacy/IMG_3445.PNG",

        brand:
            "Great Legacy",

        collection:
            "GREAT LEGACY COLLECTION",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        description:
            "The LEGACY JORST is a modern take on classic denim. Cut from durable, mid-weight jean fabric with a relaxed fit, it’s built for everyday wear without losing its edge. Subtle detailing and a structured silhouette give it a standout look that works effortlessly with tees, hoodies, or layered fits."

    },


    /* =========================================
       FEATURED PRODUCT 2 (Great Legacy, LEGACY SKULL CAP)
    ========================================= */

    {

        productId: "legacy-skull-cap",

        name: "LEGACY SKULL CAP",

        price: "₦16,000",

        image:
            "../images-fsn/great-legacy/IMG_3720.PNG",

        brand:
            "Great Legacy",

        collection:
            "NEW GREAT LEGACY COLLECTION",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        description:
            "Built for everyday presence, the Legacy Skull Cap blends minimal design with timeless identity. Crafted from soft, durable knit, it delivers warmth, comfort, and a clean silhouette that fits effortlessly into any look."

    },

    /* =========================================
       FEATURED PRODUCT 3 (R4ndom Drip, 5 ⭐ TRUCKER)
    ========================================= */

    {

        productId: "5 \u2605 TRUCKER",

        name: "5 \u2605 TRUCKER",

        price: "₦15,750",

        image:
            "../images-fsn/r4ndom-drip/IMG_0776.PNG",

        brand:
            "R4ndom Drip",

        collection:
            "NEW R4NDOM DRIP COLLECTION",

        brandLink:
            "brandpage-template.html?brand=R4ndom%20Drip",

        description:
            "The 5 ⭐ TRUCKER combines a classic trucker silhouette with a bold streetwear edge. Designed for everyday wear, it features a structured front, breathable mesh backing, and an adjustable fit for easy comfort. A versatile finishing piece that adds character to any casual look."
    },


    /* =========================================
       FEATURED PRODUCT 4 (Great Legacy, LEGACY CROP TEE)
    ========================================= */

    {

        productId: "legacy-crop-tee",

        name: "LEGACY CROP TEE",

        price: "₦22,000",

        image:
            "../images-fsn/great-legacy/IMG_3467.PNG",

        brand:
            "Great Legacy",

        collection:
            "NEW GREAT LEGACY COLLECTION",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        description:
            "The LEGACY CROP TEE brings a clean, contemporary edge to the Great Legacy collection. Designed with a cropped silhouette and bold character, it’s an easy statement piece that pairs effortlessly with relaxed trousers, denim, or layered fits."

    },

    /* =========================================
       FEATURED PRODUCT 5 (R4ndom Drip, 5 ⭐ TEE)
    ========================================= */

    {

        productId: "5 \u2605 TEE",

        name: "5 \u2605 TEE",

        price: "₦31,500",

        image:
            "../images-fsn/r4ndom-drip/IMG_0872.PNG",

        brand:
            "R4ndom Drip",

        collection:
            "NEW R4NDOM DRIP COLLECTION",

        brandLink:
            "brandpage-template.html?brand=R4ndom%20Drip",

        description:
            "The 5 ⭐ TEE brings a clean, contemporary edge to the R4ndom Drip collection. Designed with a cropped silhouette and bold character, it’s an easy statement piece that pairs effortlessly with relaxed trousers, denim, or layered fits."

    },

];


/* =========================================
   BEELINX BRAND ADVERTISEMENT DATABASE

   THIS IS WHERE THE HOMEPAGE BRAND ADS
   GET THEIR INFORMATION.

   To add another advertisement:

   1. Copy one object.
   2. Change the brand.
   3. Change the image.
   4. Change the subtitle.
   5. Add a comma after the previous object.

   The brand page link is automatically taken
   from the brands database above.

========================================= */

const brandAds = [

    /* =========================================
       AD 1 GREAT LEGACY
    ========================================= */

    {

        brand:
            "Great Legacy",

        image:
            "../images-fsn/great-legacy/c118c87f-d7a4-445d-a879-263a853f6a39.jpeg",

        title:
            "GREAT LEGACY",

        subtitle:
            "EXPLORE THE COLLECTION",

        alt:
            "Great Legacy collection"

    },

    /* =========================================
       AD 2 R4NDOM DRIP
    ========================================= */

    {

        brand:
            "R4ndom Drip",

        image:
            "../images-fsn/r4ndom-drip/IMG_0765.WEBP",

        title:
            "R4NDOM DRIP",

        subtitle:
            "DISCOVER MORE",

        alt:
            "R4ndom Drip collection"

    },

];



/* =========================================
   BEELINX BRAND DATABASE
========================================= */

const brands = {


    /* =========================================
       GREAT LEGACY
    ========================================= */

    "Great Legacy": {

        name:
            "Great Legacy",

        logo:
            "../images-fsn/great-legacy/IMG_0874.JPG",

        page:
            "brandpage-template.html?brand=Great%20Legacy",

        website:
            "https://gtl-great-legacy539.labeld.app/",

        slogan:
            "Swag up",

        social: {

            instagram:
                "https://instagram.com/_gtl_1",

            tiktok:
                "https://www.tiktok.com/@_gtl_",

            twitter:
                "https://twitter.com/greatlegacy001"

        }

    },

    "R4ndom Drip": {

        name:
            "R4ndom Drip",

        logo:"../images-fsn/r4ndom-drip/9533CAA2-6B83-47CC-8D21-D3A46A54F3D0.png",

        page:
            "brandpage-template.html?brand=R4ndom%20Drip",

        website:
            "https://r4ndom-drip.labeld.app/",

        slogan:
            "Elevate your style",

        social: {

            instagram:
                "https://instagram.com/r4ndom.drip",

            tiktok:
                "https://www.tiktok.com/@r4ndom_drip",


        }

    },

};

/* =========================================
   ALL PRODUCTS DATABASE
========================================= */

const products = {


    /* =========================================
       GREAT LEGACY PRODUCTS
    ========================================= */

    "GTL WARCORE": {

        name:
            "GTL WARCORE LONG SLEEVE",

        price:
            "₦35,000",

        image:
            "../images-fsn/great-legacy/gtlwarcorewhite.webp",

        brand:
            "Great Legacy",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        orderLink:
            "https://gtl-great-legacy539.labeld.app/brands/MKIp4g7ONRRW0ZDklzxorq1hniI3/drops/INQgLXBVVs17p2J6HOnU"

    },

    "gl-made-in-ikoyi": {

        name:
            "GL-MADE IN IKOYI",

        price:
            "₦29,000",

        image:
            "../images-fsn/great-legacy/miiblack.webp",

        brand:
            "Great Legacy",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        orderLink:
            "https://gtl-great-legacy539.labeld.app/brands/MKIp4g7ONRRW0ZDklzxorq1hniI3/drops/JqqoKjbolAsIvrqHTlFO"

    },


    "legacy-skull-cap": {

        name:
            "LEGACY SKULL CAP",

        price:
            "₦16,000",

        image:
            "../images-fsn/great-legacy/IMG_3038.WEBP",

        brand:
            "Great Legacy",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        orderLink:
            "https://greatlegacy0.myshopify.com/products/legacy-skull-capp?variant=44521672474735"

    },

    "LEGACY DEPT": {

        name:
            "LEGACY DEPT",

        price:
            "₦40,000",

        image:
            "../images-fsn/great-legacy/legacydeptpink.webp",

        brand:
            "Great Legacy",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        orderLink:
            "https://gtl-great-legacy539.labeld.app/brands/MKIp4g7ONRRW0ZDklzxorq1hniI3/drops/Bq8DL3D5U2WvGvM2xz64"

    },

    "ALL WE NEED IS MOTION": {

        name:
            "ALL WE NEED IS MOTION",

        price:
            "₦20,000",

        image:
            "../images-fsn/great-legacy/awnimteewhite.webp",

        brand:
            "Great Legacy",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        orderLink:
            "https://gtl-great-legacy539.labeld.app/brands/MKIp4g7ONRRW0ZDklzxorq1hniI3/drops/rIEGx9ty9qDUw2UzhFDP"

    },

    "FREEDOM TEE": {

        name:
            "FREEDOM TEE",

        price:
            "₦30,000",

        image:
            "../images-fsn/great-legacy/freedomtee.webp",

        brand:
            "Great Legacy",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        orderLink:
            "https://gtl-great-legacy539.labeld.app/brands/MKIp4g7ONRRW0ZDklzxorq1hniI3/drops/6nPra9Hozakt85vc7xCd"

    },

    "GTL 444 WAR JORTS": {

        name:
            "GTL 444 WAR JORTS",

        price:
            "₦27,000",

        image:
            "../images-fsn/great-legacy/gtl444warjortsblackgold.webp",

        brand:
            "Great Legacy",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        orderLink:
            "https://gtl-great-legacy539.labeld.app/brands/MKIp4g7ONRRW0ZDklzxorq1hniI3/drops/IYlfPhIptECJrq5d5v1v"

    },

    "GTL WAR JORST": {

        name:
            "GTL WAR JORST",

        price:
            "₦27,000",

        image:
            "../images-fsn/great-legacy/gtl444warjorst.webp",

        brand:
            "Great Legacy",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        orderLink:
            "https://gtl-great-legacy539.labeld.app/brands/MKIp4g7ONRRW0ZDklzxorq1hniI3/drops/4LGh2y1na1Z3RPBghhSb"

    },

    "MOTION IS THE MOTIVE": {

        name:
            "MOTION IS THE MOTIVE",

        price:
            "₦20,000",

        image:
            "../images-fsn/great-legacy/mitmwhite.webp",

        brand:
            "Great Legacy",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        orderLink:
            "https://gtl-great-legacy539.labeld.app/brands/MKIp4g7ONRRW0ZDklzxorq1hniI3/drops/iXn0Dl0qx7SSrnwIDJlA"

    },

    "GTL SYNDICATE TRACK": {

        name:
            "GTL SYNDICATE TRACK",

        price:
            "₦35,000",

        image:
            "../images-fsn/great-legacy/gtlsyndicatetrackblack.webp",

        brand:
            "Great Legacy",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        orderLink:
            "https://gtl-great-legacy539.labeld.app/brands/MKIp4g7ONRRW0ZDklzxorq1hniI3/drops/FaiOEVq7i722PrhhuY2H"

    },

    "GTL POLO": {

        name:
            "GTL POLO",

        price:
            "₦20,000",

        image:
            "../images-fsn/great-legacy/gtlpoloblack.webp",

        brand:
            "Great Legacy",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        orderLink:
            "https://gtl-great-legacy539.labeld.app/brands/MKIp4g7ONRRW0ZDklzxorq1hniI3/drops/nJ3MZKrFQoytoKn4gAUq"

    },

    /* =========================================
       R4NDOM DRIP PRODUCTS
    ========================================= */


    "5 \u2605 TEE": {

        name:
            "5 \u2605 TEE",

        price:
            "₦31,500",

        image:
            "../images-fsn/r4ndom-drip/IMG_0770.WEBP",

        brand:
            "R4ndom Drip",

        brandLink:
            "brandpage-template.html?brand=R4ndom%20Drip",

        orderLink:
            "https://r4ndom-drip.labeld.app/brands/WA3gmm8SmgXXDX1R7hDYzBqfHfy1/drops/ofad7BH6N2pTjXyRzfd0"

    },

    
    "5 \u2605 TRUCKER": {

        name:
            "5 \u2605 TRUCKER",

        price:
            "₦15,750",

        image:
            "../images-fsn/r4ndom-drip/IMG_0771.WEBP",

        brand:
            "R4ndom Drip",

        brandLink:
            "brandpage-template.html?brand=R4ndom%20Drip",

        orderLink:
            "https://r4ndom-drip.labeld.app/brands/WA3gmm8SmgXXDX1R7hDYzBqfHfy1/drops/ewB8FCwq6QCQngKMCgYx"

    },

    "RD CLASSIC TEE": {

        name:
            "RD CLASSIC TEE",

        price:
            "₦31,503",

        image:
            "../images-fsn/r4ndom-drip/EB6EED05-E1FA-4BBD-806D-5BD248E2EE47.png",

        brand:
            "R4ndom Drip",

        brandLink:
            "brandpage-template.html?brand=R4ndom%20Drip",

        orderLink:
            "https://r4ndom-drip.labeld.app/brands/WA3gmm8SmgXXDX1R7hDYzBqfHfy1/drops/VVacQQi5z0KrZ2dtIwgY"

    },

    "5 \u2605 TANK": {

        name:
            "5 \u2605 TANK",

        price:
            "₦36,750",

        image:
            "../images-fsn/r4ndom-drip/IMG_0871.JPG",

        brand:
            "R4ndom Drip",

        brandLink:
            "brandpage-template.html?brand=R4ndom%20Drip",

        orderLink:
            "https://r4ndom-drip.labeld.app/brands/WA3gmm8SmgXXDX1R7hDYzBqfHfy1/drops/gZE9JDfI7dL1qoDsY6Zx"

    },

    "RD INDIPENDENCE DAY": {

        name:
            "RD INDIPENDENCE DAY",

        price:
            "₦15,750",

        image:
            "../images-fsn/r4ndom-drip/rdindipendenceuse.jpg",

        brand:
            "R4ndom Drip",

        brandLink:
            "brandpage-template.html?brand=R4ndom%20Drip",

        orderLink:
            "https://r4ndom-drip.labeld.app/brands/WA3gmm8SmgXXDX1R7hDYzBqfHfy1/drops/szhXxg8Z1ZapMMlOZwKV"

    },

    "RD SKULLY": {

        name:
            "RD SKULLY",

        price:
            "₦15,750",

        image:
            "../images-fsn/r4ndom-drip/rdskully.webp",

        brand:
            "R4ndom Drip",

        brandLink:
            "brandpage-template.html?brand=R4ndom%20Drip",

        orderLink:
            "https://r4ndom-drip.labeld.app/brands/WA3gmm8SmgXXDX1R7hDYzBqfHfy1/drops/gnlfUYAXRjV3WJwytEkU"

    },


};
