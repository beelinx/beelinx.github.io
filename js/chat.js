/* =========================================================
   BEELINX CHAT (chat.html)

   - Messages are saved on THIS device (IndexedDB), one store per account.
   - Sending = adding a row to pending_messages (database table).
   - The other person's page gets it live, saves it, then deletes the row,
     so the database only ever holds messages nobody has picked up yet.
   - Offline recipients pick messages up next time they open chat
     (anything older than 48 hours is purged by the database).
========================================================= */

(function () {
    "use strict";

    var B = window.Beelinx;
    var shell = document.getElementById("cx-shell");

    if (!B || !shell) return;

    var db = B.db;
    var h = B.h;

    function $(id) { return document.getElementById(id); }

    var el = {
        login: $("cx-login"),
        loginLink: $("cx-login-link"),
        convos: $("cx-convos"),
        listNote: $("cx-list-note"),
        find: $("cx-find"),
        empty: $("cx-empty"),
        thread: $("cx-thread"),
        back: $("cx-back"),
        peer: $("cx-peer"),
        peerAvatar: $("cx-peer-avatar"),
        peerName: $("cx-peer-name"),
        peerHandle: $("cx-peer-handle"),
        clear: $("cx-clear"),
        messages: $("cx-messages"),
        form: $("cx-form"),
        input: $("cx-input")
    };

    var MAX_LENGTH = 1000;

    var user = null;
    var idb = null;
    var channel = null;
    var peers = new Map();          // people I have chatted with (id -> info)
    var activePeer = null;          // id of the open conversation
    var finding = false;            // true while the "find someone" results are showing
    var findResults = [];
    var lastShownAt = 0;            // time of the newest bubble on screen
    var lastShownDay = "";
    var inFlight = new Set();       // messages being saved right now (avoids doubles)

    var finePointer = window.matchMedia("(pointer: fine)");


    /* =====================================================
       THE DEVICE STORE (IndexedDB)
    ===================================================== */

    function openStore(userId) {

        return new Promise(function (resolve, reject) {

            if (!window.indexedDB) {
                reject(new Error("IndexedDB is not available"));
                return;
            }

            var request = window.indexedDB.open("beelinx-chat-" + userId, 1);

            request.onupgradeneeded = function () {

                var store = request.result;

                var messages = store.createObjectStore("messages", { keyPath: "id" });
                messages.createIndex("peer_time", ["peer", "at"]);

                store.createObjectStore("peers", { keyPath: "id" });

            };

            request.onsuccess = function () { resolve(request.result); };
            request.onerror = function () { reject(request.error); };

        });

    }

    function wrap(request) {

        return new Promise(function (resolve, reject) {
            request.onsuccess = function () { resolve(request.result); };
            request.onerror = function () { reject(request.error); };
        });

    }

    function store(name, mode) {
        return idb.transaction(name, mode || "readonly").objectStore(name);
    }

    function peerRange(peerId) {
        return window.IDBKeyRange.bound([peerId, 0], [peerId, Infinity]);
    }

    var local = {

        message: function (id) {
            return wrap(store("messages").get(id));
        },

        saveMessage: function (message) {
            return wrap(store("messages", "readwrite").put(message));
        },

        thread: function (peerId) {
            return wrap(store("messages").index("peer_time").getAll(peerRange(peerId)));
        },

        peers: function () {
            return wrap(store("peers").getAll());
        },

        savePeer: function (peer) {
            return wrap(store("peers", "readwrite").put(peer));
        },

        clearThread: function (peerId) {

            return new Promise(function (resolve, reject) {

                var transaction = idb.transaction("messages", "readwrite");

                var cursorRequest = transaction.objectStore("messages")
                    .index("peer_time").openCursor(peerRange(peerId));

                cursorRequest.onsuccess = function () {

                    var cursor = cursorRequest.result;

                    if (cursor) {
                        cursor.delete();
                        cursor.continue();
                    }

                };

                transaction.oncomplete = resolve;
                transaction.onerror = function () { reject(transaction.error); };

            });

        }

    };


    /* =====================================================
       SMALL HELPERS
    ===================================================== */

    function newId() {

        if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();

        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0;
            return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
        });

    }

    function formatTime(ms) {
        return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }

    function dayKey(ms) {
        var d = new Date(ms);
        return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
    }

    function dayLabel(ms) {

        var now = new Date();
        var then = new Date(ms);

        var days = Math.round(
            (new Date(now.getFullYear(), now.getMonth(), now.getDate()) -
             new Date(then.getFullYear(), then.getMonth(), then.getDate())) / 86400000
        );

        if (days === 0) return "Today";
        if (days === 1) return "Yesterday";
        if (days < 7) return then.toLocaleDateString(undefined, { weekday: "long" });

        return then.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

    }

    function setListNote(text) {
        el.listNote.textContent = text || "";
        el.listNote.hidden = !text;
    }

    function updateTitle() {

        var unread = 0;

        peers.forEach(function (peer) { unread += peer.unread || 0; });

        document.title = (unread ? "(" + unread + ") " : "") + "Chat | Beelinx";

    }


    /* =====================================================
       PEOPLE
    ===================================================== */

    function adoptPeer(row) {

        var known = peers.get(row.id);

        if (known) return known;

        var peer = {
            id: row.id,
            username: row.username,
            display_name: row.display_name,
            avatar_url: row.avatar_url,
            last_at: 0,
            last_text: "",
            unread: 0
        };

        peers.set(peer.id, peer);
        local.savePeer(peer);

        return peer;

    }

    async function ensurePeer(id) {

        var known = peers.get(id);

        if (known) return known;

        var result = await db.from("profiles")
            .select("id,username,display_name,avatar_url")
            .eq("id", id)
            .maybeSingle();

        if (result.error || !result.data) {
            throw (result.error || new Error("Profile not found"));
        }

        return adoptPeer(result.data);

    }

    function bump(peer, message, unreadToAdd) {

        if (message.at >= peer.last_at) {
            peer.last_at = message.at;
            peer.last_text = (message.mine ? "You: " : "") + message.body;
        }

        peer.unread = (peer.unread || 0) + unreadToAdd;

        local.savePeer(peer);
        renderList();
        updateTitle();

    }


    /* =====================================================
       THE LEFT LIST
    ===================================================== */

    function convoRow(peer, preview, extra) {

        var button = h("button", {
            type: "button",
            class: "cx-convo" + (peer.id === activePeer ? " is-active" : ""),
            onclick: function () { pick(peer); }
        },
            B.avatar(peer),
            h("span", { class: "cx-convo-text" },
                h("strong", { text: B.displayName(peer) }),
                h("span", { class: "cx-convo-preview", text: preview })),
            extra || null
        );

        return h("li", {}, button);

    }

    async function pick(peerRow) {

        var peer = peers.get(peerRow.id) || adoptPeer(peerRow);

        // leave "find someone" mode
        finding = false;
        el.find.value = "";

        await openThread(peer.id);

    }

    function renderList() {

        el.convos.replaceChildren();

        if (finding) {

            setListNote(findResults.length ? "" : "No one found.");

            findResults.forEach(function (row) {
                el.convos.appendChild(convoRow(row, row.username ? "@" + row.username : ""));
            });

            return;

        }

        var list = Array.from(peers.values())
            .filter(function (peer) { return peer.last_at > 0; })
            .sort(function (a, b) { return b.last_at - a.last_at; });

        setListNote(list.length ? "" : "No chats yet. Find someone above to start one.");

        list.forEach(function (peer) {

            var side = h("span", { class: "cx-convo-side" },
                h("small", { text: B.timeAgo(new Date(peer.last_at).toISOString()) }),
                peer.unread ? h("span", { class: "cx-badge", text: String(peer.unread) }) : null);

            el.convos.appendChild(convoRow(peer, peer.last_text, side));

        });

    }

    var runFind = B.debounce(async function (raw) {

        var q = raw.trim().replace(/[%,()*\\]/g, " ").trim();

        if (!q) {
            finding = false;
            renderList();
            return;
        }

        var result = await db.from("profiles")
            .select("id,username,display_name,avatar_url")
            .not("username", "is", null)
            .neq("id", user.id)
            .or("username.ilike.%" + q + "%,display_name.ilike.%" + q + "%")
            .limit(12);

        if (el.find.value.trim() !== raw.trim()) return;      // typed more meanwhile

        finding = true;
        findResults = result.error ? [] : (result.data || []);

        renderList();

    }, 250);

    el.find.addEventListener("input", function () { runFind(el.find.value); });

    el.find.form.addEventListener("submit", function (event) { event.preventDefault(); });


    /* =====================================================
       THE OPEN CONVERSATION
    ===================================================== */

    function metaText(message) {

        var time = formatTime(message.at);

        if (!message.mine) return time;
        if (message.status === "sending") return time + " \u00b7 Sending...";
        if (message.status === "failed") return "Not sent \u00b7 tap to try again";

        return time + " \u00b7 Sent";

    }

    function buildBubble(message) {

        var bubble = h("div", {
            class: "cx-msg " + (message.mine ? "is-mine" : "is-theirs") +
                (message.status === "failed" ? " is-failed" : ""),
            "data-id": message.id
        },
            h("p", { class: "cx-text", text: message.body }),
            h("span", { class: "cx-meta", text: metaText(message) })
        );

        if (message.mine && message.status === "failed") {
            bubble.addEventListener("click", function () { push(message); });
        }

        return bubble;

    }

    function refreshBubble(message) {

        var old = el.messages.querySelector('[data-id="' + message.id + '"]');

        if (old) old.replaceWith(buildBubble(message));

    }

    function scrollDown() {
        el.messages.scrollTop = el.messages.scrollHeight;
    }

    function addBubble(message) {

        var hint = el.messages.querySelector(".cx-hint");
        if (hint) hint.remove();

        var key = dayKey(message.at);

        if (key !== lastShownDay) {
            el.messages.appendChild(h("p", { class: "cx-day", text: dayLabel(message.at) }));
            lastShownDay = key;
        }

        el.messages.appendChild(buildBubble(message));

        lastShownAt = Math.max(lastShownAt, message.at);

    }

    async function drawThread(peerId) {

        var rows = await local.thread(peerId);

        if (activePeer !== peerId) return;

        el.messages.replaceChildren();
        lastShownAt = 0;
        lastShownDay = "";

        if (!rows.length) {
            el.messages.appendChild(h("p", {
                class: "cx-hint",
                text: "Say hello. Chats are saved on this device only, so clearing your browser data removes them."
            }));
        }

        rows.forEach(addBubble);

        scrollDown();

    }

    async function openThread(peerId) {

        var peer = peers.get(peerId) || await ensurePeer(peerId);

        activePeer = peerId;

        shell.classList.add("is-thread");
        document.documentElement.classList.add("cx-thread-open");

        el.empty.hidden = true;
        el.thread.hidden = false;

        el.peer.href = B.profileUrl(peer);
        el.peerAvatar.replaceChildren(B.avatar(peer, "is-md"));
        el.peerName.textContent = B.displayName(peer);
        el.peerHandle.textContent = peer.display_name && peer.username ? "@" + peer.username : "";

        if (peer.unread) {
            peer.unread = 0;
            local.savePeer(peer);
            updateTitle();
        }

        renderList();

        if (peer.username) {
            var url = new URL(window.location.href);
            url.searchParams.set("with", peer.username);
            window.history.replaceState(null, "", url);
        }

        await drawThread(peerId);

        if (finePointer.matches) el.input.focus({ preventScroll: true });

    }

    function closeThread() {

        activePeer = null;

        shell.classList.remove("is-thread");
        document.documentElement.classList.remove("cx-thread-open");

        el.thread.hidden = true;
        el.empty.hidden = false;

        var url = new URL(window.location.href);
        url.searchParams.delete("with");
        window.history.replaceState(null, "", url);

        renderList();

    }

    el.back.addEventListener("click", closeThread);

    el.clear.addEventListener("click", async function () {

        var peer = peers.get(activePeer);

        if (!peer) return;

        var ok = window.confirm(
            "Remove this chat from this device? " + B.displayName(peer) +
            " keeps their copy."
        );

        if (!ok) return;

        await local.clearThread(peer.id);

        peer.last_at = 0;
        peer.last_text = "";
        peer.unread = 0;
        local.savePeer(peer);

        await drawThread(peer.id);

        renderList();
        updateTitle();

    });


    /* =====================================================
       SENDING
    ===================================================== */

    async function push(message) {

        message.status = "sending";
        refreshBubble(message);

        var result = await db.from("pending_messages").insert({
            id: message.id,
            sender_id: user.id,
            recipient_id: message.peer,
            body: message.body
        });

        // 23505 = this message is already queued, which is fine
        message.status = result.error && result.error.code !== "23505" ? "failed" : "sent";

        await local.saveMessage(message);
        refreshBubble(message);

    }

    async function send(text) {

        text = text.trim();

        var peer = peers.get(activePeer);

        if (!text || !peer) return;

        var message = {
            id: newId(),
            peer: peer.id,
            mine: true,
            body: text.slice(0, MAX_LENGTH),
            at: Date.now(),
            status: "sending"
        };

        await local.saveMessage(message);

        bump(peer, message, 0);
        addBubble(message);
        scrollDown();

        push(message);

    }

    function autosize() {
        el.input.style.height = "auto";
        el.input.style.height = Math.min(el.input.scrollHeight, 120) + "px";
    }

    el.input.addEventListener("input", autosize);

    el.input.addEventListener("keydown", function (event) {

        // Enter sends on computers; on phones it makes a new line
        if (event.key === "Enter" && !event.shiftKey && !event.isComposing && finePointer.matches) {
            event.preventDefault();
            el.form.requestSubmit();
        }

    });

    el.form.addEventListener("submit", function (event) {

        event.preventDefault();

        var text = el.input.value;

        el.input.value = "";
        autosize();

        send(text);

    });


    /* =====================================================
       RECEIVING
    ===================================================== */

    async function receive(row) {

        if (!row || inFlight.has(row.id)) return;

        inFlight.add(row.id);

        try {

            var existing = await local.message(row.id);

            if (!existing) {

                var peer = await ensurePeer(row.sender_id);

                var message = {
                    id: row.id,
                    peer: peer.id,
                    mine: false,
                    body: row.body || "",
                    at: new Date(row.created_at).getTime(),
                    status: "received"
                };

                await local.saveMessage(message);

                var watching = activePeer === peer.id && !document.hidden;

                bump(peer, message, watching ? 0 : 1);

                if (activePeer === peer.id) {

                    if (message.at >= lastShownAt) {
                        addBubble(message);
                        scrollDown();
                    } else {
                        drawThread(peer.id);       // it belongs earlier: redraw in order
                    }

                }

            }

            // safe on this device now, so take it off the server
            await db.from("pending_messages").delete().eq("id", row.id);

        } finally {

            inFlight.delete(row.id);

        }

    }

    async function fetchPending() {

        var result = await db.from("pending_messages")
            .select("id,sender_id,body,created_at")
            .eq("recipient_id", user.id)
            .order("created_at", { ascending: true })
            .limit(200);

        if (result.error) return;

        var rows = result.data || [];

        for (var i = 0; i < rows.length; i++) {

            try {
                await receive(rows[i]);
            } catch (error) {
                console.warn("Beelinx: could not save a message yet.", error);
            }

        }

        if (rows.length === 200) fetchPending();

    }

    function listen() {

        channel = db.channel("inbox-" + user.id)
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "pending_messages",
                filter: "recipient_id=eq." + user.id
            }, function (payload) {

                receive(payload.new).catch(function (error) {
                    console.warn("Beelinx: could not save a message yet.", error);
                });

            })
            .subscribe(function (status) {

                // (re)connected: pick up anything that arrived while we were away
                if (status === "SUBSCRIBED") fetchPending();

            });

    }

    document.addEventListener("visibilitychange", function () {

        if (document.hidden || !user || !idb) return;

        fetchPending();

        var peer = peers.get(activePeer);

        if (peer && peer.unread) {
            peer.unread = 0;
            local.savePeer(peer);
            renderList();
            updateTitle();
        }

    });

    window.addEventListener("pagehide", function () {
        if (channel) db.removeChannel(channel);
    });


    /* =====================================================
       START
    ===================================================== */

    async function openByUsername(name) {

        var result = await db.from("profiles")
            .select("id,username,display_name,avatar_url")
            .ilike("username", name.replace(/[%_\\]/g, "\\$&"))
            .maybeSingle();

        if (result.error || !result.data || result.data.id === user.id) return;

        var peer = adoptPeer(result.data);

        await openThread(peer.id);

    }

    (async function start() {

        user = await B.me();

        if (!user) {

            shell.hidden = true;
            el.login.hidden = false;
            el.loginLink.href = "login.html?next=" + encodeURIComponent("chat.html" + window.location.search);

            return;

        }

        try {

            idb = await openStore(user.id);

        } catch (error) {

            console.warn("Beelinx: chat storage is not available.", error);

            setListNote("Chat needs browser storage, which is switched off here (private windows often block it).");

            el.find.disabled = true;

            return;

        }

        var saved = await local.peers();

        saved.forEach(function (peer) { peers.set(peer.id, peer); });

        renderList();
        updateTitle();

        listen();

        var wanted = new URLSearchParams(window.location.search).get("with");

        if (wanted) openByUsername(wanted);

    })();

})();