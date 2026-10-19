/* =========================================
   BEELINX PROFILE PAGE
   profile.html            -> your own profile (or a blank
                              "Log in" screen if logged out)
   profile.html?u=name     -> someone else's profile

   Needs, loaded before this file: the Supabase library,
   auth.js, data.js and engagement.js.
========================================= */

(function () {
    "use strict";

    var Auth = window.BeelinxAuth || null;
    var db = Auth ? Auth.client : null;

    function $(id) { return document.getElementById(id); }

    var ui = {
        hero: $("profile-hero"),
        title: $("profile-title"),
        ghost: $("profile-ghost"),
        body: $("profile-body"),
        login: $("guest-login"),
        avatar: $("profile-avatar"),
        username: $("profile-username"),
        kicker: $("profile-kicker"),
        bio: $("profile-bio"),
        follow: $("follow-btn"),
        message: $("message-btn"),
        logout: $("logout-btn"),
        countPosts: $("count-posts"),
        countFollowers: $("count-followers"),
        countFollowing: $("count-following"),
        usernameForm: $("username-form"),
        usernameInput: $("username-input"),
        usernameMessage: $("username-message"),
        tabs: document.querySelectorAll(".profile-tabs .tab"),
        listsTab: $("tab-lists"),
        peopleTab: $("tab-people"),
        panel: $("profile-panel")
    };

    var TYPE_LABELS = { shopper: "Consumer", brand: "Brand", model: "Model" };

    var viewer = null;          /* logged-in user, or null */
    var target = null;          /* the profile being shown */
    var isOwn = false;
    var isFollowing = false;
    var activeTab = "posts";
    var renderToken = 0;
    var followers = 0;


    /* ---------- small helpers ---------- */

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    /* the hero is always on screen; only its words and the white body change */
    function showOnly(name, title, text) {
        ui.hero.className = "profile-hero is-" + name;
        ui.body.hidden = name !== "view";

        if (name === "view" || name === "loading") return;

        var isGuest = name === "guest";

        ui.avatar.replaceChildren();
        var icon = document.createElement("i");
        icon.className = "fas " + (isGuest ? "fa-user" : "fa-question");
        ui.avatar.appendChild(icon);

        ui.ghost.textContent = isGuest ? "BEELINX" : "404";
        ui.ghost.style.setProperty("--ghost-size", "13vw");

        ui.title.textContent = isGuest ? "Your profile" : "Profile";
        ui.kicker.textContent = "";
        ui.username.textContent = title || "";
        ui.bio.textContent = text || "";
        ui.bio.hidden = !text;

        ui.login.hidden = !isGuest;
        ui.follow.hidden = true;
        ui.message.hidden = true;
        ui.logout.hidden = true;
        document.title = (title || "Profile") + " | Beelinx";
    }

    function note(text) {
        return el("p", "profile-empty", text);
    }

    function profileHref(username) {
        return "profile.html?u=" + encodeURIComponent(username);
    }

    function formatDate(value) {
        var date = new Date(value);
        return isNaN(date) ? "" : date.toLocaleDateString(undefined, {
            year: "numeric", month: "short", day: "numeric"
        });
    }

    async function countRows(table, column, id) {
        var result = await db
            .from(table)
            .select("*", { count: "exact", head: true })
            .eq(column, id);
        return result.error ? 0 : (result.count || 0);
    }

    function setFollowerCount(value) {
        followers = Math.max(0, value);
        ui.countFollowers.textContent = followers;
    }

    /* ---------- speed: remember the last profile so the page can paint at once ---------- */

    var CACHE_KEY = "beelinx_profile_cache";

    function readCache(userId) {
        try {
            var saved = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
            return saved && saved.uid === userId ? saved : null;
        } catch (error) {
            return null;
        }
    }

    function writeCache(userId, profile, counts) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ uid: userId, profile: profile, counts: counts }));
        } catch (error) { /* storage full or blocked: fine */ }
    }

    function clearCache() {
        try { localStorage.removeItem(CACHE_KEY); } catch (error) { /* ignore */ }
    }

    /* loads a script only when it is first needed */
    var loadedScripts = {};

    function loadScript(src) {
        if (!loadedScripts[src]) {
            loadedScripts[src] = new Promise(function (resolve, reject) {
                var tag = document.createElement("script");
                tag.src = src;
                tag.onload = resolve;
                tag.onerror = function () { reject(new Error("Could not load " + src)); };
                document.head.appendChild(tag);
            });
        }
        return loadedScripts[src];
    }

    function fetchPosts(userId) {
        return db
            .from("posts")
            .select("id, body, image_url, media_archived, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(50);
    }

    /* posts are requested at the same moment as the profile, not after it */
    var postsRequest = null;

    function loadCounts(id) {
        return Promise.all([
            countRows("posts", "user_id", id),
            countRows("follows", "following_id", id),
            countRows("follows", "follower_id", id)
        ]);
    }

    function goToLogin() {
        var here = "profile.html" + window.location.search;
        window.location.href = "login.html?next=" + encodeURIComponent(here);
    }


    /* ---------- tabs ---------- */

    function selectTab(name) {
        if ((name === "lists" || name === "people") && !isOwn) name = "posts";
        activeTab = name;

        ui.tabs.forEach(function (tab) {
            var active = tab.dataset.tab === name;
            tab.classList.toggle("active", active);
            tab.setAttribute("aria-selected", String(active));
        });

        moveIndicator();
        renderTab();
    }

    /* the sliding line under the active tab */
    function moveIndicator() {
        var bar = document.querySelector(".tab-indicator");
        var active = document.querySelector(".profile-tabs .tab.active");
        if (!bar) return;

        if (!active || active.hidden) {
            bar.style.width = "0px";
            return;
        }

        bar.style.width = active.offsetWidth + "px";
        bar.style.transform = "translateX(" + active.offsetLeft + "px)";
    }

    window.addEventListener("resize", moveIndicator);

    async function renderTab() {
        var token = ++renderToken;
        var tab = activeTab;

        ui.panel.replaceChildren(note("Loading..."));

        var content;
        try {
            if (tab === "posts") content = await buildPosts();
            else if (tab === "followers") content = await buildPeople("follower_id", "following_id");
            else if (tab === "following") content = await buildPeople("following_id", "follower_id");
            else if (tab === "people") content = buildPeopleSearch();
            else content = await buildList();
        } catch (error) {
            console.warn("Beelinx: could not load this tab.", error);
            content = note("Something went wrong. Please try again.");
        }

        /* ignore if the person already moved to another tab */
        if (token !== renderToken) return;

        if (tab === "followers" || tab === "following") {
            var box = el("div");
            box.append(el("h2", "panel-title", tab === "followers" ? "Followers" : "Following"), content);
            content = box;
        }

        ui.panel.replaceChildren(content);
    }

    async function buildPosts() {
        var request = postsRequest && postsRequest.id === target.id
            ? postsRequest.promise
            : fetchPosts(target.id);
        postsRequest = null;

        var result = await request;

        if (result.error) throw result.error;

        var rows = result.data || [];
        ui.countPosts.textContent = rows.length;

        if (!rows.length) {
            return note(isOwn ? "You haven't posted anything yet." : "No posts yet.");
        }

        var wrap = el("div", "post-list");

        rows.forEach(function (row) {
            var post = el("article", "post-card" + (row.image_url || row.media_archived ? "" : " is-text"));

            if (row.image_url) {
                var image = document.createElement("img");
                image.className = "post-image";
                image.src = row.image_url;
                image.alt = "Post photo";
                image.loading = "lazy";
                post.appendChild(image);
            }

            /* the picture was removed from the feed to save space */
            if (!row.image_url && row.media_archived) {
                post.appendChild(el("div", "post-archived", "Media archived"));
            }

            if (row.body) post.appendChild(el("p", "post-body", row.body));
            post.appendChild(el("time", "post-time", formatDate(row.created_at)));

            wrap.appendChild(post);
        });

        return wrap;
    }

    /* mineColumn = the column that equals this profile's id,
       otherColumn = the column that holds the person to display */
    async function buildPeople(otherColumn, mineColumn) {
        var relation = otherColumn === "follower_id"
            ? "follows_follower_id_fkey"
            : "follows_following_id_fkey";

        var result = await db
            .from("follows")
            .select("created_at, person:profiles!" + relation + "(username, role)")
            .eq(mineColumn, target.id)
            .order("created_at", { ascending: false })
            .limit(200);

        if (result.error) throw result.error;

        var rows = result.data || [];

        if (!rows.length) {
            var empty = otherColumn === "follower_id" ? "No followers yet." : "Not following anyone yet.";
            return note(empty);
        }

        var wrap = el("div", "people-list");

        rows.forEach(function (row) {
            var person = row.person;
            if (!person) return;

            var name = person.username;
            var item = name ? el("a", "person") : el("div", "person");
            if (name) item.href = profileHref(name);

            item.appendChild(el("span", "person-avatar", (name || "?").charAt(0).toUpperCase()));
            item.appendChild(el("span", "person-name", name ? "@" + name : "Unnamed user"));
            item.appendChild(el("span", "person-type", TYPE_LABELS[person.role] || ""));

            wrap.appendChild(item);
        });

        return wrap;
    }

    /* one row in a people list (same look as followers / following) */
    function personRow(name, role) {
        var item = name ? el("a", "person") : el("div", "person");
        if (name) item.href = profileHref(name);

        item.appendChild(el("span", "person-avatar", (name || "?").charAt(0).toUpperCase()));
        item.appendChild(el("span", "person-name", name ? "@" + name : "Unnamed user"));
        item.appendChild(el("span", "person-type", TYPE_LABELS[role] || ""));
        return item;
    }

    /* People tab: find other members by username.
       With nothing typed it shows the newest members. */
    function buildPeopleSearch() {
        var box = el("div", "people-search");

        var input = document.createElement("input");
        input.type = "search";
        input.className = "people-input";
        input.placeholder = "Search people by username";
        input.autocomplete = "off";
        input.autocapitalize = "none";
        input.spellcheck = false;
        input.maxLength = 20;
        input.setAttribute("aria-label", "Search people by username");

        var results = el("div", "people-results");
        box.append(input, results);

        var timer = null;
        var searchToken = 0;

        async function run() {
            var mine = ++searchToken;

            /* usernames only contain letters, numbers and underscores */
            var query = input.value.trim().replace(/[^A-Za-z0-9_]/g, "");

            if (query) results.replaceChildren(note("Searching..."));

            var request = db
                .from("profiles")
                .select("id, username, role, created_at")
                .not("username", "is", null)
                .order("created_at", { ascending: false })
                .limit(30);

            if (query) request = request.ilike("username", "%" + query + "%");
            if (viewer) request = request.neq("id", viewer.id);

            var result = await request;

            /* a newer search started meanwhile: drop this answer */
            if (mine !== searchToken) return;

            if (result.error) {
                console.warn("Beelinx: could not search people.", result.error);
                results.replaceChildren(note("Search is unavailable right now. Please try again later."));
                return;
            }

            var rows = result.data || [];

            if (!rows.length) {
                results.replaceChildren(note(query ? "No one found." : "No other members yet."));
                return;
            }

            /* names that start with what was typed come first */
            if (query) {
                var lower = query.toLowerCase();
                rows.sort(function (a, b) {
                    var aStarts = a.username.toLowerCase().indexOf(lower) === 0 ? 0 : 1;
                    var bStarts = b.username.toLowerCase().indexOf(lower) === 0 ? 0 : 1;
                    return aStarts - bStarts || a.username.localeCompare(b.username);
                });
            }

            var list = el("div", "people-list");
            rows.forEach(function (row) { list.appendChild(personRow(row.username, row.role)); });

            results.replaceChildren(
                el("p", "people-label", query ? "Results" : "Newest members"),
                list
            );
        }

        input.addEventListener("input", function () {
            clearTimeout(timer);
            timer = setTimeout(run, 250);
        });

        run();
        return box;
    }

    function money(price) {
        if (price === null || price === undefined || price === "") return "";
        var number = Number(String(price).replace(/,/g, ""));
        if (!isFinite(number)) return String(price);
        return "\u20A6" + new Intl.NumberFormat("en-NG", { maximumFractionDigits: 2 }).format(number);
    }

    async function buildList() {
        /* the save buttons come from engagement.js, loaded only now */
        var engineReady = loadScript("../js/engagement.js").catch(function () { return null; });

        var saved = await db
            .from("saves")
            .select("product_id")
            .eq("user_id", viewer.id)
            .order("created_at", { ascending: false });

        if (saved.error) throw saved.error;

        var ids = (saved.data || []).map(function (row) { return row.product_id; });

        if (!ids.length) {
            return note("Nothing saved yet. Tap the bookmark on any product to keep it here.");
        }

        var loaded = await Promise.all([
            db.from("products").select("id, name, price, image, brand_id").in("id", ids),
            db.from("brands").select("id, name")
        ]);

        if (loaded[0].error) throw loaded[0].error;

        var brandNames = {};
        (loaded[1].data || []).forEach(function (row) { brandNames[row.id] = row.name; });

        var byId = {};
        (loaded[0].data || []).forEach(function (row) { byId[row.id] = row; });

        await engineReady;
        var engage = window.BeelinxEngage;

        var grid = el("div", "products-container");

        ids.forEach(function (id) {
            var product = byId[id];
            if (!product) return;

            var brand = brandNames[product.brand_id] || "";

            var card = el("div", "products");

            var imageLink = document.createElement("a");
            imageLink.href = "product-template.html?id=" + encodeURIComponent(id);

            var image = document.createElement("img");
            image.className = "clothe-image";
            image.src = product.image || "";
            image.alt = product.name || "Product image";
            image.loading = "lazy";
            imageLink.appendChild(image);

            var text = el("div", "clothe-text");

            var brandLink = document.createElement("a");
            brandLink.className = "brand-page-link";
            brandLink.href = "brandpage-template.html?brand=" + encodeURIComponent(brand);
            brandLink.appendChild(el("strong", null, brand));

            text.append(brandLink, document.createElement("br"),
                document.createTextNode(product.name || ""),
                el("p", "price", money(product.price)));

            card.append(imageLink, text);
            if (engage) card.appendChild(engage.createSaveButton(id));
            grid.appendChild(card);
        });

        return grid;
    }

    /* saving or un-saving elsewhere updates the list tab */
    document.addEventListener("beelinx:change", function () {
        if (activeTab === "lists" && isOwn && !ui.body.hidden) renderTab();
    });


    /* ---------- follow / unfollow ---------- */

    function paintFollow() {
        ui.follow.textContent = isFollowing ? "Following" : "Follow";
        ui.follow.classList.toggle("pill-ghost", isFollowing);
        ui.follow.setAttribute("aria-pressed", String(isFollowing));
    }

    var followBusy = false;

    ui.follow.addEventListener("click", async function () {
        if (!viewer) { goToLogin(); return; }
        if (followBusy || isOwn) return;
        followBusy = true;

        var was = isFollowing;
        isFollowing = !was;
        setFollowerCount(followers + (was ? -1 : 1));
        paintFollow();

        var result = was
            ? await db.from("follows").delete()
                .eq("follower_id", viewer.id).eq("following_id", target.id)
            : await db.from("follows")
                .insert({ follower_id: viewer.id, following_id: target.id });

        /* 23505 = already following, which is fine */
        if (result.error && result.error.code !== "23505") {
            console.warn("Beelinx: could not update follow.", result.error);
            isFollowing = was;
            setFollowerCount(followers + (was ? 1 : -1));
            paintFollow();
        }

        followBusy = false;
        if (activeTab === "followers") renderTab();
    });


    /* ---------- log out ---------- */

    ui.logout.addEventListener("click", async function () {
        ui.logout.disabled = true;
        var result = await Auth.signOut();
        if (result.error) {
            ui.logout.disabled = false;
            return;
        }
        clearCache();
        window.location.href = "profile.html";
    });


    /* ---------- choose a username (older accounts) ---------- */

    ui.usernameForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        ui.usernameMessage.textContent = "";
        var submit = ui.usernameForm.querySelector("button[type=submit]");
        submit.disabled = true;

        var result = await Auth.setUsername(ui.usernameInput.value);

        if (result.error) {
            ui.usernameMessage.textContent = result.error;
            submit.disabled = false;
            return;
        }

        window.location.reload();
    });


    /* ---------- tab + stat clicks ---------- */

    ui.tabs.forEach(function (tab) {
        tab.addEventListener("click", function () { selectTab(tab.dataset.tab); });
    });

    document.querySelectorAll(".profile-stats .stat").forEach(function (stat) {
        stat.addEventListener("click", function () {
            selectTab(stat.dataset.tab);
            document.querySelector(".profile-tabs").scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });


    /* ---------- draw the profile ---------- */

    var shown = false;

    /* everything here is instant: it only uses data already in hand */
    function paintHeader(counts) {
        var name = target.username;

        document.title = (name ? "@" + name : "Profile") + " | Beelinx";

        ui.avatar.textContent = (name || "?").charAt(0).toUpperCase();
        ui.title.textContent = isOwn ? "Your profile" : "Profile";
        ui.username.textContent = name ? "@" + name : "No username yet";

        var ghostText = (name || "BEELINX").toUpperCase();
        ui.ghost.textContent = ghostText;

        var year = new Date(target.created_at).getFullYear();
        var parts = [TYPE_LABELS[target.role] || "Member"];
        if (year) parts.push("since " + year);
        ui.kicker.textContent = parts.join(" \u00b7 ");
        ui.hero.dataset.role = target.role || "";

        ui.bio.textContent = target.bio || "";
        ui.bio.hidden = !target.bio;

        ui.login.hidden = true;
        ui.logout.hidden = !isOwn;
        ui.follow.hidden = isOwn;

        /* the chat icon: opens a conversation with this person */
        ui.message.hidden = isOwn || !name;
        if (name) ui.message.href = "chat.html?with=" + encodeURIComponent(name);
        ui.listsTab.hidden = !isOwn;
        ui.peopleTab.hidden = !isOwn;
        ui.usernameForm.hidden = !(isOwn && !name);

        if (counts) {
            ui.countPosts.textContent = counts[0];
            setFollowerCount(counts[1]);
            ui.countFollowing.textContent = counts[2];
        }

        if (!isOwn) paintFollow();
    }

    function reveal() {
        if (shown) { moveIndicator(); return; }
        shown = true;
        showOnly("view");
        selectTab("posts");
    }

    async function start() {
        showOnly("loading");

        if (!Auth) {
            showOnly("missing", "Unavailable", "Profiles are unavailable right now. Please try again later.");
            return;
        }

        var wanted = new URLSearchParams(window.location.search).get("u");

        /* reads the saved login from this device: no network */
        viewer = await Auth.getUser();

        /* ----- someone else's page ----- */
        if (wanted) {
            ui.login.href = "login.html?next=" + encodeURIComponent("profile.html" + window.location.search);

            target = await Auth.getProfileByUsername(wanted);

            if (!target) {
                showOnly("missing", "Not found", "We couldn't find that profile.");
                return;
            }

            isOwn = !!viewer && target.id === viewer.id;

            postsRequest = { id: target.id, promise: fetchPosts(target.id) };

            var extras = [loadCounts(target.id)];
            if (!isOwn && viewer) {
                extras.push(
                    db.from("follows").select("follower_id")
                        .eq("follower_id", viewer.id).eq("following_id", target.id).maybeSingle()
                );
            }

            var found = await Promise.all(extras);
            if (found[1]) isFollowing = !!found[1].data;

            paintHeader(found[0]);
            reveal();
            return;
        }

        /* ----- logged out ----- */
        if (!viewer) {
            clearCache();
            showOnly("guest", "Not logged in", "Log in to see your posts, followers, following and saved list.");
            return;
        }

        /* ----- your own page ----- */
        isOwn = true;

        /* start every request at once instead of one after another */
        postsRequest = { id: viewer.id, promise: fetchPosts(viewer.id) };

        var profileRequest = db
            .from("profiles")
            .select("id, username, role, display_name, bio, avatar_url, created_at")
            .eq("id", viewer.id)
            .maybeSingle();

        var countsRequest = loadCounts(viewer.id);

        /* seen before on this device: paint right now, refresh in a moment */
        var cached = readCache(viewer.id);
        if (cached && cached.profile) {
            target = cached.profile;
            paintHeader(cached.counts);
            reveal();
        }

        var results = await Promise.all([profileRequest, countsRequest]);

        if (results[0].error || !results[0].data) {
            if (!cached) {
                showOnly("missing", "Something went wrong", "We couldn't load your profile. Please try again.");
            }
            return;
        }

        target = results[0].data;
        writeCache(viewer.id, target, results[1]);

        paintHeader(results[1]);
        reveal();
    }

    start();

})();