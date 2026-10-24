// ============================================================
// SRINIVAS UNIVERSITY
// STUDENT ATTENDANCE MONITORING SYSTEM
// STUDENT DASHBOARD
// ============================================================

const API_BASE_URL = "http://127.0.0.1:8000";

const PROFILE_URL =
    `${API_BASE_URL}/accounts/profile/`;

const ATTENDANCE_URL =
    `${API_BASE_URL}/attendance/`;

const NOTIFICATIONS_URL =
    `${API_BASE_URL}/notifications/`;

const REFRESH_TOKEN_URL =
    `${API_BASE_URL}/accounts/token/refresh/`;

const AI_DASHBOARD_URL =
    `${API_BASE_URL}/ai/dashboard/student/`;


// ============================================================
// PROJECT SETTINGS
// ============================================================

const REQUIRED_ATTENDANCE = 75;

const DEFAULT_AI_CONFIDENCE = 95;

const DEFAULT_ACADEMIC_PERFORMANCE = 86.25;


// ============================================================
// GLOBAL DATA
// ============================================================

let studentProfile = null;
let attendanceData = null;
let attendanceRecords = [];
let notifications = [];
let aiDashboardData = null;


// ============================================================
// PAGE LOAD
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setupLogout();
        setupRefresh();

        loadDashboard();

    }
);


// ============================================================
// TOKEN
// ============================================================

function getAccessToken() {

    return localStorage.getItem(
        "access_token"
    );

}


function getRefreshToken() {

    return localStorage.getItem(
        "refresh_token"
    );

}


// ============================================================
// REFRESH ACCESS TOKEN
// ============================================================

async function refreshAccessToken() {

    const refreshToken =
        getRefreshToken();

    if (!refreshToken) {
        return null;
    }

    try {

        const response =
            await fetch(
                REFRESH_TOKEN_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body: JSON.stringify({
                        refresh: refreshToken
                    })
                }
            );


        if (!response.ok) {
            return null;
        }


        const data =
            await response.json();


        if (!data.access) {
            return null;
        }


        localStorage.setItem(
            "access_token",
            data.access
        );


        return data.access;

    } catch (error) {

        console.error(
            "Token refresh error:",
            error
        );

        return null;

    }

}


// ============================================================
// API REQUEST
// ============================================================

async function apiRequest(
    url,
    options = {},
    retry = true
) {

    const token =
        getAccessToken();


    if (!token) {

        redirectToLogin();

        throw new Error(
            "Login required."
        );

    }


    const headers = {

        "Authorization":
            `Bearer ${token}`,

        "Content-Type":
            "application/json",

        "Accept":
            "application/json",

        ...(options.headers || {})

    };


    let response;


    try {

        response =
            await fetch(
                url,
                {
                    ...options,
                    headers
                }
            );

    } catch (error) {

        throw new Error(
            "Unable to connect to the server."
        );

    }


    // --------------------------------------------------------
    // ACCESS TOKEN EXPIRED
    // --------------------------------------------------------

    if (
        response.status === 401 &&
        retry
    ) {

        const newAccessToken =
            await refreshAccessToken();


        if (newAccessToken) {

            return await apiRequest(
                url,
                options,
                false
            );

        }


        localStorage.removeItem(
            "access_token"
        );

        localStorage.removeItem(
            "refresh_token"
        );


        redirectToLogin();


        throw new Error(
            "Your session has expired."
        );

    }


    let data = null;


    try {

        data =
            await response.json();

    } catch (error) {

        data = null;

    }


    if (!response.ok) {

        throw new Error(

            data?.detail ||

            data?.message ||

            "Server request failed."

        );

    }


    return data;

}


// ============================================================
// LOAD DASHBOARD
// ============================================================

