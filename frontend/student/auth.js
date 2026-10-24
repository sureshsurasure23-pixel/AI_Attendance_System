/* =========================================================
   AI ATTEND - JWT AUTHENTICATION HELPER
========================================================= */

const API_BASE_URL = "http://127.0.0.1:8000";


/* =========================================================
   GET ACCESS TOKEN
========================================================= */

function getAccessToken() {
    return localStorage.getItem("access_token");
}


/* =========================================================
   GET REFRESH TOKEN
========================================================= */

function getRefreshToken() {
    return localStorage.getItem("refresh_token");
}


/* =========================================================
   REFRESH ACCESS TOKEN
========================================================= */

async function refreshAccessToken() {

    console.log("🔄 Access token expired. Refreshing token...");

    const refreshToken = getRefreshToken();

    if (!refreshToken) {

        console.error(
            "❌ Refresh token not found."
        );

        return null;
    }


    try {

        const response = await fetch(
            `${API_BASE_URL}/api/token/refresh/`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    refresh: refreshToken
                })
            }
        );


        console.log(
            "🔐 Token refresh status:",
            response.status
        );


        if (!response.ok) {

            console.error(
                "❌ Refresh token is invalid or expired."
            );

            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "refresh_token"
            );

            return null;
        }


        const data =
            await response.json();


        if (!data.access) {

            console.error(
                "❌ New access token not received."
            );

            return null;
        }


        localStorage.setItem(
            "access_token",
            data.access
        );


        console.log(
            "✅ New access token generated."
        );


        return data.access;

    }
    catch (error) {

        console.error(
            "❌ Token refresh error:",
            error
        );

        return null;
    }
}


/* =========================================================
   AUTHENTICATED FETCH
========================================================= */

async function authenticatedFetch(
    url,
    options = {}
) {

    let accessToken =
        getAccessToken();


    if (!accessToken) {

        console.error(
            "❌ Access token missing."
        );

        window.location.href =
            "../login.html";

        return null;
    }


    /* -----------------------------------------------------
       FIRST REQUEST
    ----------------------------------------------------- */

    let response =
        await fetch(
            url,
            {
                ...options,

                headers: {
                    ...(options.headers || {}),

                    "Authorization":
                        `Bearer ${accessToken}`,

                    "Content-Type":
                        "application/json"
                }
            }
        );


    /* -----------------------------------------------------
       TOKEN EXPIRED
    ----------------------------------------------------- */

    if (response.status === 401) {

        console.warn(
            "⚠️ Access token expired."
        );


        const newAccessToken =
            await refreshAccessToken();


        if (!newAccessToken) {

            console.error(
                "❌ Unable to refresh token."
            );

            window.location.href =
                "../login.html";

            return null;
        }


        /* -------------------------------------------------
           RETRY REQUEST
        ------------------------------------------------- */

        console.log(
            "🔁 Retrying API request with new token..."
        );


        response =
            await fetch(
                url,
                {
                    ...options,

                    headers: {
                        ...(options.headers || {}),

                        "Authorization":
                            `Bearer ${newAccessToken}`,

                        "Content-Type":
                            "application/json"
                    }
                }
            );
    }


    return response;
}


/* =========================================================
   LOGOUT
========================================================= */

function logoutUser() {

    console.log(
        "🚪 Logging out..."
    );


    localStorage.removeItem(
        "access_token"
    );

    localStorage.removeItem(
        "refresh_token"
    );


    window.location.href =
        "../login.html";
}
