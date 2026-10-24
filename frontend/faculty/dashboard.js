// =====================================================
// AI ATTEND - FACULTY DASHBOARD
// Assignment-Aware Dashboard
// =====================================================

const API_BASE_URL = "http://127.0.0.1:8000";

const DASHBOARD_URL = `${API_BASE_URL}/faculty/dashboard/`;
const REFRESH_URL = `${API_BASE_URL}/api/token/refresh/`;


// =====================================================
// AUTH
// =====================================================

let accessToken = localStorage.getItem("access_token");
let userRole = localStorage.getItem("user_role");


// =====================================================
// ELEMENTS
// =====================================================

const facultyName = document.getElementById("facultyName");
const facultyDesignation = document.getElementById("facultyDesignation");
const facultyInitial = document.getElementById("facultyInitial");
const welcomeName = document.getElementById("welcomeName");
const departmentName = document.getElementById("departmentName");

const overallAttendance = document.getElementById("overallAttendance");
const totalStudents = document.getElementById("totalStudents");
const totalSubjects = document.getElementById("totalSubjects");
const attendancePercentage = document.getElementById("attendancePercentage");
const atRiskStudents = document.getElementById("atRiskStudents");

const todayPercentage = document.getElementById("todayPercentage");
const todayPresent = document.getElementById("todayPresent");
const todayAbsent = document.getElementById("todayAbsent");
const todayTotal = document.getElementById("todayTotal");

const subjectsContainer = document.getElementById("subjectsContainer");
const studentsTable = document.getElementById("studentsTable");
const recentAttendanceTable =
    document.getElementById("recentAttendanceTable");


// =====================================================
// AUTH CHECK
// =====================================================

if (!accessToken) {
    window.location.href = "../login/login.html";
}


// =====================================================
// TOKEN REFRESH
// =====================================================