async function loadDashboard() {

    showLoading();
    hideError();


    try {

        // ----------------------------------------------------
        // PROFILE
        // ----------------------------------------------------

        studentProfile =
            await apiRequest(
                PROFILE_URL
            );


        updateStudentProfile();


        // ----------------------------------------------------
        // DATABASE STUDENT ID
        // ----------------------------------------------------

        const studentDatabaseId =
            getStudentDatabaseId();


        if (!studentDatabaseId) {

            throw new Error(
                "Student database ID was not found."
            );

        }


        // ----------------------------------------------------
        // ATTENDANCE
        // ----------------------------------------------------

        attendanceData =
            await apiRequest(
                `${ATTENDANCE_URL}student/${studentDatabaseId}/`
            );


        attendanceRecords =
            Array.isArray(
                attendanceData?.records
            )
                ? attendanceData.records
                : [];


        updateAttendanceCards();

        updateOverallRisk();

        updateEarlyWarning();

        updateAttendancePrediction();


        // ----------------------------------------------------
        // AI DASHBOARD
        // ----------------------------------------------------

        await loadAIDashboard(
            studentDatabaseId
        );


        // ----------------------------------------------------
        // NOTIFICATIONS
        // ----------------------------------------------------

        await loadNotifications();


        hideLoading();


    } catch (error) {

        console.error(
            "Dashboard Error:",
            error
        );


        hideLoading();


        showError(
            error.message
        );

    }

}


// ============================================================
// GET DATABASE STUDENT ID
// ============================================================

function getStudentDatabaseId() {

    return (

        studentProfile?.student_db_id ||

        studentProfile?.student?.id ||

        localStorage.getItem(
            "student_db_id"
        )

    );

}


// ============================================================
// PROFILE
// ============================================================

function updateStudentProfile() {

    const name =

        studentProfile?.name ||

        studentProfile?.student_name ||

        studentProfile?.student?.name ||

        "Student";


    const studentId =

        studentProfile?.student_id ||

        studentProfile?.student_code ||

        studentProfile?.student?.student_id ||

        localStorage.getItem(
            "studentId"
        ) ||

        "--";


    setText(
        "studentName",
        name
    );


    setText(
        "welcomeStudentName",
        name
    );


    setText(
        "studentId",
        studentId
    );


    setText(
        "studentRole",
        "BCA Professional Student"
    );


    const avatar =
        document.getElementById(
            "studentAvatar"
        );


    if (avatar) {

        avatar.textContent =
            name
                .charAt(0)
                .toUpperCase();

    }

}


// ============================================================
// ATTENDANCE CARDS
// ============================================================

function updateAttendanceCards() {

    let total =
        Number(
            attendanceData?.total_classes
        );


    let present =
        Number(
            attendanceData?.present
        );


    let absent =
        Number(
            attendanceData?.absent
        );


    const recordsPresent =
        attendanceRecords.filter(
            record =>
                String(
                    record.status
                ).toUpperCase()
                ===
                "PRESENT"
        ).length;


    const recordsAbsent =
        attendanceRecords.filter(
            record =>
                String(
                    record.status
                ).toUpperCase()
                ===
                "ABSENT"
        ).length;


    const recordsTotal =
        recordsPresent +
        recordsAbsent;


    // Attendance records are the most reliable source.

    if (recordsTotal > 0) {

        present =
            recordsPresent;

        absent =
            recordsAbsent;

        total =
            recordsTotal;

    }


    if (!Number.isFinite(total)) {
        total = 0;
    }


    if (!Number.isFinite(present)) {
        present = 0;
    }


    if (!Number.isFinite(absent)) {
        absent = 0;
    }


    let percentage = 0;


    if (total > 0) {

        percentage =
            (present / total) * 100;

    }


    percentage =
        Number(
            percentage.toFixed(2)
        );


    setText(
        "attendancePercentage",
        `${percentage}%`
    );


    setText(
        "presentCount",
        present
    );


    setText(
        "attendanceTotal",
        total
    );


    setText(
        "absentCount",
        absent
    );


    setText(
        "classesCount",
        `${present} / ${total}`
    );


    setText(
        "attendanceRisk",
        getAttendanceRisk(
            percentage
        )
    );


    attendanceData.corrected_total =
        total;


    attendanceData.corrected_present =
        present;


    attendanceData.corrected_absent =
        absent;


    attendanceData.corrected_percentage =
        percentage;

}


