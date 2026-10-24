/* =========================================================
   AI ATTEND - STUDENT AI PREDICTION
   ========================================================= */

console.log("🤖 AI Prediction JavaScript started.");


/* =========================================================
   CONFIGURATION
   ========================================================= */

const API_BASE_URL = "http://127.0.0.1:8000";

const STUDENT_ID = Number(
    localStorage.getItem("studentId")
);

const REFRESH_URL =
    `${API_BASE_URL}/api/token/refresh/`;

console.log("👤 Student ID:", STUDENT_ID);


/* =========================================================
   STUDENT ID VALIDATION
   ========================================================= */

if (!STUDENT_ID) {

    console.error(
        "❌ Student ID not found in localStorage."
    );

}


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "🚀 AI Prediction DOM loaded."
        );

        initializePage();

    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

function initializePage() {

    setupRefreshButton();

    setupRetryButton();

    setupLogoutButton();

    loadStudentData();

}


/* =========================================================
   DOM HELPER
   ========================================================= */

function getElement(id) {

    return document.getElementById(id);

}


/* =========================================================
   SET TEXT
   ========================================================= */

function setText(id, value) {

    const element =
        getElement(id);

    if (!element) {

        console.warn(
            `⚠️ Element not found: ${id}`
        );

        return;

    }

    element.textContent =
        value !== undefined &&
        value !== null &&
        value !== ""
            ? value
            : "-";

}


/* =========================================================
   ACCESS TOKEN
   ========================================================= */

function getAccessToken() {

    return localStorage.getItem(
        "access_token"
    );

}


/* =========================================================
   SHOW LOADING
   ========================================================= */

