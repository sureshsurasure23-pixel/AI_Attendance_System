/* =========================================================
   AI ATTEND - STUDENT AI PREDICTION
   ========================================================= */

console.log("🤖 AI Prediction JavaScript started.");


// =========================================================
// CONFIGURATION
// =========================================================

const API_BASE_URL = "http://127.0.0.1:8000";


// =========================================================
// STUDENT ID
// =========================================================

const STUDENT_ID = Number(
    localStorage.getItem("studentId")
);

console.log("👤 Student ID:", STUDENT_ID);


// =========================================================
// PAGE LOAD
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

    if (!STUDENT_ID) {

        console.error(
            "❌ Student ID not found in localStorage."
        );

        showError(
            "Student ID could not be found. Please login again."
        );

        return;
    }

    loadPrediction();

}


// =========================================================
// GET ELEMENT
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
        value !== null &&
        value !== ""
            ? value
            : "-";

}


// =========================================================
// SHOW / HIDE LOADING
// =========================================================

function showLoading() {

    const loading =
        getElement("loadingState");

    const content =
        getElement("predictionContent");

    const error =
        getElement("errorState");


    if (loading) {

        loading.style.display = "block";

    }

    if (content) {

        content.style.display = "none";

    }

    if (error) {

        error.style.display = "none";

    }

}


function hideLoading() {

    const loading =
        getElement("loadingState");

    const content =
        getElement("predictionContent");


    if (loading) {

        loading.style.display = "none";

    }

    if (content) {

        content.style.display = "block";

    }

}


// =========================================================
// SHOW ERROR
// =========================================================

function showError(message) {

    const error =
        getElement("errorState");

    const errorMessage =
        getElement("errorMessage");

    const content =
        getElement("predictionContent");

    const loading =
        getElement("loadingState");


    if (loading) {

        loading.style.display = "none";

    }

    if (content) {

        content.style.display = "none";

    }

    if (error) {

        error.style.display = "block";

    }

    if (errorMessage) {

        errorMessage.textContent =
            message || "Something went wrong.";

    }

}


// =========================================================
// HIDE ERROR
// =========================================================

function hideError() {

    const error =
        getElement("errorState");

    if (error) {

        error.style.display = "none";

    }

}


// =========================================================
// REFRESH JWT TOKEN
// =========================================================