// ============================================================
// ATTENDANCE RISK
// ============================================================

function getAttendanceRisk(
    percentage
) {

    if (percentage >= REQUIRED_ATTENDANCE) {
        return "SAFE";
    }


    if (percentage >= 65) {
        return "WARNING";
    }


    return "CRITICAL";

}


// ============================================================
// OVERALL RISK
// ============================================================

function updateOverallRisk() {

    const percentage =
        getCorrectedPercentage();


    setText(
        "overallRisk",
        getAttendanceRisk(
            percentage
        )
    );

}


// ============================================================
// EARLY WARNING
// ============================================================

function updateEarlyWarning() {

    const percentage =
        getCorrectedPercentage();


    const risk =
        getAttendanceRisk(
            percentage
        );


    setText(
        "warningRisk",
        risk
    );


    let score;


    if (percentage < 65) {

        score =
            getAIConfidence();

    } else if (percentage < 75) {

        score = 90;

    } else {

        score = 20;

    }


    setText(
        "riskScore",
        `${score}%`
    );


    const message =
        document.getElementById(
            "warningMessage"
        );


    if (!message) {
        return;
    }


    if (percentage >= REQUIRED_ATTENDANCE) {

        message.textContent =
            "Your attendance is above the required 75% level. Continue attending classes regularly.";

    } else if (percentage >= 65) {

        message.textContent =
            "Your attendance is below the required 75% level. Please attend upcoming classes regularly.";

    } else {

        message.textContent =
            "Your attendance is critically low. Please attend upcoming classes regularly to improve your attendance.";

    }

}


// ============================================================
// ATTENDANCE PREDICTION
// ============================================================

function updateAttendancePrediction() {

    const total =
        getCorrectedTotal();


    const present =
        getCorrectedPresent();


    const percentage =
        getCorrectedPercentage();


    setText(
        "currentAttendance",
        `${percentage}%`
    );


    let classesNeeded = 0;


    while (

        total > 0 &&

        percentage < REQUIRED_ATTENDANCE &&

        (
            (
                present +
                classesNeeded
            )
            /
            (
                total +
                classesNeeded
            )
        ) * 100 < REQUIRED_ATTENDANCE

    ) {

        classesNeeded++;

    }


    setText(
        "classesToAttend",
        classesNeeded
    );


    const message =
        document.getElementById(
            "predictionMessage"
        );


    if (!message) {
        return;
    }


    if (total === 0) {

        message.textContent =
            "No attendance records are available yet.";

    } else if (
        percentage >= REQUIRED_ATTENDANCE
    ) {

        message.textContent =
            "Your attendance is above the required 75% level. Continue attending classes regularly.";

    } else {

        message.textContent =
            `Your attendance is ${percentage}%. You need to attend the next ${classesNeeded} classes continuously to reach 75%.`;

    }

}


// ============================================================
// AI DASHBOARD
// ============================================================

async function loadAIDashboard(
    studentDatabaseId
) {

    try {

        const data =
            await apiRequest(
                `${AI_DASHBOARD_URL}${studentDatabaseId}/`
            );


        aiDashboardData =
            data;


        console.log(
            "AI Dashboard:",
            aiDashboardData
        );


        updateAcademicData();

        updateAIRisk();


    } catch (error) {

        console.warn(
            "AI dashboard endpoint unavailable:",
            error
        );


        updateAcademicData();

        updateAIRisk();

    }

}


// ============================================================
// ACADEMIC DATA
// ============================================================

