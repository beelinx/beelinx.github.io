/* =========================================
   BEELINX AUTH
   Log in, sign up (with a unique username and
   account type), log out, password reset and
   profiles, through Supabase.

   Needs the Supabase library loaded first:
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.105.4/dist/umd/supabase.js"></script>
   <script src="../js/auth.js"></script>

   Other scripts use:
     BeelinxAuth.getUser()      -> logged-in user, or null
     BeelinxAuth.getProfile()   -> their profile row, or null
     BeelinxAuth.client         -> the Supabase client
========================================= */

(function () {
    "use strict";

    var SUPABASE_URL = "https://zjzygjflcjqvouitblne.supabase.co";
    var SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqenlnamZsY2pxdm91aXRibG5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MzU4ODEsImV4cCI6MjEwNzMxMTg4MX0.4eL9sedABpdvthy3v7t_V1WtcxeoQ7rxe1z38VQ3N48";

    if (!window.supabase || typeof window.supabase.createClient !== "function") {
        console.error("Beelinx: the Supabase library did not load, so login is unavailable.");
        return;
    }

    /* "implicit" keeps email links working even when they are opened
       in a different browser from the one the person signed up in. */
    var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { flowType: "implicit" }
    });

    /* usernames: 3-20 letters, numbers, underscores or dots (saved lowercase) */
    var USERNAME_PATTERN = /^[a-z0-9_.]{3,20}$/;

    /* roles people can pick themselves. "brand" is given by Beelinx. */
    var SIGNUP_TYPES = ["shopper", "model"];

    function cleanUsername(value) {
        return String(value || "").trim().replace(/^@/, "").toLowerCase();
    }

    function validateUsername(value) {
        var name = cleanUsername(value);
        if (!USERNAME_PATTERN.test(name)) {
            return "Username must be 3-20 characters: letters, numbers, _ or . only.";
        }
        return null;
    }

    /* The login page's own address, with no extra bits. */
    function loginPageUrl() {
        return new URL("login.html", window.location.href).href;
    }

    function friendlyError(error) {
        if (!error) return null;

        var message = String(error.message || "");
        var lower = message.toLowerCase();

        if (error.status === 429 || lower.includes("rate limit")) {
            return "Too many attempts. Please wait a few minutes and try again.";
        }
        if (lower.includes("invalid login credentials")) {
            return "Wrong email or password.";
        }
        if (lower.includes("email not confirmed")) {
            return "Please confirm your email first. Check your inbox.";
        }
        if (lower.includes("already registered")) {
            return "An account with this email already exists. Try logging in.";
        }
        if (lower.includes("database error saving new user") ||
            lower.includes("profiles_username") ||
            lower.includes("duplicate key")) {
            return "That username is taken or not allowed. Please pick another.";
        }
        if (lower.includes("password should be at least") || lower.includes("weak")) {
            return "Please choose a stronger password (at least 8 characters).";
        }
        if (lower.includes("same password") || lower.includes("different from the old")) {
            return "Your new password must be different from the old one.";
        }
        if (lower.includes("failed to fetch") || lower.includes("network")) {
            return "Could not reach Beelinx. Check your connection and try again.";
        }

        return message || "Something went wrong. Please try again.";
    }


    /* ---------- usernames ---------- */

    /* true = free, false = taken, null = could not check */
    async function usernameAvailable(value) {
        var name = cleanUsername(value);
        if (validateUsername(name)) return false;

        var result = await client.rpc("username_available", { name: name });
        if (result.error) {
            console.warn("Beelinx: could not check the username.", result.error);
            return null;
        }
        return result.data === true;
    }


    /* ---------- sign up / log in ---------- */

    async function signUp(email, password, username, accountType) {
        var name = cleanUsername(username);

        var problem = validateUsername(name);
        if (problem) return { error: problem };

        var available = await usernameAvailable(name);
        if (available === false) {
            return { error: "That username is already taken. Please pick another." };
        }

        var type = SIGNUP_TYPES.indexOf(accountType) >= 0 ? accountType : "shopper";

        /* username + account type travel with the signup; a database
           trigger (profiles-setup.sql) saves them into the profiles table */
        var result = await client.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: loginPageUrl(),
                data: { username: name, role: type }
            }
        });

        if (result.error) return { error: friendlyError(result.error) };

        var user = result.data.user;

        /* With email confirmation switched on, Supabase answers an
           already-registered email with a fake user that has no identities. */
        if (user && Array.isArray(user.identities) && user.identities.length === 0) {
            return { error: "An account with this email already exists. Try logging in." };
        }

        return {
            error: null,
            loggedIn: !!result.data.session,
            needsConfirmation: !result.data.session
        };
    }

    async function signIn(email, password) {
        var result = await client.auth.signInWithPassword({ email: email, password: password });
        return { error: friendlyError(result.error) };
    }

    async function signOut() {
        var result = await client.auth.signOut();
        return { error: friendlyError(result.error) };
    }

    async function sendPasswordReset(email) {
        var result = await client.auth.resetPasswordForEmail(email, {
            redirectTo: loginPageUrl()
        });
        return { error: friendlyError(result.error) };
    }

    async function updatePassword(newPassword) {
        var result = await client.auth.updateUser({ password: newPassword });
        return { error: friendlyError(result.error) };
    }

    async function getUser() {
        var result = await client.auth.getSession();
        return result.data && result.data.session ? result.data.session.user : null;
    }

    function onChange(callback) {
        client.auth.onAuthStateChange(callback);
    }


    /* ---------- profiles ---------- */

    var PROFILE_FIELDS = "id, username, role, display_name, bio, avatar_url, created_at";

    /* the logged-in person's profile (null if logged out) */
    async function getProfile() {
        var user = await getUser();
        if (!user) return null;

        var result = await client
            .from("profiles")
            .select(PROFILE_FIELDS)
            .eq("id", user.id)
            .maybeSingle();

        if (result.error) {
            console.warn("Beelinx: could not load your profile.", result.error);
            return null;
        }
        return result.data;
    }

    /* anyone's profile, by username */
    async function getProfileByUsername(username) {
        var result = await client
            .from("profiles")
            .select(PROFILE_FIELDS)
            .eq("username", cleanUsername(username))
            .maybeSingle();

        if (result.error) {
            console.warn("Beelinx: could not load that profile.", result.error);
            return null;
        }
        return result.data;
    }

    /* for accounts made before usernames existed: choose one (once) */
    async function setUsername(username) {
        var name = cleanUsername(username);

        var problem = validateUsername(name);
        if (problem) return { error: problem };

        var user = await getUser();
        if (!user) return { error: "Please log in first." };

        var result = await client
            .from("profiles")
            .update({ username: name })
            .eq("id", user.id)
            .select("id")
            .maybeSingle();

        if (result.error) {
            if (result.error.code === "23505") {
                return { error: "That username is already taken. Please pick another." };
            }
            return { error: friendlyError(result.error) };
        }
        if (!result.data) {
            return { error: "Could not save your username. Please try again." };
        }
        return { error: null };
    }


    window.BeelinxAuth = {
        client: client,
        cleanUsername: cleanUsername,
        validateUsername: validateUsername,
        usernameAvailable: usernameAvailable,
        signUp: signUp,
        signIn: signIn,
        signOut: signOut,
        sendPasswordReset: sendPasswordReset,
        updatePassword: updatePassword,
        getUser: getUser,
        getProfile: getProfile,
        getProfileByUsername: getProfileByUsername,
        setUsername: setUsername,
        onChange: onChange
    };

})();