/* =========================================
   BEELINX ENGAGEMENT
   Likes, My List (saved products) and comments.

   Stored in Supabase and tied to the logged-in
   account, so they follow a person to any phone or
   computer. Needs an account: logged-out visitors
   are sent to the login page and brought back.

   Needs these scripts loaded BEFORE this file:
     supabase library, ../js/auth.js, ../js/data.js
   and the tables from engagement-setup.sql.
========================================= */

(function () {
    "use strict";

    const MAX_COMMENT_LENGTH = 300;

    const Auth = window.BeelinxAuth || null;
    const db = Auth ? Auth.client : null;

    if (!Auth) {
        console.error("Beelinx: auth.js did not load, so likes, saves and comments are unavailable.");
    }


    /* =========================================
       WHO IS LOGGED IN + THEIR LIKES AND SAVES
       Loaded once, then kept in memory so the
       buttons on every product card are instant.
    ========================================= */

    let userId = null;
    let username = null;
    let liked = new Set();
    let saved = [];                 /* newest first */
    const likeCounts = {};          /* productId -> total likes */
    const pending = new Set();      /* stops double taps */

    function notify() {
        document.dispatchEvent(new CustomEvent("beelinx:change"));
    }

    async function loadState() {
        userId = null;
        username = null;
        liked = new Set();
        saved = [];

        if (!Auth) return;

        try {
            const user = await Auth.getUser();
            if (!user) return;

            userId = user.id;

            const [likesResult, savesResult, profile] = await Promise.all([
                db.from("likes").select("product_id").eq("user_id", userId),
                db.from("saves").select("product_id").eq("user_id", userId)
                    .order("created_at", { ascending: false }),
                Auth.getProfile()
            ]);

            if (likesResult.error) console.warn("Beelinx: could not load likes.", likesResult.error);
            if (savesResult.error) console.warn("Beelinx: could not load saved list.", savesResult.error);

            liked = new Set((likesResult.data || []).map(row => row.product_id));
            saved = (savesResult.data || []).map(row => row.product_id);
            username = profile ? profile.username : null;
        } catch (error) {
            console.warn("Beelinx: could not load your account data.", error);
        }
    }

    let ready = loadState().then(notify);

    /* log in / log out: reload everything */
    if (Auth) {
        Auth.onChange(function (event) {
            if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
                /* deferred: auth callbacks must not call Supabase directly */
                setTimeout(function () {
                    ready = loadState().then(notify);
                }, 0);
            }
        });
    }

    /* send logged-out visitors to log in, then bring them back here */
    function goToLogin() {
        const here = (window.location.pathname.split("/").pop() || "index.html") + window.location.search;
        window.location.href = "login.html?next=" + encodeURIComponent(here);
    }


    /* =========================================
       DATA LAYER (Supabase)
    ========================================= */

    async function isLiked(productId) {
        await ready;
        return liked.has(productId);
    }

    async function getLikeCount(productId) {
        if (productId in likeCounts) return likeCounts[productId];
        if (!db) return 0;

        const { data, error } = await db
            .from("like_counts")
            .select("like_count")
            .eq("product_id", productId)
            .maybeSingle();

        const count = error || !data ? 0 : data.like_count;
        likeCounts[productId] = count;
        return count;
    }

    async function toggleLike(productId) {
        await ready;

        if (!userId) { goToLogin(); return false; }
        if (pending.has("like:" + productId)) return liked.has(productId);
        pending.add("like:" + productId);

        const wasLiked = liked.has(productId);
        const oldCount = await getLikeCount(productId);

        /* update the screen first, then save */
        if (wasLiked) {
            liked.delete(productId);
            likeCounts[productId] = Math.max(0, oldCount - 1);
        } else {
            liked.add(productId);
            likeCounts[productId] = oldCount + 1;
        }
        notify();

        const result = wasLiked
            ? await db.from("likes").delete().eq("user_id", userId).eq("product_id", productId)
            : await db.from("likes").insert({ user_id: userId, product_id: productId });

        /* 23505 = already liked, which is fine */
        if (result.error && result.error.code !== "23505") {
            console.warn("Beelinx: could not save your like.", result.error);
            if (wasLiked) liked.add(productId); else liked.delete(productId);
            likeCounts[productId] = oldCount;
            notify();
        }

        pending.delete("like:" + productId);
        return liked.has(productId);
    }

    async function isSaved(productId) {
        await ready;
        return saved.includes(productId);
    }

    async function getSavedIds() {
        /* Newest saved first. */
        await ready;
        return saved.slice();
    }

    async function toggleSave(productId) {
        await ready;

        if (!userId) { goToLogin(); return false; }
        if (pending.has("save:" + productId)) return saved.includes(productId);
        pending.add("save:" + productId);

        const wasSaved = saved.includes(productId);
        const oldList = saved.slice();

        saved = wasSaved
            ? saved.filter(id => id !== productId)
            : [productId, ...saved];
        notify();

        const result = wasSaved
            ? await db.from("saves").delete().eq("user_id", userId).eq("product_id", productId)
            : await db.from("saves").insert({ user_id: userId, product_id: productId });

        if (result.error && result.error.code !== "23505") {
            console.warn("Beelinx: could not save to your list.", result.error);
            saved = oldList;
            notify();
        }

        pending.delete("save:" + productId);
        return saved.includes(productId);
    }

    async function getComments(productId) {
        if (!db) return [];

        const { data, error } = await db
            .from("comments_public")
            .select("id, user_id, username, body, created_at")
            .eq("product_id", productId)
            .order("created_at", { ascending: true });

        if (error) {
            console.warn("Beelinx: could not load comments.", error);
            return [];
        }

        return (data || []).map(function (row) {
            return {
                id: row.id,
                userId: row.user_id,
                author: row.username,
                text: row.body,
                time: new Date(row.created_at).getTime()
            };
        });
    }

    async function addComment(productId, text) {
        const clean = String(text || "").trim().slice(0, MAX_COMMENT_LENGTH);
        if (!clean) return null;

        await ready;

        /* needs an account, and the account needs a username */
        if (!userId || !username) { goToLogin(); return null; }

        const { error } = await db
            .from("comments")
            .insert({ user_id: userId, product_id: productId, body: clean });

        if (error) {
            console.warn("Beelinx: could not post your comment.", error);
            return null;
        }

        notify();
        return { text: clean };
    }

    async function deleteComment(productId, commentId) {
        await ready;
        if (!userId) return;

        const { error } = await db
            .from("comments")
            .delete()
            .eq("id", commentId)
            .eq("user_id", userId);

        if (error) console.warn("Beelinx: could not delete your comment.", error);

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
        const savedNow = await isSaved(button.dataset.id);
        button.classList.toggle("is-saved", savedNow);
        button.setAttribute("aria-pressed", String(savedNow));
        button.setAttribute("aria-label", savedNow ? "Remove from My List" : "Save to My List");
        button.title = savedNow ? "Remove from My List" : "Save to My List";
        setIcon(button, savedNow, "bookmark");
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
            await ready;

            const likedNow = await isLiked(productId);
            const count = await getLikeCount(productId);
            likeButton.classList.toggle("is-active", likedNow);
            likeButton.setAttribute("aria-pressed", String(likedNow));
            setIcon(likeButton, likedNow, "heart");
            if (likeCount) likeCount.textContent = count > 0 ? count : "";

            if (saveButton) {
                const savedNow = await isSaved(productId);
                saveButton.classList.toggle("is-active", savedNow);
                saveButton.setAttribute("aria-pressed", String(savedNow));
                setIcon(saveButton, savedNow, "bookmark");
                if (saveLabel) saveLabel.textContent = savedNow ? "Saved" : "Save to My List";
            }

            if (commentInput) {
                commentInput.placeholder = !userId
                    ? "Log in to add a comment"
                    : (!username ? "Choose a username to comment" : "Add a comment");
            }
        }

        async function renderComments() {
            if (!commentsList) return;
            await ready;
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
                avatar.textContent = (item.author || "?").charAt(0).toUpperCase();

                const body = document.createElement("div");
                body.className = "comment-body";

                const meta = document.createElement("div");
                meta.className = "comment-meta";

                const author = document.createElement("strong");
                author.textContent = item.author || "user";

                const time = document.createElement("span");
                time.textContent = timeAgo(item.time);

                meta.append(author, time);

                const text = document.createElement("p");
                text.className = "comment-text";
                text.textContent = item.text;

                body.append(meta, text);

                /* only the person who wrote it can delete it */
                if (userId && item.userId === userId) {
                    const remove = document.createElement("button");
                    remove.type = "button";
                    remove.className = "comment-delete";
                    remove.textContent = "Delete";
                    remove.addEventListener("click", function () {
                        deleteComment(productId, item.id);
                    });
                    body.appendChild(remove);
                }

                row.append(avatar, body);
                commentsList.appendChild(row);
            });
        }

        likeButton.addEventListener("click", function () { toggleLike(productId); });
        if (saveButton) saveButton.addEventListener("click", function () { toggleSave(productId); });

        if (commentForm && commentInput) {
            commentInput.maxLength = MAX_COMMENT_LENGTH;

            const status = document.createElement("p");
            status.className = "comments-empty";
            status.hidden = true;
            commentForm.insertAdjacentElement("afterend", status);

            commentForm.addEventListener("submit", async function (event) {
                event.preventDefault();
                status.hidden = true;

                const text = commentInput.value;
                if (!text.trim()) return;

                const posted = await addComment(productId, text);

                if (posted) {
                    commentInput.value = "";
                } else if (userId && username) {
                    status.textContent = "Could not post your comment. Please try again.";
                    status.hidden = false;
                }
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

    let emptyDefault = null;

    async function renderMyList() {
        const container = document.getElementById("my-list-container");
        if (!container) return;

        const empty = document.getElementById("my-list-empty");
        if (empty && emptyDefault === null) emptyDefault = empty.innerHTML;

        await ready;

        const ids = await getSavedIds();
        const available = typeof products !== "undefined" ? products : {};
        const validIds = ids.filter(id => available[id]);

        container.replaceChildren();
        validIds.forEach(id => container.appendChild(buildListCard(id, available[id])));

        if (empty) {
            if (!userId) {
                const link = document.createElement("a");
                link.href = "login.html?next=my-list.html";
                link.textContent = "Log in";
                link.style.color = "inherit";
                link.style.textDecoration = "underline";
                empty.replaceChildren(
                    document.createTextNode("Log in to see the products you saved."),
                    document.createElement("br"),
                    link
                );
            } else if (emptyDefault !== null) {
                empty.innerHTML = emptyDefault;
            }

            empty.style.display = validIds.length ? "none" : "block";
        }
    }


    /* =========================================
       KEEP EVERYTHING IN SYNC
       Runs after any like, save or comment change,
       and after logging in or out.
    ========================================= */

    function refreshAll() {
        document.querySelectorAll(".save-btn[data-id]").forEach(syncSaveButton);
    }

    document.addEventListener("beelinx:change", refreshAll);
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