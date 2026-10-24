/* =========================================================
   AI ATTEND - STUDENT ACADEMIC PAGE
   ========================================================= */

console.log("🎓 Academic JavaScript started.");


// =========================================================
// API CONFIGURATION
// =========================================================

const API_URL =
    "http://127.0.0.1:8000/ai/dashboard/student/2/";

const REFRESH_URL =
    "http://127.0.0.1:8000/api/token/refresh/";


// =========================================================
// DOM HELPERS
// =========================================================

function getElement(id) {
    return document.getElementById(id);
}


function setText(id, value) {

    const element = getElement(id);

    if (!element) {
        console.warn(
            `⚠️ HTML element not found: ${id}`
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
// REFRESH JWT ACCESS TOKEN
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

        localStorage.removeItem(
            "access_token"
        );

        window.location.href =
            "../login.html";

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
                        refresh: refreshToken
                    })
                }
            );

        const data =
            await response.json();

        console.log(
            "📡 Refresh status:",
            response.status
        );

        if (!response.ok) {

            console.error(
                "❌ Refresh failed:",
                data
            );

            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "refresh_token"
            );

            window.location.href =
                "../login.html";

            return false;
        }

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

    } catch (error) {

        console.error(
            "❌ Token refresh error:",
            error
        );

        return false;
    }
}


// =========================================================
// API REQUEST
// =========================================================

async function requestAcademicData() {

    let accessToken =
        localStorage.getItem(
            "access_token"
        );

    if (!accessToken) {

        console.error(
            "❌ Access token not found."
        );

        window.location.href =
            "../login.html";

        return null;
    }

    try {

        console.log(
            "📡 Sending academic API request..."
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
            "📡 Academic API status:",
            response.status
        );


        // =================================================
        // ACCESS TOKEN EXPIRED
        // =================================================

        if (response.status === 401) {

            console.warn(
                "⚠️ Access token expired."
            );

            const refreshed =
                await refreshAccessToken();

            if (!refreshed) {
                return null;
            }

            accessToken =
                localStorage.getItem(
                    "access_token"
                );

            console.log(
                "🔁 Retrying academic API..."
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
                "📡 Retry status:",
                response.status
            );
        }


        // =================================================
        // API ERROR
        // =================================================

        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "❌ Academic API error:",
                errorText
            );

            return null;
        }


        // =================================================
        // SUCCESS
        // =================================================

        const data =
            await response.json();

        console.log(
    "✅ FULL ACADEMIC API DATA:"
);

console.log(
    JSON.stringify(data, null, 2)
);

        return data;

    } catch (error) {

        console.error(
            "❌ Academic request error:",
            error
        );

        return null;
    }
}


// =========================================================
// DISPLAY ACADEMIC DATA
// =========================================================

function displayAcademicData(data) {

    console.log(
        "📊 Displaying academic data..."
    );


    // =====================================================
    // SAFELY GET OBJECTS
    // =====================================================

    const student =
        data?.student || {};

    const academic =
        data?.academic || {};


    // =====================================================
// STUDENT NAME
// =====================================================

const studentName =
    student.name ||
    student.username ||
    "Student";

console.log(
    "👤 Student:",
    studentName
);

setText(
    "topStudentName",
    studentName
);


// =====================================================
// STUDENT AVATAR
// =====================================================

const avatar =
    getElement("studentAvatar");

if (avatar) {

    avatar.textContent =
        studentName
            .charAt(0)
            .toUpperCase();
}


   // =====================================================
// AVERAGE MARKS
// =====================================================

const averageMarks =
    Number(
        academic.average_marks || 0
    );

const safeAverage =
    Math.max(
        0,
        Math.min(
            100,
            averageMarks
        )
    );


setText(
    "averageMarksCard",
    safeAverage.toFixed(2)
);


setText(
    "averageMarks",
    safeAverage.toFixed(2) + "%"
);


// =====================================================
// PROGRESS BAR
// =====================================================

const marksProgress =
    getElement("marksProgress");

if (marksProgress) {

    marksProgress.style.width =
        safeAverage + "%";
}

    // =====================================================
// SUBJECT COUNT
// =====================================================

const subjectsCount =
    Number(
        academic.subjects_count || 0
    );

setText(
    "subjectsCount",
    subjectsCount
);


// =====================================================
// RISK LEVEL
// =====================================================

const riskLevel =
    academic.risk_level ||
    academic.performance_level ||
    "MONITORING";

setText(
    "academicRisk",
    riskLevel
);

setText(
    "riskBadge",
    riskLevel
);


// =====================================================
// ACADEMIC STATUS
// =====================================================

const academicStatus =
    getElement("academicStatus");

if (academicStatus) {

    academicStatus.textContent =
        String(riskLevel).toUpperCase();
}


// =====================================================
// MESSAGE
// =====================================================

const message =
    academic.message ||
    academic.reason ||
    "Academic performance information loaded successfully.";

setText(
    "academicMessage",
    message
);

    // =====================================================
    // SUBJECTS
    // =====================================================

    displaySubjects(
        academic
    );


    console.log(
        "🎉 Academic display completed."
    );
}


// =========================================================
// DISPLAY SUBJECTS
// =========================================================

