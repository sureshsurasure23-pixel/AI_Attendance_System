
// =========================================================
// AI ANALYTICS - ADMIN PORTAL
// =========================================================


// =========================================================
// API CONFIGURATION
// =========================================================

const API_BASE_URL =
    "http://127.0.0.1:8000";


// =========================================================
// GLOBAL VARIABLES
// =========================================================

let students = [];

let selectedStudentId = null;

let currentAIData = null;


// =========================================================
// DOM CONTENT LOADED
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "🤖 AI Analytics page loaded."
        );


        setupAIAnalytics();


    }
);


// =========================================================
// INITIAL SETUP
// =========================================================

function setupAIAnalytics() {

    setupEventListeners();

    loadStudents();


}


// =========================================================
// EVENT LISTENERS
// =========================================================

function setupEventListeners() {


    // -----------------------------------------------------
    // STUDENT SELECT
    // -----------------------------------------------------

    const studentSelect =
        document.getElementById(
            "studentSelect"
        );


    if (studentSelect) {

        studentSelect.addEventListener(
            "change",
            function () {

                const studentId =
                    this.value;


                if (!studentId) {

                    selectedStudentId = null;

                    clearAIData();

                    return;
                }


                selectedStudentId =
                    Number(studentId);


                console.log(
                    "👨‍🎓 Selected student:",
                    selectedStudentId
                );


                loadAIAnalysis(
                    selectedStudentId
                );

            }
        );

    }


    // -----------------------------------------------------
    // REFRESH BUTTON
    // -----------------------------------------------------

    const refreshButton =
        document.getElementById(
            "refreshAIButton"
        );


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            function () {

                if (!selectedStudentId) {

                    showAIError(
                        "Please select a student first."
                    );

                    return;
                }


                loadAIAnalysis(
                    selectedStudentId
                );

            }
        );

    }


    // -----------------------------------------------------
    // RETRY BUTTON
    // -----------------------------------------------------

    const retryButton =
        document.getElementById(
            "retryAIButton"
        );


    if (retryButton) {

        retryButton.addEventListener(
            "click",
            function () {

                if (selectedStudentId) {

                    loadAIAnalysis(
                        selectedStudentId
                    );

                }

            }
        );

    }


    // -----------------------------------------------------
    // LOGOUT
    // -----------------------------------------------------

    const logoutButton =
        document.getElementById(
            "logoutBtn"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logoutAdmin
        );

    }

}


// =========================================================
// GET JWT TOKEN
// =========================================================

function getToken() {

    const possibleKeys = [

        "accessToken",

        "access_token",

        "token",

        "jwtToken",

        "jwt_token"

    ];


    for (
        const key of possibleKeys
    ) {

        const token =
            localStorage.getItem(
                key
            );


        if (token) {

            return token;

        }

    }


    return null;

}


// =========================================================
// LOAD STUDENTS
// =========================================================

