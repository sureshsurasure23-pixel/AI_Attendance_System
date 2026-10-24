/* =========================================================
   AI ATTEND - AI PREDICTION
   Django REST API Integration
========================================================= */

"use strict";


/* =========================================================
   API CONFIGURATION
========================================================= */

const API_BASE_URL = "http://127.0.0.1:8000";

const PROFILE_URL =
    `${API_BASE_URL}/accounts/profile/`;

const REFRESH_URL =
    `${API_BASE_URL}/accounts/token/refresh/`;


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);


function setText(id, value) {

    const element = $(id);

    if (element) {
        element.textContent = value ?? "--";
    }
}


function showElement(id) {

    const element = $(id);

    if (element) {
        element.classList.remove("hidden");
    }
}


function hideElement(id) {

    const element = $(id);

    if (element) {
        element.classList.add("hidden");
    }
}


/* =========================================================
   TOKEN MANAGEMENT
========================================================= */

function getAccessToken() {

    return localStorage.getItem("access_token");
}


function getRefreshToken() {

    return localStorage.getItem("refresh_token");
}


/* =========================================================
   REFRESH JWT TOKEN
========================================================= */

async function refreshAccessToken() {

    const refreshToken = getRefreshToken();

    if (!refreshToken) {
        return false;
    }

    try {

        const response = await fetch(REFRESH_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                refresh: refreshToken
            })

        });


        if (!response.ok) {

            clearAuthentication();

            return false;
        }


        const data = await response.json();


        if (!data.access) {

            clearAuthentication();

            return false;
        }


        localStorage.setItem(
            "access_token",
            data.access
        );


        return true;

    } catch (error) {

        console.error(
            "Token refresh error:",
            error
        );

        return false;
    }
}


/* =========================================================
   API FETCH
========================================================= */

async function apiFetch(
    url,
    options = {},
    retry = true
) {

    const token = getAccessToken();


    const headers = {
        ...(options.headers || {})
    };


    if (token) {

        headers.Authorization =
            `Bearer ${token}`;
    }


    if (
        !headers["Content-Type"] &&
        options.body &&
        !(options.body instanceof FormData)
    ) {

        headers["Content-Type"] =
            "application/json";
    }


    const response = await fetch(url, {

        ...options,

        headers

    });


    /* TOKEN EXPIRED */

    if (
        response.status === 401 &&
        retry
    ) {

        const refreshed =
            await refreshAccessToken();


        if (refreshed) {

            return apiFetch(
                url,
                options,
                false
            );
        }
    }


    return response;
}


/* =========================================================
   PROFILE
========================================================= */

async function loadStudentProfile() {

    const response =
        await apiFetch(PROFILE_URL);


    if (!response.ok) {

        throw new Error(
            "Unable to load student profile."
        );
    }


    const profile =
        await response.json();


    return profile;
}


/* =========================================================
   LOAD PROFILE INTO UI
========================================================= */

function renderStudentProfile(profile) {

    const name =
        profile.student_name ||
        profile.name ||
        profile.full_name ||
        localStorage.getItem("user") ||
        "Student";


    const studentId =
        profile.student_id ||
        localStorage.getItem("studentId") ||
        "N/A";


    setText(
        "topStudentName",
        name
    );


    setText(
        "studentName",
        name
    );


    setText(
        "studentId",
        studentId
    );


    const firstLetter =
        name.trim().charAt(0).toUpperCase() ||
        "S";


    setText(
        "studentAvatar",
        firstLetter
    );


    setText(
        "studentLargeAvatar",
        firstLetter
    );


    if (profile.student_db_id) {

        localStorage.setItem(
            "student_db_id",
            profile.student_db_id
        );
    }


    if (profile.student_id) {

        localStorage.setItem(
            "studentId",
            profile.student_id
        );
    }


    if (profile.student_name) {

        localStorage.setItem(
            "user",
            profile.student_name
        );
    }


    return profile;
}


/* =========================================================
   GET DATABASE STUDENT ID
========================================================= */

function getStudentDatabaseId(profile) {

    return (
        profile.student_db_id ||
        localStorage.getItem("student_db_id")
    );
}


/* =========================================================
   AI ENDPOINT
========================================================= */

async function loadAIPrediction(studentDbId) {

    if (!studentDbId) {

        throw new Error(
            "Student database ID was not found."
        );
    }


    const url =
        `${API_BASE_URL}/ai/dashboard/student/${studentDbId}/`;


    const response =
        await apiFetch(url);


    if (!response.ok) {

        let message =
            `AI prediction request failed (${response.status}).`;


        try {

            const errorData =
                await response.json();


            if (errorData.detail) {

                message =
                    errorData.detail;
            }

        } catch (error) {

            // Ignore JSON parsing errors.
        }


        throw new Error(message);
    }


    return await response.json();
}