function showLoading() {

    const loading =
        getElement("loadingState");

    const content =
        getElement("predictionContent");

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


/* =========================================================
   HIDE LOADING
   ========================================================= */

function hideLoading() {

    const loading =
        getElement("loadingState");

    const content =
        getElement("predictionContent");


    if (loading) {

        loading.style.display =
            "none";

    }


    if (content) {

        content.style.display =
            "block";

    }

}


/* =========================================================
   SHOW ERROR
   ========================================================= */

function showError(message) {

    const loading =
        getElement("loadingState");

    const content =
        getElement("predictionContent");

    const error =
        getElement("errorState");

    const errorMessage =
        getElement("errorMessage");


    if (loading) {

        loading.style.display =
            "none";

    }


    if (content) {

        content.style.display =
            "none";

    }


    if (errorMessage) {

        errorMessage.textContent =
            message ||
            "Unable to load AI prediction.";

    }


    if (error) {

        error.style.display =
            "block";

    }

}


/* =========================================================
   HIDE ERROR
   ========================================================= */

function hideError() {

    const error =
        getElement("errorState");

    if (error) {

        error.style.display =
            "none";

    }

}


/* =========================================================
   REFRESH ACCESS TOKEN
   ========================================================= */

async function refreshAccessToken() {

    console.log(
        "🔄 Refreshing JWT access token..."
    );


    const refreshToken =
        localStorage.getItem(
            "refresh_token"
        );


    if (!refreshToken) {

        console.error(
            "❌ Refresh token not found."
        );

        return null;

    }


    try {

        const response =
            await fetch(
                REFRESH_URL,
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

            console.error(
                "❌ JWT refresh failed."
            );

            return null;

        }


        const data =
            await response.json();


        if (!data.access) {

            console.error(
                "❌ New access token not returned."
            );

            return null;

        }


        localStorage.setItem(
            "access_token",
            data.access
        );


        console.log(
            "✅ New access token saved."
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
   LOAD AI DATA
   ========================================================= */

async function loadStudentData() {

    console.log(
        "🔄 Loading AI prediction data..."
    );


    if (!STUDENT_ID) {

        showError(
            "Student ID not found. Please login again."
        );

        return;

    }


    showLoading();

    hideError();


    let accessToken =
        getAccessToken();


    console.log(
        "🔐 Access token:",
        accessToken
            ? "Available"
            : "Missing"
    );


    if (!accessToken) {

        showError(
            "Access token not found. Please login again."
        );

        return;

    }


    const API_URL =
        `${API_BASE_URL}/ai/dashboard/student/${STUDENT_ID}/`;


    console.log(
        "📡 AI Dashboard API:",
        API_URL
    );


    try {

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
            "📡 AI API status:",
            response.status
        );


        /* =================================================
           TOKEN EXPIRED
           ================================================= */

        if (response.status === 401) {

            console.warn(
                "⚠️ Access token expired. Trying refresh..."
            );


            accessToken =
                await refreshAccessToken();


            if (!accessToken) {

                showError(
                    "Session expired. Please login again."
                );

                return;

            }


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
                "📡 AI API retry status:",
                response.status
            );

        }


        /* =================================================
           API ERROR
           ================================================= */

        if (!response.ok) {

            let errorMessage =
                `AI API failed with status ${response.status}`;


            try {

                const errorData =
                    await response.json();

                console.error(
                    "❌ AI API error data:",
                    errorData
                );

                if (errorData.detail) {

                    errorMessage =
                        errorData.detail;

                }

            }

            catch (jsonError) {

                console.warn(
                    "⚠️ Could not parse API error."
                );

            }


            throw new Error(
                errorMessage
            );

        }


        /* =================================================
           READ RESPONSE
           ================================================= */

        const data =
            await response.json();


        console.log(
            "✅ FULL AI PREDICTION API DATA:"
        );

        console.log(data);


        /* =================================================
           DISPLAY DATA
           ================================================= */

        displayPrediction(
            data
        );


        console.log(
            "🎉 AI prediction display completed."
        );

    }

    catch (error) {

        console.error(
            "❌ AI prediction error:",
            error
        );


        showError(
            error.message ||
            "Failed to load AI prediction."
        );

    }

}


/* =========================================================
   DISPLAY PREDICTION
   ========================================================= */

function displayPrediction(data) {

    console.log(
        "📊 Displaying AI prediction data..."
    );


    /* =====================================================
       ML PREDICTION
       ===================================================== */

    const prediction =
        data.ml_prediction || {};


    const riskLevel =
        prediction.risk_level ||
        "UNKNOWN";


    const confidence =
        Number(
            prediction.confidence || 0
        );


    setText(
        "predictionStatus",
        prediction.prediction_status ||
        "-"
    );


    setText(
        "riskLevel",
        riskLevel
    );


    setText(
        "confidence",
        `${confidence}%`
    );


    setText(
        "predictionReason",
        prediction.reason ||
        "No prediction reason available."
    );


    /* =====================================================
       CONFIDENCE BAR
       ===================================================== */

    const confidenceBar =
        getElement(
            "confidenceBar"
        );


    if (confidenceBar) {

        const safeConfidence =
            Math.max(
                0,
                Math.min(
                    100,
                    confidence
                )
            );


        confidenceBar.style.width =
            `${safeConfidence}%`;

    }


    /* =====================================================
       ATTENDANCE
       ===================================================== */

    const attendance =
        data.attendance || {};


    const attendancePercentage =
        Number(
            attendance.percentage || 0
        );


    setText(
        "attendancePercentage",
        `${attendancePercentage}%`
    );


    setText(
        "totalClasses",
        attendance.total_classes || 0
    );


    setText(
        "presentClasses",
        attendance.present || 0
    );


    setText(
        "absentClasses",
        attendance.absent || 0
    );


    /* =====================================================
       ACADEMIC
       ===================================================== */

    const academic =
        data.academic || {};


    const averageMarks =
        Number(
            academic.average_marks || 0
        );


    setText(
        "averageMarks",
        `${averageMarks}%`
    );


    /* =====================================================
       ATTENDANCE SHORTAGE
       ===================================================== */

    const shortage =
        data.attendance_shortage || {};


    const currentPercentage =
        Number(
            shortage.current_percentage ??
            attendancePercentage
        );


    const requiredPercentage =
        Number(
            shortage.required_percentage ??
            75
        );


    const classesToAttend =
        Number(
            shortage.classes_to_attend || 0
        );


    setText(
        "currentAttendance",
        `${currentPercentage}%`
    );


    setText(
        "targetAttendance",
        `${requiredPercentage}%`
    );


    setText(
        "requiredPercentage",
        `${requiredPercentage}%`
    );


    setText(
        "classesToAttend",
        classesToAttend
    );


    setText(
        "shortageMessage",
        shortage.message ||
        "No attendance shortage information available."
    );


    /* =====================================================
       TARGET STATUS
       ===================================================== */

    const targetStatus =
        getElement(
            "targetStatus"
        );


    if (targetStatus) {

        if (
            shortage.can_reach_target === true
        ) {

            targetStatus.textContent =
                "Target achievable";

            targetStatus.className =
                "target-status success";

        }

        else {

            targetStatus.textContent =
                "Target cannot be reached";

            targetStatus.className =
                "target-status danger";

        }

    }


    /* =====================================================
       STUDENT INFORMATION
       ===================================================== */

    const student =
        data.student || {};


    setText(
        "studentName",
        student.name ||
        "-"
    );


    setText(
        "studentId",
        STUDENT_ID
    );


    setText(
        "topStudentName",
        student.name ||
        "Student"
    );


    /* =====================================================
       AVATAR
       ===================================================== */

    updateAvatar(
        "studentAvatar",
        student.name ||
        "Student"
    );


    /* =====================================================
       RISK STYLE
       ===================================================== */

    applyRiskStyle(
        riskLevel
    );


    /* =====================================================
       EARLY WARNING
       ===================================================== */

    displayEarlyWarning(
        data.early_warning || {}
    );


    /* =====================================================
       LAST UPDATED
       ===================================================== */

    const lastUpdated =
        getElement(
            "lastUpdated"
        );


    if (lastUpdated) {

        const now =
            new Date();

        lastUpdated.textContent =
            now.toLocaleString();

    }


    /* =====================================================
       SHOW RESULT
       ===================================================== */

    hideLoading();


    console.log(
        "✅ Prediction data displayed."
    );

}


/* =========================================================
   EARLY WARNING
   ========================================================= */

function displayEarlyWarning(
    warning
) {

    if (!warning) {
        return;
    }


    console.log(
        "⚠️ Early warning:",
        warning
    );


    const recommendations =
        warning.recommendations;


    if (
        Array.isArray(
            recommendations
        )
    ) {

        console.log(
            "💡 Recommendations:",
            recommendations
        );

    }

}


/* =========================================================
   RISK STYLE
   ========================================================= */

function applyRiskStyle(
    riskLevel
) {

    const riskElement =
        getElement(
            "riskLevel"
        );


    if (!riskElement) {

        return;

    }


    const risk =
        String(
            riskLevel
        )
        .trim()
        .toLowerCase();


    riskElement.classList.remove(
        "low",
        "medium",
        "high",
        "critical",
        "unknown"
    );


    if (risk === "low") {

        riskElement.classList.add(
            "low"
        );

    }

    else if (
        risk === "medium"
    ) {

        riskElement.classList.add(
            "medium"
        );

    }

    else if (
        risk === "high"
    ) {

        riskElement.classList.add(
            "high"
        );

    }

    else if (
        risk === "critical"
    ) {

        riskElement.classList.add(
            "critical"
        );

    }

    else {

        riskElement.classList.add(
            "unknown"
        );

    }

}


/* =========================================================
   AVATAR
   ========================================================= */

function updateAvatar(
    id,
    name
) {

    const element =
        getElement(id);


    if (!element) {

        return;

    }


    if (!name) {

        element.textContent =
            "S";

        return;

    }


    element.textContent =
        String(name)
            .trim()
            .charAt(0)
            .toUpperCase();

}


/* =========================================================
   REFRESH BUTTON
   ========================================================= */

function setupRefreshButton() {

    const button =
        getElement(
            "refreshBtn"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        async function () {

            console.log(
                "🔄 Manual AI prediction refresh..."
            );


            button.disabled =
                true;


            try {

                await loadStudentData();

            }

            finally {

                button.disabled =
                    false;

            }

        }
    );

}


/* =========================================================
   RETRY BUTTON
   ========================================================= */

function setupRetryButton() {

    const button =
        getElement(
            "retryBtn"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        async function () {

            console.log(
                "🔁 Retrying AI prediction..."
            );


            await loadStudentData();

        }
    );

}


/* =========================================================
   LOGOUT
   ========================================================= */

function setupLogoutButton() {

    const button =
        getElement(
            "logoutBtn"
        );


    if (!button) {

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
                "login.html";

        }
    );

}


/* =========================================================
   FINAL LOG
   ========================================================= */

console.log(
    "✅ NEW AI prediction.js loaded successfully."
);