async function loadStudents() {

    console.log(
        "👨‍🎓 Loading students..."
    );


    try {


        const token =
            getToken();


        if (!token) {

            console.error(
                "❌ JWT token not found."
            );


            showAIError(
                "Login session not found. Please login again."
            );


            return;

        }


        const response =
            await fetch(
                `${API_BASE_URL}/student-profile/list/`,
                {

                    method: "GET",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"

                    }

                }
            );


        console.log(
            "👨‍🎓 Student API status:",
            response.status
        );


        if (response.status === 401) {

            handleUnauthorized();

            return;

        }


        if (!response.ok) {

            throw new Error(
                `Student API returned ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "👨‍🎓 Student API response:",
            data
        );


        students =
            normalizeStudents(
                data
            );


        console.log(
            "👨‍🎓 Students:",
            students
        );


        populateStudentSelect(
            students
        );


        hideAIError();


    }
    catch (error) {

        console.error(
            "❌ Error loading students:",
            error
        );


        showAIError(
            "Unable to load student list. " +
            error.message
        );

    }

}


// =========================================================
// NORMALIZE STUDENTS
// =========================================================

function normalizeStudents(data) {


    if (Array.isArray(data)) {

        return data;

    }


    if (
        data &&
        Array.isArray(data.results)
    ) {

        return data.results;

    }


    if (
        data &&
        Array.isArray(data.students)
    ) {

        return data.students;

    }


    if (
        data &&
        Array.isArray(data.data)
    ) {

        return data.data;

    }


    return [];

}


// =========================================================
// POPULATE STUDENT SELECT
// =========================================================

function populateStudentSelect(
    studentList
) {


    const select =
        document.getElementById(
            "studentSelect"
        );


    if (!select) {

        console.warn(
            "⚠️ studentSelect not found."
        );


        return;

    }


    select.innerHTML = `

        <option value="">
            Select a student
        </option>

    `;


    studentList.forEach(
        function (student) {


            const id =
                student.id;


            const studentCode =
                student.student_id ||
                student.usn ||
                "";


            const name =
                student.name ||
                "Student";


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                id;


            option.textContent =
                studentCode
                    ? `${studentCode} - ${name}`
                    : name;


            select.appendChild(
                option
            );

        }
    );


}


// =========================================================
// LOAD COMPLETE AI DASHBOARD
// =========================================================

async function loadAIAnalysis(
    studentId
) {


    if (!studentId) {

        return;

    }


    showAILoading();


    hideAIError();


    console.log(
        "🤖 Loading AI analysis for student:",
        studentId
    );


    try {


        const token =
            getToken();


        if (!token) {

            handleUnauthorized();

            return;

        }


        const url =
            `${API_BASE_URL}/ai/dashboard/student/${studentId}/`;


        console.log(
            "🤖 AI Dashboard API:",
            url
        );


        const response =
            await fetch(
                url,
                {

                    method: "GET",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"

                    }

                }
            );


        console.log(
            "🤖 AI Dashboard status:",
            response.status
        );


        if (response.status === 401) {

            handleUnauthorized();

            return;

        }


        if (response.status === 403) {

            throw new Error(
                "You do not have permission to access AI analytics."
            );

        }


        if (response.status === 404) {

            throw new Error(
                "Student or AI dashboard data was not found."
            );

        }


        if (!response.ok) {

            throw new Error(
                `AI API returned ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "🤖 AI Dashboard response:",
            data
        );


        currentAIData =
            data;


        renderAIAnalysis(
            data
        );


        hideAILoading();


    }
    catch (error) {

        console.error(
            "❌ AI analysis error:",
            error
        );


        hideAILoading();


        showAIError(
            error.message ||
            "Unable to load AI analysis."
        );

    }

}


// =========================================================
// RENDER COMPLETE AI ANALYSIS
// =========================================================