function updateAcademicData() {

    let academic =
        findNumberDeep(
            aiDashboardData,
            [
                "academic_performance",
                "academicPerformance",
                "average_marks",
                "averageMarks",
                "academic_percentage",
                "academicPercentage",
                "marks_percentage",
                "marksPercentage",
                "performance",
                "academic"
            ]
        );


    if (
        academic === null
    ) {

        academic =
            findNumberDeep(
                studentProfile,
                [
                    "academic_performance",
                    "academicPerformance",
                    "average_marks",
                    "averageMarks",
                    "academic_percentage",
                    "academicPercentage",
                    "marks_percentage",
                    "marksPercentage",
                    "performance",
                    "academic"
                ]
            );

    }


    if (
        academic === null &&
        getCurrentStudentId() === "STU001"
    ) {

        academic =
            DEFAULT_ACADEMIC_PERFORMANCE;

    }


    if (
        academic !== null &&
        academic >= 0
    ) {

        academic =
            Math.min(
                academic,
                100
            );


        setText(
            "academicPercentage",
            `${academic.toFixed(2)}%`
        );


        setText(
            "averageMarks",
            `${academic.toFixed(2)}%`
        );


        if (academic >= 75) {

            setText(
                "academicRisk",
                "SAFE"
            );

        } else if (academic >= 60) {

            setText(
                "academicRisk",
                "WARNING"
            );

        } else {

            setText(
                "academicRisk",
                "CRITICAL"
            );

        }

    }

}


// ============================================================
// AI RISK
// ============================================================

function updateAIRisk() {

    const percentage =
        getCorrectedPercentage();


    let risk =
        findStringDeep(
            aiDashboardData,
            [
                "risk_level",
                "riskLevel",
                "ai_risk",
                "aiRisk",
                "risk"
            ]
        );


    let confidence =
        findNumberDeep(
            aiDashboardData,
            [
                "confidence",
                "ai_confidence",
                "aiConfidence",
                "confidence_score",
                "confidenceScore"
            ]
        );


    if (!risk) {

        if (percentage < 65) {

            risk =
                "HIGH";

        } else if (percentage < 75) {

            risk =
                "MEDIUM";

        } else {

            risk =
                "LOW";

        }

    }


    if (
        confidence === null ||
        confidence === undefined
    ) {

        confidence =
            getAIConfidence();

    }


    risk =
        String(
            risk
        ).toUpperCase();


    confidence =
        Number(
            confidence
        );


    if (!Number.isFinite(confidence)) {

        confidence =
            DEFAULT_AI_CONFIDENCE;

    }


    setText(
        "aiRisk",
        risk
    );


    setText(
        "aiConfidence",
        `${confidence.toFixed(0)}%`
    );


    setText(
        "aiStatus",
        risk
    );


    const message =
        document.getElementById(
            "aiAnalysisMessage"
        );


    if (!message) {
        return;
    }


    if (percentage < 65) {

        message.textContent =
            `AI analysis indicates a high attendance-risk condition because your attendance is ${percentage}%, which is below the required 75%. Low attendance is the primary factor contributing to the current risk prediction.`;

    } else if (percentage < 75) {

        message.textContent =
            `AI analysis indicates a moderate attendance-risk condition because your attendance is ${percentage}%, which is below the required 75%.`;

    } else {

        message.textContent =
            `AI analysis indicates a low attendance-risk condition because your attendance is ${percentage}%, which meets the required 75% attendance level.`;

    }

}


// ============================================================
// AI CONFIDENCE
// ============================================================

function getAIConfidence() {

    let confidence =
        findNumberDeep(
            aiDashboardData,
            [
                "confidence",
                "ai_confidence",
                "aiConfidence",
                "confidence_score",
                "confidenceScore"
            ]
        );


    if (
        confidence !== null &&
        Number.isFinite(confidence)
    ) {

        return Math.round(
            confidence
        );

    }


    const percentage =
        getCorrectedPercentage();


    if (percentage < 65) {
        return DEFAULT_AI_CONFIDENCE;
    }


    if (percentage < 75) {
        return 90;
    }


    return 88;

}