async function refreshAccessToken() {

    console.log(
        "🔄 Refreshing JWT access token..."
    );


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


        console.log(
            "🔄 Token refresh status:",
            response.status
        );


        if (!response.ok) {

            console.error(
                "❌ Token refresh failed."
            );

            return false;

        }


        const data =
            await response.json();


        if (!data.access) {

            console.error(
                "❌ New access token missing."
            );

            return false;

        }


        localStorage.setItem(
            "access_token",
            data.access
        );


        console.log(
            "✅ New access token saved."
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
// LOAD AI PREDICTION
// =========================================================

async function loadPrediction() {

    console.log(
        "🔄 Loading AI prediction data..."
    );


    if (!STUDENT_ID) {

        showError(
            "Student ID could not be found. Please login again."
        );

        return;

    }


    showLoading();

    hideError();


    try {

        let accessToken =
            localStorage.getItem("access_token");


        console.log(
            "🔐 Access token:",
            accessToken
                ? "Available"
                : "Missing"
        );


        if (!accessToken) {

            showError(
                "Your session has expired. Please login again."
            );

            return;

        }


        const API_URL =
            `${API_BASE_URL}/ai/dashboard/student/${STUDENT_ID}/`;


        console.log(
            "📡 AI Dashboard API:",
            API_URL
        );


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


        // =================================================
        // ACCESS TOKEN EXPIRED
        // =================================================

        if (response.status === 401) {

            console.log(
                "🔐 Access token expired. Refreshing..."
            );


            const refreshed =
                await refreshAccessToken();


            if (!refreshed) {

                showError(
                    "Your session has expired. Please login again."
                );

                return;

            }


            accessToken =
                localStorage.getItem(
                    "access_token"
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
                "📡 Retry AI API status:",
                response.status
            );

        }


        // =================================================
        // API ERROR
        // =================================================

        if (!response.ok) {

            let errorText =
                "Unable to load AI prediction data.";


            try {

                const errorData =
                    await response.json();

                console.error(
                    "❌ API error:",
                    errorData
                );

                if (errorData.detail) {

                    errorText =
                        errorData.detail;

                }

            }
            catch {

                console.error(
                    "❌ Could not read API error."
                );

            }


            throw new Error(errorText);

        }


        // =================================================
        // READ JSON
        // =================================================

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


        // =================================================
        // DISPLAY
        // =================================================

        displayPrediction(data);


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
            "Failed to load AI prediction data."
        );

    }

}


// =========================================================
// DISPLAY AI DATA
// =========================================================

function displayPrediction(data) {

    console.log(
        "📊 Displaying AI prediction data..."
    );


    const student =
        data.student || {};

    const attendance =
        data.attendance || {};

    const academic =
        data.academic || {};

    const prediction =
        data.ml_prediction || {};

    const shortage =
        data.attendance_shortage || {};

    const earlyWarning =
        data.early_warning || {};


    // =================================================
    // STUDENT
    // =================================================

    setText(
        "studentName",
        student.name
    );


    setText(
        "studentId",
        student.id
    );


    setText(
        "topStudentName",
        student.name
    );


    const avatar =
        getElement("studentAvatar");


    if (avatar && student.name) {

        avatar.textContent =
            student.name
                .charAt(0)
                .toUpperCase();

    }


    // =================================================
    // PREDICTION STATUS
    // =================================================

    setText(
        "predictionStatus",
        prediction.prediction_status ||
        "ACTIVE"
    );


    // =================================================
    // RISK
    // =================================================

    const risk =
        prediction.risk_level ||
        academic.risk_level ||
        attendance.risk_level ||
        "LOW";


    setText(
        "riskLevel",
        risk
    );


    // =================================================
    // CONFIDENCE
    // =================================================

    const confidence =
        Number(
            prediction.confidence || 0
        );


    setText(
        "confidence",
        `${confidence}%`
    );


    const confidenceBar =
        getElement("confidenceBar");


    if (confidenceBar) {

        confidenceBar.style.width =
            `${Math.min(
                Math.max(confidence, 0),
                100
            )}%`;

    }


    // =================================================
    // ATTENDANCE
    // =================================================

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
        attendance.total_classes
    );


    setText(
        "presentClasses",
        attendance.present
    );


    setText(
        "absentClasses",
        attendance.absent
    );


    // =================================================
    // ACADEMIC
    // =================================================

    const averageMarks =
        Number(
            academic.average_marks || 0
        );


    setText(
        "averageMarks",
        `${averageMarks.toFixed(2)}%`
    );


    // =================================================
    // REASON
    // =================================================

    setText(
        "predictionReason",
        prediction.reason ||
        "Prediction generated using attendance and academic performance data."
    );


    // =================================================
    // REQUIRED ATTENDANCE
    // =================================================

    const requiredPercentage =
        Number(
            shortage.required_percentage || 75
        );


    setText(
        "requiredPercentage",
        `${requiredPercentage}%`
    );


    // =================================================
    // ATTENDANCE RECOVERY
    // =================================================

    setText(
        "currentAttendance",
        `${Number(
            shortage.current_percentage ||
            attendancePercentage
        )}%`
    );


    setText(
        "targetAttendance",
        `${requiredPercentage}%`
    );


    setText(
        "classesToAttend",
        shortage.classes_to_attend ?? 0
    );


    // =================================================
    // TARGET STATUS
    // =================================================

    const targetStatus =
        getElement("targetStatus");


    if (targetStatus) {

        if (shortage.can_reach_target) {

            targetStatus.textContent =
                "Target achievable";

            targetStatus.className =
                "target-status success";

        }
        else {

            targetStatus.textContent =
                "Target difficult to reach";

            targetStatus.className =
                "target-status danger";

        }

    }


    // =================================================
    // SHORTAGE MESSAGE
    // =================================================

    setText(
        "shortageMessage",
        shortage.message ||
        "Attendance is currently on track."
    );


    // =================================================
    // LAST UPDATED
    // =================================================

    const lastUpdated =
        getElement("lastUpdated");


    if (lastUpdated) {

        lastUpdated.textContent =
            new Date().toLocaleString();

    }


    // =================================================
    // RISK STATUS COLORS
    // =================================================

    updateRiskStyle(risk);


    // =================================================
    // EARLY WARNING
    // =================================================

    console.log(
        "⚠️ Early warning:",
        earlyWarning
    );


    hideLoading();


    console.log(
        "✅ Prediction data displayed."
    );

}


// =========================================================
// RISK STYLE
// =========================================================

function updateRiskStyle(risk) {

    const riskElement =
        getElement("riskLevel");


    if (!riskElement) {

        return;

    }


    riskElement.classList.remove(
        "low",
        "medium",
        "high",
        "critical"
    );


    const normalizedRisk =
        String(risk)
            .toLowerCase();


    riskElement.classList.add(
        normalizedRisk
    );

}


// =========================================================
// REFRESH BUTTON
// =========================================================

function setupRefreshButton() {

    const button =
        getElement("refreshBtn");


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        async () => {

            console.log(
                "🔄 Manual AI prediction refresh..."
            );


            await loadPrediction();

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

        return;

    }


    button.addEventListener(
        "click",
        async () => {

            console.log(
                "🔁 Retrying AI prediction..."
            );


            await loadPrediction();

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

            localStorage.removeItem(
                "studentId"
            );


            window.location.href =
                "login.html";

        }
    );

}


// =========================================================
// FINAL LOG
// =========================================================

console.log(
    "✅ ai-prediction.js loaded successfully."
);