function renderAIAnalysis(
    data
) {


    if (!data) {

        return;

    }


    // =====================================================
    // STUDENT
    // =====================================================

    const student =
        data.student ||
        {};


    const studentName =
        student.name ||
        "Student";


    const studentId =
        student.id ||
        selectedStudentId ||
        "—";


    setText(
        "aiStudentName",
        studentName
    );


    setText(
        "aiStudentId",
        `Student ID: ${studentId}`
    );


    setText(
        "aiStudentAvatar",
        getInitial(
            studentName
        )
    );


    setText(
        "aiStudentInfo",
        `${studentName} • Student ID: ${studentId}`
    );


    // =====================================================
    // ATTENDANCE
    // =====================================================

    const attendance =
        data.attendance ||
        {};


    const attendancePercentage =
        toNumber(
            attendance.percentage
        );


    const totalClasses =
        toNumber(
            attendance.total_classes
        );


    const present =
        toNumber(
            attendance.present
        );


    const absent =
        toNumber(
            attendance.absent
        );


    const attendanceRisk =
        attendance.risk_level ||
        "—";


    setText(
        "aiAttendancePercentage",
        formatPercentage(
            attendancePercentage
        )
    );


    setText(
        "aiAttendanceClasses",
        `${present} present / ${totalClasses} classes`
    );


    setRiskBadge(
        "aiAttendanceRisk",
        attendanceRisk
    );


    setText(
        "aiAttendanceRiskText",
        getAttendanceRiskMessage(
            attendancePercentage
        )
    );


    // =====================================================
    // ACADEMIC
    // =====================================================

    const academic =
        data.academic ||
        {};


    const averageMarks =
        toNumber(
            academic.average_marks ??
            academic.average_percentage
        );


    const subjectsCount =
        toNumber(
            academic.subjects_count
        );


    const academicRisk =
        academic.risk_level ||
        "—";


    setText(
        "aiAcademicAverage",
        formatPercentage(
            averageMarks
        )
    );


    setText(
        "aiAcademicSubjects",
        `${subjectsCount} subjects`
    );


    setRiskBadge(
        "aiAcademicRisk",
        academicRisk
    );


    setText(
        "aiAcademicRiskText",
        getAcademicRiskMessage(
            averageMarks
        )
    );


    // =====================================================
    // ACADEMIC MESSAGE
    // =====================================================

    setText(
        "academicMessage",
        academic.message ||
        "No academic message available."
    );


    // =====================================================
    // ML PREDICTION
    // =====================================================

    const mlPrediction =
        data.ml_prediction ||
        {};


    const mlRisk =
        mlPrediction.risk_level ||
        "—";


    const confidence =
        mlPrediction.confidence;


    const predictionStatus =
        mlPrediction.prediction_status ||
        "Not available";


    const reason =
        mlPrediction.reason ||
        "No prediction reason available.";


    setRiskBadge(
        "aiMLRisk",
        mlRisk
    );


    setText(
        "aiMLReason",
        reason
    );


    setText(
        "aiConfidence",
        `Confidence: ${formatConfidence(confidence)}`
    );


    setText(
        "aiPredictionStatus",
        predictionStatus
    );


    setRiskBadge(
        "aiPredictionStatus",
        predictionStatus
    );


    setText(
        "aiPredictionReason",
        reason
    );


    setText(
        "aiRiskLevel",
        mlRisk
    );


    // =====================================================
    // EARLY WARNING
    // =====================================================

    const earlyWarning =
        data.early_warning ||
        {};


    const riskScore =
        toNumber(
            earlyWarning.risk_score
        );


    const overallRisk =
        earlyWarning.overall_risk ||
        "—";


    const recommendations =
        Array.isArray(
            earlyWarning.recommendations
        )
            ? earlyWarning.recommendations
            : [];


    setText(
        "aiOverallRisk",
        overallRisk
    );


    setText(
        "aiRiskScore",
        `Risk Score: ${riskScore}`
    );


    setRiskBadge(
        "aiOverallRisk",
        overallRisk
    );


    setRiskBadge(
        "earlyWarningBadge",
        overallRisk
    );


    renderRecommendations(
        recommendations
    );


    // =====================================================
    // ATTENDANCE SHORTAGE
    // =====================================================

    const shortage =
        data.attendance_shortage ||
        {};


    const requiredPercentage =
        toNumber(
            shortage.required_percentage ||
            75
        );


    const classesToAttend =
        toNumber(
            shortage.classes_to_attend
        );


    const canReachTarget =
        shortage.can_reach_target;


    const projectedPercentage =
        shortage.projected_percentage;


    const shortageMessage =
        shortage.message ||
        "No attendance shortage message available.";


    setText(
        "shortageRequired",
        formatPercentage(
            requiredPercentage
        )
    );


    setText(
        "shortageClasses",
        classesToAttend
    );


    setText(
        "shortageCanReach",
        formatBoolean(
            canReachTarget
        )
    );


    setText(
        "shortageMessage",
        shortageMessage
    );


    if (
        projectedPercentage !== null &&
        projectedPercentage !== undefined
    ) {

        setText(
            "projectedAttendance",
            formatPercentage(
                projectedPercentage
            )
        );

    }
    else {

        setText(
            "projectedAttendance",
            "—"
        );

    }


    // =====================================================
    // SUBJECTS
    // =====================================================

    renderSubjects(
        academic.subjects
    );


    // =====================================================
    // ATTENDANCE PREDICTION
    // =====================================================

    loadAttendancePrediction(
        selectedStudentId
    );


    // =====================================================
    // UPDATE AI SUMMARY
    // =====================================================

    updateAISummaryClass(
        mlRisk
    );

}


// =========================================================
// ATTENDANCE PREDICTION API
// =========================================================

async function loadAttendancePrediction(
    studentId
) {


    if (!studentId) {

        return;

    }


    try {


        const token =
            getToken();


        if (!token) {

            return;

        }


        const response =
            await fetch(
                `${API_BASE_URL}/ai/prediction/student/${studentId}/`,
                {

                    method: "GET",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"

                    }

                }
            );


        if (!response.ok) {

            console.warn(
                "⚠️ Attendance prediction API failed:",
                response.status
            );


            return;

        }


        const data =
            await response.json();


        console.log(
            "📈 Attendance prediction:",
            data
        );


        renderAttendancePrediction(
            data
        );


    }
    catch (error) {

        console.error(
            "❌ Attendance prediction error:",
            error
        );

    }

}


