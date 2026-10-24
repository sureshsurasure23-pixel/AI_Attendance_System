// ============================================================
// AI ATTENDANCE SYSTEM - STUDENT ATTENDANCE PAGE
// ============================================================

const API_BASE_URL = "http://127.0.0.1:8000";
const LOGIN_URL = "../login/login.html";

const DEFAULT_REQUIRED_PERCENTAGE = 75;

let STUDENT_DB_ID = null;
let allAttendanceRecords = [];

let CURRENT_ATTENDANCE_PERCENTAGE = 0;
let CURRENT_REQUIRED_PERCENTAGE = DEFAULT_REQUIRED_PERCENTAGE;


// ============================================================
// PAGE START
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("=================================");
    console.log("AI Attendance - Attendance Page");
    console.log("=================================");

    setupRefreshButton();
    setupLogoutButton();
    setupAttendanceFilter();
    setupSettingsButton();

    loadAttendance();
});


// ============================================================
// AUTHENTICATION
// ============================================================

function getAccessToken() {

    return localStorage.getItem("access_token");
}


// ============================================================
// REDIRECT TO LOGIN
// ============================================================

function redirectToLogin() {

    console.log("Redirecting to login...");

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("studentId");
    localStorage.removeItem("student_db_id");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    localStorage.removeItem("userData");

    window.location.replace(LOGIN_URL);
}


// ============================================================
// REFRESH ACCESS TOKEN
// ============================================================

