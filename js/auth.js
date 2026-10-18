/* =========================================
   BEELINX AUTH
   Log in, sign up, Google, log out and password
   reset, through Supabase Auth.

   Needs the Supabase library loaded first:
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.105.4/dist/umd/supabase.js"></script>
   <script src="../js/auth.js"></script>

   Other scripts (likes, comments, save) will later use:
     BeelinxAuth.getUser()   -> the logged-in user, or null
     BeelinxAuth.client      -> the Supabase client
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
       in a different browser from the one the person signed up in
       (for example Gmail's built-in browser on a phone). */
    var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { flowType: "implicit" }
    });

    /* The login page's own address, with no extra bits.
       Supabase sends people back here after Google / email links. */
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

    async function signUp(email, password) {
        var result = await client.auth.signUp({
            email: email,
            password: password,
            options: { emailRedirectTo: loginPageUrl() }
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

    async function signInWithGoogle() {
        var result = await client.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: loginPageUrl() }
        });
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

    window.BeelinxAuth = {
        client: client,
        signUp: signUp,
        signIn: signIn,
        signInWithGoogle: signInWithGoogle,
        signOut: signOut,
        sendPasswordReset: sendPasswordReset,
        updatePassword: updatePassword,
        getUser: getUser,
        onChange: onChange
    };

})();