// =========================================================
// RENDER ATTENDANCE PREDICTION
// =========================================================

function renderAttendancePrediction(
    data
) {


    if (!data) {

        return;

    }


    const current =
        data.current_attendance ||
        {};


    const prediction =
        data.prediction ||
        {};


    const recovery =
        data.recovery ||
        {};


    setText(
        "predictionCurrent",
        formatPercentage(
            current.percentage
        )
    );


    const next10 =
        prediction.next_10_classes_attended ||
        {};


    setText(
        "predictionNext10",
        formatPercentage(
            next10.attendance_percentage
        )
    );


    const next5 =
        prediction.next_5_classes_missed ||
        {};


    setText(
        "predictionNext5",
        formatPercentage(
            next5.attendance_percentage
        )
    );


    setText(
        "classesNeeded",
        recovery.classes_needed_for_75_percent ??
        0
    );


    setText(
        "classesCanMiss",
        recovery.classes_can_miss_while_staying_at_75_percent ??
        0
    );


}


// =========================================================
// RENDER SUBJECTS
// =========================================================

function renderSubjects(
    subjects
) {


    const tableBody =
        document.getElementById(
            "aiSubjectsTableBody"
        );


    if (!tableBody) {

        return;

    }


    if (
        !Array.isArray(subjects) ||
        subjects.length === 0
    ) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    style="text-align:center;"
                >

                    No subject performance
                    data available.

                </td>

            </tr>

        `;


        return;

    }


    let html = "";


    subjects.forEach(
        function (subject) {


            const name =
                subject.name ||
                subject.subject ||
                "Subject";


            const marks =
                toNumber(
                    subject.marks ??
                    subject.percentage
                );


            const percentage =
                toNumber(
                    subject.percentage ??
                    subject.marks
                );


            const performance =
                subject.performance ||
                getPerformance(
                    marks
                );


            html += `

                <tr>

                    <td>
                        ${escapeHTML(
                            String(name)
                        )}
                    </td>

                    <td>
                        ${marks.toFixed(2)}
                    </td>

                    <td>
                        ${percentage.toFixed(2)}%
                    </td>

                    <td>

                        <span
                            class="admin-section-badge ${getPerformanceClass(performance)}"
                        >

                            ${escapeHTML(
                                String(performance)
                            )}

                        </span>

                    </td>

                </tr>

            `;

        }
    );


    tableBody.innerHTML =
        html;

}


// =========================================================
// RENDER RECOMMENDATIONS
// =========================================================

function renderRecommendations(
    recommendations
) {


    const list =
        document.getElementById(
            "aiRecommendations"
        );


    if (!list) {

        return;

    }


    if (
        !Array.isArray(
            recommendations
        ) ||
        recommendations.length === 0
    ) {

        list.innerHTML = `

            <li>
                No specific recommendations available.
            </li>

        `;


        return;

    }


    list.innerHTML =
        recommendations
            .map(
                function (recommendation) {

                    return `

                        <li>
                            ${escapeHTML(
                                String(
                                    recommendation
                                )
                            )}
                        </li>

                    `;

                }
            )
            .join("");

}


// =========================================================
// CLEAR AI DATA
// =========================================================

function clearAIData() {


    setText(
        "aiStudentInfo",
        "No student selected"
    );


    setText(
        "aiStudentName",
        "Student"
    );


    setText(
        "aiStudentId",
        "Student ID: —"
    );


    setText(
        "aiStudentAvatar",
        "S"
    );


    setText(
        "aiAttendancePercentage",
        "0%"
    );


    setText(
        "aiAcademicAverage",
        "0%"
    );


    setText(
        "aiRiskLevel",
        "—"
    );


    setText(
        "aiOverallRisk",
        "—"
    );


    setText(
        "aiConfidence",
        "Confidence: —"
    );


    setText(
        "aiRiskScore",
        "Risk Score: 0"
    );


    setText(
        "predictionCurrent",
        "0%"
    );


    setText(
        "predictionNext10",
        "0%"
    );


    setText(
        "predictionNext5",
        "0%"
    );


    setText(
        "classesNeeded",
        "0"
    );


    setText(
        "classesCanMiss",
        "0"
    );


    setText(
        "projectedAttendance",
        "—"
    );


    setText(
        "academicMessage",
        "Select a student to view academic analysis."
    );


    setText(
        "aiPredictionReason",
        "Select a student to view the AI prediction reason."
    );


    setText(
        "shortageMessage",
        "Select a student to view attendance shortage information."
    );


    const tableBody =
        document.getElementById(
            "aiSubjectsTableBody"
        );


    if (tableBody) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    style="text-align:center;"
                >

                    No student selected.

                </td>

            </tr>

        `;

    }


    const recommendationList =
        document.getElementById(
            "aiRecommendations"
        );


    if (recommendationList) {

        recommendationList.innerHTML = `

            <li>
                Select a student to view recommendations.
            </li>

        `;

    }

}