/* =========================================================
   NUMBER HELPERS
========================================================= */

function numberValue(
    value,
    fallback = 0
) {

    const number =
        Number(value);


    return Number.isFinite(number)
        ? number
        : fallback;
}


function clamp(
    value,
    minimum = 0,
    maximum = 100
) {

    return Math.min(
        maximum,
        Math.max(
            minimum,
            value
        )
    );
}


/* =========================================================
   CONFIDENCE NORMALIZATION
========================================================= */

function normalizeConfidence(value) {

    let confidence =
        numberValue(value, 0);


    /*
       Backend may return:

       95

       OR

       0.95
    */

    if (
        confidence >= 0 &&
        confidence <= 1
    ) {

        confidence *= 100;
    }


    return clamp(confidence);
}


/* =========================================================
   PERCENTAGE FORMATTING
========================================================= */

function formatPercentage(value) {

    const number =
        numberValue(value, 0);


    return number.toFixed(2);
}


/* =========================================================
   RISK FORMATTING
========================================================= */

function formatRisk(value) {

    if (!value) {

        return "UNKNOWN";
    }


    return String(value)
        .replace(/_/g, " ")
        .toUpperCase();
}


/* =========================================================
   ATTENDANCE RISK
========================================================= */

function getAttendanceRisk(
    attendance
) {

    const percentage =
        numberValue(attendance);


    if (percentage < 60) {

        return "CRITICAL";
    }


    if (percentage < 75) {

        return "HIGH";
    }


    if (percentage < 85) {

        return "MODERATE";
    }


    return "SAFE";
}


/* =========================================================
   CLASSES REQUIRED
========================================================= */

function calculateClassesToAttend(
    present,
    total,
    target = 75
) {

    present =
        numberValue(present);


    total =
        numberValue(total);


    target =
        numberValue(target, 75);


    if (total <= 0) {

        return 0;
    }


    const current =
        present / total * 100;


    if (current >= target) {

        return 0;
    }


    /*
       Formula:

       (present + x)
       ---------------- >= target
          (total + x)

       x =
       (target * total - 100 * present)
       /
       (100 - target)
    */

    const required =
        Math.ceil(
            (
                (target * total) -
                (100 * present)
            ) /
            (100 - target)
        );


    return Math.max(
        0,
        required
    );
}


/* =========================================================
   PREDICTION REASON
========================================================= */

function createPredictionReason(
    attendance,
    marks,
    risk
) {

    if (attendance < 75) {

        return `Your attendance is currently ${formatPercentage(attendance)}%, which is below the required 75%. Low attendance is the primary factor contributing to your current academic risk prediction.`;
    }


    if (marks < 50) {

        return `Your academic performance is currently ${formatPercentage(marks)}%. Improving your academic performance can help reduce your predicted academic risk.`;
    }


    if (
        String(risk).toUpperCase() === "LOW"
    ) {

        return "Your attendance and academic performance are currently in a healthy range. Continue maintaining regular attendance and consistent academic performance.";
    }


    return "Your AI risk prediction is based on your attendance and academic performance data.";
}


/* =========================================================
   RECOMMENDATION
========================================================= */

function createRecommendation(
    attendance,
    marks,
    risk,
    classesToAttend
) {

    if (attendance < 75) {

        if (classesToAttend > 0) {

            return `Prioritize attendance. You need to attend the next ${classesToAttend} classes consecutively to reach the required 75% attendance level.`;
        }


        return "Your attendance is below the required 75%. Attend all upcoming classes regularly to improve your attendance.";
    }


    if (marks < 50) {

        return "Focus on improving your academic performance through regular revision, assignments, and subject practice.";
    }


    if (
        String(risk).toUpperCase() === "LOW"
    ) {

        return "Continue maintaining regular attendance and consistent academic performance.";
    }


    return "Maintain regular attendance and continue improving your academic performance.";
}


/* =========================================================
   RISK CSS
========================================================= */

function applyRiskTheme(
    element,
    risk
) {

    if (!element) {

        return;
    }


    element.classList.remove(
        "risk-high",
        "risk-medium",
        "risk-low"
    );


    const normalized =
        String(risk || "")
            .toLowerCase();


    if (
        normalized.includes("high") ||
        normalized.includes("critical")
    ) {

        element.classList.add(
            "risk-high"
        );

    } else if (
        normalized.includes("medium") ||
        normalized.includes("moderate")
    ) {

        element.classList.add(
            "risk-medium"
        );

    } else if (
        normalized.includes("low") ||
        normalized.includes("safe")
    ) {

        element.classList.add(
            "risk-low"
        );
    }
}


/* =========================================================
   PROGRESS BAR
========================================================= */

