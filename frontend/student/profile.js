/* =========================================================
   AI ATTEND - STUDENT PROFILE
   ========================================================= */

console.log("👤 Student Profile JavaScript started.");


// =========================================================
// CONFIGURATION
// =========================================================

const API_BASE_URL = "http://127.0.0.1:8000";

const STUDENT_ID = Number(
    localStorage.getItem("student_db_id")
);

console.log("👤 Student DB ID:", STUDENT_ID);


// =========================================================
// DOM READY
// =========================================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("🚀 Student Profile DOM loaded.");

    initializeProfilePage();

});


// =========================================================
// INITIALIZE PAGE
// =========================================================

function initializeProfilePage() {

    // Check student ID
    if (!STUDENT_ID) {

        console.error(
            "❌ Student ID not found in localStorage."
        );

        showError(
            "Student ID not found. Please login again."
        );

        return;
    }


    console.log(
        "✅ Student ID found:",
        STUDENT_ID
    );


    setupRefreshButton();

    setupRetryButton();

    setupLogoutButton();

    loadStudentProfile();

}


// =========================================================
// DOM HELPER
// =========================================================

function getElement(id) {

    return document.getElementById(id);

}


// =========================================================
// SET TEXT
// =========================================================

function setText(id, value) {

    const element = getElement(id);

    if (!element) {

        console.warn(
            "⚠️ Element not found:",
            id
        );

        return;
    }


    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        element.textContent = "-";

    } else {

        element.textContent = value;

    }

}


// =========================================================
// GET ACCESS TOKEN
// =========================================================

function getAccessToken() {

    return localStorage.getItem(
        "access_token"
    );

}


// =========================================================
// GET REFRESH TOKEN
// =========================================================

function getRefreshToken() {

    return localStorage.getItem(
        "refresh_token"
    );

}


// =========================================================
// SAVE ACCESS TOKEN
// =========================================================

function saveAccessToken(token) {

    localStorage.setItem(
        "access_token",
        token
    );

    console.log(
        "💾 New access token saved."
    );

}


// =========================================================
// REFRESH JWT ACCESS TOKEN
// =========================================================

async function refreshAccessToken() {

    console.log(
        "🔄 Starting JWT token refresh..."
    );


    const refreshToken =
        getRefreshToken();


    if (!refreshToken) {

        console.error(
            "❌ Refresh token not found."
        );

        return null;

    }


    try {

        const refreshURL =
            `${API_BASE_URL}/api/token/refresh/`;


        console.log(
            "📡 Refresh API:",
            refreshURL
        );


        const response =
            await fetch(
                refreshURL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        refresh:
                            refreshToken
                    })
                }
            );


        console.log(
            "🔄 Refresh API status:",
            response.status
        );


        if (!response.ok) {

            let errorData = null;

            try {

                errorData =
                    await response.json();

            } catch (e) {

                // Ignore JSON parsing error

            }


            console.error(
                "❌ Refresh token rejected:",
                errorData
            );


            // Session is no longer valid
            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "refresh_token"
            );

          localStorage.removeItem(
    "studentId"
);

