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
        logout: $("logout-btn"),
        countPosts: $("count-posts"),
        countFollowers: $("count-followers"),
        countFollowing: $("count-following"),
        usernameForm: $("username-form"),
        usernameInput: $("username-input"),
        usernameMessage: $("username-message"),
        usernameEditForm: $("username-edit-form"),
        usernameEditInput: $("username-edit-input"),
        usernameEditMessage: $("username-edit-message"),
        usernameEditCancel: $("username-edit-cancel"),
        tabs: document.querySelectorAll(".profile-tabs .tab"),
        listsTab: $("tab-lists"),
        productsTab: document.querySelector('[data-tab="products"]'),
        panel: $("profile-panel"),
        bioEditBtn: $("bio-edit-btn"),
        bioRow: $("bio-edit-row"),
        bioInput: $("bio-input"),
        bioSave: $("bio-save"),
        bioCancel: $("bio-cancel"),
        bioMsg: $("bio-msg"),
        avatarInput: $("avatar-input")
    };

    var TYPE_LABELS = { shopper: "Shopper", brand: "Brand", model: "Model" };

    var viewer = null;          /* logged-in user, or null */
    var target = null;          /* the profile being shown */
    var isOwn = false;
    var isFollowing = false;
    var activeTab = "posts";
    var renderToken = 0;
    var followers = 0;

    var B = window.Beelinx || null;
    var sheetEl = document.getElementById("sx-sheet");
    var profilePostsById = new Map();
    var roleChangePop = null;


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
            .select("id, user_id, body, image_url, image_path, media_archived, created_at, post_likes(count), post_comments(count)")
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
        if (name === "lists" && !isOwn) name = "posts";
        if (name === "products" && (!target || target.role !== "brand")) name = "posts";
        activeTab = name;

        ui.tabs.forEach(function (tab) {
            var active = tab.dataset.tab === name;
            tab.classList.toggle("active", active);
            tab.setAttribute("aria-selected", String(active));
        });

        moveIndicator();
        renderTab();
    }

    /* People tab: search + newest members (same data as search.html) */
    var peopleTicket = 0;
    var peopleFollowing = new Set();

    async function loadPeopleFollowing() {
        if (!viewer) return;
        try {
            var r = await db.from("follows").select("following_id").eq("follower_id", viewer.id).limit(500);
            peopleFollowing = new Set((r.data || []).map(function (x) { return x.following_id; }));
        } catch (e) { /* ignore */ }
    }

    function peopleFollowButton(profile) {
        var btn = el("button", "sx-pill sx-pill-sm", peopleFollowing.has(profile.id) ? "Following" : "Follow");
        btn.type = "button";
        btn.classList.toggle("sx-pill-ghost", peopleFollowing.has(profile.id));
        btn.setAttribute("aria-pressed", String(peopleFollowing.has(profile.id)));
        btn.addEventListener("click", async function (e) {
            e.preventDefault(); e.stopPropagation();
            if (!viewer) { goToLogin(); return; }
            var was = peopleFollowing.has(profile.id);
            if (was) peopleFollowing.delete(profile.id); else peopleFollowing.add(profile.id);
            btn.textContent = was ? "Follow" : "Following";
            btn.classList.toggle("sx-pill-ghost", !was);
            btn.setAttribute("aria-pressed", String(!was));
            btn.disabled = true;
            var res = was
                ? await db.from("follows").delete().eq("follower_id", viewer.id).eq("following_id", profile.id)
                : await db.from("follows").insert({ follower_id: viewer.id, following_id: profile.id });
            btn.disabled = false;
            if (res.error && res.error.code !== "23505") {
                if (was) peopleFollowing.add(profile.id); else peopleFollowing.delete(profile.id);
                btn.textContent = was ? "Following" : "Follow";
                btn.classList.toggle("sx-pill-ghost", was);
                btn.setAttribute("aria-pressed", String(was));
            } else if (!was) {
                setFollowerCount(followers);
            }
        });
        return btn;
    }

    function peopleRow(profile) {
        var isMe = viewer && profile.id === viewer.id;
        var link = document.createElement("a");
        link.className = "sx-person-link";
        link.href = profileHref(profile.username);
        var av = el("span", "sx-avatar is-md", (profile.username || "?").charAt(0).toUpperCase());
        if (profile.avatar_url) {
            av.textContent = "";
            var im = document.createElement("img");
            im.src = profile.avatar_url; im.alt = ""; im.loading = "lazy";
            av.appendChild(im);
        }
        var txt = el("span", "sx-person-text");
        var strong = el("strong", null, profile.username ? "@" + profile.username : "Unnamed");
        var role = el("span", "sx-handle", TYPE_LABELS[profile.role] || "Shopper");
        txt.append(strong, role);
        if (profile.bio) txt.appendChild(el("span", "sx-bio", profile.bio));
        link.append(av, txt);
        var li = el("li", "sx-person");
        li.appendChild(link);
        li.appendChild(isMe ? el("span", "sx-you", "You") : peopleFollowButton(profile));
        return li;
    }

    async function buildPeopleTab() {
        await loadPeopleFollowing();
        var wrap = el("div");
        var searchWrap = el("div", "people-searchbar");
        var input = document.createElement("input");
        input.type = "search";
        input.placeholder = "Search people by username";
        input.setAttribute("aria-label", "Search people");
        input.autocapitalize = "none"; input.spellcheck = false; input.maxLength = 40;
        searchWrap.appendChild(input);
        var heading = el("h2", "people-section-title", "Newest members");
        var noteEl = el("p", "people-note");
        noteEl.hidden = true;
        var list = el("ul", "people-list sx-people");

        function showNote(t) { noteEl.textContent = t || ""; noteEl.hidden = !t; }

        async function run(raw) {
            var q = raw.trim().replace(/[%,()*\\]/g, " ").trim();
            var mine = ++peopleTicket;
            var query = db.from("profiles").select("id,username,display_name,bio,avatar_url,role").not("username", "is", null);
            if (q) query = query.or("username.ilike.%" + q + "%,display_name.ilike.%" + q + "%").limit(30);
            else query = query.order("created_at", { ascending: false }).limit(20);
            showNote("");
            var res = await query;
            if (mine !== peopleTicket) return;
            if (res.error) { list.replaceChildren(); heading.textContent = ""; showNote("Search is not available right now."); return; }
            var found = res.data || [];
            if (q) {
                var lower = q.toLowerCase();
                found.sort(function (a, b) {
                    function rank(p) {
                        var n = (p.username || "").toLowerCase();
                        if (n === lower) return 0;
                        if (n.indexOf(lower) === 0) return 1;
                        if ((p.display_name || "").toLowerCase().indexOf(lower) === 0) return 2;
                        return 3;
                    }
                    return rank(a) - rank(b);
                });
            }
            if (!found.length) { list.replaceChildren(); heading.textContent = ""; showNote(q ? 'No one found for "' + q + '".' : "No accounts yet."); return; }
            heading.textContent = q ? "Results" : "Newest members";
            list.replaceChildren();
            found.forEach(function (p) { list.appendChild(peopleRow(p)); });
        }

        var tmr = null;
        input.addEventListener("input", function () {
            clearTimeout(tmr);
            tmr = setTimeout(function () { run(input.value); }, 250);
        });
        input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); clearTimeout(tmr); run(input.value); } });

        wrap.append(searchWrap, heading, noteEl, list);
        await run("");
        // focus helper for the search
        setTimeout(function () { /* keep empty input focused on desktop */ }, 0);
        return wrap;
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
            else if (tab === "products") content = await buildBrandProducts();
            else if (tab === "people") content = await buildPeopleTab();
            else if (tab === "followers") content = await buildPeople("follower_id", "following_id");
            else if (tab === "following") content = await buildPeople("following_id", "follower_id");
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

    /* sheet helpers so profile posts can be opened like the feed */
    function pH(tag, props) {
        if (B && B.h) return B.h.apply(null, arguments);
        var e = document.createElement(tag);
        props = props || {};
        Object.keys(props).forEach(function (k) {
            var v = props[k];
            if (v == null || v === false) return;
            if (k === "class") e.className = v;
            else if (k === "text") e.textContent = v;
            else if (k === "hidden") e.hidden = !!v;
            else if (k.slice(0, 2) === "on" && typeof v === "function") e.addEventListener(k.slice(2), v);
            else e.setAttribute(k, v === true ? "" : v);
        });
        for (var i = 2; i < arguments.length; i++) {
            var ch = arguments[i];
            if (ch == null || ch === false) continue;
            e.appendChild(typeof ch === "string" ? document.createTextNode(ch) : ch);
        }
        return e;
    }

    function pTimeAgo(iso) {
        if (B && B.timeAgo) return B.timeAgo(iso);
        var s = (Date.now() - new Date(iso).getTime()) / 1000;
        if (s < 60) return "just now";
        var m = s / 60; if (m < 60) return Math.floor(m) + "m";
        var h = m / 60; if (h < 24) return Math.floor(h) + "h";
        var d = h / 24; if (d < 7) return Math.floor(d) + "d";
        return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
    }

    function profileAvatarMini() {
        var sp = pH("span", { class: "sx-avatar is-md" });
        if (target && target.avatar_url) {
            var im = document.createElement("img");
            im.src = target.avatar_url; im.alt = ""; im.loading = "lazy";
            sp.appendChild(im);
        } else {
            sp.textContent = (target && target.username || "?").charAt(0).toUpperCase();
        }
        return sp;
    }

    function lockSheet(on) { document.documentElement.classList.toggle("sx-lock", !!on); }

    function showSheet(panel) {
        if (!sheetEl) return;
        sheetEl.replaceChildren(panel);
        sheetEl.hidden = false;
        lockSheet(true);
    }

    function closeSheet() {
        if (!sheetEl) return;
        sheetEl.hidden = true;
        sheetEl.replaceChildren();
        lockSheet(false);
    }

    if (sheetEl) {
        sheetEl.addEventListener("click", function (e) { if (e.target === sheetEl) closeSheet(); });
        document.addEventListener("keydown", function (e) { if (e.key === "Escape" && sheetEl && !sheetEl.hidden) closeSheet(); });
    }

    function postById(id) { return profilePostsById.get(id) || null; }

    function paintProfileLike(btn, post) {
        if (!btn) return;
        btn.classList.toggle("is-liked", !!post.liked);
        btn.setAttribute("aria-pressed", String(!!post.liked));
        btn.replaceChildren(
            pH("i", { class: (post.liked ? "fa-solid" : "fa-regular") + " fa-heart" }),
            pH("span", { text: String(post.likeCount) })
        );
    }

    function repaintProfileLikes(post) {
        document.querySelectorAll('[data-plike="' + post.id + '"]').forEach(function (b) { paintProfileLike(b, post); });
    }

    function repaintProfileComments(post) {
        document.querySelectorAll('[data-pcomments="' + post.id + '"] span').forEach(function (s) { s.textContent = String(post.commentCount); });
    }

    async function toggleProfileLike(post) {
        if (!viewer) { window.location.href = "login.html?next=" + encodeURIComponent("profile.html" + window.location.search); return; }
        var was = !!post.liked;
        post.liked = !was;
        post.likeCount += was ? -1 : 1;
        repaintProfileLikes(post);
        var r = was
            ? await db.from("post_likes").delete().eq("user_id", viewer.id).eq("post_id", post.id)
            : await db.from("post_likes").insert({ user_id: viewer.id, post_id: post.id });
        if (r.error && r.error.code !== "23505") {
            post.liked = was;
            post.likeCount += was ? 1 : -1;
            repaintProfileLikes(post);
        }
    }

    function commentRowForProfile(post, c) {
        var prof = c.profiles || {};
        var body = pH("div", { class: "sx-comment-body" },
            pH("p", { class: "sx-comment-head" },
                pH("a", { href: profileHref(prof.username), text: prof.username ? "@" + prof.username : (B ? B.displayName(prof) : "Someone") }),
                pH("span", { text: pTimeAgo(c.created_at) })),
            pH("p", { class: "sx-comment-text", text: c.body })
        );
        var li = pH("li", { class: "sx-comment" }, (B ? B.avatar(prof, "is-md") : profileAvatarMini()), body);
        if (viewer && c.user_id === viewer.id) {
            body.appendChild(pH("button", {
                type: "button", class: "sx-link", text: "Delete",
                onclick: async function () {
                    var rr = await db.from("post_comments").delete().eq("id", c.id);
                    if (rr.error) return;
                    li.remove();
                    post.commentCount = Math.max(0, post.commentCount - 1);
                    repaintProfileComments(post);
                }
            }));
        }
        return li;
    }

    async function deleteProfilePost(post) {
        if (!window.confirm("Delete this post?")) return;
        var r = await db.from("posts").delete().eq("id", post.id);
        if (r.error) { window.alert("Could not delete the post."); return; }
        if (post.image_path) db.storage.from("post-images").remove([post.image_path]);
        profilePostsById.delete(post.id);
        var tile = document.querySelector('[data-post="' + post.id + '"]');
        if (tile) tile.remove();
        closeSheet();
        ui.countPosts.textContent = String(profilePostsById.size);
        if (!profilePostsById.size && activeTab === "posts" && isOwn) {
            ui.panel.replaceChildren(note("You haven't posted anything yet."));
        }
    }

    function openProfilePost(post) {
        var hasMedia = !!post.image_url || !!post.media_archived;
        var media = null;
        if (post.image_url) media = pH("div", { class: "sx-sheet-media" }, pH("img", { src: post.image_url, alt: "" }));
        else if (post.media_archived) media = pH("div", { class: "sx-sheet-media" }, pH("div", { class: "sx-post-archived" }, pH("i", { class: "fa-regular fa-image" }), pH("span", { text: "Media archived" })));

        var status = pH("p", { class: "sx-note", text: "Loading comments..." });
        var list = pH("ul", { class: "sx-comments" });
        var input = pH("input", { type: "text", placeholder: viewer ? "Add a comment" : "Log in to comment", maxlength: "500", autocomplete: "off", "aria-label": "Add a comment" });
        var send = pH("button", { type: "submit", class: "sx-pill sx-pill-sm", text: "Post" });
        var form = pH("form", {
            class: "sx-comment-form",
            onsubmit: async function (e) {
                e.preventDefault();
                if (!viewer) { window.location.href = "login.html?next=" + encodeURIComponent("profile.html" + window.location.search); return; }
                var t = input.value.trim();
                if (!t) return;
                send.disabled = true;
                var rr = await db.from("post_comments").insert({ post_id: post.id, user_id: viewer.id, body: t }).select("id,user_id,body,created_at,profiles!post_comments_user_id_fkey(username,display_name,avatar_url)").single();
                send.disabled = false;
                if (rr.error) { status.hidden = false; status.textContent = "Could not post your comment."; return; }
                input.value = ""; status.hidden = true;
                list.appendChild(commentRowForProfile(post, rr.data));
                post.commentCount += 1;
                repaintProfileComments(post);
            }
        }, input, send);

        var likeBtn = pH("button", { type: "button", class: "sx-stat", "data-plike": post.id, onclick: function (ev) { ev.stopPropagation(); toggleProfileLike(post); } });
        paintProfileLike(likeBtn, post);
        var cStat = pH("span", { class: "sx-stat", "data-pcomments": post.id }, pH("i", { class: "fa-regular fa-comment" }), pH("span", { text: String(post.commentCount) }));
        var isMine = viewer && post.user_id === viewer.id;
        var actions = pH("div", { class: "sx-sheet-actions" }, likeBtn, cStat, isMine ? pH("button", { type: "button", class: "sx-link sx-danger", text: "Delete post", onclick: function () { deleteProfilePost(post); } }) : null);

        var closeBtn = pH("button", { type: "button", class: "sx-sheet-close", "aria-label": "Close", onclick: closeSheet }, pH("i", { class: "fas fa-xmark" }));
        var info = pH("div", { class: "sx-sheet-info" },
            pH("div", { class: "sx-sheet-scroll" },
                pH("a", { class: "sx-sheet-author", href: profileHref(target.username) }, profileAvatarMini(), pH("span", {}, pH("strong", { text: target.username ? "@" + target.username : "Someone" }), pH("small", { text: pTimeAgo(post.created_at) }))),
                post.body ? pH("p", { class: "sx-sheet-body", text: post.body }) : null,
                actions,
                pH("h3", { class: "sx-sheet-heading", text: "Comments" }), status, list), form);

        var panel = pH("div", { class: "sx-sheet-panel" + (hasMedia ? "" : " is-narrow") }, closeBtn, media, info);
        showSheet(panel);

        db.from("post_comments").select("id,user_id,body,created_at,profiles!post_comments_user_id_fkey(username,display_name,avatar_url)").eq("post_id", post.id).order("created_at", { ascending: true }).limit(200).then(function (rr) {
            if (rr.error) { status.textContent = "Could not load comments."; return; }
            var rows2 = rr.data || [];
            status.hidden = rows2.length > 0;
            if (!rows2.length) status.textContent = "No comments yet.";
            rows2.forEach(function (r2) { list.appendChild(commentRowForProfile(post, r2)); });
        });
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
        profilePostsById.clear();
        rows.forEach(function (r) {
            var cc = (r.post_likes && r.post_likes[0] && r.post_likes[0].count) || 0;
            var cm = (r.post_comments && r.post_comments[0] && r.post_comments[0].count) || 0;
            profilePostsById.set(r.id, { id: r.id, user_id: r.user_id, body: r.body || "", image_url: r.image_url, image_path: r.image_path, media_archived: !!r.media_archived, created_at: r.created_at, likeCount: cc, commentCount: cm, liked: false });
        });

        if (viewer && profilePostsById.size) {
            try {
                var ids = Array.from(profilePostsById.keys());
                var likedRes = await db.from("post_likes").select("post_id").eq("user_id", viewer.id).in("post_id", ids);
                var likedSet = new Set((likedRes.data || []).map(function (x) { return x.post_id; }));
                likedSet.forEach(function (id) { var p = profilePostsById.get(id); if (p) p.liked = true; });
            } catch (e) { /* ignore */ }
        }

        if (!rows.length) {
            return note(isOwn ? "You haven't posted anything yet." : "No posts yet.");
        }

        var wrap = el("div", "post-list");

        if (isOwn) {
            var addBtn = el("button", "pf-post-btn", "+ Post");
            addBtn.type = "button";
            addBtn.addEventListener("click", function () { window.location.href = "feed.html?compose=1"; });
            wrap.appendChild(addBtn);
        }

        profilePostsById.forEach(function (post) {
            var label = post.created_at ? pTimeAgo(post.created_at) : "";
            var article = el("article", "sx-tweet");
            article.setAttribute("data-post", post.id);
            article.style.cursor = "pointer";
            article.addEventListener("click", function () { openProfilePost(post); });

            var avatarLink = document.createElement("a");
            avatarLink.className = "sx-tweet-avatar";
            avatarLink.href = profileHref(target.username);
            var av = el("span", "sx-avatar");
            if (target.avatar_url) {
                var avImg = document.createElement("img");
                avImg.src = target.avatar_url; avImg.alt = ""; avImg.loading = "lazy";
                av.appendChild(avImg);
            } else {
                av.textContent = (target.username || "?").charAt(0).toUpperCase();
            }
            avatarLink.appendChild(av);
            avatarLink.addEventListener("click", function (e) { e.stopPropagation(); });

            var main = el("div", "sx-tweet-main");
            var head = el("div", "sx-tweet-head");
            var nameLink = document.createElement("a");
            nameLink.className = "sx-tweet-name";
            nameLink.href = profileHref(target.username);
            nameLink.textContent = "@" + (target.username || "");
            nameLink.addEventListener("click", function (e) { e.stopPropagation(); });
            var dot = el("span", "sx-tweet-handle", "·");
            var tSpan = el("span", "sx-tweet-time", label);
            head.append(nameLink, dot, tSpan);

            if (isOwn) {
                var del = document.createElement("button");
                del.className = "sx-tweet-del";
                del.type = "button";
                del.setAttribute("aria-label", "Delete post");
                del.innerHTML = '<i class="far fa-trash-can"></i>';
                del.addEventListener("click", async function (e) {
                    e.stopPropagation();
                    await deleteProfilePost(post);
                });
                head.appendChild(del);
            }

            var bodyEl = post.body ? el("p", "sx-tweet-body", post.body) : null;

            var media = null;
            if (post.image_url) {
                media = el("div", "sx-tweet-media");
                var mImg = document.createElement("img");
                mImg.src = post.image_url;
                mImg.alt = post.body ? post.body.slice(0, 80) : "Post photo";
                mImg.loading = "lazy";
                media.appendChild(mImg);
            } else if (post.media_archived) {
                media = el("div", "sx-tweet-media");
                var arch = el("div", "sx-post-archived");
                var archIcon = document.createElement("i");
                archIcon.className = "fa-regular fa-image";
                arch.append(archIcon, el("span", null, "Media archived"));
                media.appendChild(arch);
            }

            var actions = el("div", "sx-tweet-actions");
            var cBtn = pH("span", { class: "sx-stat", "data-pcomments": post.id }, pH("i", { class: "fa-regular fa-comment" }), pH("span", { text: String(post.commentCount) }));
            var lBtn = pH("button", { type: "button", class: "sx-stat", "data-plike": post.id, onclick: function (ev) { ev.stopPropagation(); toggleProfileLike(post); } });
            paintProfileLike(lBtn, post);
            actions.append(cBtn, lBtn);

            main.append(head);
            if (bodyEl) main.appendChild(bodyEl);
            if (media) main.appendChild(media);
            main.appendChild(actions);

            article.append(avatarLink, main);
            wrap.appendChild(article);
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

    function money(price) {
        if (price === null || price === undefined || price === "") return "";
        var number = Number(String(price).replace(/,/g, ""));
        if (!isFinite(number)) return String(price);
        return "\u20A6" + new Intl.NumberFormat("en-NG", { maximumFractionDigits: 2 }).format(number);
    }

    async function buildBrandProducts() {
        var brandRes = await db.from("brands").select("id,name").eq("owner_id", target.id).maybeSingle();
        var brand = brandRes.data;
        if (!brand) return note("No brand yet.");
        var prods = await db.from("products").select("id,name,price,image,brand_id").eq("brand_id", brand.id).order("created_at", { ascending: false }).limit(100);
        if (prods.error) throw prods.error;
        var rows = prods.data || [];
        if (!rows.length) return note(isOwn ? "No products yet — add them in Brand tools." : "No products yet.");
        var engineReady = loadScript("../js/engagement.js").catch(function(){ return null; });
        await engineReady;
        var engage = window.BeelinxEngage;
        var grid = el("div", "products-container");
        rows.forEach(function (product) {
            var card = el("div", "products");
            var imageLink = document.createElement("a");
            imageLink.href = "product-template.html?id=" + encodeURIComponent(product.id);
            var image = document.createElement("img");
            image.className = "clothe-image";
            image.src = product.image || "";
            image.alt = product.name || "Product image";
            image.loading = "lazy";
            imageLink.appendChild(image);
            var text = el("div", "clothe-text");
            var brandLink = document.createElement("a");
            brandLink.className = "brand-page-link";
            brandLink.href = "brandpage-template.html?brand=" + encodeURIComponent(brand.name);
            brandLink.appendChild(el("strong", null, brand.name));
            text.append(brandLink, document.createElement("br"), document.createTextNode(product.name || ""), el("p", "price", money(product.price)));
            card.append(imageLink, text);
            if (engage) card.appendChild(engage.createSaveButton(product.id));
            grid.appendChild(card);
        });
        return grid;
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

    
/* ---------- edit existing username ---------- */

function usernameDaysRemaining() {
    if (!target || !target.username_changed_at) return 0;

    var last = new Date(target.username_changed_at).getTime();

    if (isNaN(last)) return 0;

    var remaining = (14 * 24 * 60 * 60 * 1000) - (Date.now() - last);

    return remaining > 0 ? Math.ceil(remaining / (24 * 60 * 60 * 1000)) : 0;
}

if (ui.username) {
    ui.username.addEventListener("click", function () {
        if (!isOwn || !target || !target.username) return;

        ui.usernameEditForm.hidden = false;
        ui.usernameEditInput.value = target.username;
        ui.usernameEditMessage.textContent = "";

        var days = usernameDaysRemaining();
        var submit = ui.usernameEditForm.querySelector('button[type="submit"]');

        if (days > 0) {
            ui.usernameEditMessage.textContent =
                "You can change your username again in " + days + " day(s).";
            submit.disabled = true;
        } else {
            ui.usernameEditMessage.textContent =
                "You can change your username once every 14 days.";
            submit.disabled = false;
        }

        ui.usernameEditInput.focus();
    });
}

ui.username.addEventListener("keydown", function (event) {
    if ((event.key === "Enter" || event.key === " ") && isOwn && target && target.username) {
        event.preventDefault();
        ui.username.click();
    }
});

ui.usernameEditCancel.addEventListener("click", function () {
    ui.usernameEditForm.hidden = true;
    ui.usernameEditMessage.textContent = "";
});

ui.usernameEditForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!isOwn || !target) return;

    var submit = ui.usernameEditForm.querySelector('button[type="submit"]');
    var name = Auth.cleanUsername(ui.usernameEditInput.value);

    ui.usernameEditMessage.textContent = "";

    var days = usernameDaysRemaining();

    if (days > 0) {
        ui.usernameEditMessage.textContent =
            "You can change your username again in " + days + " day(s).";
        return;
    }

    var problem = Auth.validateUsername(name);

    if (problem) {
        ui.usernameEditMessage.textContent = problem;
        return;
    }

    if (name === target.username) {
        ui.usernameEditMessage.textContent = "That's already your username.";
        return;
    }

    submit.disabled = true;
    submit.textContent = "Saving...";

    var available = await Auth.usernameAvailable(name);

    if (available === false) {
        ui.usernameEditMessage.textContent =
            "That username is already taken. Please choose another.";
        submit.disabled = false;
        submit.textContent = "Save";
        return;
    }

    if (available === null) {
        ui.usernameEditMessage.textContent =
            "Couldn't check username availability. Please try again.";
        submit.disabled = false;
        submit.textContent = "Save";
        return;
    }

    var result = await Auth.setUsername(name);

    if (result.error) {
        ui.usernameEditMessage.textContent = result.error;
        submit.disabled = false;
        submit.textContent = "Save";
        return;
    }

    clearCache();

    // Return to the normal profile URL because the old username may
    // have been part of the current profile URL.
    window.location.href = "profile.html";
});


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


    /* ---------- avatar + bio edit (own profile only) ---------- */

    if (ui.avatar) ui.avatar.addEventListener("click", function(){ if (isOwn && ui.avatarInput) ui.avatarInput.click(); });

    function storagePathFromUrl(url){
        if (!url || typeof url !== "string") return null;
        var m = url.match(/\/storage\/v1\/object\/public\/avatars\/(.+)$/);
        return m ? m[1] : null;
    }

    if (ui.avatarInput) ui.avatarInput.addEventListener("change", async function(){
        var f = ui.avatarInput.files && ui.avatarInput.files[0]; if (!f || !isOwn) return;
        var oldUrl = target.avatar_url || null;
        var oldPath = storagePathFromUrl(oldUrl);
        ui.avatarInput.disabled = true;
        if (ui.bioMsg) { ui.bioMsg.textContent = "Uploading..."; ui.bioMsg.className = "profile-bio-msg"; }
        try {
            var comp = (B && B.compressImage) ? await B.compressImage(f) : null;
            if (!comp) throw new Error("Image compression unavailable.");
            var path = viewer.id + "/avatar-" + Date.now() + "." + comp.ext;
            var up = await db.storage.from("avatars").upload(path, comp.blob, { contentType: comp.blob.type, upsert: true, cacheControl: "31536000" });
            if (up.error) throw up.error;
            var pub = db.storage.from("avatars").getPublicUrl(path).data.publicUrl;
            var upd = await db.from("profiles").update({ avatar_url: pub }).eq("id", viewer.id).select("avatar_url").maybeSingle();
            if (upd.error) throw upd.error;
            target.avatar_url = pub;
            // bust cache so it shows immediately everywhere (profile + feed header)
            ui.avatar.replaceChildren();
            var img = document.createElement("img"); img.src = pub + (pub.indexOf("?")>=0?"&":"?") + "t=" + Date.now(); img.alt = "";
            ui.avatar.appendChild(img);
            if (ui.bioMsg) { ui.bioMsg.textContent = "Picture updated."; ui.bioMsg.className = "profile-bio-msg is-ok"; setTimeout(function(){ if(ui.bioMsg) ui.bioMsg.textContent=""; }, 1600); }
            // delete old file so storage doesn't fill up
            if (oldPath) db.storage.from("avatars").remove([oldPath]);
            // also update the hero header if this is the viewer's own profile
            try { localStorage.removeItem("beelinx_profile_cache"); } catch(e){}
        } catch (e) {
            if (ui.bioMsg) { ui.bioMsg.textContent = e.message || "Could not update picture."; ui.bioMsg.className = "profile-bio-msg is-error"; }
        }
        ui.avatarInput.value = "";
        ui.avatarInput.disabled = false;
    });

    if (ui.bioEditBtn) ui.bioEditBtn.addEventListener("click", function(){
        if (!isOwn) return;
        ui.bioRow.hidden = false;
        ui.bioEditBtn.hidden = true;
        ui.bio.hidden = true;
        ui.bioInput.focus();
    });
    if (ui.bioCancel) ui.bioCancel.addEventListener("click", function(){
        ui.bioRow.hidden = true;
        ui.bioEditBtn.hidden = false;
        ui.bio.hidden = !target.bio;
        ui.bioInput.value = target.bio || "";
        if (ui.bioMsg) { ui.bioMsg.textContent=""; ui.bioMsg.className="profile-bio-msg"; }
    });
    if (ui.bioSave) ui.bioSave.addEventListener("click", async function(){
        var val = ui.bioInput.value.trim();
        if (val.length > 300) { if(ui.bioMsg){ ui.bioMsg.textContent="About must be 300 characters or less."; ui.bioMsg.className="profile-bio-msg is-error"; } return; }
        ui.bioSave.disabled = true; ui.bioSave.textContent = "Saving..."; if(ui.bioMsg) ui.bioMsg.textContent="";
        var r = await db.from("profiles").update({ bio: val || null }).eq("id", viewer.id).select("bio").maybeSingle();
        ui.bioSave.disabled = false; ui.bioSave.textContent = "Save";
        if (r.error) { if(ui.bioMsg){ ui.bioMsg.textContent=r.error.message; ui.bioMsg.className="profile-bio-msg is-error"; } return; }
        target.bio = r.data ? r.data.bio : (val || null);
        ui.bio.textContent = target.bio || "";
        ui.bio.hidden = !target.bio;
        ui.bioRow.hidden = true;
        ui.bioEditBtn.hidden = false;
        ui.bioEditBtn.textContent = target.bio ? "Edit about" : "Add about";
        if(ui.bioMsg){ ui.bioMsg.textContent="Saved."; ui.bioMsg.className="profile-bio-msg is-ok"; setTimeout(function(){ if(ui.bioMsg) ui.bioMsg.textContent=""; }, 1600); }
    });

    /* ---------- tab + stat clicks ---------- */

    ui.kicker.addEventListener("click", function () {
        if (!isOwn) return;
        var pop = buildRolePopContent();
        var isOpen = !pop.hidden;
        pop.hidden = isOpen;
        ui.kicker.setAttribute("aria-expanded", String(!isOpen));
    });

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
    function canSwitchRole(lastChanged) {
        if (!lastChanged) return true;
        var last = new Date(lastChanged).getTime();
        if (isNaN(last)) return true;
        return (Date.now() - last) >= 30*24*60*60*1000;
    }

    function formatRoleChangeNote(lastChanged) {
        if (!lastChanged || canSwitchRole(lastChanged)) return "You can switch between Shopper and Model. Next switch available in 30 days.";
        var last = new Date(lastChanged).getTime();
        var next = last + 30*24*60*60*1000;
        var days = Math.ceil((next - Date.now()) / (24*60*60*1000));
        return "Next switch available in " + days + " day(s). Brand requests are reviewed separately.";
    }

    function ensureRolePop() {
        if (roleChangePop) return roleChangePop;
        roleChangePop = el("div", "profile-role-pop");
        roleChangePop.hidden = true;
        roleChangePop.setAttribute("role", "menu");
        (ui.kicker.parentElement || document.body).appendChild(roleChangePop);
        document.addEventListener("click", function (e) {
            if (!roleChangePop.hidden && !roleChangePop.contains(e.target) && e.target !== ui.kicker) roleChangePop.hidden = true;
        });
        return roleChangePop;
    }

    function buildRolePopContent() {
        var pop = ensureRolePop();
        pop.replaceChildren();
        var allowed = canSwitchRole(target.role_changed_at);
        var toShopper = el("button", null, "Switch to Shopper");
        toShopper.type = "button";
        toShopper.disabled = !allowed || target.role === "shopper";
        toShopper.addEventListener("click", function(){ if(allowed) doRoleSwitch("shopper"); });
        var toModel = el("button", null, "Switch to Model");
        toModel.type = "button";
        toModel.disabled = !allowed || target.role === "model";
        toModel.addEventListener("click", function(){ if(allowed) doRoleSwitch("model"); });
        var brandBtn = el("button", null, target.role === "brand" ? "Brand account (active)" : "Request brand account");
        brandBtn.type = "button";
        brandBtn.disabled = target.role === "brand";
        brandBtn.addEventListener("click", function(){
            roleChangePop.hidden = true;
            if (target.role === "brand") return;
            window.location.href = "brand-manage.html";
        });
        pop.append(toShopper, toModel, brandBtn, el("p", "role-note", formatRoleChangeNote(target.role_changed_at)));
        return pop;
    }

    async function doRoleSwitch(newRole) {
        if (!isOwn || target.role === newRole || target.role === "brand") return;
        if (!canSwitchRole(target.role_changed_at)) return;
        var pop = ensureRolePop();
        pop.hidden = true;
        var r = await db.from("profiles").update({ role: newRole, role_changed_at: new Date().toISOString() }).eq("id", target.id).select("role,role_changed_at").maybeSingle();
        if (r.error) { window.alert(r.error.message); return; }
        target.role = r.data.role;
        target.role_changed_at = r.data.role_changed_at;
        paintHeader();
        // refresh tabs visibility
        if (ui.productsTab) ui.productsTab.hidden = !(target.role === "brand");
    }

    function paintHeader(counts) {
        var name = target.username;

        document.title = (name ? "@" + name : "Profile") + " | Beelinx";

        ui.avatar.textContent = (name || "?").charAt(0).toUpperCase();
        ui.title.textContent = isOwn ? "Your profile" : "Profile";
        ui.username.textContent = name ? "@" + name : "No username yet";
        ui.username.setAttribute("aria-disabled", String(!isOwn || !name));
        ui.username.tabIndex = isOwn && name ? 0 : -1;
        ui.username.setAttribute(
        "aria-label",
        isOwn ? "Click to change your username" : "Username"
        );

        var ghostText = (name || "BEELINX").toUpperCase();
        ui.ghost.textContent = ghostText;

        var year = new Date(target.created_at).getFullYear();
        var parts = [TYPE_LABELS[target.role] || "Member"];
        if (year) parts.push("since " + year);
        ui.kicker.textContent = parts.join(" \u00b7 ");
        ui.kicker.hidden = false;
        ui.kicker.disabled = !isOwn || target.role === "brand";
        ui.kicker.setAttribute("aria-expanded", "false");
        ui.hero.dataset.role = target.role || "";

        // avatar
        ui.avatar.replaceChildren();
        if (target.avatar_url) {
            var avImg = document.createElement("img");
            avImg.src = target.avatar_url; avImg.alt = "";
            ui.avatar.appendChild(avImg);
        } else {
            ui.avatar.textContent = (target.username || "?").charAt(0).toUpperCase();
        }
        ui.avatar.classList.toggle("is-editable", !!isOwn);
        ui.avatar.disabled = !isOwn;

        ui.bio.textContent = target.bio || "";
        ui.bio.hidden = !target.bio;
        if (ui.bioEditBtn) {
            ui.bioEditBtn.hidden = !isOwn;
            ui.bioEditBtn.textContent = target.bio ? "Edit about" : "Add about";
        }
        if (ui.bioRow) { ui.bioRow.hidden = true; }
        if (ui.bioInput) ui.bioInput.value = target.bio || "";
        if (ui.bioMsg) { ui.bioMsg.textContent = ""; ui.bioMsg.className = "profile-bio-msg"; }

        ui.login.hidden = true;
        ui.logout.hidden = !isOwn;
        ui.follow.hidden = isOwn;
        ui.listsTab.hidden = !isOwn;
        if (ui.productsTab) ui.productsTab.hidden = !(target && target.role === "brand");
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
            .select("id, username, role, display_name, bio, avatar_url, created_at, username_changed_at")
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