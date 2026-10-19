/* =========================================================
   BEELINX SOCIAL HELPERS
   Shared by search.html and feed.html (and chat later).
   Loaded after the Supabase library, before the page script.
========================================================= */

(function () {
    "use strict";

    var SUPABASE_URL = "https://zjzygjflcjqvouitblne.supabase.co";
    var SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenlnamZsY2pxdm91aXRibG5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MzU4ODEsImV4cCI6MjEwNzMxMTg4MX0.4eL9sedABpdvthy3v7t_V1WtcxeoQ7rxe1z38VQ3N48";

    var Auth = window.BeelinxAuth || null;

    // use the same connection as the rest of the site (auth.js) when it is there,
    // so there is only one login session to keep fresh
    var db = Auth && Auth.client ? Auth.client : null;

    if (!db) {

        if (!window.supabase) {
            console.error("Beelinx: the Supabase library did not load.");
            return;
        }

        db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    }


    /* ---------- tiny DOM builder (text is never read as HTML) ---------- */

    function h(tag, props) {

        var el = document.createElement(tag);

        props = props || {};

        Object.keys(props).forEach(function (key) {

            var value = props[key];

            if (value === null || value === undefined || value === false) return;

            if (key === "class") el.className = value;
            else if (key === "text") el.textContent = value;
            else if (key === "hidden") el.hidden = !!value;
            else if (key.slice(0, 2) === "on" && typeof value === "function") {
                el.addEventListener(key.slice(2), value);
            }
            else el.setAttribute(key, value === true ? "" : value);

        });

        for (var i = 2; i < arguments.length; i++) {

            var child = arguments[i];

            if (child === null || child === undefined || child === false) continue;

            el.appendChild(
                typeof child === "string" ? document.createTextNode(child) : child
            );

        }

        return el;

    }


    /* ---------- who is logged in ---------- */

    async function me() {

        // auth.js reads the saved login straight from the device
        if (Auth && Auth.getUser) {
            try { return await Auth.getUser(); } catch (error) { return null; }
        }

        try {
            var result = await db.auth.getSession();
            return result.data && result.data.session ? result.data.session.user : null;
        } catch (error) {
            return null;
        }

    }

    function goLogin() {

        var page = window.location.pathname.split("/").pop() + window.location.search;

        window.location.href = "login.html?next=" + encodeURIComponent(page);

    }


    /* ---------- people ---------- */

    // accounts without a display name show as @username
    function displayName(profile) {

        if (!profile) return "Someone";

        return profile.display_name ||
            (profile.username ? "@" + profile.username : "Someone");

    }

    // where a person's profile lives.
    // If profile.js reads a different link parameter, change "u" here.
    function profileUrl(profile) {
        return "profile.html?u=" + encodeURIComponent((profile && profile.username) || "");
    }

    function avatar(profile, sizeClass) {

        var el = h("span", { class: "sx-avatar" + (sizeClass ? " " + sizeClass : "") });

        if (profile && profile.avatar_url) {

            el.appendChild(h("img", { src: profile.avatar_url, alt: "", loading: "lazy" }));

        } else {

            el.textContent = (
                (profile && (profile.username || profile.display_name)) || "?"
            ).charAt(0).toUpperCase();

        }

        return el;

    }


    /* ---------- small helpers ---------- */

    function timeAgo(iso) {

        var seconds = (Date.now() - new Date(iso).getTime()) / 1000;

        if (seconds < 60) return "just now";

        var minutes = seconds / 60;
        if (minutes < 60) return Math.floor(minutes) + "m";

        var hours = minutes / 60;
        if (hours < 24) return Math.floor(hours) + "h";

        var days = hours / 24;
        if (days < 7) return Math.floor(days) + "d";

        return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });

    }

    function debounce(fn, wait) {

        var timer;

        return function () {

            var args = arguments;

            clearTimeout(timer);

            timer = setTimeout(function () { fn.apply(null, args); }, wait);

        };

    }


    /* ---------- photo compression (runs on the user's device) ----------
       Longest side 1200px, WebP (JPEG where the browser cannot make WebP),
       shrunk until it is about 500 KB or less. Never above 2 MB. */

    var MAX_BYTES = 2 * 1024 * 1024;
    var TARGET_BYTES = 500 * 1024;
    var MAX_SIDE = 1200;

    function canvasToBlob(canvas, type, quality) {

        return new Promise(function (resolve) {
            canvas.toBlob(resolve, type, quality);
        });

    }

    async function compressImage(file) {

        if (!file || !/^image\//.test(file.type)) {
            throw new Error("Please choose a photo.");
        }

        var bitmap;

        try {
            bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
        } catch (error) {
            throw new Error("That photo format is not supported here. Try a JPG or PNG.");
        }

        var scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));

        var canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));

        var context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

        if (bitmap.close) bitmap.close();

        var quality = 0.82;
        var blob = await canvasToBlob(canvas, "image/webp", quality);

        // Safari and some browsers hand back a PNG when asked for WebP
        if (!blob || blob.type !== "image/webp") {
            blob = await canvasToBlob(canvas, "image/jpeg", quality);
        }

        while (blob && blob.size > TARGET_BYTES && quality > 0.5) {
            quality -= 0.08;
            blob = await canvasToBlob(canvas, blob.type, quality);
        }

        if (!blob) throw new Error("Could not prepare that photo.");

        if (blob.size > MAX_BYTES) {
            throw new Error("That photo is too large even after shrinking. Try another one.");
        }

        return { blob: blob, ext: blob.type === "image/webp" ? "webp" : "jpg" };

    }


    window.Beelinx = {
        db: db,
        h: h,
        me: me,
        goLogin: goLogin,
        displayName: displayName,
        profileUrl: profileUrl,
        avatar: avatar,
        timeAgo: timeAgo,
        debounce: debounce,
        compressImage: compressImage
    };

})();