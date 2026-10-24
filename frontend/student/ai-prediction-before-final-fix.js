/* =========================================================
   AI ATTEND - STUDENT AI PREDICTION
   ========================================================= */

console.log("🤖 AI Prediction JavaScript started.");


// =========================================================
// CONFIGURATION
// =========================================================

const API_BASE_URL = "http://127.0.0.1:8000";

// TEMPORARY TEST STUDENT
// Same student used by academic.js
const STUDENT_ID = 2;

const AI_DASHBOARD_URL =
    `${API_BASE_URL}/ai/dashboard/student/${STUDENT_ID}/`;

const REFRESH_URL =
    `${API_BASE_URL}/api/token/refresh/`;


// =========================================================
// DOM READY
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("🚀 AI Prediction DOM loaded.");

    initializePage();

});


// =========================================================
// INITIALIZE
// =========================================================

function initializePage() {

    setupRefreshButton();

    setupRetryButton();

    setupLogoutButton();

    loadStudentData();

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
            `⚠️ Element not found: ${id}`
        );

        return;
    }

    element.textContent =
        value !== undefined &&
        value !== null
            ? value
            : "-";

}


// =========================================================
// SHOW / HIDE LOADING
// =========================================================

function showLoading() {

    const loading = getElement("loadingState");

    const content = getElement("predictionContent");

    const error = getElement("errorState");


    if (loading) {

        loading.style.display = "flex";

    }


    if (content) {

        content.style.display = "none";

    }


    if (error) {

        error.style.display = "none";

    }

}


function hideLoading() {

    const loading = getElement("loadingState");

    const content = getElement("predictionContent");


    if (loading) {

        loading.style.display = "none";

    }


    if (content) {

        content.style.display = "block";

    }

}


// =========================================================
// ERROR
// =========================================================

function showError(message) {

    const errorState =
        getElement("errorState");

    const errorMessage =
        getElement("errorMessage");


    if (errorMessage) {

        errorMessage.textContent =
            message ||
            "Unable to load AI prediction.";

    }


    if (errorState) {

        errorState.style.display = "block";

    }

}


function hideError() {

    const errorState =
        getElement("errorState");


    if (errorState) {

        errorState.style.display = "none";

    }

}


// =========================================================
// JWT REFRESH
// =========================================================