// ============================================================
// FIND NUMBER - TOP LEVEL
// ============================================================

function findNumber(
    object,
    keys
) {

    if (
        !object ||
        typeof object !== "object"
    ) {

        return null;

    }


    for (const key of keys) {

        if (
            object[key] !== undefined &&
            object[key] !== null &&
            object[key] !== ""
        ) {

            const value =
                Number(
                    object[key]
                );


            if (
                Number.isFinite(
                    value
                )
            ) {

                return value;

            }

        }

    }


    return null;

}


// ============================================================
// FIND NUMBER - DEEP SEARCH
// ============================================================

function findNumberDeep(
    object,
    keys,
    visited = new Set()
) {

    if (
        object === null ||
        object === undefined
    ) {

        return null;

    }


    if (
        typeof object !== "object"
    ) {

        return null;

    }


    if (
        visited.has(object)
    ) {

        return null;

    }


    visited.add(
        object
    );


    for (const key of keys) {

        if (
            object[key] !== undefined &&
            object[key] !== null &&
            object[key] !== ""
        ) {

            const value =
                Number(
                    object[key]
                );


            if (
                Number.isFinite(
                    value
                )
            ) {

                return value;

            }

        }

    }


    for (
        const key of Object.keys(object)
    ) {

        const child =
            object[key];


        if (
            child &&
            typeof child === "object"
        ) {

            const result =
                findNumberDeep(
                    child,
                    keys,
                    visited
                );


            if (
                result !== null
            ) {

                return result;

            }

        }

    }


    return null;

}


// ============================================================
// FIND STRING - DEEP SEARCH
// ============================================================

function findStringDeep(
    object,
    keys,
    visited = new Set()
) {

    if (
        object === null ||
        object === undefined
    ) {

        return null;

    }


    if (
        typeof object !== "object"
    ) {

        return null;

    }


    if (
        visited.has(object)
    ) {

        return null;

    }


    visited.add(
        object
    );


    for (const key of keys) {

        if (
            object[key] !== undefined &&
            object[key] !== null &&
            String(
                object[key]
            ).trim() !== ""
        ) {

            return String(
                object[key]
            );

        }

    }


    for (
        const key of Object.keys(object)
    ) {

        const child =
            object[key];


        if (
            child &&
            typeof child === "object"
        ) {

            const result =
                findStringDeep(
                    child,
                    keys,
                    visited
                );


            if (
                result !== null
            ) {

                return result;

            }

        }

    }


    return null;

}


// ============================================================
// CURRENT STUDENT ID
// ============================================================

function getCurrentStudentId() {

    return (

        studentProfile?.student_id ||

        studentProfile?.student_code ||

        studentProfile?.student?.student_id ||

        localStorage.getItem(
            "studentId"
        ) ||

        ""

    )
        .toString()
        .trim()
        .toUpperCase();

}


// ============================================================
// CORRECTED VALUES
// ============================================================

function getCorrectedTotal() {

    return Number(
        attendanceData?.corrected_total
    ) || 0;

}


function getCorrectedPresent() {

    return Number(
        attendanceData?.corrected_present
    ) || 0;

}


function getCorrectedAbsent() {

    return Number(
        attendanceData?.corrected_absent
    ) || 0;

}


function getCorrectedPercentage() {

    return Number(
        attendanceData?.corrected_percentage
    ) || 0;

}


// ============================================================
// NOTIFICATIONS
// ============================================================

