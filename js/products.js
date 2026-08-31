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
       FEATURED PRODUCT 1
    ========================================= */

    {

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

        orderLink:
            "https://greatlegacy0.myshopify.com/products/legacy-jorst?variant=44552514338927",

        description:
            "The LEGACY JORST is a modern take on classic denim. Cut from durable, mid-weight jean fabric with a relaxed fit, it’s built for everyday wear without losing its edge. Subtle detailing and a structured silhouette give it a standout look that works effortlessly with tees, hoodies, or layered fits."

    },


    /* =========================================
       FEATURED PRODUCT 2
    ========================================= */

    {

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

        orderLink:
            "https://greatlegacy0.myshopify.com/products/legacy-skull-capp?variant=44521672474735",

        description:
            "Built for everyday presence, the Legacy Skull Cap blends minimal design with timeless identity. Crafted from soft, durable knit, it delivers warmth, comfort, and a clean silhouette that fits effortlessly into any look."

    },


    /* =========================================
       FEATURED PRODUCT 3
    ========================================= */

    {

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

        orderLink:
            "https://greatlegacy0.myshopify.com/products/legacy-crop-tee?variant=44510958714991",

        description:
            "The LEGACY CROP TEE brings a clean, contemporary edge to the Great Legacy collection. Designed with a cropped silhouette and bold character, it’s an easy statement piece that pairs effortlessly with relaxed trousers, denim, or layered fits."

    }

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
       GREAT LEGACY AD 1
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
       GREAT LEGACY AD 2
    ========================================= */

    {

        brand:
            "Great Legacy",

        image:
            "../images-fsn/great-legacy/98b271aa-490e-4356-9b4e-6ecfeeab8f4a.jpeg",

        title:
            "GREAT LEGACY",

        subtitle:
            "DISCOVER MORE",

        alt:
            "Great Legacy collection"

    }

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
            "../images-fsn/great-legacy/627839a2-2465-477c-8e09-e6d088122392.JPG",

        page:
            "brandpage-template.html?brand=Great%20Legacy",

        website:
            "https://gtl-great-legacy539.labeld.app/",

        social: {

            instagram:
                "https://instagram.com/_gtl_1",

            tiktok:
                "https://www.tiktok.com/@_gtl_",

            twitter:
                "https://twitter.com/greatlegacy001"

        }

    }

};

/* =========================================
   ALL PRODUCTS DATABASE
========================================= */