async function refreshAccessToken() {

    console.log(
        "🔄 Refreshing JWT access token..."
    );


    const refreshToken =
        localStorage.getItem("refresh_token");


    if (!refreshToken) {

        console.error(
            "❌ Refresh token not available."
        );

        return false;

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
            "🔐 Token refresh status:",
            response.status
        );


        if (!response.ok) {

            console.error(
                "❌ JWT refresh failed."
            );

            return false;

        }


        const data =
            await response.json();


        if (!data.access) {

            console.error(
                "❌ New access token not received."
            );

            return false;

        }


        localStorage.setItem(
            "access_token",
            data.access
        );


        console.log(
            "✅ New access token stored."
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


// =========================================================
// LOAD STUDENT DATA
// =========================================================

async function loadStudentData() {

    console.log(
        "🔄 Loading AI prediction data..."
    );


    showLoading();

    hideError();


    try {

        // -------------------------------------------------
        // GET ACCESS TOKEN
        // -------------------------------------------------

        let accessToken =
            localStorage.getItem(
                "access_token"
            );


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


        // -------------------------------------------------
        // STUDENT ID
        // -------------------------------------------------

        const studentId =
            STUDENT_ID;


        console.log(
            "👤 Student ID:",
            studentId
        );


        if (!studentId) {

            throw new Error(
                "Student ID could not be found."
            );

        }


        // -------------------------------------------------
        // API URL
        // -------------------------------------------------

        const apiUrl =
            `${API_BASE_URL}/ai/dashboard/student/${studentId}/`;


        console.log(
            "📡 AI Dashboard API:",
            apiUrl
        );


        // -------------------------------------------------
        // FIRST REQUEST
        // -------------------------------------------------

        let response =
            await fetch(
                apiUrl,
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


        // -------------------------------------------------
        // ACCESS TOKEN EXPIRED
        // -------------------------------------------------

        if (response.status === 401) {

            console.log(
                "🔄 Access token expired."
            );


            const refreshed =
                await refreshAccessToken();


            if (!refreshed) {

                throw new Error(
                    "Session expired. Please login again."
                );

            }


            accessToken =
                localStorage.getItem(
                    "access_token"
                );


            // Retry request

            response =
                await fetch(
                    apiUrl,
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
                "📡 Retry API status:",
                response.status
            );

        }


        // -------------------------------------------------
        // API ERROR
        // -------------------------------------------------

        if (!response.ok) {

            let errorMessage =
                `API request failed: ${response.status}`;


            try {

                const errorData =
                    await response.json();


                console.error(
                    "❌ API error:",
                    errorData
                );


                if (errorData.detail) {

                    errorMessage =
                        errorData.detail;

                }

            }

            catch (error) {

                console.warn(
                    "Could not parse API error."
                );

            }


            throw new Error(
                errorMessage
            );

        }


        // -------------------------------------------------
        // JSON
        // -------------------------------------------------

        const data =
            await response.json();


        console.log(
            "✅ FULL AI PREDICTION API DATA:"
        );


        console.log(
            JSON.stringify(
                data,
                null,
                2
            )
        );


        // -------------------------------------------------
        // DISPLAY DATA
        // -------------------------------------------------

        displayPredictionData(data);


        hideLoading();


        console.log(
            "🎉 AI prediction display completed."
        );

    }

    catch (error) {

        console.error(
            "❌ AI prediction error:",
            error
        );


        hideLoading();


        showError(
            error.message
        );

    }

}


// =========================================================
// DISPLAY PREDICTION DATA
// =========================================================

function displayPredictionData(data) {

    console.log(
        "📊 Displaying AI prediction data..."
    );


    // =====================================================
    // STUDENT
    // =====================================================

    const student =
        data.student || {};


    setText(
        "topStudentName",
        student.name
    );


    setText(
        "studentName",
        student.name
    );


    setText(
        "studentId",
        student.id
    );


    // Avatar

    const avatar =
        getElement("studentAvatar");


    if (avatar && student.name) {

        avatar.textContent =
            student.name
                .charAt(0)
                .toUpperCase();

    }


    // =====================================================
    // ML PREDICTION
    // =====================================================

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
        "riskLevel",
        riskLevel
    );


    setText(
        "confidence",
        `${confidence}%`
    );


    setText(
        "predictionStatus",
        prediction.prediction_status ||
        "-"
    );


    setText(
        "predictionReason",
        prediction.reason ||
        "No prediction reason available."
    );


    // =====================================================
    // CONFIDENCE BAR
    // =====================================================

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


    // =====================================================
    // ATTENDANCE
    // =====================================================

    const attendance =
        data.attendance || {};


    setText(
        "attendancePercentage",
        `${attendance.percentage ?? 0}%`
    );


    setText(
        "totalClasses",
        attendance.total_classes ?? 0
    );


    setText(
        "presentClasses",
        attendance.present ?? 0
    );


    setText(
        "absentClasses",
        attendance.absent ?? 0
    );


    // =====================================================
    // ACADEMIC
    // =====================================================

    const academic =
        data.academic || {};


    setText(
        "averageMarks",
        `${academic.average_marks ?? 0}%`
    );


    // =====================================================
    // ATTENDANCE SHORTAGE
    // =====================================================

    const shortage =
        data.attendance_shortage || {};


    setText(
        "currentAttendance",
        `${shortage.current_percentage ?? 0}%`
    );


    setText(
        "targetAttendance",
        `${shortage.required_percentage ?? 75}%`
    );


    setText(
        "requiredPercentage",
        `${shortage.required_percentage ?? 75}%`
    );


    setText(
        "classesToAttend",
        shortage.classes_to_attend ?? 0
    );


    setText(
        "shortageMessage",
        shortage.message ||
        "No attendance shortage information available."
    );


    // =====================================================
    // TARGET STATUS
    // =====================================================

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


    // =====================================================
    // RISK CLASS
    // =====================================================

    applyRiskStyle(
        riskLevel
    );


    console.log(
        "✅ Prediction data displayed."
    );

}


// =========================================================
// RISK STYLE
// =========================================================

function applyRiskStyle(riskLevel) {

    const riskElement =
        getElement(
            "riskLevel"
        );


    if (!riskElement) {

        return;

    }


    riskElement.classList.remove(
        "risk-low",
        "risk-medium",
        "risk-high",
        "risk-critical"
    );


    const risk =
        String(
            riskLevel
        )
        .toLowerCase();


    if (risk === "low") {

        riskElement.classList.add(
            "risk-low"
        );

    }

    else if (
        risk === "medium"
    ) {

        riskElement.classList.add(
            "risk-medium"
        );

    }

    else if (
        risk === "high"
    ) {

        riskElement.classList.add(
            "risk-high"
        );

    }

    else if (
        risk === "critical"
    ) {

        riskElement.classList.add(
            "risk-critical"
        );

    }

}


// =========================================================
// REFRESH BUTTON
// =========================================================

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
        async () => {

            console.log(
                "🔄 Manual AI prediction refresh..."
            );


            await loadStudentData();

        }
    );

}


// =========================================================
// RETRY BUTTON
// =========================================================

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
        async () => {

            console.log(
                "🔁 Retrying AI prediction..."
            );


            await loadStudentData();

        }
    );

}


// =========================================================
// LOGOUT
// =========================================================

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
        (event) => {

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


            window.location.href =
                "../login.html";

        }
    );

}


// =========================================================
// INITIAL LOAD
// =========================================================

console.log(
    "✅ ai-prediction.js loaded successfully."
);