// =========================================================
// LOADING STATE
// =========================================================

function showAILoading() {


    const loading =
        document.getElementById(
            "aiLoading"
        );


    const content =
        document.getElementById(
            "aiAnalyticsContent"
        );


    if (loading) {

        loading.style.display =
            "block";

    }


    if (content) {

        content.style.opacity =
            "0.5";

    }

}


// =========================================================
// HIDE LOADING
// =========================================================

function hideAILoading() {


    const loading =
        document.getElementById(
            "aiLoading"
        );


    const content =
        document.getElementById(
            "aiAnalyticsContent"
        );


    if (loading) {

        loading.style.display =
            "none";

    }


    if (content) {

        content.style.opacity =
            "1";

    }

}


// =========================================================
// SHOW ERROR
// =========================================================

function showAIError(
    message
) {


    const errorBox =
        document.getElementById(
            "aiError"
        );


    const errorMessage =
        document.getElementById(
            "aiErrorMessage"
        );


    if (errorMessage) {

        errorMessage.textContent =
            message;

    }


    if (errorBox) {

        errorBox.style.display =
            "block";

    }

}


// =========================================================
// HIDE ERROR
// =========================================================

function hideAIError() {


    const errorBox =
        document.getElementById(
            "aiError"
        );


    if (errorBox) {

        errorBox.style.display =
            "none";

    }

}


// =========================================================
// UNAUTHORIZED
// =========================================================

function handleUnauthorized() {


    console.warn(
        "🔐 JWT authentication expired or missing."
    );


    localStorage.removeItem(
        "accessToken"
    );


    localStorage.removeItem(
        "access_token"
    );


    localStorage.removeItem(
        "token"
    );


    localStorage.removeItem(
        "jwtToken"
    );


    localStorage.removeItem(
        "jwt_token"
    );


    showAIError(
        "Your login session has expired. Please login again."
    );

}


// =========================================================
// LOGOUT
// =========================================================

function logoutAdmin() {


    localStorage.removeItem(
        "accessToken"
    );


    localStorage.removeItem(
        "access_token"
    );


    localStorage.removeItem(
        "token"
    );


    localStorage.removeItem(
        "jwtToken"
    );


    localStorage.removeItem(
        "jwt_token"
    );


    window.location.href =
        "../login.html";

}


// =========================================================
// SET TEXT
// =========================================================

function setText(
    elementId,
    value
) {


    const element =
        document.getElementById(
            elementId
        );


    if (!element) {

        return;

    }


    element.textContent =
        value ??
        "—";

}


// =========================================================
// SET RISK BADGE
// =========================================================

function setRiskBadge(
    elementId,
    value
) {


    const element =
        document.getElementById(
            elementId
        );


    if (!element) {

        return;

    }


    const risk =
        String(
            value ||
            "—"
        ).toUpperCase();


    element.textContent =
        risk;


    element.classList.remove(
        "present",
        "absent",
        "unknown",
        "risk-low",
        "risk-medium",
        "risk-high",
        "risk-critical",
        "low",
        "medium",
        "high",
        "critical"
    );


    switch (risk) {


        case "LOW":

        case "SAFE":

        case "GOOD":

        case "EXCELLENT":

            element.classList.add(
                "present"
            );

            break;


        case "MEDIUM":

        case "WARNING":

        case "AVERAGE":

            element.classList.add(
                "medium"
            );

            break;


        case "HIGH":

            element.classList.add(
                "high"
            );

            break;


        case "CRITICAL":

        case "NEEDS IMPROVEMENT":

            element.classList.add(
                "critical"
            );

            break;


        default:

            element.classList.add(
                "unknown"
            );

            break;

    }

}