const products = {


    /* =========================================
       GREAT LEGACY PRODUCTS
    ========================================= */


    "gl-01": {

        name:
            "GREAT LEGACY'S GL-01 SET",

        price:
            "₦29,000",

        image:
            "../images-fsn/great-legacy/IMG_3037.WEBP",

        brand:
            "Great Legacy",

        brandLogo:
            "../images-fsn/great-legacy/627839a2-2465-477c-8e09-e6d088122392.JPG",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        orderLink:
            "https://greatlegacy0.myshopify.com/"

    },


    "legacy-monarch": {

        name:
            "LEGACY MONARCH",

        price:
            "₦31,000",

        image:
            "../images-fsn/great-legacy/4f3cc3b7-99a3-48a6-85ec-13d9f4792fd7.JPG",

        brand:
            "Great Legacy",

        brandLogo:
            "../images-fsn/great-legacy/627839a2-2465-477c-8e09-e6d088122392.JPG",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        orderLink:
            "https://greatlegacy0.myshopify.com/products/legacy-monarch?variant=44525883228271"

    },


    "gl-warmer": {

        name:
            "GL - WARMER",

        price:
            "₦23,000",

        image:
            "../images-fsn/great-legacy/IMG_3331.WEBP",

        brand:
            "Great Legacy",

        brandLogo:
            "../images-fsn/great-legacy/627839a2-2465-477c-8e09-e6d088122392.JPG",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        orderLink:
            "https://greatlegacy0.myshopify.com/products/gl-warmer?variant=44536435736687"

    },


    "after-dark-2": {

        name:
            "AFTER DARK 2",

        price:
            "₦28,000",

        image:
            "../images-fsn/great-legacy/ab1310be-ec08-46ed-bde3-ab78f58d0400.JPG",

        brand:
            "Great Legacy",

        brandLogo:
            "../images-fsn/great-legacy/627839a2-2465-477c-8e09-e6d088122392.JPG",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        orderLink:
            "https://greatlegacy0.myshopify.com/products/after-dark-2?variant=44341382938735"

    },


    "legacy-reaper": {

        name:
            "LEGACY REAPER",

        price:
            "₦26,000",

        image:
            "../images-fsn/great-legacy/IMG_3464.WEBP",

        brand:
            "Great Legacy",

        brandLogo:
            "../images-fsn/great-legacy/627839a2-2465-477c-8e09-e6d088122392.JPG",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        orderLink:
            "https://greatlegacy0.myshopify.com/products/legacy-reaper?variant=52747046387823"

    },


    "gl-edition": {

        name:
            "GL EDITION",

        price:
            "₦29,000",

        image:
            "../images-fsn/great-legacy/2cfd2606-1ed1-4c33-b7b3-959c45aa28fa.jpeg",

        brand:
            "Great Legacy",

        brandLogo:
            "../images-fsn/great-legacy/627839a2-2465-477c-8e09-e6d088122392.JPG",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        orderLink:
            "https://greatlegacy0.myshopify.com/products/gl-edition?variant=44521678930031"

    },


    "legacy-grip-tee": {

        name:
            "LEGACY GRIP TEE",

        price:
            "₦18,000",

        image:
            "../images-fsn/great-legacy/f91e7c10-6fdd-483a-a056-0365d3a12a7b.JPG",

        brand:
            "Great Legacy",

        brandLogo:
            "../images-fsn/great-legacy/627839a2-2465-477c-8e09-e6d088122392.JPG",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        orderLink:
            "https://greatlegacy0.myshopify.com/products/legacy-grip-tee?variant=44537614041199"

    },


    "gl-made-in-ikoyi": {

        name:
            "GL-MADE IN IKOYI",

        price:
            "₦29,000",

        image:
            "../images-fsn/great-legacy/faac6dac-080b-4523-8b73-0bfcaa465faf.JPG",

        brand:
            "Great Legacy",

        brandLogo:
            "../images-fsn/great-legacy/627839a2-2465-477c-8e09-e6d088122392.JPG",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        orderLink:
            "https://greatlegacy0.myshopify.com/products/gl-made-in-ikoyi?variant=44508133326959"

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

        brandLogo:
            "../images-fsn/great-legacy/627839a2-2465-477c-8e09-e6d088122392.JPG",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        orderLink:
            "https://greatlegacy0.myshopify.com/products/legacy-skull-capp?variant=44521672474735"

    },


    "gl-01-jogger": {

        name:
            "GL-01 JOGGER",

        price:
            "₦26,000",

        image:
            "../images-fsn/great-legacy/IMG_3034.WEBP",

        brand:
            "Great Legacy",

        brandLogo:
            "../images-fsn/great-legacy/627839a2-2465-477c-8e09-e6d088122392.JPG",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        orderLink:
            "https://greatlegacy0.myshopify.com/products/gl-01-jogger?variant=44092181905519"

    },


    "gl-apex-tee": {

        name:
            "GL APEX TEE",

        price:
            "₦31,000",

        image:
            "../images-fsn/great-legacy/IMG_3035.WEBP",

        brand:
            "Great Legacy",

        brandLogo:
            "../images-fsn/great-legacy/627839a2-2465-477c-8e09-e6d088122392.JPG",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        orderLink:
            "https://greatlegacy0.myshopify.com/products/untitled-jan29_18-57?variant=44202474242159"

    },


    "outlaw": {

        name:
            "OUTLAW",

        price:
            "₦25,000",

        image:
            "../images-fsn/great-legacy/IMG_3036.WEBP",

        brand:
            "Great Legacy",

        brandLogo:
            "../images-fsn/great-legacy/627839a2-2465-477c-8e09-e6d088122392.JPG",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        orderLink:
            "https://greatlegacy0.myshopify.com/products/b?variant=44300219547759"

    },


    "gl-x-zeno": {

        name:
            "GL x ZENO",

        price:
            "₦31,000",

        image:
            "../images-fsn/great-legacy/IMG_3039.WEBP",

        brand:
            "Great Legacy",

        brandLogo:
            "../images-fsn/great-legacy/627839a2-2465-477c-8e09-e6d088122392.JPG",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        orderLink:
            "https://greatlegacy0.myshopify.com/products/copy-gl-x-zeno?variant=44530307989615"

    },


    "legacy-jorst": {

        name:
            "LEGACY JORST",

        price:
            "₦29,000",

        image:
            "../images-fsn/great-legacy/IMG_3329.WEBP",

        brand:
            "Great Legacy",

        brandLogo:
            "../images-fsn/great-legacy/627839a2-2465-477c-8e09-e6d088122392.JPG",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        orderLink:
            "https://greatlegacy0.myshopify.com/products/legacy-jorst?variant=44552514338927"

    },


    "legacy-denim": {

        name:
            "LEGACY DENIM",

        price:
            "₦30,000",

        image:
            "../images-fsn/great-legacy/IMG_3330.WEBP",

        brand:
            "Great Legacy",

        brandLogo:
            "../images-fsn/great-legacy/627839a2-2465-477c-8e09-e6d088122392.JPG",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        orderLink:
            "https://greatlegacy0.myshopify.com/products/legacy-denim?variant=44530914394223"

    },


    "legacy-crop-tee": {

        name:
            "LEGACY CROP TEE",

        price:
            "₦22,000",

        image:
            "../images-fsn/great-legacy/IMG_3332.WEBP",

        brand:
            "Great Legacy",

        brandLogo:
            "../images-fsn/great-legacy/627839a2-2465-477c-8e09-e6d088122392.JPG",

        brandLink:
            "brandpage-template.html?brand=Great%20Legacy",

        orderLink:
            "https://greatlegacy0.myshopify.com/products/legacy-crop-tee?variant=44510958714991"

    }

};