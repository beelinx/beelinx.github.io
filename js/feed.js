/* =========================================================
   BEELINX FEED (feed.html), timeline layout
   - write a post: text only, a photo only, or both
   - "For you" (everyone) and "Following" tabs
   - like, comment, delete your own posts and comments
========================================================= */

(function () {
    "use strict";

    var B = window.Beelinx;

    var listEl = document.getElementById("sx-feed");
    var composeEl = document.getElementById("sx-compose");
    var emptyEl = document.getElementById("sx-empty");
    var moreButton = document.getElementById("sx-more");
    var errorEl = document.getElementById("sx-error");
    var sheetEl = document.getElementById("sx-sheet");
    var tabs = document.querySelectorAll(".sx-tab");

    if (!B || !listEl) return;

    var db = B.db;
    var h = B.h;

    var PAGE = 20;
    var BUCKET = "post-images";
    var MAX_TEXT = 500;

    // short readable reason, e.g. "42703: column posts.image_path does not exist"
    function why(error) {
        if (!error) return "";
        return (error.code ? error.code + ": " : "") + (error.message || String(error));
    }

    var POST_SELECT =
        "id,user_id,body,image_url,image_path,media_archived,created_at," +
        "profiles!posts_user_id_fkey(username,display_name,avatar_url)," +
        "post_likes(count),post_comments(count)";

    var COMMENT_SELECT =
        "id,user_id,body,created_at,profiles(username,display_name,avatar_url)";

    var user = null;
    var myProfile = null;
    var tab = "all";
    var followingIds = [];
    var posts = new Map();
    var loadedCount = 0;
    var busy = false;
    var token = 0;              // changes when the tab changes, so late answers are ignored


    /* ---------- data shape ---------- */

    function countOf(embedded) {
        return (embedded && embedded[0] && embedded[0].count) || 0;
    }

    function normalize(row) {
        return {
            id: row.id,
            user_id: row.user_id,
            body: row.body || "",
            image_url: row.image_url,
            image_path: row.image_path,
            media_archived: !!row.media_archived,
            created_at: row.created_at,
            author: row.profiles || {},
            likeCount: countOf(row.post_likes),
            commentCount: countOf(row.post_comments),
            liked: false
        };
    }

    function showError(text) {
        errorEl.textContent = text || "";
        errorEl.hidden = !text;
    }

    function updateEmpty() {

        emptyEl.textContent = tab === "following"
            ? "Nothing here yet. Follow people to see their posts."
            : "No posts yet. Be the first to share something.";

        emptyEl.hidden = posts.size > 0;

    }

    // clicks on links and buttons inside a post should not also open the post
    function stop(event) { event.stopPropagation(); }


    /* ---------- likes and comment counts (kept in step everywhere) ---------- */

    function paintLike(button, post) {

        button.classList.toggle("is-liked", post.liked);
        button.setAttribute("aria-pressed", String(post.liked));

        button.replaceChildren(
            h("i", { class: (post.liked ? "fa-solid" : "fa-regular") + " fa-heart" }),
            h("span", { text: String(post.likeCount) })
        );

    }

    function repaintLikes(post) {
        document.querySelectorAll('[data-like="' + post.id + '"]').forEach(function (button) {
            paintLike(button, post);
        });
    }

    function repaintComments(post) {
        document.querySelectorAll('[data-comments="' + post.id + '"] span').forEach(function (span) {
            span.textContent = String(post.commentCount);
        });
    }

    function likeButton(post) {

        var button = h("button", {
            type: "button",
            class: "sx-stat",
            "data-like": post.id,
            "aria-label": "Like",
            onclick: function (event) {
                event.stopPropagation();
                toggleLike(post);
            }
        });

        paintLike(button, post);

        return button;

    }

    // a button when it opens the post, a plain label inside the open post
    function commentStat(post, onOpen) {

        var inner = [
            h("i", { class: "fa-regular fa-comment" }),
            h("span", { text: String(post.commentCount) })
        ];

        if (!onOpen) {
            return h("span", { class: "sx-stat", "data-comments": post.id }, inner[0], inner[1]);
        }

        return h("button", {
            type: "button",
            class: "sx-stat",
            "data-comments": post.id,
            "aria-label": "Comments",
            onclick: function (event) {
                event.stopPropagation();
                onOpen();
            }
        }, inner[0], inner[1]);

    }

    async function toggleLike(post) {

        if (!user) { B.goLogin(); return; }

        var was = post.liked;

        post.liked = !was;
        post.likeCount += was ? -1 : 1;
        repaintLikes(post);

        var result = was
            ? await db.from("post_likes").delete()
                .eq("user_id", user.id).eq("post_id", post.id)
            : await db.from("post_likes")
                .insert({ user_id: user.id, post_id: post.id });

        // 23505 = "already liked", which is fine
        if (result.error && result.error.code !== "23505") {      // put it back
            post.liked = was;
            post.likeCount += was ? 1 : -1;
            repaintLikes(post);
        }

    }


    /* ---------- deleting ---------- */

    async function deletePost(post) {

        if (!window.confirm("Delete this post?")) return;

        var result = await db.from("posts").delete().eq("id", post.id);

        if (result.error) {
            window.alert("Could not delete the post. Please try again.");
            return;
        }

        if (post.image_path) {
            db.storage.from(BUCKET).remove([post.image_path]);     // free the space too
        }

        posts.delete(post.id);

        var row = listEl.querySelector('[data-post="' + post.id + '"]');
        if (row) row.remove();

        closeSheet();
        updateEmpty();

    }


    /* ---------- one post in the timeline ---------- */

    function mediaFor(post) {

        if (post.image_url) {
            return h("div", { class: "sx-tweet-media" },
                h("img", {
                    src: post.image_url,
                    alt: post.body ? post.body.slice(0, 80) : "Post photo",
                    loading: "lazy"
                }));
        }

        if (post.media_archived) {
            return h("div", { class: "sx-tweet-media" },
                h("div", { class: "sx-post-archived" },
                    h("i", { class: "fa-regular fa-image" }),
                    h("span", { text: "Media archived" })));
        }

        return null;

    }

    function buildPost(post) {

        var author = post.author;
        var mine = user && post.user_id === user.id;

        var head = h("div", { class: "sx-tweet-head" },
            h("a", {
                class: "sx-tweet-name",
                href: B.profileUrl(author),
                text: B.displayName(author),
                onclick: stop
            }),
            author.display_name && author.username
                ? h("span", { class: "sx-tweet-handle", text: "@" + author.username })
                : null,
            h("span", { class: "sx-tweet-time", text: "\u00b7 " + B.timeAgo(post.created_at) }),
            mine ? h("button", {
                type: "button",
                class: "sx-tweet-del",
                "aria-label": "Delete post",
                title: "Delete post",
                onclick: function (event) { event.stopPropagation(); deletePost(post); }
            }, h("i", { class: "far fa-trash-can" })) : null
        );

        var main = h("div", { class: "sx-tweet-main" },
            head,
            post.body ? h("p", { class: "sx-tweet-body", text: post.body }) : null,
            mediaFor(post),
            h("div", { class: "sx-tweet-actions" },
                commentStat(post, function () { openPost(post); }),
                likeButton(post))
        );

        var article = h("article", {
            class: "sx-tweet",
            "data-post": post.id,
            tabindex: "0"
        },
            h("a", { class: "sx-tweet-avatar", href: B.profileUrl(author), onclick: stop, tabindex: "-1" },
                B.avatar(author)),
            main
        );

        article.addEventListener("click", function () { openPost(post); });

        article.addEventListener("keydown", function (event) {
            if (event.key === "Enter" && event.target === article) openPost(post);
        });

        return article;

    }


    /* ---------- the pop-up sheet (a post with its comments) ---------- */

    function lockPage(on) {
        document.documentElement.classList.toggle("sx-lock", on);
    }

    function showSheet(panel) {
        sheetEl.replaceChildren(panel);
        sheetEl.hidden = false;
        lockPage(true);
    }

    function closeSheet() {
        sheetEl.hidden = true;
        sheetEl.replaceChildren();
        lockPage(false);
    }

    sheetEl.addEventListener("click", function (event) {
        if (event.target === sheetEl) closeSheet();
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !sheetEl.hidden) closeSheet();
    });

    function closeButton() {
        return h("button", {
            type: "button",
            class: "sx-sheet-close",
            "aria-label": "Close",
            onclick: closeSheet
        }, h("i", { class: "fas fa-xmark" }));
    }

    function commentRow(post, comment) {

        var profile = comment.profiles || {};

        var body = h("div", { class: "sx-comment-body" },
            h("p", { class: "sx-comment-head" },
                h("a", { href: B.profileUrl(profile), text: B.displayName(profile) }),
                h("span", { text: B.timeAgo(comment.created_at) })),
            h("p", { class: "sx-comment-text", text: comment.body })
        );

        var li = h("li", { class: "sx-comment" }, B.avatar(profile, "is-md"), body);

        if (user && comment.user_id === user.id) {

            body.appendChild(h("button", {
                type: "button",
                class: "sx-link",
                text: "Delete",
                onclick: async function () {

                    var result = await db.from("post_comments").delete().eq("id", comment.id);

                    if (result.error) return;

                    li.remove();
                    post.commentCount = Math.max(0, post.commentCount - 1);
                    repaintComments(post);

                }
            }));

        }

        return li;

    }

    function openPost(post) {

        var author = post.author;
        var mine = user && post.user_id === user.id;

        var status = h("p", { class: "sx-note", text: "Loading comments..." });
        var list = h("ul", { class: "sx-comments" });

        var input = h("input", {
            type: "text",
            placeholder: user ? "Post your reply" : "Log in to reply",
            maxlength: "500",
            autocomplete: "off",
            "aria-label": "Your reply"
        });

        var send = h("button", { type: "submit", class: "sx-pill sx-pill-sm", text: "Reply" });

        var form = h("form", {
            class: "sx-comment-form",
            onsubmit: async function (event) {

                event.preventDefault();

                if (!user) { B.goLogin(); return; }

                var text = input.value.trim();

                if (!text) return;

                send.disabled = true;

                var result = await db.from("post_comments")
                    .insert({ post_id: post.id, user_id: user.id, body: text })
                    .select(COMMENT_SELECT)
                    .single();

                send.disabled = false;

                if (result.error) {
                    status.hidden = false;
                    status.textContent = "Could not post your reply.";
                    return;
                }

                input.value = "";
                status.hidden = true;
                list.appendChild(commentRow(post, result.data));
                post.commentCount += 1;
                repaintComments(post);

            }
        }, input, send);

        var media = post.image_url
            ? h("div", { class: "sx-sheet-media" }, h("img", { src: post.image_url, alt: "" }))
            : post.media_archived
                ? h("div", { class: "sx-sheet-media" },
                    h("div", { class: "sx-post-archived" },
                        h("i", { class: "fa-regular fa-image" }),
                        h("span", { text: "Media archived" })))
                : null;

        var panel = h("div", { class: "sx-sheet-panel is-narrow" },
            closeButton(),
            h("h3", { class: "sx-sheet-heading", text: "Post" }),
            h("a", { class: "sx-sheet-author", href: B.profileUrl(author) },
                B.avatar(author, "is-md"),
                h("span", {},
                    h("strong", { text: B.displayName(author) }),
                    author.display_name && author.username
                        ? h("small", { text: "@" + author.username })
                        : null)),
            post.body ? h("p", { class: "sx-sheet-body", text: post.body }) : null,
            media,
            h("p", { class: "sx-sheet-time", text: new Date(post.created_at).toLocaleString() }),
            h("div", { class: "sx-sheet-actions" },
                likeButton(post),
                commentStat(post),
                mine ? h("button", {
                    type: "button",
                    class: "sx-link sx-danger",
                    text: "Delete post",
                    onclick: function () { deletePost(post); }
                }) : null),
            form,
            status,
            list
        );

        showSheet(panel);

        db.from("post_comments")
            .select(COMMENT_SELECT)
            .eq("post_id", post.id)
            .order("created_at", { ascending: true })
            .limit(200)
            .then(function (result) {

                if (result.error) {
                    status.textContent = "Could not load comments.";
                    return;
                }

                var rows = result.data || [];

                status.hidden = rows.length > 0;
                if (!rows.length) status.textContent = "No replies yet.";

                rows.forEach(function (row) { list.appendChild(commentRow(post, row)); });

            });

    }


    /* ---------- write a post ---------- */

    function renderCompose() {

        composeEl.replaceChildren();

        if (!user) {

            composeEl.appendChild(h("div", { class: "sx-compose-guest" },
                h("p", { text: "Log in to post, like and reply." }),
                h("a", { class: "sx-pill sx-pill-sm", href: "login.html?next=feed.html", text: "Log in" })));

            return;

        }

        var chosen = null;          // the compressed photo, once it is ready
        var posting = false;

        var text = h("textarea", {
            class: "sx-compose-text",
            placeholder: "What's happening?",
            maxlength: String(MAX_TEXT),
            rows: "1",
            "aria-label": "Post text"
        });

        var counter = h("span", { class: "sx-counter" });
        var preview = h("div", { class: "sx-preview", hidden: true });
        var problem = h("p", { class: "sx-note sx-problem", hidden: true });
        var file = h("input", { type: "file", accept: "image/*", hidden: true });

        var photoButton = h("button", {
            type: "button",
            class: "sx-compose-icon",
            "aria-label": "Add a photo",
            title: "Add a photo",
            onclick: function () { file.click(); }
        }, h("i", { class: "far fa-image" }));

        var submit = h("button", { type: "submit", class: "sx-pill sx-pill-sm", text: "Post" });

        function fail(message) {
            problem.textContent = message || "";
            problem.hidden = !message;
        }

        // the Post button works with text, a photo, or both
        function refresh() {

            var length = text.value.length;

            counter.textContent = length > MAX_TEXT - 100 ? String(MAX_TEXT - length) : "";

            submit.disabled = posting || (!text.value.trim() && !chosen);

        }

        function autosize() {
            text.style.height = "auto";
            text.style.height = Math.min(text.scrollHeight, 260) + "px";
        }

        function reset() {
            text.value = "";
            chosen = null;
            file.value = "";
            preview.hidden = true;
            preview.replaceChildren();
            fail("");
            autosize();
            refresh();
        }

        text.addEventListener("input", function () { autosize(); refresh(); });

        file.addEventListener("change", async function () {

            var original = file.files && file.files[0];

            if (!original) return;

            fail("");
            photoButton.disabled = true;

            try {

                chosen = await B.compressImage(original);

                var url = URL.createObjectURL(chosen.blob);

                preview.hidden = false;
                preview.replaceChildren(
                    h("img", { src: url, alt: "Preview" }),
                    h("button", {
                        type: "button",
                        class: "sx-preview-remove",
                        "aria-label": "Remove photo",
                        onclick: function () {
                            chosen = null;
                            file.value = "";
                            preview.hidden = true;
                            preview.replaceChildren();
                            refresh();
                        }
                    }, h("i", { class: "fas fa-xmark" }))
                );

            } catch (error) {

                chosen = null;
                file.value = "";
                fail(error.message);

            }

            photoButton.disabled = false;
            refresh();

        });

        var form = h("form", {
            class: "sx-compose-form",
            onsubmit: async function (event) {

                event.preventDefault();

                var body = text.value.trim();

                if (!body && !chosen) return;

                posting = true;
                fail("");
                refresh();
                submit.textContent = "Posting...";

                var path = null;

                try {

                    var imageUrl = null;

                    if (chosen) {

                        path = user.id + "/" + Date.now() + "-" +
                            Math.random().toString(36).slice(2, 8) + "." + chosen.ext;

                        var upload = await db.storage.from(BUCKET).upload(path, chosen.blob, {
                            contentType: chosen.blob.type,
                            cacheControl: "31536000",
                            upsert: false
                        });

                        if (upload.error) throw upload.error;

                        imageUrl = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

                    }

                    var result = await db.from("posts")
                        .insert({
                            user_id: user.id,
                            body: body,
                            image_url: imageUrl,
                            image_path: path
                        })
                        .select(POST_SELECT)
                        .single();

                    if (result.error) throw result.error;

                    var post = normalize(result.data);

                    posts.set(post.id, post);
                    listEl.prepend(buildPost(post));

                    reset();
                    updateEmpty();

                } catch (error) {

                    if (path) db.storage.from(BUCKET).remove([path]);   // do not leave a stray file

                    // the real reason (open the browser console with F12)
                    console.warn("Beelinx feed: could not post. " + why(error), error);

                    fail("Could not post. Please try again. (" + why(error) + ")");

                }

                posting = false;
                submit.textContent = "Post";
                refresh();

            }
        },
            text,
            preview,
            problem,
            file,
            h("div", { class: "sx-compose-bar" },
                photoButton,
                h("span", { class: "sx-compose-spacer" }),
                counter,
                submit)
        );

        composeEl.appendChild(h("div", { class: "sx-compose-row" },
            B.avatar(myProfile || { username: "?" }),
            form));

        refresh();

    }


    /* ---------- loading the timeline ---------- */

    async function loadMore() {

        if (busy) return;

        busy = true;

        var mine = token;

        moreButton.disabled = true;
        showError("");

        var query = db.from("posts")
            .select(POST_SELECT)
            .order("created_at", { ascending: false })
            .range(loadedCount, loadedCount + PAGE - 1);

        if (tab === "following") query = query.in("user_id", followingIds);

        var result = await query;

        if (mine !== token) return;         // the tab changed while we waited

        if (result.error) {
            console.warn("Beelinx feed: could not load. " + why(result.error), result.error);
            busy = false;
            moreButton.disabled = false;
            showError("The feed could not be loaded. Please try again. (" + why(result.error) + ")");
            return;
        }

        var rows = (result.data || []).map(normalize);

        if (user && rows.length) {

            var likedResult = await db.from("post_likes")
                .select("post_id")
                .eq("user_id", user.id)
                .in("post_id", rows.map(function (post) { return post.id; }));

            if (mine !== token) return;

            var likedIds = new Set((likedResult.data || []).map(function (r) { return r.post_id; }));

            rows.forEach(function (post) { post.liked = likedIds.has(post.id); });

        }

        rows.forEach(function (post) {
            if (posts.has(post.id)) return;
            posts.set(post.id, post);
            listEl.appendChild(buildPost(post));
        });

        loadedCount += rows.length;

        busy = false;
        moreButton.disabled = false;
        moreButton.hidden = rows.length < PAGE;

        updateEmpty();

    }

    async function setTab(name) {

        if (name === "following" && !user) { B.goLogin(); return; }

        tab = name;

        tabs.forEach(function (button) {
            var on = button.dataset.tab === name;
            button.classList.toggle("active", on);
            button.setAttribute("aria-selected", String(on));
        });

        token += 1;                         // forget anything still loading
        busy = false;
        posts.clear();
        loadedCount = 0;
        listEl.replaceChildren();
        moreButton.hidden = true;
        emptyEl.hidden = true;
        showError("");

        if (name === "following") {

            var mine = token;

            var follows = await db.from("follows")
                .select("following_id")
                .eq("follower_id", user.id);

            if (mine !== token) return;

            // people I follow, plus my own posts
            followingIds = (follows.data || [])
                .map(function (r) { return r.following_id; })
                .concat(user.id);

        }

        loadMore();

    }

    tabs.forEach(function (button) {
        button.addEventListener("click", function () {
            if (button.dataset.tab !== tab) setTab(button.dataset.tab);
        });
    });

    moreButton.addEventListener("click", loadMore);


    /* ---------- start ---------- */

    (async function start() {

        user = await B.me();

        if (user) {

            var mine = await db.from("profiles")
                .select("id,username,display_name,avatar_url")
                .eq("id", user.id)
                .maybeSingle();

            myProfile = mine.data || null;

        }

        renderCompose();

        setTab("all");

    })();

})();