function setProgress(
    elementId,
    percentage
) {

    const element =
        $(elementId);


    if (!element) {

        return;
    }


    const value =
        clamp(
            numberValue(percentage)
        );


    element.style.width =
        `${value}%`;
}


/* =========================================================
   RENDER AI DATA
========================================================= */

function renderAIPrediction(data) {

    console.log(
        "AI Prediction Response:",
        data
    );


    /* -----------------------------------------
       AI PREDICTION
    ----------------------------------------- */

    const prediction =
        data.ml_prediction ||
        data.prediction ||
        {};


    const risk =
        prediction.risk_level ||
        data.risk_level ||
        "UNKNOWN";


    const confidence =
        normalizeConfidence(
            prediction.confidence ??
            data.confidence ??
            0
        );


    /* -----------------------------------------
       ATTENDANCE
    ----------------------------------------- */

    const attendance =
        data.attendance ||
        {};


    const attendancePercentage =
        numberValue(
            attendance.percentage ??
            data.attendance_percentage ??
            0
        );


    const totalClasses =
        numberValue(
            attendance.total_classes ??
            data.total_classes ??
            0
        );


    const presentClasses =
        numberValue(
            attendance.present ??
            data.present ??
            0
        );


    const absentClasses =
        numberValue(
            attendance.absent ??
            data.absent ??
            0
        );


    const attendanceRisk =
        attendance.risk_level ||
        data.attendance_risk ||
        getAttendanceRisk(
            attendancePercentage
        );


    /* -----------------------------------------
       ACADEMIC
    ----------------------------------------- */

    const academic =
        data.academic ||
        {};


    const averageMarks =
        numberValue(
            academic.average_marks ??
            data.average_marks ??
            0
        );


    /* -----------------------------------------
       SHORTAGE
    ----------------------------------------- */

    const shortage =
        data.attendance_shortage ||
        {};


    let classesToAttend =
        shortage.classes_to_attend;


    if (
        classesToAttend === undefined ||
        classesToAttend === null
    ) {

        classesToAttend =
            calculateClassesToAttend(
                presentClasses,
                totalClasses,
                75
            );
    }


    classesToAttend =
        numberValue(
            classesToAttend
        );


    /* -----------------------------------------
       REASON
    ----------------------------------------- */

    const backendReason =
        prediction.reason ||
        data.reason;


    /*
       IMPORTANT:
       When attendance is below 75%,
       always show the specific attendance
       explanation instead of a generic
       backend message.
    */

    let reason;


    if (attendancePercentage < 75) {

        reason =
            createPredictionReason(
                attendancePercentage,
                averageMarks,
                risk
            );

    } else {

        reason =
            backendReason ||
            createPredictionReason(
                attendancePercentage,
                averageMarks,
                risk
            );
    }


    /* -----------------------------------------
       RENDER KPI
    ----------------------------------------- */

    setText(
        "predictionStatus",
        "AI Analysis Complete"
    );


    setText(
        "riskLevel",
        formatRisk(risk)
    );


    setText(
        "aiRisk",
        formatRisk(risk)
    );


    setText(
        "confidence",
        confidence.toFixed(0)
    );


    setText(
        "attendancePercentage",
        formatPercentage(
            attendancePercentage
        )
    );


    setText(
        "averageMarks",
        formatPercentage(
            averageMarks
        )
    );


    /* -----------------------------------------
       REASON
    ----------------------------------------- */

    setText(
        "predictionReason",
        reason
    );


    /* -----------------------------------------
       RECOMMENDATION
    ----------------------------------------- */

    const recommendation =
        createRecommendation(
            attendancePercentage,
            averageMarks,
            risk,
            classesToAttend
        );


    setText(
        "recommendationText",
        recommendation
    );


    /* -----------------------------------------
       ATTENDANCE
    ----------------------------------------- */

    setText(
        "attendanceRiskPercentage",
        formatPercentage(
            attendancePercentage
        )
    );


    setText(
        "attendanceRisk",
        formatRisk(attendanceRisk)
    );


    setText(
        "totalClasses",
        totalClasses
    );


    setText(
        "presentClasses",
        presentClasses
    );


    setText(
        "absentClasses",
        absentClasses
    );


    /* -----------------------------------------
       RECOVERY
    ----------------------------------------- */

    setText(
        "currentAttendance",
        formatPercentage(
            attendancePercentage
        )
    );


    setText(
        "currentAttendanceRecovery",
        formatPercentage(
            attendancePercentage
        )
    );


    setText(
        "targetAttendance",
        "75"
    );


    setText(
        "classesToAttend",
        classesToAttend
    );


    /* -----------------------------------------
       SHORTAGE MESSAGE
    ----------------------------------------- */

    let shortageMessage = "";


    if (classesToAttend > 0) {

        shortageMessage =
            `You need to attend the next ${classesToAttend} classes consecutively to reach the required 75% attendance level.`;

    } else if (attendancePercentage >= 75) {

        shortageMessage =
            "Your attendance has reached the required 75% attendance level.";

    } else {

        shortageMessage =
            "Continue attending upcoming classes regularly to improve your attendance.";
    }


    /*
       IMPORTANT:
       Do NOT use shortage.message here.

       The backend message is intentionally
       ignored so the frontend can display
       the cleaner message above.
    */


    setText(
        "shortageMessage",
        shortageMessage
    );


    /* -----------------------------------------
       PROGRESS
    ----------------------------------------- */

    setProgress(
        "confidenceBar",
        confidence
    );


    setProgress(
        "attendanceProgressBar",
        attendancePercentage
    );


    /*
       Recovery meter:
       Current attendance relative to 75% target.
    */

    const recoveryProgress =
        clamp(
            (
                attendancePercentage /
                75
            ) * 100
        );


    setProgress(
        "recoveryProgressBar",
        recoveryProgress
    );


    /* -----------------------------------------
       RISK THEME
    ----------------------------------------- */

    applyRiskTheme(
        $("riskCard"),
        risk
    );


    applyRiskTheme(
        $("attendanceRiskCard"),
        attendanceRisk
    );


    /* -----------------------------------------
       TARGET STATUS
    ----------------------------------------- */

    const targetStatus =
        $("targetStatus");


    if (targetStatus) {

        if (attendancePercentage >= 75) {

            targetStatus.textContent =
                "Target achieved";


            targetStatus.style.background =
                "#ecfdf3";


            targetStatus.style.color =
                "#16a34a";

        } else {

            targetStatus.textContent =
                "Improvement required";


            targetStatus.style.background =
                "#fff7ed";


            targetStatus.style.color =
                "#ea580c";
        }
    }


    /* -----------------------------------------
       LAST UPDATED
    ----------------------------------------- */

    setText(
        "lastUpdated",
        "Just now"
    );
}