// =========================================================
// UPDATE AI SUMMARY CLASS
// =========================================================

function updateAISummaryClass(
    risk
) {


    const element =
        document.getElementById(
            "aiRiskLevel"
        );


    if (!element) {

        return;

    }


    element.classList.remove(
        "risk-low",
        "risk-medium",
        "risk-high",
        "risk-critical"
    );


    const normalized =
        String(
            risk ||
            ""
        ).toUpperCase();


    if (
        normalized === "LOW" ||
        normalized === "SAFE"
    ) {

        element.classList.add(
            "risk-low"
        );

    }
    else if (
        normalized === "MEDIUM" ||
        normalized === "WARNING"
    ) {

        element.classList.add(
            "risk-medium"
        );

    }
    else if (
        normalized === "HIGH"
    ) {

        element.classList.add(
            "risk-high"
        );

    }
    else if (
        normalized === "CRITICAL"
    ) {

        element.classList.add(
            "risk-critical"
        );

    }

}


// =========================================================
// ATTENDANCE RISK MESSAGE
// =========================================================

function getAttendanceRiskMessage(
    percentage
) {


    const value =
        toNumber(
            percentage
        );


    if (value >= 75) {

        return (
            "Attendance is currently at or above the required 75% level."
        );

    }


    if (value >= 60) {

        return (
            "Attendance is below the required 75% level and should be improved."
        );

    }


    return (
        "Attendance is critically low and requires immediate attention."
    );

}


// =========================================================
// ACADEMIC RISK MESSAGE
// =========================================================

function getAcademicRiskMessage(
    percentage
) {


    const value =
        toNumber(
            percentage
        );


    if (value >= 75) {

        return (
            "Academic performance is currently at a good level."
        );

    }


    if (value >= 50) {

        return (
            "Academic performance needs improvement in weaker areas."
        );

    }


    return (
        "Academic performance is below the recommended level."
    );

}


// =========================================================
// PERFORMANCE
// =========================================================

function getPerformance(
    marks
) {


    const value =
        toNumber(
            marks
        );


    if (value >= 85) {

        return "Excellent";

    }


    if (value >= 75) {

        return "Good";

    }


    if (value >= 60) {

        return "Average";

    }


    return "Needs Improvement";

}


// =========================================================
// PERFORMANCE CSS CLASS
// =========================================================

function getPerformanceClass(
    performance
) {


    const value =
        String(
            performance ||
            ""
        ).toLowerCase();


    if (
        value.includes(
            "excellent"
        ) ||
        value.includes(
            "good"
        )
    ) {

        return "present";

    }


    if (
        value.includes(
            "average"
        )
    ) {

        return "medium";

    }


    return "critical";

}


// =========================================================
// NUMBER CONVERSION
// =========================================================

function toNumber(
    value
) {


    const number =
        Number(
            value
        );


    if (
        Number.isFinite(
            number
        )
    ) {

        return number;

    }


    return 0;

}


// =========================================================
// PERCENTAGE FORMAT
// =========================================================

function formatPercentage(
    value
) {


    const number =
        toNumber(
            value
        );


    return (
        `${number.toFixed(2)}%`
    );

}


// =========================================================
// CONFIDENCE FORMAT
// =========================================================

function formatConfidence(
    value
) {


    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "—";

    }


    const number =
        Number(
            value
        );


    if (
        Number.isFinite(
            number
        )
    ) {


        if (number <= 1) {

            return (
                `${(
                    number * 100
                ).toFixed(2)}%`
            );

        }


        return (
            `${number.toFixed(2)}%`
        );

    }


    return String(
        value
    );

}


// =========================================================
// BOOLEAN FORMAT
// =========================================================

function formatBoolean(
    value
) {


    if (
        value === true
    ) {

        return "Yes";

    }


    if (
        value === false
    ) {

        return "No";

    }


    return "—";

}


// =========================================================
// GET INITIAL
// =========================================================

function getInitial(
    name
) {


    const value =
        String(
            name ||
            "S"
        ).trim();


    if (!value) {

        return "S";

    }


    return value
        .charAt(0)
        .toUpperCase();

}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(
    value
) {


    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value;


    return div.innerHTML;

}


// =========================================================
// CONSOLE DEBUG
// =========================================================

console.log(
    "🤖 ai-analytics.js loaded successfully."
);
