/* =========================================================
   BEELINX PEOPLE SEARCH (search.html)
   Type a username or name, get matching accounts, follow from
   the list. With nothing typed it shows the newest accounts.
========================================================= */

(function () {
    "use strict";

    var B = window.Beelinx;

    var input = document.getElementById("sx-q");
    var list = document.getElementById("sx-results");
    var note = document.getElementById("sx-note");
    var heading = document.getElementById("sx-heading");
    var clearButton = document.getElementById("sx-clear");

    if (!B || !input || !list) return;

    var db = B.db;
    var h = B.h;

    var user = null;
    var following = new Set();      // ids of the people I already follow
    var ticket = 0;                 // ignores answers that arrive late


    function setNote(text) {
        note.textContent = text || "";
        note.hidden = !text;
    }

    /* ---------- one row ---------- */

    function followButton(profile) {

        var button = h("button", { type: "button", class: "sx-pill sx-pill-sm" });

        function paint() {
            var on = following.has(profile.id);
            button.textContent = on ? "Following" : "Follow";
            button.classList.toggle("sx-pill-ghost", on);
            button.setAttribute("aria-pressed", String(on));
        }

        paint();

        button.addEventListener("click", async function () {

            if (!user) { B.goLogin(); return; }

            var was = following.has(profile.id);

            if (was) following.delete(profile.id); else following.add(profile.id);
            paint();
            button.disabled = true;

            var result = was
                ? await db.from("follows").delete()
                    .eq("follower_id", user.id).eq("following_id", profile.id)
                : await db.from("follows")
                    .insert({ follower_id: user.id, following_id: profile.id });

            button.disabled = false;

            // 23505 = "already following", which is fine
            if (result.error && result.error.code !== "23505") {      // put it back
                if (was) following.add(profile.id); else following.delete(profile.id);
                paint();
            }

        });

        return button;

    }

    function row(profile) {

        var isMe = user && profile.id === user.id;

        var text = h("span", { class: "sx-person-text" },
            h("strong", { text: B.displayName(profile) }),
            profile.display_name
                ? h("span", { class: "sx-handle", text: "@" + profile.username })
                : null,
            profile.bio ? h("span", { class: "sx-bio", text: profile.bio }) : null
        );

        var actions = isMe
            ? h("span", { class: "sx-you", text: "You" })
            : h("span", { class: "sx-person-actions" },
                h("a", {
                    class: "sx-icon-link",
                    href: "chat.html?with=" + encodeURIComponent(profile.username),
                    "aria-label": "Message " + B.displayName(profile),
                    title: "Message"
                }, h("i", { class: "far fa-comment-dots" })),
                followButton(profile));

        return h("li", { class: "sx-person" },
            h("a", { class: "sx-person-link", href: B.profileUrl(profile) },
                B.avatar(profile), text),
            actions
        );

    }

    function show(profiles, title) {

        heading.textContent = title;
        list.replaceChildren();

        profiles.forEach(function (profile) {
            list.appendChild(row(profile));
        });

    }

    /* ---------- searching ---------- */

    function rank(profile, q) {
        var name = (profile.username || "").toLowerCase();
        if (name === q) return 0;
        if (name.indexOf(q) === 0) return 1;
        if ((profile.display_name || "").toLowerCase().indexOf(q) === 0) return 2;
        return 3;
    }

    async function run(raw) {

        var q = raw.trim().replace(/[%,()*\\]/g, " ").trim();
        var mine = ++ticket;

        clearButton.hidden = !raw;

        var query = db.from("profiles")
            .select("id,username,display_name,bio,avatar_url")
            .not("username", "is", null);

        if (q) {
            query = query
                .or("username.ilike.%" + q + "%,display_name.ilike.%" + q + "%")
                .limit(30);
        } else {
            query = query.order("created_at", { ascending: false }).limit(20);
        }

        setNote("");

        var result = await query;

        if (mine !== ticket) return;      // a newer search already started

        if (result.error) {
            list.replaceChildren();
            heading.textContent = "";
            setNote("Search is not available right now. Please try again.");
            return;
        }

        var found = result.data || [];

        if (q) {
            var lower = q.toLowerCase();
            found.sort(function (a, b) { return rank(a, lower) - rank(b, lower); });
        }

        if (!found.length) {
            list.replaceChildren();
            heading.textContent = "";
            setNote(q ? "No one found for \u201c" + q + "\u201d." : "No accounts yet.");
            return;
        }

        show(found, q ? "Results" : "New on Beelinx");

    }

    var runLater = B.debounce(run, 250);

    input.addEventListener("input", function () {

        runLater(input.value);

        var url = new URL(window.location.href);
        if (input.value.trim()) url.searchParams.set("q", input.value.trim());
        else url.searchParams.delete("q");
        window.history.replaceState(null, "", url);

    });

    input.form && input.form.addEventListener("submit", function (event) {
        event.preventDefault();
        run(input.value);
    });

    clearButton.addEventListener("click", function () {
        input.value = "";
        input.focus();
        run("");
        var url = new URL(window.location.href);
        url.searchParams.delete("q");
        window.history.replaceState(null, "", url);
    });

    /* ---------- start ---------- */

    (async function start() {

        user = await B.me();

        if (user) {
            var mineResult = await db.from("follows")
                .select("following_id").eq("follower_id", user.id);

            (mineResult.data || []).forEach(function (r) { following.add(r.following_id); });
        }

        var first = new URLSearchParams(window.location.search).get("q") || "";

        input.value = first;
        run(first);

        if (!first) input.focus({ preventScroll: true });

    })();

})();