async function refreshAccessToken() {

    const refreshToken =
        localStorage.getItem("refresh_token");

    if (!refreshToken) {
        return false;
    }

    try {

        const response = await fetch(
            REFRESH_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },

                body: JSON.stringify({
                    refresh: refreshToken
                })
            }
        );

        if (!response.ok) {
            return false;
        }

        const data = await response.json();

        if (!data.access) {
            return false;
        }

        accessToken = data.access;

        localStorage.setItem(
            "access_token",
            accessToken
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


// =====================================================
// API REQUEST
// =====================================================

async function apiRequest(
    url,
    options = {},
    retry = true
) {

    const headers = {
        "Accept": "application/json",
        ...options.headers,
        "Authorization": `Bearer ${accessToken}`
    };

    try {

        const response = await fetch(
            url,
            {
                ...options,
                headers
            }
        );

        // Token expired
        if (
            response.status === 401 &&
            retry
        ) {

            const refreshed =
                await refreshAccessToken();

            if (refreshed) {

                return apiRequest(
                    url,
                    options,
                    false
                );
            }

            logout();
            return null;
        }

        return response;

    } catch (error) {

        console.error(
            "API request failed:",
            error
        );

        throw error;
    }
}


// =====================================================
// LOAD DASHBOARD
// =====================================================

async function loadDashboard() {

    showLoadingState();

    try {

        const response =
            await apiRequest(
                DASHBOARD_URL
            );

        if (!response) {
            return;
        }


        // =================================================
        // 403
        // =================================================

        if (response.status === 403) {

            const errorData =
                await response.json()
                    .catch(() => ({}));

            console.error(
                "Faculty permission error:",
                errorData
            );

            showDashboardError(
                errorData.detail ||
                "Faculty access required. Please login again."
            );

            return;
        }


        // =================================================
        // OTHER HTTP ERRORS
        // =================================================

        if (!response.ok) {

            const errorData =
                await response.json()
                    .catch(() => ({}));

            throw new Error(
                errorData.detail ||
                errorData.error ||
                `Server error (${response.status})`
            );
        }


        // =================================================
        // RESPONSE DATA
        // =================================================

        const data =
            await response.json();

        console.log(
            "===================================="
        );

        console.log(
            "AI ATTEND FACULTY DASHBOARD"
        );

        console.log(
            "Dashboard API:",
            DASHBOARD_URL
        );

        console.log(
            "Response:",
            data
        );

        console.log(
            "===================================="
        );


        // =================================================
        // RENDER
        // =================================================

        renderFaculty(
            data.faculty || {}
        );

        renderStatistics(
            data.statistics || {}
        );

        renderSubjects(
            data.subjects || []
        );

        renderStudents(
            data.students || []
        );

        renderRecentAttendance(
            data.recent_attendance || []
        );


    } catch (error) {

        console.error(
            "Faculty dashboard error:",
            error
        );

        showDashboardError(
            error.message ||
            "Unable to load faculty dashboard."
        );
    }
}


// =====================================================
// LOADING STATE
// =====================================================

function showLoadingState() {

    if (departmentName) {
        departmentName.textContent =
            "Loading department...";
    }

    if (subjectsContainer) {
        subjectsContainer.innerHTML = `
            <div class="loading">
                Loading subjects...
            </div>
        `;
    }

    if (studentsTable) {
        studentsTable.innerHTML = `
            <tr>
                <td colspan="6">
                    Loading students...
                </td>
            </tr>
        `;
    }

    if (recentAttendanceTable) {
        recentAttendanceTable.innerHTML = `
            <tr>
                <td colspan="4">
                    Loading attendance...
                </td>
            </tr>
        `;
    }
}


// =====================================================
// ERROR STATE
// =====================================================

function showDashboardError(message) {

    if (departmentName) {
        departmentName.textContent =
            "Unable to load";
    }

    if (subjectsContainer) {
        subjectsContainer.innerHTML = `
            <div class="loading">
                ${escapeHTML(message)}
            </div>
        `;
    }

    if (studentsTable) {
        studentsTable.innerHTML = `
            <tr>
                <td colspan="6">
                    ${escapeHTML(message)}
                </td>
            </tr>
        `;
    }

    if (recentAttendanceTable) {
        recentAttendanceTable.innerHTML = `
            <tr>
                <td colspan="4">
                    ${escapeHTML(message)}
                </td>
            </tr>
        `;
    }
}


// =====================================================
// FACULTY INFORMATION
// =====================================================

function renderFaculty(faculty) {

    if (!faculty) {
        return;
    }

    const name =
        faculty.name ||
        faculty.full_name ||
        "Faculty";

    const designation =
        faculty.designation ||
        "Faculty";

    const department =
        faculty.department_name ||
        faculty.department ||
        "Department not available";


    if (facultyName) {
        facultyName.textContent =
            name;
    }

    if (welcomeName) {
        welcomeName.textContent =
            name;
    }

    if (facultyDesignation) {
        facultyDesignation.textContent =
            designation;
    }

    if (departmentName) {
        departmentName.textContent =
            department;
    }

    if (facultyInitial) {

        facultyInitial.textContent =
            name
                .trim()
                .charAt(0)
                .toUpperCase();
    }
}


// =====================================================
// STATISTICS
// =====================================================

function renderStatistics(stats) {

    if (!stats) {
        return;
    }


    const percentage =
        Number(
            stats.attendance_percentage ??
            stats.overall_attendance ??
            stats.percentage ??
            0
        );


    const students =
        Number(
            stats.total_students ??
            0
        );


    const subjects =
        Number(
            stats.total_subjects ??
            0
        );


    const atRisk =
        Number(
            stats.at_risk_students ??
            stats.at_risk ??
            0
        );


    const present =
        Number(
            stats.today_present ??
            0
        );


    const absent =
        Number(
            stats.today_absent ??
            0
        );


    const total =
        Number(
            stats.today_total ??
            (present + absent)
        );


    let todayPercent =
        Number(
            stats.today_percentage ??
            0
        );


    if (
        !stats.today_percentage &&
        total > 0
    ) {

        todayPercent =
            (present / total) * 100;
    }


    // =================================================
    // MAIN CARDS
    // =================================================

    if (totalStudents) {
        totalStudents.textContent =
            students;
    }

    if (totalSubjects) {
        totalSubjects.textContent =
            subjects;
    }

    if (attendancePercentage) {
        attendancePercentage.textContent =
            `${percentage.toFixed(2)}%`;
    }

    if (overallAttendance) {
        overallAttendance.textContent =
            `${percentage.toFixed(2)}%`;
    }

    if (atRiskStudents) {
        atRiskStudents.textContent =
            atRisk;
    }


    // =================================================
    // TODAY
    // =================================================

    if (todayPresent) {
        todayPresent.textContent =
            present;
    }

    if (todayAbsent) {
        todayAbsent.textContent =
            absent;
    }

    if (todayTotal) {
        todayTotal.textContent =
            total;
    }

    if (todayPercentage) {

        if (total === 0) {

            todayPercentage.textContent =
                "No data";

        } else {

            todayPercentage.textContent =
                `${todayPercent.toFixed(2)}%`;
        }
    }
}


// =====================================================
// SUBJECTS
// =====================================================

function renderSubjects(subjects) {

    if (!subjectsContainer) {
        return;
    }


    if (
        !Array.isArray(subjects) ||
        subjects.length === 0
    ) {

        subjectsContainer.innerHTML = `
            <div class="loading">
                No subjects assigned.
            </div>
        `;

        return;
    }


    subjectsContainer.innerHTML =
        subjects
            .map(function(subject) {

                const percentage =
                    Number(
                        subject.attendance_percentage ??
                        subject.percentage ??
                        subject.attendance ??
                        0
                    );


                const subjectName =
                    subject.name ||
                    subject.subject_name ||
                    subject.subject?.name ||
                    "Subject";


                const subjectCode =
                    subject.subject_code ||
                    subject.code ||
                    subject.subject?.subject_code ||
                    "";


                const credits =
                    subject.credits ??
                    subject.subject?.credits ??
                    0;


                const semester =
                    subject.semester ??
                    subject.semester_number ??
                    subject.semester?.number ??
                    "";


                const section =
                    subject.section ??
                    subject.section_name ??
                    subject.section?.name ??
                    "";


                let assignmentText = "";

                if (semester || section) {

                    assignmentText =
                        `Sem ${semester}`;

                    if (section) {
                        assignmentText +=
                            ` · Section ${section}`;
                    }
                }


                return `
                    <div class="subject-row">

                        <div class="subject-top">

                            <div>

                                <div class="subject-name">
                                    ${escapeHTML(
                                        subjectName
                                    )}
                                </div>

                                <div class="subject-code">

                                    ${escapeHTML(
                                        subjectCode
                                    )}

                                    ${
                                        credits
                                            ? ` · ${escapeHTML(credits)} Credits`
                                            : ""
                                    }

                                    ${
                                        assignmentText
                                            ? ` · ${escapeHTML(assignmentText)}`
                                            : ""
                                    }

                                </div>

                            </div>

                            <div class="subject-percent">
                                ${percentage.toFixed(2)}%
                            </div>

                        </div>


                        <div class="progress">

                            <div
                                class="progress-fill"
                                style="width:${Math.min(
                                    100,
                                    Math.max(
                                        0,
                                        percentage
                                    )
                                )}%"
                            ></div>

                        </div>

                    </div>
                `;
            })
            .join("");
}


// =====================================================
// STUDENTS
// =====================================================

function renderStudents(students) {

    if (!studentsTable) {
        return;
    }


    if (
        !Array.isArray(students) ||
        students.length === 0
    ) {

        studentsTable.innerHTML = `
            <tr>
                <td colspan="6">
                    No students found in your assigned classes.
                </td>
            </tr>
        `;

        return;
    }


    studentsTable.innerHTML =
        students
            .map(function(student) {

                const percentage =
                    Number(
                        student.attendance_percentage ??
                        student.percentage ??
                        0
                    );


                const risk =
                    String(
                        student.risk ??
                        student.attendance_risk ??
                        "NO DATA"
                    ).toUpperCase();


                let riskClass = "";


                if (risk === "LOW") {
                    riskClass = "risk-low";
                }

                else if (risk === "MEDIUM") {
                    riskClass = "risk-medium";
                }

                else if (risk === "HIGH") {
                    riskClass = "risk-high";
                }


                const name =
                    student.name ||
                    student.student_name ||
                    "Student";


                const email =
                    student.email ||
                    "";


                const usn =
                    student.usn ||
                    student.USN ||
                    "-";


                const present =
                    Number(
                        student.present ??
                        student.present_count ??
                        0
                    );


                const absent =
                    Number(
                        student.absent ??
                        student.absent_count ??
                        0
                    );


                return `
                    <tr>

                        <td>

                            <div class="student-cell">

                                <strong>
                                    ${escapeHTML(name)}
                                </strong>

                                ${
                                    email
                                        ? `<span>${escapeHTML(email)}</span>`
                                        : ""
                                }

                            </div>

                        </td>


                        <td>
                            ${escapeHTML(usn)}
                        </td>


                        <td>
                            ${present}
                        </td>


                        <td>
                            ${absent}
                        </td>


                        <td>
                            <strong>
                                ${percentage.toFixed(2)}%
                            </strong>
                        </td>


                        <td>

                            <span
                                class="status ${riskClass}"
                            >
                                ${escapeHTML(risk)}
                            </span>

                        </td>

                    </tr>
                `;
            })
            .join("");
}


// =====================================================
// RECENT ATTENDANCE
// =====================================================

function renderRecentAttendance(records) {

    if (!recentAttendanceTable) {
        return;
    }


    if (
        !Array.isArray(records) ||
        records.length === 0
    ) {

        recentAttendanceTable.innerHTML = `
            <tr>
                <td colspan="4">
                    No recent attendance records.
                </td>
            </tr>
        `;

        return;
    }


    recentAttendanceTable.innerHTML =
        records
            .map(function(record) {

                const status =
                    String(
                        record.status ||
                        ""
                    ).toUpperCase();


                const statusClass =
                    status === "PRESENT"
                        ? "present"
                        : "absent";


                const date =
                    record.date ||
                    record.attendance_date ||
                    "-";


                const student =
                    record.student_name ||
                    record.student ||
                    record.student?.name ||
                    "-";


                const subject =
                    record.subject_name ||
                    record.subject ||
                    record.subject?.name ||
                    "-";


                return `
                    <tr>

                        <td>
                            ${escapeHTML(date)}
                        </td>

                        <td>
                            ${escapeHTML(student)}
                        </td>

                        <td>
                            ${escapeHTML(subject)}
                        </td>

                        <td>

                            <span
                                class="status ${statusClass}"
                            >
                                ${escapeHTML(status || "-")}
                            </span>

                        </td>

                    </tr>
                `;
            })
            .join("");
}


// =====================================================
// LOGOUT
// =====================================================

function logout() {

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_role");
    localStorage.removeItem("studentId");

    window.location.href =
        "../login/login.html";
}


const logoutBtn =
    document.getElementById("logoutBtn");


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        logout
    );
}


// =====================================================
// HTML ESCAPE
// =====================================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value == null
            ? ""
            : String(value);

    return div.innerHTML;
}


// =====================================================
// START
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadDashboard();

    }
);