async function refreshAccessToken() {

    const refreshToken =
        localStorage.getItem("refresh_token");

    if (!refreshToken) {

        console.error(
            "Refresh token not found."
        );

        return false;
    }

    try {

        const response = await fetch(
            `${API_BASE_URL}/accounts/token/refresh/`,
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
            "Token refresh status:",
            response.status
        );

        if (!response.ok) {
            return false;
        }

        const data = await response.json();

        if (!data.access) {
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


// ============================================================
// API REQUEST
// ============================================================

async function apiRequest(endpoint) {

    let token = getAccessToken();

    if (!token) {

        redirectToLogin();

        return null;
    }

    try {

        let response = await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log(
            `API ${endpoint} -> ${response.status}`
        );


        // ------------------------------------------------------
        // ACCESS TOKEN EXPIRED
        // ------------------------------------------------------

        if (response.status === 401) {

            console.log(
                "Access token expired. Refreshing..."
            );

            const refreshed =
                await refreshAccessToken();

            if (!refreshed) {

                console.error(
                    "Unable to refresh access token."
                );

                redirectToLogin();

                return null;
            }

            token = getAccessToken();

            response = await fetch(
                `${API_BASE_URL}${endpoint}`,
                {
                    method: "GET",

                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            console.log(
                `Retry ${endpoint} -> ${response.status}`
            );
        }


        // ------------------------------------------------------
        // API ERROR
        // ------------------------------------------------------

        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                `API Error ${response.status}:`,
                errorText
            );

            return null;
        }


        // ------------------------------------------------------
        // JSON RESPONSE
        // ------------------------------------------------------

        return await response.json();

    } catch (error) {

        console.error(
            "Network error:",
            error
        );

        return null;
    }
}


// ============================================================
// RESOLVE STUDENT DATABASE ID
// ============================================================

async function resolveStudentId() {

    const storedDatabaseId =
        localStorage.getItem("student_db_id");

    const storedStudentId =
        localStorage.getItem("studentId");


    // ------------------------------------------------------
    // 1. Prefer student_db_id
    // ------------------------------------------------------

    if (
        storedDatabaseId &&
        /^\d+$/.test(String(storedDatabaseId))
    ) {

        STUDENT_DB_ID =
            Number(storedDatabaseId);

        console.log(
            "Using stored student_db_id:",
            STUDENT_DB_ID
        );

        return true;
    }


    // ------------------------------------------------------
    // 2. Try numeric studentId
    // ------------------------------------------------------

    if (
        storedStudentId &&
        /^\d+$/.test(String(storedStudentId))
    ) {

        STUDENT_DB_ID =
            Number(storedStudentId);

        localStorage.setItem(
            "student_db_id",
            String(STUDENT_DB_ID)
        );

        console.log(
            "Using numeric studentId:",
            STUDENT_DB_ID
        );

        return true;
    }


    // ------------------------------------------------------
    // 3. Get logged-in profile
    // ------------------------------------------------------

    console.log(
        "Getting student profile..."
    );

    const profile =
        await apiRequest(
            "/accounts/profile/"
        );

    if (!profile) {

        console.error(
            "Student profile could not be loaded."
        );

        return false;
    }

    console.log(
        "Student Profile:",
        profile
    );


    // ------------------------------------------------------
    // Verify role
    // ------------------------------------------------------

    const role = String(
        profile.role ||
        profile.user?.role ||
        profile.data?.role ||
        ""
    ).toUpperCase();

    if (
        role &&
        role !== "STUDENT"
    ) {

        console.error(
            "Logged-in user is not a student:",
            role
        );

        return false;
    }


    // ------------------------------------------------------
    // Possible student database IDs
    // ------------------------------------------------------

    const possibleIds = [

        profile.student_db_id,
        profile.student_profile_id,

        profile.student?.id,
        profile.student?.student_db_id,

        profile.student_profile?.id,
        profile.student_profile?.student_db_id,

        profile.data?.student_db_id,
        profile.data?.student_profile_id,

        profile.data?.student?.id,
        profile.data?.student?.student_db_id
    ];


    for (const id of possibleIds) {

        if (
            id !== undefined &&
            id !== null &&
            /^\d+$/.test(String(id))
        ) {

            STUDENT_DB_ID =
                Number(id);

            localStorage.setItem(
                "student_db_id",
                String(STUDENT_DB_ID)
            );

            console.log(
                "Resolved student database ID:",
                STUDENT_DB_ID
            );

            return true;
        }
    }


    // ------------------------------------------------------
    // 4. Last fallback: profile.id
    // ------------------------------------------------------

    if (
        role === "STUDENT" &&
        profile.id !== undefined &&
        /^\d+$/.test(String(profile.id))
    ) {

        STUDENT_DB_ID =
            Number(profile.id);

        localStorage.setItem(
            "student_db_id",
            String(STUDENT_DB_ID)
        );

        console.warn(
            "Using profile.id as student database ID:",
            STUDENT_DB_ID
        );

        return true;
    }


    console.error(
        "Could not find student database ID."
    );

    return false;
}


// ============================================================
// LOAD ATTENDANCE
// ============================================================

async function loadAttendance() {

    console.log("---------------------------------");
    console.log("Loading attendance...");
    console.log("---------------------------------");

    showLoadingState();


    const resolved =
        await resolveStudentId();

    if (
        !resolved ||
        !STUDENT_DB_ID
    ) {

        console.error(
            "Student database ID not found."
        );

        showErrorState(
            "Student information could not be found."
        );

        return;
    }


    console.log(
        "Student Database ID:",
        STUDENT_DB_ID
    );


    const data =
        await apiRequest(
            `/attendance/student/${STUDENT_DB_ID}/`
        );


    if (!data) {

        showErrorState(
            "Unable to load attendance data."
        );

        return;
    }


    console.log(
        "Attendance API response:",
        data
    );


    displayAttendance(data);
}


// ============================================================
// DISPLAY ATTENDANCE
// ============================================================

function displayAttendance(data) {

    // ------------------------------------------------------
    // Student name
    // ------------------------------------------------------

    const studentName =
        data.student_name ||
        data.student?.name ||
        data.student?.student_name ||
        data.name ||
        "Student";


    setText(
        "studentName",
        studentName
    );


    // ------------------------------------------------------
    // Avatar
    // ------------------------------------------------------

    const avatar =
        document.getElementById(
            "studentAvatar"
        );

    if (avatar) {

        const firstLetter =
            studentName
                .trim()
                .charAt(0)
                .toUpperCase();

        avatar.textContent =
            firstLetter || "S";
    }


    // ------------------------------------------------------
    // Find attendance container
    // ------------------------------------------------------

    const attendance =
        data.attendance ||
        data.summary ||
        data;


    // ------------------------------------------------------
    // Find records
    // ------------------------------------------------------

    let records = [];


    if (Array.isArray(data.records)) {

        records = data.records;

    } else if (
        Array.isArray(attendance.records)
    ) {

        records = attendance.records;

    } else if (
        Array.isArray(data.attendance_records)
    ) {

        records = data.attendance_records;

    } else if (
        Array.isArray(data.attendance)
    ) {

        records = data.attendance;
    }


    console.log(
        "Raw attendance records:",
        records
    );


    // ------------------------------------------------------
    // Remove Sunday
    // ------------------------------------------------------

    records =
        removeSundayRecords(records);


    // ------------------------------------------------------
    // Normalize records
    // ------------------------------------------------------

    records =
        normalizeAttendanceRecords(records);


    // ------------------------------------------------------
    // Save globally
    // ------------------------------------------------------

    allAttendanceRecords =
        records;


    // ------------------------------------------------------
    // Calculate attendance
    // ------------------------------------------------------

    const present =
        records.filter(
            record =>
                isPresentRecord(record)
        ).length;


    const absent =
        records.filter(
            record =>
                isAbsentRecord(record)
        ).length;


    const total =
        present + absent;


    const percentage =
        total > 0
            ? (present / total) * 100
            : 0;


    // ------------------------------------------------------
    // Required attendance
    // ------------------------------------------------------

    const requiredValue =
        attendance.required_percentage ??
        attendance.required ??
        data.required_percentage ??
        data.required ??
        DEFAULT_REQUIRED_PERCENTAGE;


    const required =
        Number(requiredValue) ||
        DEFAULT_REQUIRED_PERCENTAGE;


    CURRENT_ATTENDANCE_PERCENTAGE =
        percentage;

    CURRENT_REQUIRED_PERCENTAGE =
        required;


    console.log(
        "Present:",
        present
    );

    console.log(
        "Absent:",
        absent
    );

    console.log(
        "Total:",
        total
    );

    console.log(
        "Percentage:",
        percentage.toFixed(2) + "%"
    );

    console.log(
        "Required:",
        required + "%"
    );


    // ------------------------------------------------------
    // Attendance status
    // ------------------------------------------------------

    const status =
        getAttendanceStatus(
            percentage,
            required
        );


    // ------------------------------------------------------
    // Classes needed
    // ------------------------------------------------------

    const classesNeeded =
        calculateClassesNeeded(
            present,
            total,
            required
        );


    console.log(
        "Classes needed:",
        classesNeeded
    );


    // ======================================================
    // SUMMARY
    // ======================================================

    setText(
        "attendancePercentage",
        `${percentage.toFixed(2)}%`
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


    setText(
        "requiredPercentage",
        `${required}%`
    );


    setText(
        "progressPercentage",
        `${percentage.toFixed(2)}%`
    );


    // ======================================================
    // ATTENDANCE CIRCLE
    // ======================================================

    const circle =
        document.querySelector(
            ".attendance-circle"
        );


    if (circle) {

        const safePercentage =
            Math.min(
                Math.max(
                    percentage,
                    0
                ),
                100
            );


        circle.style.setProperty(
            "--attendance",
            `${safePercentage}%`
        );
    }


    // ======================================================
    // PROGRESS BAR
    // ======================================================

    const progress =
        document.getElementById(
            "attendanceProgress"
        );


    if (progress) {

        const safePercentage =
            Math.min(
                Math.max(
                    percentage,
                    0
                ),
                100
            );


        progress.style.width =
            `${safePercentage}%`;
    }


    // ======================================================
    // RISK
    // ======================================================

    setText(
        "attendanceRisk",
        formatStatus(status)
    );


    // ======================================================
    // MAIN MESSAGE
    // ======================================================

    setText(
        "attendanceMessage",
        getAttendanceMessage(
            percentage,
            required
        )
    );


    // ======================================================
    // AI INSIGHT
    // ======================================================

    setText(
        "aiInsight",
        getAIInsight(
            percentage,
            required,
            present,
            absent,
            classesNeeded
        )
    );


    // ======================================================
    // RECOMMENDATION
    // ======================================================

    setText(
        "recommendationText",
        getRecommendation(
            percentage,
            required,
            classesNeeded
        )
    );


    // ======================================================
    // RENDER HISTORY
    // ======================================================

    renderAttendanceTable(
        allAttendanceRecords
    );
}


// ============================================================
// NORMALIZE RECORDS
// ============================================================

function normalizeAttendanceRecords(records) {

    return records
        .map(record => {

            const session =
                record.session &&
                typeof record.session === "object"
                    ? record.session
                    : null;


            let date =
                record.date ||
                record.session_date ||
                record.attendance_date ||
                session?.attendance_date ||
                null;


            if (
                typeof date === "string" &&
                date.includes("T")
            ) {

                date =
                    date.split("T")[0];
            }


            const period =
                record.period ??
                session?.period ??
                null;


            const status =
                String(
                    record.status ??
                    record.attendance_status ??
                    ""
                ).toUpperCase();


            return {

                ...record,

                _date: date,

                _period: period,

                _status: status
            };
        })


        .filter(record => {

            return (
                record._status === "PRESENT" ||
                record._status === "ABSENT" ||
                record._status === "P" ||
                record._status === "A"
            );
        });
}


// ============================================================
// REMOVE SUNDAY
// ============================================================

function removeSundayRecords(records) {

    return records.filter(record => {

        const dateValue =
            record.date ||
            record.session_date ||
            record.attendance_date ||
            record.session?.attendance_date;


        if (!dateValue) {
            return true;
        }


        const cleanDate =
            String(dateValue)
                .split("T")[0];


        const date =
            new Date(
                `${cleanDate}T00:00:00`
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return true;
        }


        // JavaScript:
        // Sunday = 0
        return date.getDay() !== 0;
    });
}


// ============================================================
// PRESENT RECORD
// ============================================================

function isPresentRecord(record) {

    const status =
        String(
            record._status ??
            record.status ??
            record.attendance_status ??
            ""
        ).toUpperCase();


    return (
        status === "PRESENT" ||
        status === "P"
    );
}


// ============================================================
// ABSENT RECORD
// ============================================================

function isAbsentRecord(record) {

    const status =
        String(
            record._status ??
            record.status ??
            record.attendance_status ??
            ""
        ).toUpperCase();


    return (
        status === "ABSENT" ||
        status === "A"
    );
}


// ============================================================
// ATTENDANCE STATUS
// ============================================================

function getAttendanceStatus(
    percentage,
    required
) {

    if (percentage >= required) {
        return "LOW";
    }


    if (percentage >= 65) {
        return "WARNING";
    }


    return "CRITICAL";
}


// ============================================================
// FORMAT STATUS
// ============================================================

function formatStatus(status) {

    const value =
        String(status)
            .toUpperCase();


    if (
        value === "LOW" ||
        value === "SAFE"
    ) {

        return "Risk: LOW";
    }


    if (value === "WARNING") {

        return "Risk: WARNING";
    }


    if (
        value === "CRITICAL" ||
        value === "HIGH"
    ) {

        return "Risk: CRITICAL";
    }


    return `Risk: ${value}`;
}


// ============================================================
// ATTENDANCE MESSAGE
// ============================================================

function getAttendanceMessage(
    percentage,
    required
) {

    if (percentage >= required) {

        return (
            `Your attendance is ${percentage.toFixed(2)}%. ` +
            `You have reached the required ${required}% attendance.`
        );
    }


    const difference =
        required - percentage;


    return (
        `Your attendance is ${percentage.toFixed(2)}%. ` +
        `You need to improve your attendance by ` +
        `${difference.toFixed(1)} percentage points.`
    );
}


// ============================================================
// CALCULATE CLASSES NEEDED
// ============================================================

function calculateClassesNeeded(
    present,
    total,
    required
) {

    // Already reached target
    if (
        total === 0 ||
        (present / total) * 100 >= required
    ) {

        return 0;
    }


    let classesNeeded = 0;


    // Add future PRESENT classes until
    // required attendance is reached.

    while (classesNeeded < 10000) {

        const futurePresent =
            present + classesNeeded + 1;

        const futureTotal =
            total + classesNeeded + 1;


        const futurePercentage =
            (
                futurePresent /
                futureTotal
            ) * 100;


        classesNeeded++;


        if (
            futurePercentage >= required
        ) {

            return classesNeeded;
        }
    }


    return classesNeeded;
}


// ============================================================
// AI INSIGHT
// ============================================================

function getAIInsight(
    percentage,
    required,
    present,
    absent,
    classesNeeded
) {

    if (percentage >= required) {

        return (
            `Your attendance is ${percentage.toFixed(2)}%, ` +
            `which meets the required ${required}% target. ` +
            `You attended ${present} classes and missed ${absent}. ` +
            `Keep maintaining consistent attendance.`
        );
    }


    if (percentage >= 65) {

        return (
            `Your attendance is ${percentage.toFixed(2)}%, ` +
            `which is below the required ${required}% target. ` +
            `You attended ${present} classes and missed ${absent}. ` +
            `Your attendance needs improvement. ` +
            `Consistent attendance can help you recover.`
        );
    }


    return (
        `Your attendance requires immediate attention. ` +
        `You attended ${present} classes and missed ${absent}. ` +
        `Your current attendance is ${percentage.toFixed(2)}%, ` +
        `below the required ${required}%. ` +
        `You need to attend the next ${classesNeeded} ` +
        `classes consecutively to reach the required target.`
    );
}


// ============================================================
// RECOMMENDATION
// ============================================================

function getRecommendation(
    percentage,
    required,
    classesNeeded
) {

    if (percentage >= required) {

        return (
            `Keep attending classes regularly to maintain ` +
            `your attendance above the required ${required}% target.`
        );
    }


    if (classesNeeded > 0) {

        return (
            `Prioritize your upcoming classes. ` +
            `You need to attend the next ${classesNeeded} ` +
            `classes consecutively to reach the required ` +
            `${required}% attendance. Avoid unnecessary absences.`
        );
    }


    return (
        "Prioritize attending your upcoming classes " +
        "and avoid unnecessary absences."
    );
}


// ============================================================
// ATTENDANCE TABLE
// ============================================================

function renderAttendanceTable(records) {

    const tableBody =
        document.getElementById(
            "attendanceTableBody"
        );


    if (!tableBody) {
        return;
    }


    if (
        !records ||
        records.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="loading-row">
                    No attendance records found.
                </td>
            </tr>
        `;

        return;
    }


    // ========================================================
    // STEP 1
    // CHRONOLOGICAL CALCULATION ORDER
    //
    // Oldest date -> newest date
    // Same date -> Period 1 -> Period 2
    // ========================================================

    const chronologicalRecords =
        [...records].sort(
            (a, b) => {

                const dateA =
                    getDateTimestamp(a._date);

                const dateB =
                    getDateTimestamp(b._date);


                if (dateA !== dateB) {

                    return dateA - dateB;
                }


                const periodA =
                    getPeriodNumber(a._period);

                const periodB =
                    getPeriodNumber(b._period);


                if (periodA !== periodB) {

                    return periodA - periodB;
                }


                return (
                    Number(a.id || 0) -
                    Number(b.id || 0)
                );
            }
        );


    // ========================================================
    // STEP 2
    // CUMULATIVE ATTENDANCE
    // ========================================================

    const percentageMap =
        new Map();


    let runningPresent = 0;
    let runningTotal = 0;


    chronologicalRecords.forEach(record => {

        if (isPresentRecord(record)) {

            runningPresent++;
            runningTotal++;

        } else if (isAbsentRecord(record)) {

            runningTotal++;
        }


        const cumulativePercentage =
            runningTotal > 0
                ? (
                    runningPresent /
                    runningTotal
                ) * 100
                : 0;


        percentageMap.set(
            getRecordKey(record),
            cumulativePercentage
        );
    });


    // ========================================================
    // STEP 3
    // DISPLAY ORDER
    //
    // Newest date first
    // Same date -> Period 1 -> Period 2
    // ========================================================

    const displayRecords =
        [...records].sort(
            (a, b) => {

                const dateA =
                    getDateTimestamp(a._date);

                const dateB =
                    getDateTimestamp(b._date);


                // Newest date first
                if (dateA !== dateB) {

                    return dateB - dateA;
                }


                const periodA =
                    getPeriodNumber(a._period);

                const periodB =
                    getPeriodNumber(b._period);


                // Period 1 before Period 2
                if (periodA !== periodB) {

                    return periodA - periodB;
                }


                return (
                    Number(a.id || 0) -
                    Number(b.id || 0)
                );
            }
        );


    // ========================================================
    // STEP 4
    // GENERATE TABLE
    // ========================================================

    tableBody.innerHTML =
        displayRecords
            .map(
                (record, index) => {

                    const dateValue =
                        record._date || "-";


                    const formattedDate =
                        formatDate(dateValue);


                    const dayName =
                        getDayName(dateValue);


                    const subject =
                        record.subject_name ??
                        record.subject?.name ??
                        record.subject ??
                        "Class";


                    const period =
                        formatPeriod(record);


                    const present =
                        isPresentRecord(record);


                    const displayStatus =
                        present
                            ? "Present"
                            : "Absent";


                    const statusClass =
                        present
                            ? "present-status"
                            : "absent-status";


                    const rowPercentage =
                        percentageMap.get(
                            getRecordKey(record)
                        ) ?? 0;


                    return `
                        <tr>

                            <td>
                                ${index + 1}
                            </td>

                            <td>
                                ${escapeHTML(
                                    formattedDate
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    dayName
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    String(subject)
                                )}
                            </td>

                            <td>
                                <span class="period-badge">
                                    ${escapeHTML(
                                        period
                                    )}
                                </span>
                            </td>

                            <td>
                                <span class="attendance-record-status ${statusClass}">
                                    ${present ? "✓" : "!"}
                                    ${displayStatus}
                                </span>
                            </td>

                            <td>
                                <strong class="percentage-value">
                                    ${rowPercentage.toFixed(2)}%
                                </strong>
                            </td>

                        </tr>
                    `;
                }
            )
            .join("");
}


// ============================================================
// DATE TIMESTAMP
// ============================================================

function getDateTimestamp(dateValue) {

    if (!dateValue) {
        return 0;
    }


    const cleanDate =
        String(dateValue)
            .split("T")[0];


    const date =
        new Date(
            `${cleanDate}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return 0;
    }


    return date.getTime();
}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(dateValue) {

    if (
        !dateValue ||
        dateValue === "-"
    ) {

        return "-";
    }


    const cleanDate =
        String(dateValue)
            .split("T")[0];


    const date =
        new Date(
            `${cleanDate}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return cleanDate;
    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


// ============================================================
// DAY NAME
// ============================================================

function getDayName(dateValue) {

    if (
        !dateValue ||
        dateValue === "-"
    ) {

        return "-";
    }


    const cleanDate =
        String(dateValue)
            .split("T")[0];


    const date =
        new Date(
            `${cleanDate}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";
    }


    return date.toLocaleDateString(
        "en-IN",
        {
            weekday: "long"
        }
    );
}


// ============================================================
// FORMAT PERIOD
// ============================================================

function formatPeriod(record) {

    const period =
        record._period;


    if (
        period !== null &&
        period !== undefined &&
        period !== ""
    ) {

        return `Period ${period}`;
    }


    return "Historical";
}


// ============================================================
// PERIOD NUMBER
// ============================================================

function getPeriodNumber(period) {

    if (
        period === null ||
        period === undefined ||
        period === ""
    ) {

        // Historical records are placed
        // after actual periods on the same date.
        return 999;
    }


    const number =
        Number(period);


    return Number.isNaN(number)
        ? 999
        : number;
}


// ============================================================
// RECORD KEY
// ============================================================

function getRecordKey(record) {

    if (
        record.id !== undefined &&
        record.id !== null
    ) {

        return `id-${record.id}`;
    }


    return [
        record._date || "",
        record._period || "",
        record.subject_name || "",
        record.subject || "",
        record._status || ""
    ].join("-");
}


// ============================================================
// LOADING STATE
// ============================================================

function showLoadingState() {

    setText(
        "studentName",
        "Loading..."
    );


    setText(
        "attendancePercentage",
        "0%"
    );


    setText(
        "progressPercentage",
        "0%"
    );


    setText(
        "attendanceMessage",
        "Loading attendance status..."
    );


    setText(
        "presentClasses",
        "0"
    );


    setText(
        "absentClasses",
        "0"
    );


    setText(
        "totalClasses",
        "0"
    );


    setText(
        "requiredPercentage",
        `${DEFAULT_REQUIRED_PERCENTAGE}%`
    );


    setText(
        "attendanceRisk",
        "Risk: --"
    );


    setText(
        "aiInsight",
        "Analyzing your attendance..."
    );


    setText(
        "recommendationText",
        "Loading recommendation..."
    );


    const tableBody =
        document.getElementById(
            "attendanceTableBody"
        );


    if (tableBody) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="loading-row">
                    Loading attendance data...
                </td>
            </tr>
        `;
    }
}


// ============================================================
// ERROR STATE
// ============================================================

function showErrorState(
    message = "Unable to load attendance data."
) {

    setText(
        "attendanceMessage",
        message
    );


    setText(
        "aiInsight",
        "Attendance information could not be loaded."
    );


    setText(
        "recommendationText",
        "Please check your connection and refresh the page."
    );


    const tableBody =
        document.getElementById(
            "attendanceTableBody"
        );


    if (tableBody) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="loading-row">
                    ${escapeHTML(message)}
                </td>
            </tr>
        `;
    }
}


// ============================================================
// SET TEXT
// ============================================================

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (!element) {
        return;
    }


    element.textContent =
        value ?? "-";
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    const div =
        document.createElement("div");


    div.textContent =
        value ?? "";


    return div.innerHTML;
}


// ============================================================
// FILTER ATTENDANCE
// ============================================================

function filterAttendance() {

    const filter =
        document.getElementById(
            "attendanceFilter"
        );


    if (!filter) {
        return;
    }


    const selected =
        filter.value;


    let filteredRecords =
        allAttendanceRecords;


    if (selected === "present") {

        filteredRecords =
            allAttendanceRecords.filter(
                record =>
                    isPresentRecord(record)
            );
    }


    if (selected === "absent") {

        filteredRecords =
            allAttendanceRecords.filter(
                record =>
                    isAbsentRecord(record)
            );
    }


    renderAttendanceTable(
        filteredRecords
    );
}


// ============================================================
// REFRESH BUTTON
// ============================================================

function setupRefreshButton() {

    const refreshButton =
        document.getElementById(
            "refreshAttendance"
        );


    if (!refreshButton) {
        return;
    }


    refreshButton.addEventListener(
        "click",
        async () => {

            refreshButton.disabled = true;


            const originalText =
                refreshButton.textContent;


            refreshButton.textContent =
                "↻ Loading...";


            try {

                await loadAttendance();

            } catch (error) {

                console.error(
                    "Refresh error:",
                    error
                );

                showErrorState(
                    "Unable to refresh attendance data."
                );

            } finally {

                refreshButton.disabled = false;

                refreshButton.textContent =
                    originalText ||
                    "↻ Refresh";
            }
        }
    );
}


// ============================================================
// LOGOUT
// ============================================================

function setupLogoutButton() {

    const logoutButton =
        document.getElementById(
            "logoutBtn"
        );


    if (!logoutButton) {
        return;
    }


    logoutButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            redirectToLogin();
        }
    );
}


// ============================================================
// SETTINGS
// ============================================================

function setupSettingsButton() {

    const settingsButton =
        document.getElementById(
            "settingsBtn"
        );


    if (!settingsButton) {
        return;
    }


    settingsButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            alert(
                "Settings will be available soon."
            );
        }
    );
}


// ============================================================
// ATTENDANCE FILTER
// ============================================================

function setupAttendanceFilter() {

    const filter =
        document.getElementById(
            "attendanceFilter"
        );


    if (!filter) {
        return;
    }


    filter.addEventListener(
        "change",
        filterAttendance
    );
}


// ============================================================
// END
// ============================================================

console.log(
    "Attendance.js loaded successfully."
);