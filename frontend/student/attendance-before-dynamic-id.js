// ============================================================
// AI ATTEND - STUDENT ATTENDANCE
// JWT + Django REST API
// ============================================================

const API_BASE_URL = "http://127.0.0.1:8000";

console.log("📊 Attendance page started.");


// ============================================================
// GET JWT ACCESS TOKEN
// ============================================================

function getAccessToken() {
    const token = localStorage.getItem("access_token");

    if (!token) {
        console.error("❌ Access token not found.");

        window.location.href = "../login.html";
        return null;
    }

    return token;
}


// ============================================================
// API REQUEST HELPER
// ============================================================

async function apiRequest(url) {

    const token = getAccessToken();

    if (!token) {
        return null;
    }

    try {

        const response = await fetch(
            `${API_BASE_URL}${url}`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );


        console.log(
            `🌐 API ${url} → ${response.status}`
        );


        // ----------------------------------------------------
        // ACCESS TOKEN EXPIRED
        // ----------------------------------------------------

        if (response.status === 401) {

            console.warn(
                "⚠️ Access token expired or unauthorized."
            );

            await refreshAccessToken();

            const newToken =
                localStorage.getItem("access_token");

            if (!newToken) {

                window.location.href =
                    "../login.html";

                return null;
            }


            // Retry request once

            const retryResponse =
                await fetch(
                    `${API_BASE_URL}${url}`,
                    {
                        method: "GET",

                        headers: {
                            "Authorization":
                                `Bearer ${newToken}`,

                            "Content-Type":
                                "application/json"
                        }
                    }
                );


            if (!retryResponse.ok) {

                console.error(
                    "❌ Retry request failed."
                );

                return null;
            }


            return await retryResponse.json();
        }


        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "❌ API Error:",
                errorText
            );

            return null;
        }


        return await response.json();

    }

    catch (error) {

        console.error(
            "❌ Network error:",
            error
        );

        return null;
    }
}


// ============================================================
// REFRESH JWT ACCESS TOKEN
// ============================================================

async function refreshAccessToken() {

    const refreshToken =
        localStorage.getItem("refresh_token");


    if (!refreshToken) {

        console.error(
            "❌ Refresh token not found."
        );

        return false;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/token/refresh/`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        refresh: refreshToken
                    })
                }
            );


        if (!response.ok) {

            console.error(
                "❌ Refresh token failed."
            );

            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "refresh_token"
            );

            return false;
        }


        const data =
            await response.json();


        localStorage.setItem(
            "access_token",
            data.access
        );


        console.log(
            "✅ Access token refreshed."
        );


        return true;

    }

    catch (error) {

        console.error(
            "❌ Token refresh error:",
            error
        );

        return false;
    }
}


// ============================================================
// LOAD ATTENDANCE
// ============================================================

async function loadAttendance() {

    console.log(
        "🔄 Loading attendance..."
    );


    /*
     * IMPORTANT
     *
     * Replace this URL ONLY if your Django
     * attendance endpoint has a different URL.
     *
     * Examples:
     *
     * /api/attendance/
     * /api/student/attendance/
     * /attendance/
     */

    const data =
        await apiRequest(
            "/api/attendance/"
        );


    if (!data) {

        console.error(
            "❌ Attendance data could not be loaded."
        );

        return;
    }


    console.log(
        "✅ Attendance data received:",
        data
    );


    displayAttendance(data);
}


// ============================================================
// DISPLAY ATTENDANCE
// ============================================================

function displayAttendance(data) {

    console.log(
        "🎨 Displaying attendance..."
    );


    /*
     * These values support common Django
     * response formats.
     */

    const attendance =
        data.attendance || data;


    const percentage =
        Number(
            attendance.percentage ??
            attendance.attendance_percentage ??
            attendance.current_percentage ??
            0
        );


    const present =
        Number(
            attendance.present ??
            attendance.present_classes ??
            0
        );


    const absent =
        Number(
            attendance.absent ??
            attendance.absent_classes ??
            0
        );


    const total =
        Number(
            attendance.total_classes ??
            attendance.total ??
            (present + absent)
        );


    // ========================================================
    // UPDATE SUMMARY CARDS
    // ========================================================

    setText(
        "attendancePercentage",
        Math.round(percentage)
    );


    setText(
        "presentClasses",
        present
    );


    setText(
        "absentClasses",
        absent
    );


    setText(
        "totalClasses",
        total
    );


    // ========================================================
    // UPDATE ATTENDANCE CIRCLE
    // ========================================================

    const circle =
        document.querySelector(
            ".attendance-circle"
        );


    if (circle) {

        circle.style.setProperty(
            "--attendance",
            `${percentage}%`
        );
    }


    // ========================================================
    // UPDATE PROGRESS BARS
    // ========================================================

    const progress =
        document.getElementById(
            "attendanceProgress"
        );


    if (progress) {

        progress.style.width =
            `${Math.min(percentage, 100)}%`;
    }


    // ========================================================
    // REQUIRED ATTENDANCE
    // ========================================================

    const required =
        Number(
            attendance.required_percentage ??
            75
        );


    setText(
        "requiredAttendance",
        `${required}%`
    );


    // ========================================================
    // ATTENDANCE RISK
    // ========================================================

    const risk =
        attendance.risk_level ??
        attendance.risk ??
        (
            percentage >= required
                ? "LOW"
                : "HIGH"
        );


    setText(
        "attendanceRisk",
        `Risk: ${risk}`
    );


    console.log(
        "🎉 Attendance display completed."
    );
}


// ============================================================
// SAFE TEXT UPDATE
// ============================================================

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (!element) {

        console.warn(
            `⚠️ Missing HTML element: ${id}`
        );

        return;
    }


    element.textContent =
        value ?? "-";
}


// ============================================================
// REFRESH BUTTON
// ============================================================

const refreshBtn =
    document.getElementById(
        "refreshBtn"
    );


if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        async function () {

            refreshBtn.disabled = true;

            refreshBtn.textContent =
                "↻ Loading...";


            await loadAttendance();


            refreshBtn.disabled = false;

            refreshBtn.textContent =
                "↻ Refresh";
        }
    );
}


// ============================================================
// LOGOUT
// ============================================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        function () {

            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "refresh_token"
            );


            window.location.href =
                "../login.html";
        }
    );
}


// ============================================================
// START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "🚀 Starting attendance page..."
        );

        loadAttendance();

    }
);
