/* =========================================
   BEELINX ENGAGEMENT
   Likes, My List (saved products) and comments.

   FRONTEND-ONLY STAND-IN
   Everything is stored in this browser's localStorage,
   so it is private to one browser and one device.
   Nobody else can see your likes or comments yet.

   BACKEND SWAP POINT
   Only the functions in the "DATA LAYER" section below
   touch storage. When the Supabase backend is ready,
   replace the bodies of those functions with database
   calls. They already return Promises, so the rest of
   this file and the pages do not need to change.
========================================= */

(function () {
    "use strict";

    const KEY_LIKES = "beelinx:likes";
    const KEY_SAVED = "beelinx:saved";
    const KEY_COMMENTS = "beelinx:comments";
    const MAX_COMMENT_LENGTH = 300;


    /* =========================================
       DATA LAYER (replace with backend later)
    ========================================= */

    function read(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function write(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn("Beelinx: could not save to browser storage.", error);
        }
    }

    function notify() {
        document.dispatchEvent(new CustomEvent("beelinx:change"));
    }

    async function isLiked(productId) {
        return read(KEY_LIKES, []).includes(productId);
    }

    async function getLikeCount(productId) {
        /* Local stand-in: only this browser's own like counts. */
        return read(KEY_LIKES, []).includes(productId) ? 1 : 0;
    }

    async function toggleLike(productId) {
        let likes = read(KEY_LIKES, []);
        likes = likes.includes(productId)
            ? likes.filter(id => id !== productId)
            : [...likes, productId];
        write(KEY_LIKES, likes);
        notify();
        return likes.includes(productId);
    }

    async function isSaved(productId) {
        return read(KEY_SAVED, []).includes(productId);
    }

    async function getSavedIds() {
        /* Newest saved first. */
        return read(KEY_SAVED, []);
    }

    async function toggleSave(productId) {
        let saved = read(KEY_SAVED, []);
        saved = saved.includes(productId)
            ? saved.filter(id => id !== productId)
            : [productId, ...saved];
        write(KEY_SAVED, saved);
        notify();
        return saved.includes(productId);
    }

    async function getComments(productId) {
        const all = read(KEY_COMMENTS, {});
        return all[productId] || [];
    }

    async function addComment(productId, text) {
        const clean = String(text || "").trim().slice(0, MAX_COMMENT_LENGTH);
        if (!clean) return null;

        const all = read(KEY_COMMENTS, {});
        const comment = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
            author: "Guest",
            text: clean,
            time: Date.now()
        };
        all[productId] = [...(all[productId] || []), comment];
        write(KEY_COMMENTS, all);
        notify();
        return comment;
    }

    async function deleteComment(productId, commentId) {
        const all = read(KEY_COMMENTS, {});
        all[productId] = (all[productId] || []).filter(c => c.id !== commentId);
        write(KEY_COMMENTS, all);
        notify();
    }


    /* =========================================
       SMALL HELPERS
    ========================================= */

    function setIcon(button, active, name) {
        const icon = button.querySelector("i");
        if (icon) icon.className = (active ? "fa-solid" : "fa-regular") + " fa-" + name;
    }

    function timeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return "just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return minutes + "m ago";
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return hours + "h ago";
        const days = Math.floor(hours / 24);
        if (days < 7) return days + "d ago";
        return new Date(timestamp).toLocaleDateString();
    }

    function formatMoney(price) {
        return typeof formatPrice === "function" ? formatPrice(price) : (price || "");
    }


    /* =========================================
       SAVE BUTTON ON PRODUCT CARDS
       Used by home-products.js, brand-page.js
       and the My List page.
    ========================================= */

    async function syncSaveButton(button) {
        const saved = await isSaved(button.dataset.id);
        button.classList.toggle("is-saved", saved);
        button.setAttribute("aria-pressed", String(saved));
        button.setAttribute("aria-label", saved ? "Remove from My List" : "Save to My List");
        button.title = saved ? "Remove from My List" : "Save to My List";
        setIcon(button, saved, "bookmark");
    }

    function createSaveButton(productId) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "save-btn";
        button.dataset.id = productId;
        button.appendChild(document.createElement("i"));

        button.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            toggleSave(productId);
        });

        syncSaveButton(button);
        return button;
    }


    /* =========================================
       PRODUCT PAGE (product-template.html)
       Like, Save to My List, comments.
       Starts only if the page has #like-btn.
    ========================================= */

    function initProductPage() {
        const likeButton = document.getElementById("like-btn");
        if (!likeButton) return;

        const productId = new URLSearchParams(window.location.search).get("id");
        if (!productId) return;

        const likeCount = document.getElementById("like-count");
        const saveButton = document.getElementById("save-btn");
        const saveLabel = document.getElementById("save-label");

        const commentsList = document.getElementById("comments-list");
        const commentsCount = document.getElementById("comments-count");
        const commentForm = document.getElementById("comment-form");
        const commentInput = document.getElementById("comment-input");

        async function renderActions() {
            const liked = await isLiked(productId);
            const count = await getLikeCount(productId);
            likeButton.classList.toggle("is-active", liked);
            likeButton.setAttribute("aria-pressed", String(liked));
            setIcon(likeButton, liked, "heart");
            if (likeCount) likeCount.textContent = count > 0 ? count : "";

            if (saveButton) {
                const saved = await isSaved(productId);
                saveButton.classList.toggle("is-active", saved);
                saveButton.setAttribute("aria-pressed", String(saved));
                setIcon(saveButton, saved, "bookmark");
                if (saveLabel) saveLabel.textContent = saved ? "Saved" : "Save to My List";
            }
        }

        async function renderComments() {
            if (!commentsList) return;
            const items = await getComments(productId);

            if (commentsCount) commentsCount.textContent = items.length ? "(" + items.length + ")" : "";
            commentsList.replaceChildren();

            if (!items.length) {
                const empty = document.createElement("p");
                empty.className = "comments-empty";
                empty.textContent = "No comments yet. Be the first to say something.";
                commentsList.appendChild(empty);
                return;
            }

            items.forEach(function (item) {
                const row = document.createElement("div");
                row.className = "comment";

                const avatar = document.createElement("div");
                avatar.className = "comment-avatar";
                avatar.textContent = (item.author || "G").charAt(0).toUpperCase();

                const body = document.createElement("div");
                body.className = "comment-body";

                const meta = document.createElement("div");
                meta.className = "comment-meta";

                const author = document.createElement("strong");
                author.textContent = item.author || "Guest";

                const time = document.createElement("span");
                time.textContent = timeAgo(item.time);

                meta.append(author, time);

                const text = document.createElement("p");
                text.className = "comment-text";
                text.textContent = item.text;

                const remove = document.createElement("button");
                remove.type = "button";
                remove.className = "comment-delete";
                remove.textContent = "Delete";
                remove.addEventListener("click", function () {
                    deleteComment(productId, item.id);
                });

                body.append(meta, text, remove);
                row.append(avatar, body);
                commentsList.appendChild(row);
            });
        }

        likeButton.addEventListener("click", function () { toggleLike(productId); });
        if (saveButton) saveButton.addEventListener("click", function () { toggleSave(productId); });

        if (commentForm && commentInput) {
            commentInput.maxLength = MAX_COMMENT_LENGTH;
            commentForm.addEventListener("submit", async function (event) {
                event.preventDefault();
                const posted = await addComment(productId, commentInput.value);
                if (posted) commentInput.value = "";
            });
        }

        document.addEventListener("beelinx:change", function () {
            renderActions();
            renderComments();
        });

        renderActions();
        renderComments();
    }


    /* =========================================
       MY LIST PAGE (my-list.html)
       Starts only if the page has #my-list-container.
    ========================================= */

    function buildListCard(id, product) {
        const card = document.createElement("div");
        card.className = "products";

        const imageLink = document.createElement("a");
        imageLink.href = "product-template.html?id=" + encodeURIComponent(id);

        const image = document.createElement("img");
        image.className = "clothe-image";
        image.src = product.image || "";
        image.alt = product.name || "Product image";
        image.loading = "lazy";
        imageLink.appendChild(image);

        const text = document.createElement("div");
        text.className = "clothe-text";

        const brandLink = document.createElement("a");
        brandLink.className = "brand-page-link";
        brandLink.href = product.brandLink ||
            "brandpage-template.html?brand=" + encodeURIComponent(product.brand || "");

        const brandName = document.createElement("strong");
        brandName.textContent = product.brand || "";
        brandLink.appendChild(brandName);

        const price = document.createElement("p");
        price.className = "price";
        price.textContent = formatMoney(product.price);

        text.append(brandLink, document.createElement("br"), document.createTextNode(product.name || ""), price);
        card.append(imageLink, text, createSaveButton(id));
        return card;
    }

    async function renderMyList() {
        const container = document.getElementById("my-list-container");
        if (!container) return;

        const empty = document.getElementById("my-list-empty");
        const ids = await getSavedIds();
        const available = typeof products !== "undefined" ? products : {};
        const validIds = ids.filter(id => available[id]);

        container.replaceChildren();
        validIds.forEach(id => container.appendChild(buildListCard(id, available[id])));

        if (empty) empty.style.display = validIds.length ? "none" : "block";
    }


    /* =========================================
       KEEP EVERYTHING IN SYNC
       Runs after any like, save or comment change,
       including changes made in another tab.
    ========================================= */

    function refreshAll() {
        document.querySelectorAll(".save-btn[data-id]").forEach(syncSaveButton);
    }

    document.addEventListener("beelinx:change", refreshAll);

    window.addEventListener("storage", function (event) {
        if (event.key && event.key.indexOf("beelinx:") === 0) notify();
    });

    document.addEventListener("beelinx:change", renderMyList);


    /* =========================================
       START
    ========================================= */

    function start() {
        initProductPage();
        renderMyList();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }


    /* =========================================
       PUBLIC API
    ========================================= */

    window.BeelinxEngage = {
        isLiked, toggleLike, getLikeCount,
        isSaved, toggleSave, getSavedIds,
        getComments, addComment, deleteComment,
        createSaveButton
    };

})();