function displaySubjects(academic) {

    const container = getElement("subjectContainer");

    if (!container) {
        console.warn("⚠️ subjectContainer not found.");
        return;
    }

    console.log("📚 Academic object:", academic);

    // ---------------------------------------------------------
    // GET SUBJECT ARRAY FROM BACKEND
    // ---------------------------------------------------------

    const subjects =
        Array.isArray(academic?.subjects)
            ? academic.subjects
            : Array.isArray(academic?.subject_data)
                ? academic.subject_data
                : Array.isArray(academic?.records)
                    ? academic.records
                    : Array.isArray(academic?.results)
                        ? academic.results
                        : [];

    console.log("📚 Subjects:", subjects);

    // ---------------------------------------------------------
    // CURRENT BACKEND DOES NOT RETURN SUBJECT DETAILS
    // ---------------------------------------------------------

    if (subjects.length === 0) {

        const subjectsCount =
            Number(academic?.subjects_count ?? 0);

        const averageMarks =
            Number(academic?.average_marks ?? 0);

        const riskLevel =
            academic?.risk_level ||
            "MONITORING";

        const safeAverage =
            Math.max(
                0,
                Math.min(
                    100,
                    averageMarks
                )
            );

        container.innerHTML = `

            <div class="academic-summary-box">

                <div class="summary-item">

                    <span class="summary-label">
                        Total Subjects
                    </span>

                    <strong class="summary-value">
                        ${subjectsCount}
                    </strong>

                </div>


                <div class="summary-item">

                    <span class="summary-label">
                        Average Marks
                    </span>

                    <strong class="summary-value">
                        ${safeAverage.toFixed(2)}%
                    </strong>

                </div>


                <div class="summary-item">

                    <span class="summary-label">
                        Performance Level
                    </span>

                    <strong class="summary-value">
                        ${escapeHTML(
                            String(riskLevel)
                        )}
                    </strong>

                </div>


                <div class="subject-info-message">

                    <div class="info-icon">
                        ℹ
                    </div>

                    <div>

                        <strong>
                            Subject details are not available yet
                        </strong>

                        <p>
                            Your academic API currently returns
                            the total number of subjects and the
                            overall average marks. Individual
                            subject names and marks are not
                            included in the API response.
                        </p>

                    </div>

                </div>

            </div>

        `;

        return;
    }


    // =========================================================
    // SUBJECT TABLE
    // =========================================================

    let html = `

        <div class="subject-table-wrapper">

            <table class="subject-table">

                <thead>

                    <tr>

                        <th>
                            Subject
                        </th>

                        <th>
                            Marks
                        </th>

                        <th>
                            Performance
                        </th>

                    </tr>

                </thead>

                <tbody>

    `;


    // =========================================================
    // CREATE SUBJECT ROWS
    // =========================================================

    subjects.forEach(function(subject) {

        const name =
            subject?.name ||
            subject?.subject ||
            subject?.subject_name ||
            "Subject";


        const rawMarks =
            subject?.marks ??
            subject?.mark ??
            subject?.score ??
            subject?.percentage ??
            0;


        let marks =
            Number(rawMarks);


        if (!Number.isFinite(marks)) {
            marks = 0;
        }


        const safeMarks =
            Math.max(
                0,
                Math.min(
                    100,
                    marks
                )
            );


        // -----------------------------------------------------
        // PERFORMANCE
        // -----------------------------------------------------

        let performance = "Needs Improvement";


        if (safeMarks >= 85) {

            performance = "Excellent";

        }
        else if (safeMarks >= 75) {

            performance = "Good";

        }
        else if (safeMarks >= 60) {

            performance = "Average";
        }


        // -----------------------------------------------------
        // TABLE ROW
        // -----------------------------------------------------

        html += `

            <tr>

                <td class="subject-name">

                    ${escapeHTML(
                        String(name)
                    )}

                </td>


                <td class="mark-value">

                    ${safeMarks.toFixed(2)}%

                </td>


                <td>

                    <div class="subject-performance">

                        <div class="progress-small">

                            <div
                                class="progress-fill"
                                style="width:${safeMarks}%">
                            </div>

                        </div>

                        <span>
                            ${escapeHTML(
                                performance
                            )}
                        </span>

                    </div>

                </td>

            </tr>

        `;
    });


    html += `

                </tbody>

            </table>

        </div>

    `;


    container.innerHTML = html;


    console.log(
        "✅ Subject table displayed."
    );
}


// =========================================================
// HTML ESCAPE
// =========================================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;
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
        async function() {

            console.log(
                "🔄 Manual academic refresh..."
            );


            button.disabled =
                true;


            try {

                await loadAcademicData();

            } finally {

                button.disabled =
                    false;
            }
        }
    );
}


// =========================================================
// LOGOUT
// =========================================================

function setupLogout() {

    const logoutButton =
        getElement(
            "logoutBtn"
        );


    if (!logoutButton) {
        return;
    }


    logoutButton.addEventListener(
        "click",
        function(event) {

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
// LOAD ACADEMIC DATA
// =========================================================

async function loadAcademicData() {

    console.log(
        "🔄 Loading academic data..."
    );


    const data =
        await requestAcademicData();


    if (!data) {

        console.error(
            "❌ Academic data could not be loaded."
        );


        const container =
            getElement(
                "subjectContainer"
            );


        if (container) {

            container.innerHTML = `

                <div class="loading-state">

                    <strong>
                        Unable to load academic information.
                    </strong>

                    <p>
                        Please refresh the page
                        or login again.
                    </p>

                </div>

            `;
        }


        return;
    }


    displayAcademicData(
        data
    );
}


// =========================================================
// START PAGE
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        console.log(
            "🚀 Academic DOM loaded."
        );


        setupRefreshButton();


        setupLogout();


        loadAcademicData();

    }
);