localStorage.removeItem(
    "student_db_id"
);


            return null;

        }


        const data =
            await response.json();


        console.log(
            "✅ Token refresh response:",
            data
        );


        if (!data.access) {

            console.error(
                "❌ No new access token returned."
            );

            return null;

        }


        // Save new access token
        saveAccessToken(
            data.access
        );


        // Some JWT configurations
        // also return a new refresh token
        if (data.refresh) {

            localStorage.setItem(
                "refresh_token",
                data.refresh
            );

            console.log(
                "💾 New refresh token saved."
            );

        }


        console.log(
            "✅ JWT access token refreshed successfully."
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


// =========================================================
// LOAD STUDENT PROFILE
// =========================================================

async function loadStudentProfile() {

    console.log(
        "🔄 Loading student profile..."
    );


    showLoading();

    hideError();


    try {

        // =================================================
        // GET ACCESS TOKEN
        // =================================================

        let accessToken =
            getAccessToken();


        console.log(
            "🔐 Access token:",
            accessToken
                ? "Available"
                : "Missing"
        );


        if (!accessToken) {

            throw new Error(
                "Access token not found. Please login again."
            );

        }


        // =================================================
        // PROFILE API URL
        // =================================================

        const API_URL =
            `${API_BASE_URL}/student-profile/${STUDENT_ID}/`;


        console.log(
            "📡 Profile API:",
            API_URL
        );


        // =================================================
        // FIRST API REQUEST
        // =================================================

        let response =
            await fetch(
                API_URL,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${accessToken}`,

                        "Content-Type":
                            "application/json"
                    }
                }
            );


        console.log(
            "📡 Profile API status:",
            response.status
        );


        // =================================================
        // TOKEN EXPIRED
        // =================================================

        if (response.status === 401) {

            console.warn(
                "⚠️ Access token expired or rejected."
            );


            console.log(
                "🔄 Trying automatic JWT refresh..."
            );


            const newAccessToken =
                await refreshAccessToken();


            // =================================================
            // REFRESH FAILED
            // =================================================

            if (!newAccessToken) {

                throw new Error(
                    "Session expired. Please login again."
                );

            }


            // =================================================
            // USE NEW TOKEN
            // =================================================

            accessToken =
                newAccessToken;


            console.log(
                "🔁 Retrying Profile API..."
            );


            response =
                await fetch(
                    API_URL,
                    {
                        method: "GET",

                        headers: {
                            "Authorization":
                                `Bearer ${accessToken}`,

                            "Content-Type":
                                "application/json"
                        }
                    }
                );


            console.log(
                "📡 Retry Profile API status:",
                response.status
            );

        }


        // =================================================
        // HANDLE API ERRORS
        // =================================================

        if (!response.ok) {

            if (response.status === 401) {

                throw new Error(
                    "Authentication failed. Please login again."
                );

            }


            if (response.status === 404) {

                throw new Error(
                    "Student profile not found."
                );

            }


            throw new Error(
                `Profile API failed with status ${response.status}`
            );

        }


        // =================================================
        // READ JSON
        // =================================================

        const data =
            await response.json();


        console.log(
            "✅ FULL PROFILE API DATA:"
        );

        console.log(data);


        // =================================================
        // DISPLAY PROFILE
        // =================================================

        displayProfile(data);


        console.log(
            "🎉 Profile display completed."
        );

    }


    catch (error) {

        console.error(
            "❌ Profile error:",
            error
        );


        showError(
            error.message ||
            "Failed to load student profile."
        );

    }

}


// =========================================================
// DISPLAY PROFILE
// =========================================================

function displayProfile(data) {

    console.log(
        "📊 Displaying profile data..."
    );


    // =====================================================
    // BASIC INFORMATION
    // =====================================================

    setText(
        "studentId",
        data.student_id
    );


    setText(
        "usn",
        data.usn
    );


    setText(
        "studentName",
        data.name
    );


    setText(
        "departmentName",
        data.department_name
    );


    setText(
        "semester",
        data.semester
    );


    setText(
        "section",
        data.section
    );


    // =====================================================
    // CONTACT INFORMATION
    // =====================================================

    setText(
        "email",
        data.email
    );


    setText(
        "phone",
        data.phone
    );


    setText(
        "address",
        data.address || "Not provided"
    );


    // =====================================================
    // TOP STUDENT NAME
    // =====================================================

    setText(
        "topStudentName",
        data.name
    );


    // =====================================================
    // AVATARS
    // =====================================================

    updateAvatar(
        "studentAvatar",
        data.name
    );


    updateAvatar(
        "profileAvatar",
        data.name
    );


    // =====================================================
    // SHOW PROFILE
    // =====================================================

    hideLoading();

    showProfileContent();

}


// =========================================================
// UPDATE AVATAR
// =========================================================

function updateAvatar(id, name) {

    const element =
        getElement(id);


    if (!element) {

        console.warn(
            "⚠️ Avatar element not found:",
            id
        );

        return;

    }


    if (!name) {

        element.textContent = "S";

        return;

    }


    const firstLetter =
        name
            .trim()
            .charAt(0)
            .toUpperCase();


    element.textContent =
        firstLetter;

}


// =========================================================
// REFRESH BUTTON
// =========================================================

function setupRefreshButton() {

    const button =
        getElement("refreshBtn");


    if (!button) {

        console.warn(
            "⚠️ Refresh button not found."
        );

        return;

    }


    button.addEventListener(
        "click",
        async function () {

            console.log(
                "🔄 Manual profile refresh..."
            );


            button.disabled = true;


            try {

                await loadStudentProfile();

            }


            finally {

                button.disabled = false;

            }

        }
    );

}


// =========================================================
// RETRY BUTTON
// =========================================================

function setupRetryButton() {

    const button =
        getElement("retryBtn");


    if (!button) {

        console.warn(
            "⚠️ Retry button not found."
        );

        return;

    }


    button.addEventListener(
        "click",
        async function () {

            console.log(
                "🔁 Retrying student profile..."
            );


            await loadStudentProfile();

        }
    );

}


// =========================================================
// LOGOUT
// =========================================================

function setupLogoutButton() {

    const button =
        getElement("logoutBtn");


    if (!button) {

        console.warn(
            "⚠️ Logout button not found."
        );

        return;

    }


    button.addEventListener(
        "click",
        function (event) {

            event.preventDefault();


            console.log(
                "🚪 Logging out..."
            );


            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "refresh_token"
            );

            localStorage.removeItem(
                "studentId"
            );


            window.location.href =
                "../login.html";

        }
    );

}


// =========================================================
// SHOW LOADING
// =========================================================

function showLoading() {

    const loading =
        getElement("loadingState");


    const content =
        getElement("profileContent");


    const error =
        getElement("errorState");


    if (loading) {

        loading.style.display =
            "block";

    }


    if (content) {

        content.style.display =
            "none";

    }


    if (error) {

        error.style.display =
            "none";

    }

}


// =========================================================
// HIDE LOADING
// =========================================================

function hideLoading() {

    const loading =
        getElement("loadingState");


    if (loading) {

        loading.style.display =
            "none";

    }

}


// =========================================================
// SHOW PROFILE CONTENT
// =========================================================

function showProfileContent() {

    const content =
        getElement("profileContent");


    const error =
        getElement("errorState");


    if (content) {

        content.style.display =
            "block";

    }


    if (error) {

        error.style.display =
            "none";

    }

}


// =========================================================
// SHOW ERROR
// =========================================================

function showError(message) {

    hideLoading();


    const errorState =
        getElement("errorState");


    const errorMessage =
        getElement("errorMessage");


    const content =
        getElement("profileContent");


    if (content) {

        content.style.display =
            "none";

    }


    if (errorMessage) {

        errorMessage.textContent =
            message;

    }


    if (errorState) {

        errorState.style.display =
            "block";

    }

}


// =========================================================
// HIDE ERROR
// =========================================================

function hideError() {

    const errorState =
        getElement("errorState");


    if (errorState) {

        errorState.style.display =
            "none";

    }

}


// =========================================================
// DEBUG
// =========================================================

console.log(
    "✅ NEW profile.js loaded successfully."
);