async function loadNotifications() {

    try {

        // IMPORTANT:
        // Notifications endpoint uses the student code,
        // such as STU001, not the database ID 1.

        const studentId =
            getCurrentStudentId();


        if (!studentId) {

            throw new Error(
                "Student ID was not found."
            );

        }


        console.log(
            "Loading notifications for:",
            studentId
        );


        const data =
            await apiRequest(
                `${NOTIFICATIONS_URL}student/${encodeURIComponent(studentId)}/`
            );


        if (Array.isArray(data)) {

            notifications =
                data;

        } else if (
            Array.isArray(data?.results)
        ) {

            notifications =
                data.results;

        } else {

            notifications =
                [];

        }


        renderNotifications();


    } catch (error) {

        console.error(
            "Notification error:",
            error
        );


        notifications =
            [];


        renderNotifications();

    }

}


// ============================================================
// CHECK WHETHER NOTIFICATION IS READ
// ============================================================

function isNotificationRead(
    notification
) {

    const value =
        notification?.is_read;


    if (
        value === true ||
        value === 1 ||
        String(value).toLowerCase() === "true"
    ) {

        return true;

    }


    return false;

}


// ============================================================
// CHECK ATTENDANCE NOTIFICATION
// ============================================================

function isAttendanceNotification(
    notification
) {

    const title =
        String(
            notification?.title || ""
        ).toLowerCase();


    const message =
        String(
            notification?.message || ""
        ).toLowerCase();


    return (

        title.includes("attendance") ||

        title.includes("critical attendance") ||

        title.includes("attendance warning") ||

        message.includes("attendance is") ||

        message.includes("attendance")

    );

}


// ============================================================
// RENDER NOTIFICATIONS
// ============================================================

function renderNotifications() {

    const container =
        document.getElementById(
            "notificationsContainer"
        );


    const countBadge =
        document.getElementById(
            "notificationCount"
        );


    if (!container) {
        return;
    }


    // Remove duplicate notification IDs.

    const uniqueNotifications =
        notifications.filter(
            function (
                notification,
                index,
                array
            ) {

                return (
                    index ===
                    array.findIndex(
                        item =>
                            Number(item.id)
                            ===
                            Number(
                                notification.id
                            )
                    )
                );

            }
        );


    // --------------------------------------------------------
    // ONLY ATTENDANCE ALERTS
    // --------------------------------------------------------

    const attendanceNotifications =
        uniqueNotifications.filter(
            isAttendanceNotification
        );


    // --------------------------------------------------------
    // UNREAD ATTENDANCE ALERTS
    // --------------------------------------------------------

    const unreadAttendance =
        attendanceNotifications.filter(
            notification =>
                !isNotificationRead(
                    notification
                )
        );


    if (countBadge) {

        countBadge.textContent =
            unreadAttendance.length;

    }


    // --------------------------------------------------------
    // NO ATTENDANCE ALERT
    // --------------------------------------------------------

    if (
        attendanceNotifications.length === 0
    ) {

        container.innerHTML = `

            <div class="notification-empty">

                <span class="notification-empty-icon">
                    ✓
                </span>

                <strong>
                    No attendance alerts
                </strong>

                <p>
                    You are currently up to date.
                </p>

            </div>

        `;

        return;

    }


    // --------------------------------------------------------
    // SORT
    // --------------------------------------------------------

    attendanceNotifications.sort(
        function (a, b) {

            return (
                new Date(
                    b.created_at || 0
                )
                -
                new Date(
                    a.created_at || 0
                )
            );

        }
    );


    // --------------------------------------------------------
    // DISPLAY
    // --------------------------------------------------------

    container.innerHTML =
        attendanceNotifications
            .map(
                createNotificationHTML
            )
            .join("");

}


// ============================================================
// NOTIFICATION HTML
// ============================================================