/* =========================================================
   SHOW / HIDE STATES
========================================================= */

function showPredictionContent() {

    hideElement("loadingState");

    hideElement("errorState");

    showElement("predictionContent");
}


function showLoading() {

    showElement("loadingState");

    hideElement("errorState");

    hideElement("predictionContent");
}


function showPredictionError(
    message
) {

    hideElement("loadingState");

    hideElement("predictionContent");

    showElement("errorState");


    setText(
        "errorMessage",
        message ||
        "Unable to load AI prediction."
    );
}


/* =========================================================
   MAIN LOAD FUNCTION
========================================================= */

async function loadDashboard() {

    try {

        showLoading();


        /*
           STEP 1:
           Load logged-in student profile.
        */

        const profile =
            await loadStudentProfile();


        renderStudentProfile(
            profile
        );


        /*
           STEP 2:
           Get database student ID.
        */

        const studentDbId =
            getStudentDatabaseId(
                profile
            );


        if (!studentDbId) {

            throw new Error(
                "Student database ID is missing. Please login again."
            );
        }


        /*
           STEP 3:
           Load AI prediction.
        */

        const aiData =
            await loadAIPrediction(
                studentDbId
            );


        /*
           STEP 4:
           Render everything.
        */

        renderAIPrediction(
            aiData
        );


        /*
           STEP 5:
           Show dashboard.
        */

        showPredictionContent();


    } catch (error) {

        console.error(
            "AI Dashboard Error:",
            error
        );


        showPredictionError(
            error.message ||
            "Unable to load AI prediction."
        );
    }
}


/* =========================================================
   LOGOUT
========================================================= */

function clearAuthentication() {

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


    localStorage.removeItem(
        "role"
    );


    localStorage.removeItem(
        "user"
    );


    localStorage.removeItem(
        "userData"
    );
}


function logout() {

    clearAuthentication();


    window.location.href =
        "../login/login.html";
}


/* =========================================================
   REFRESH
========================================================= */

async function refreshPage() {

    const button =
        $("refreshBtn");


    if (button) {

        button.disabled = true;


        button.innerHTML =
            "<span>↻</span> Loading...";
    }


    await loadDashboard();


    if (button) {

        button.disabled = false;


        button.innerHTML =
            "<span>↻</span> Refresh";
    }
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {


        /* Refresh */

        const refreshButton =
            $("refreshBtn");


        if (refreshButton) {

            refreshButton.addEventListener(
                "click",
                refreshPage
            );
        }


        /* Retry */

        const retryButton =
            $("retryBtn");


        if (retryButton) {

            retryButton.addEventListener(
                "click",
                loadDashboard
            );
        }


        /* Logout */

        const logoutButton =
            $("logoutBtn");


        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                logout
            );
        }


        /* Load dashboard */

        loadDashboard();

    }
);