/* =========================================================
   BEELINX FEED (feed.html)
   Posts in columns, like, comment, post a photo + text,
   delete your own posts and comments.
========================================================= */

(function () {
    "use strict";

    var B = window.Beelinx;

    var feedEl = document.getElementById("sx-feed");
    var emptyEl = document.getElementById("sx-empty");
    var moreButton = document.getElementById("sx-more");
    var errorEl = document.getElementById("sx-error");
    var newButton = document.getElementById("sx-new");
    var composeEl = document.getElementById("sx-compose");
    var sheetEl = document.getElementById("sx-sheet");

    if (!B || !feedEl) return;

    var db = B.db;
    var h = B.h;

    var PAGE = 24;
    var BUCKET = "post-images";

    var POST_SELECT =
        "id,user_id,body,image_url,image_path,media_archived,created_at," +
        "profiles!posts_user_id_fkey(username,display_name,avatar_url)," +
        "post_likes(count),post_comments(count)";

    var COMMENT_SELECT =
        "id,user_id,body,created_at,profiles!post_comments_user_id_fkey(username,display_name,avatar_url)";

    var user = null;
    var posts = new Map();
    var loadedCount = 0;
    var busy = false;


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
        emptyEl.hidden = posts.size > 0;
    }


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

    function commentStat(post) {
        return h("button", {
            type: "button",
            class: "sx-stat",
            "data-comments": post.id,
            "aria-label": "Open comments",
            onclick: function (event) { event.stopPropagation(); openPost(post); }
        },
            h("i", { class: "fa-regular fa-comment" }),
            h("span", { text: String(post.commentCount) })
        );
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


    /* ---------- one tile in the feed (same timeline as profile) ---------- */

    function buildTile(post) {

        var author = post.author;

        var article = h("article", { class: "sx-tweet", "data-post": post.id });
        article.style.cursor = "pointer";
        article.addEventListener("click", function () { openPost(post); });

        var avatarLink = h("a", { class: "sx-tweet-avatar", href: B.profileUrl(author) }, B.avatar(author, "is-md"));
        avatarLink.addEventListener("click", function (e) { e.stopPropagation(); });

        var main = h("div", { class: "sx-tweet-main" });

        var head = h("div", { class: "sx-tweet-head" },
            h("a", { class: "sx-tweet-name", href: B.profileUrl(author), text: author.username ? "@" + author.username : B.displayName(author),
                onclick: function (e) { e.stopPropagation(); } }),
            h("span", { class: "sx-tweet-handle", text: "·" }),
            h("span", { class: "sx-tweet-time", text: B.timeAgo(post.created_at) })
        );

        if (user && post.user_id === user.id) {
            head.appendChild(h("button", {
                type: "button",
                class: "sx-tweet-del",
                "aria-label": "Delete post",
                onclick: function (e) { e.stopPropagation(); deletePost(post); }
            }, h("i", { class: "far fa-trash-can" })));
        }

        var body = post.body ? h("p", { class: "sx-tweet-body", text: post.body }) : null;

        var media = null;
        if (post.image_url) {
            media = h("div", { class: "sx-tweet-media" },
                h("img", { src: post.image_url, alt: post.body ? post.body.slice(0, 80) : "Post photo", loading: "lazy" }));
        } else if (post.media_archived) {
            media = h("div", { class: "sx-tweet-media" },
                h("div", { class: "sx-post-archived" }, h("i", { class: "fa-regular fa-image" }), h("span", { text: "Media archived" })));
        }

        var actions = h("div", { class: "sx-tweet-actions" }, likeButton(post), commentStat(post));

        main.appendChild(head);
        if (body) main.appendChild(body);
        if (media) main.appendChild(media);
        main.appendChild(actions);

        article.append(avatarLink, main);
        return article;

    }


    /* ---------- the pop-up sheet ---------- */

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


    /* ---------- a post, opened ---------- */

    function commentRow(post, comment) {

        var profile = comment.profiles || {};

        var body = h("div", { class: "sx-comment-body" },
            h("p", { class: "sx-comment-head" },
                h("a", {
                    href: B.profileUrl(profile),
                    text: profile.username ? "@" + profile.username : B.displayName(profile)
                }),
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

        var tile = feedEl.querySelector('[data-post="' + post.id + '"]');
        if (tile) tile.remove();

        closeSheet();
        updateEmpty();

    }

    function openPost(post) {

        var author = post.author;
        var hasMedia = !!post.image_url || post.media_archived;

        var media = null;

        if (post.image_url) {
            media = h("div", { class: "sx-sheet-media" },
                h("img", { src: post.image_url, alt: "" }));
        } else if (post.media_archived) {
            media = h("div", { class: "sx-sheet-media" },
                h("div", { class: "sx-post-archived" },
                    h("i", { class: "fa-regular fa-image" }),
                    h("span", { text: "Media archived" })));
        }

        var status = h("p", { class: "sx-note", text: "Loading comments..." });
        var list = h("ul", { class: "sx-comments" });

        var input = h("input", {
            type: "text",
            placeholder: user ? "Add a comment" : "Log in to comment",
            maxlength: "500",
            autocomplete: "off",
            "aria-label": "Add a comment"
        });

        var send = h("button", { type: "submit", class: "sx-pill sx-pill-sm", text: "Post" });

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
                    status.textContent = "Could not post your comment.";
                    return;
                }

                input.value = "";
                status.hidden = true;
                list.appendChild(commentRow(post, result.data));
                post.commentCount += 1;
                repaintComments(post);

            }
        }, input, send);

        var isMine = user && post.user_id === user.id;

        var actions = h("div", { class: "sx-sheet-actions" },
            likeButton(post),
            commentStat(post),
            isMine ? h("button", {
                type: "button",
                class: "sx-link sx-danger",
                text: "Delete post",
                onclick: function () { deletePost(post); }
            }) : null
        );

        var info = h("div", { class: "sx-sheet-info" },
            h("div", { class: "sx-sheet-scroll" },
                h("a", { class: "sx-sheet-author", href: B.profileUrl(author) },
                    B.avatar(author, "is-md"),
                    h("span", {},
                        h("strong", { text: B.displayName(author) }),
                        h("small", { text: B.timeAgo(post.created_at) }))),
                post.body ? h("p", { class: "sx-sheet-body", text: post.body }) : null,
                actions,
                h("h3", { class: "sx-sheet-heading", text: "Comments" }),
                status,
                list
            ),
            form
        );

        var panel = h("div", { class: "sx-sheet-panel" + (hasMedia ? "" : " is-narrow") },
            closeButton(), media, info);

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
                if (!rows.length) status.textContent = "No comments yet.";

                rows.forEach(function (row) { list.appendChild(commentRow(post, row)); });

            });

    }


    /* ---------- new post ---------- */

    function openComposer() {

        if (!user) { B.goLogin(); return; }

        var chosen = null;      // the compressed photo, once ready

        var text = h("textarea", {
            class: "sx-textarea",
            placeholder: "What's on your mind?",
            maxlength: "500",
            rows: "4",
            "aria-label": "Post text"
        });

        var counter = h("span", { class: "sx-counter", text: "0 / 500" });

        var preview = h("div", { class: "sx-preview", hidden: true });
        var problem = h("p", { class: "sx-note sx-problem", hidden: true });

        var file = h("input", { type: "file", accept: "image/*", hidden: true });

        var photoButton = h("button", {
            type: "button",
            class: "sx-pill sx-pill-ghost sx-pill-sm",
            onclick: function () { file.click(); }
        }, h("i", { class: "fa-regular fa-image" }), "Add photo");

        var submit = h("button", { type: "submit", class: "sx-pill", text: "Post" });

        function fail(message) {
            problem.textContent = message || "";
            problem.hidden = !message;
        }

        text.addEventListener("input", function () {
            counter.textContent = text.value.length + " / 500";
        });

        file.addEventListener("change", async function () {

            var original = file.files && file.files[0];

            if (!original) return;

            fail("");
            photoButton.disabled = true;
            photoButton.lastChild.textContent = "Preparing...";

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
                        }
                    }, h("i", { class: "fas fa-xmark" }))
                );

            } catch (error) {

                chosen = null;
                file.value = "";
                fail(error.message);

            }

            photoButton.disabled = false;
            photoButton.lastChild.textContent = "Add photo";

        });

        var form = h("form", {
            class: "sx-composer",
            onsubmit: async function (event) {

                event.preventDefault();

                var body = text.value.trim();

                if (!body && !chosen) {
                    fail("Write something or add a photo.");
                    return;
                }

                fail("");
                submit.disabled = true;
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
                    feedEl.prepend(buildTile(post));

                    closeSheet();
                    updateEmpty();

                } catch (error) {

                    if (path) db.storage.from(BUCKET).remove([path]);   // do not leave a stray file

                    fail("Could not post. Please try again.");
                    submit.disabled = false;
                    submit.textContent = "Post";

                }

            }
        },
            h("h3", { class: "sx-sheet-heading", text: "New post" }),
            text,
            h("div", { class: "sx-composer-row" }, photoButton, counter),
            file,
            preview,
            problem,
            h("div", { class: "sx-composer-actions" }, submit)
        );

        showSheet(h("div", { class: "sx-sheet-panel is-narrow" }, closeButton(), form));

        text.focus();

    }


    /* ---------- loading the feed ---------- */

    async function loadMore() {

        if (busy) return;

        busy = true;
        moreButton.disabled = true;
        showError("");

        var result = await db.from("posts")
            .select(POST_SELECT)
            .order("created_at", { ascending: false })
            .range(loadedCount, loadedCount + PAGE - 1);

        busy = false;
        moreButton.disabled = false;

        if (result.error) {
            showError(result.error.message || "The feed could not be loaded. Please try again.");
            console.warn("Beelinx feed error:", result.error);
            return;
        }

        var rows = (result.data || []).map(normalize);

        if (user && rows.length) {

            var likedResult = await db.from("post_likes")
                .select("post_id")
                .eq("user_id", user.id)
                .in("post_id", rows.map(function (post) { return post.id; }));

            var likedIds = new Set((likedResult.data || []).map(function (r) { return r.post_id; }));

            rows.forEach(function (post) { post.liked = likedIds.has(post.id); });

        }

        rows.forEach(function (post) {
            if (posts.has(post.id)) return;
            posts.set(post.id, post);
            feedEl.appendChild(buildTile(post));
        });

        loadedCount += rows.length;

        moreButton.hidden = rows.length < PAGE;

        updateEmpty();

    }

    function renderComposer() {
        if (!composeEl) return;
        if (!user) {
            composeEl.replaceChildren(
                h("div", { class: "sx-compose-guest" },
                    h("p", { text: "Log in to share a post" }),
                    h("a", { class: "sx-pill sx-pill-sm", href: B.goLoginHref ? B.goLoginHref() : "login.html?next=feed.html", text: "Log in" }))
            );
            return;
        }
        var row = h("div", { class: "sx-compose-row" },
            B.avatar({ username: user.email || "You", avatar_url: null }, "is-md"),
            h("div", { class: "sx-compose-form" },
                h("button", { type: "button", class: "sx-compose-text", text: "What's on your mind?", onclick: openComposer,
                    style: "text-align:left;color:var(--sx-grey);cursor:pointer;" }),
                h("div", { class: "sx-compose-bar" },
                    h("button", { type: "button", class: "sx-compose-icon", "aria-label": "Add photo", onclick: openComposer }, h("i", { class: "fa-regular fa-image" })),
                    h("span", { class: "sx-compose-spacer" }),
                    h("button", { type: "button", class: "sx-pill sx-pill-sm", text: "Post", onclick: openComposer }))
            )
        );
        composeEl.replaceChildren(row);
    }

    if (moreButton) moreButton.addEventListener("click", loadMore);

    if (newButton) newButton.addEventListener("click", openComposer);


    /* ---------- start ---------- */

    (async function start() {

        user = await B.me();

        if (newButton) newButton.textContent = user ? "New post" : "Log in to post";

        renderComposer();
        // auto-open composer if coming from profile + POST
        try {
            var qp = new URLSearchParams(window.location.search);
            if (qp.get("compose") === "1" && user) {
                openComposer();
                window.history.replaceState(null, "", window.location.pathname);
            }
        } catch (e) { /* ignore */ }

        loadMore();

    })();

})();