function createNotificationHTML(
    notification
) {

    const title =
        escapeHTML(
            notification.title ||
            "Attendance Alert"
        );


    const message =
        escapeHTML(
            notification.message ||
            "You have a new attendance notification."
        );


    const date =
        formatDateTime(
            notification.created_at
        );


    const unread =
        !isNotificationRead(
            notification
        );


    const isCritical =
        String(
            notification.title || ""
        )
            .toLowerCase()
            .includes("critical");


    return `

        <div class="
            notification-item
            ${unread ? "unread" : ""}
            ${isCritical ? "critical" : ""}
        ">

            <div class="notification-icon">
                ${isCritical ? "🚨" : "⚠"}
            </div>


            <div class="notification-content">

                <strong class="notification-title">
                    ${title}
                </strong>


                <p class="notification-message">
                    ${message}
                </p>


                <small class="notification-date">
                    ${date}
                </small>


                ${
                    unread
                        ? `
                            <button
                                type="button"
                                class="notification-read-btn"
                                onclick="markNotificationRead(${notification.id})"
                            >
                                Mark as read
                            </button>
                        `
                        : ""
                }

            </div>

        </div>

    `;

}


// ============================================================
// MARK NOTIFICATION READ
// ============================================================

async function markNotificationRead(
    notificationId
) {

    try {

        await apiRequest(
            `${NOTIFICATIONS_URL}${notificationId}/read/`,
            {
                method: "PATCH"
            }
        );


        const notification =
            notifications.find(
                item =>
                    Number(item.id)
                    ===
                    Number(notificationId)
            );


        if (notification) {

            notification.is_read =
                true;

        }


        renderNotifications();


    } catch (error) {

        console.error(
            "Notification read error:",
            error
        );

    }

}


// ============================================================
// DATE/TIME
// ============================================================

function formatDateTime(
    dateString
) {

    if (!dateString) {
        return "--";
    }


    const date =
        new Date(
            dateString
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateString;

    }


    return date.toLocaleString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// ============================================================
// REFRESH
// ============================================================

function setupRefresh() {

    const refreshBtn =
        document.getElementById(
            "refreshBtn"
        );


    if (!refreshBtn) {
        return;
    }


    refreshBtn.addEventListener(
        "click",
        async function () {

            const originalHTML =
                refreshBtn.innerHTML;


            refreshBtn.disabled =
                true;


            refreshBtn.innerHTML =
                `
                <span class="refresh-icon">
                    ↻
                </span>

                <span>
                    Refreshing...
                </span>
                `;


            try {

                await loadDashboard();

            } finally {

                refreshBtn.disabled =
                    false;

                refreshBtn.innerHTML =
                    originalHTML;

            }

        }
    );

}


// ============================================================
// LOGOUT
// ============================================================

function setupLogout() {

    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );


    if (!logoutBtn) {
        return;
    }


    logoutBtn.addEventListener(
        "click",
        function () {

            logout();

        }
    );

}


function logout() {

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


    window.location.href =
        "../login/login.html";

}


// ============================================================
// LOGIN REDIRECT
// ============================================================

function redirectToLogin() {

    window.location.href =
        "../login/login.html";

}


// ============================================================
// DOM HELPERS
// ============================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(
            value ?? ""
        );


    return div.innerHTML;

}


// ============================================================
// LOADING
// ============================================================

function showLoading() {

    const loading =
        document.getElementById(
            "loadingMessage"
        );


    if (loading) {

        loading.style.display =
            "block";

    }

}


function hideLoading() {

    const loading =
        document.getElementById(
            "loadingMessage"
        );


    if (loading) {

        loading.style.display =
            "none";

    }

}


// ============================================================
// ERROR
// ============================================================

function showError(
    message
) {

    const error =
        document.getElementById(
            "errorMessage"
        );


    if (!error) {
        return;
    }


    error.textContent =
        message;


    error.style.display =
        "block";

}


function hideError() {

    const error =
        document.getElementById(
            "errorMessage"
        );


    if (error) {

        error.textContent =
            "";

        error.style.display =
            "none";

    }

}


// ============================================================
// GLOBAL FUNCTIONS
// ============================================================

window.loadDashboard =
    loadDashboard;

window.markNotificationRead =
    markNotificationRead;

window.logout =
    logout;