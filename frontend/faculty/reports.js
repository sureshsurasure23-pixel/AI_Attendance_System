const API_BASE_URL = "http://127.0.0.1:8000";

const FACULTY_REPORTS_URL = `${API_BASE_URL}/faculty/reports/`;
const FACULTY_ASSIGNMENTS_URL = `${API_BASE_URL}/allocations/faculty/`;
const REFRESH_URL = `${API_BASE_URL}/api/token/refresh/`;

let accessToken = localStorage.getItem("access_token");

let facultyData = null;
let assignments = [];
let students = [];
let subjects = [];
let attendanceRecords = [];


// =========================================================
// AUTHENTICATION
// =========================================================

if (!accessToken) {
    window.location.href = "../login.html";
}


// =========================================================
// API REQUEST
// =========================================================

async function apiRequest(url, options = {}, retry = true) {

    if (!accessToken) {
        window.location.href = "../login.html";
        return null;
    }

    const response = await fetch(
        `${API_BASE_URL}${url}`,
        {
            ...options,

            headers: {
                "Content-Type": "application/json",

                "Authorization":
                    `Bearer ${accessToken}`,

                ...(options.headers || {})
            }
        }
    );


    // -----------------------------------------------------
    // TOKEN EXPIRED
    // -----------------------------------------------------

    if (response.status === 401 && retry) {

        const refreshToken =
            localStorage.getItem("refresh_token");

        if (refreshToken) {

            try {

                const refreshResponse =
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


                if (refreshResponse.ok) {

                    const refreshData =
                        await refreshResponse.json();

                    accessToken =
                        refreshData.access;

                    localStorage.setItem(
                        "access_token",
                        accessToken
                    );


                    return apiRequest(
                        url,
                        options,
                        false
                    );
                }

            }
            catch (error) {

                console.error(
                    "Token refresh error:",
                    error
                );
            }
        }


        logout();

        return null;
    }


    // -----------------------------------------------------
    // OTHER ERRORS
    // -----------------------------------------------------

    if (!response.ok) {

        let message =
            `Request failed: ${response.status}`;

        try {

            const errorData =
                await response.json();


            if (errorData.detail) {

                message =
                    errorData.detail;

            }
            else if (errorData.error) {

                message =
                    errorData.error;
            }

        }
        catch (error) {

            console.error(
                "Unable to read API error:",
                error
            );
        }


        throw new Error(message);
    }


    return response.json();
}


// =========================================================
// HELPERS
// =========================================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value ?? "");

    return div.innerHTML;
}


function formatPercentage(value) {

    const number =
        Number(value || 0);

    return `${number.toFixed(2)}%`;
}


function getRiskClass(risk) {

    const value =
        String(
            risk || "NO DATA"
        ).toUpperCase();


    if (value === "LOW") {
        return "low";
    }


    if (value === "MEDIUM") {
        return "medium";
    }


    if (value === "HIGH") {
        return "high";
    }


    return "nodata";
}


function calculateRisk(percentage) {

    const value =
        Number(percentage || 0);


    if (value >= 75) {
        return "LOW";
    }


    if (value >= 65) {
        return "MEDIUM";
    }


    return "HIGH";
}


function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


// =========================================================
// LOAD REPORTS
// =========================================================

async function loadReports() {

    try {

        console.log(
            "Loading faculty reports..."
        );


        // -------------------------------------------------
        // LOAD DEDICATED REPORT ENDPOINT
        // -------------------------------------------------

        const report =
            await apiRequest(
                "/faculty/reports/"
            );


        if (!report) {
            return;
        }


        console.log(
            "Faculty Reports:",
            report
        );


        // -------------------------------------------------
        // FACULTY
        // -------------------------------------------------

        facultyData =
            report.faculty || null;


        // -------------------------------------------------
        // LOAD ASSIGNMENTS
        // -------------------------------------------------

        try {

            const assignmentResponse =
                await apiRequest(
                    "/allocations/faculty/"
                );


            if (assignmentResponse) {

                assignments =
                    assignmentResponse.assignments || [];

            }

        }
        catch (assignmentError) {

            console.warn(
                "Assignment loading failed:",
                assignmentError
            );

            assignments = [];
        }


        // -------------------------------------------------
        // BUILD SUBJECT LIST
        // -------------------------------------------------

        if (assignments.length > 0) {

            subjects =
                assignments.map(
                    function(assignment) {

                        return {

                            id:
                                assignment.subject?.id,

                            subject_id:
                                assignment.subject?.subject_id,

                            subject_code:
                                assignment.subject?.subject_code,

                            name:
                                assignment.subject?.name,

                            credits:
                                assignment.subject?.credits || 0,

                            semester:
                                assignment.semester?.number,

                            section:
                                assignment.section?.name,

                            assignment_id:
                                assignment.id
                        };
                    }
                );

        }
        else {

            subjects =
                report.subjects || [];
        }


        // -------------------------------------------------
        // STUDENTS
        // -------------------------------------------------

        students =
            report.students || [];


        // -------------------------------------------------
        // RECENT ATTENDANCE
        // -------------------------------------------------

        attendanceRecords =
            report.recent_attendance ||
            report.recentAttendance ||
            [];


        // -------------------------------------------------
        // RENDER FACULTY
        // -------------------------------------------------

        renderFaculty(
            facultyData
        );


        // -------------------------------------------------
        // RENDER SUMMARY
        // -------------------------------------------------

        renderSummary(
            report
        );


        // -------------------------------------------------
        // RENDER SUBJECTS
        // -------------------------------------------------

        renderSubjects(
            report.subjects?.length
                ? report.subjects
                : subjects
        );


        // -------------------------------------------------
        // RENDER STUDENTS
        // -------------------------------------------------

        renderStudents(
            students
        );


        // -------------------------------------------------
        // RENDER RISK
        // -------------------------------------------------

        renderRisk(
            students
        );


        // -------------------------------------------------
        // RENDER RECENT ATTENDANCE
        // -------------------------------------------------

        renderRecentAttendance(
            attendanceRecords
        );


        console.log(
            "Faculty reports loaded successfully."
        );

    }
    catch (error) {

        console.error(
            "Reports error:",
            error
        );


        showReportError(
            error.message ||
            "Unable to load faculty reports."
        );
    }
}


// =========================================================
// FACULTY INFORMATION
// =========================================================

function renderFaculty(faculty) {

    if (!faculty) {
        return;
    }


    const name =
        faculty.name ||
        "Faculty";


    const designation =
        faculty.designation ||
        "Faculty";


    setText(
        "facultyName",
        name
    );


    setText(
        "facultyDesignation",
        designation
    );


    const initialElement =
        document.getElementById(
            "facultyInitial"
        );


    if (initialElement) {

        initialElement.textContent =
            name
                .charAt(0)
                .toUpperCase();
    }
}


// =========================================================
// SUMMARY
// =========================================================

function renderSummary(data) {

    const statistics =
        data.statistics ||
        data.summary ||
        {};


    const studentList =
        data.students ||
        [];


    const subjectList =
        data.subjects ||
        subjects ||
        [];


    // -----------------------------------------------------
    // STUDENTS
    // -----------------------------------------------------

    const totalStudents =
        Number(
            statistics.total_students ??
            statistics.students_count ??
            studentList.length ??
            0
        );


    // -----------------------------------------------------
    // SUBJECTS
    // -----------------------------------------------------

    const totalSubjects =
        Number(
            statistics.total_subjects ??
            statistics.subjects_count ??
            subjectList.length ??
            0
        );


    // -----------------------------------------------------
    // RECORDS
    // -----------------------------------------------------

    const totalRecords =
        Number(
            statistics.total_records ??
            statistics.total_attendance ??
            statistics.total ??
            0
        );


    // -----------------------------------------------------
    // PRESENT
    // -----------------------------------------------------

    const present =
        Number(
            statistics.total_present ??
            statistics.present ??
            0
        );


    // -----------------------------------------------------
    // ABSENT
    // -----------------------------------------------------

    const absent =
        Number(
            statistics.total_absent ??
            statistics.absent ??
            0
        );


    // -----------------------------------------------------
    // PERCENTAGE
    // -----------------------------------------------------

    let percentage =
        Number(
            statistics.attendance_percentage ??
            statistics.percentage ??
            0
        );


    // -----------------------------------------------------
    // FALLBACK CALCULATION
    // -----------------------------------------------------

    if (
        percentage === 0 &&
        totalRecords > 0
    ) {

        percentage =
            (present / totalRecords) * 100;
    }


    // -----------------------------------------------------
    // TOP CARDS
    // -----------------------------------------------------

    setText(
        "reportStudents",
        totalStudents
    );


    setText(
        "reportSubjects",
        totalSubjects
    );


    setText(
        "reportPresent",
        present
    );


    setText(
        "reportAbsent",
        absent
    );


    // -----------------------------------------------------
    // OVERALL PERCENTAGE
    // -----------------------------------------------------

    setText(
        "overallPercentage",
        formatPercentage(
            percentage
        )
    );


    // -----------------------------------------------------
    // OVERVIEW
    // -----------------------------------------------------

    setText(
        "overviewPresent",
        present
    );


    setText(
        "overviewAbsent",
        absent
    );


    setText(
        "overviewTotal",
        totalRecords
    );


    // -----------------------------------------------------
    // PROGRESS BAR
    // -----------------------------------------------------

    const progress =
        document.getElementById(
            "overallProgress"
        );


    if (progress) {

        const safe =
            Math.max(
                0,
                Math.min(
                    100,
                    percentage
                )
            );


        progress.style.width =
            `${safe}%`;
    }
}


// =========================================================
// SUBJECT ANALYSIS
// =========================================================

function renderSubjects(subjectList) {

    const container =
        document.getElementById(
            "subjectReport"
        );


    if (!container) {
        return;
    }


    if (!subjectList.length) {

        container.innerHTML = `
            <div class="report-empty">
                No subject attendance data available.
            </div>
        `;

        return;
    }


    container.innerHTML =
        subjectList
            .map(
                function(subject) {

                    const percentage =
                        Number(
                            subject.attendance_percentage ??
                            subject.percentage ??
                            0
                        );


                    const present =
                        Number(
                            subject.present ??
                            subject.total_present ??
                            0
                        );


                    const absent =
                        Number(
                            subject.absent ??
                            subject.total_absent ??
                            0
                        );


                    const total =
                        Number(
                            subject.total_records ??
                            subject.total ??
                            (present + absent)
                        );


                    const credits =
                        Number(
                            subject.credits ??
                            0
                        );


                    const semester =
                        subject.semester ??
                        "";


                    const section =
                        subject.section ??
                        "";


                    const safe =
                        Math.max(
                            0,
                            Math.min(
                                100,
                                percentage
                            )
                        );


                    return `

                        <div class="subject-report-item">

                            <div class="subject-report-header">

                                <div>

                                    <strong>
                                        ${escapeHTML(
                                            subject.name ||
                                            "Subject"
                                        )}
                                    </strong>

                                    <span>
                                        ${escapeHTML(
                                            subject.subject_code ||
                                            subject.subject_id ||
                                            "-"
                                        )}
                                    </span>

                                </div>


                                <strong>
                                    ${formatPercentage(
                                        percentage
                                    )}
                                </strong>

                            </div>


                            <div class="report-progress">

                                <div
                                    class="report-progress-fill"
                                    style="width:${safe}%">
                                </div>

                            </div>


                            <div class="subject-report-footer">

                                <span>
                                    Present:
                                    ${present}
                                </span>


                                <span>
                                    Absent:
                                    ${absent}
                                </span>


                                <span>
                                    Total:
                                    ${total}
                                </span>


                                <span>
                                    ${credits}
                                    Credits
                                </span>


                                ${
                                    semester !== ""
                                        ? `
                                            <span>
                                                Sem ${escapeHTML(
                                                    semester
                                                )}
                                            </span>
                                        `
                                        : ""
                                }


                                ${
                                    section !== ""
                                        ? `
                                            <span>
                                                Section ${escapeHTML(
                                                    section
                                                )}
                                            </span>
                                        `
                                        : ""
                                }

                            </div>

                        </div>

                    `;
                }
            )
            .join("");
}


// =========================================================
// STUDENT RISK
// =========================================================

function renderRisk(studentList) {

    let low = 0;
    let medium = 0;
    let high = 0;
    let noData = 0;


    studentList.forEach(
        function(student) {

            const total =
                Number(
                    student.total ??
                    student.total_records ??
                    0
                );


            const percentage =
                Number(
                    student.attendance_percentage ??
                    student.percentage ??
                    0
                );


            let risk =
                student.risk;


            // -------------------------------------------------
            // NO DATA
            // -------------------------------------------------

            if (
                total === 0 &&
                !student.risk
            ) {

                noData++;

                return;
            }


            // -------------------------------------------------
            // FALLBACK RISK
            // -------------------------------------------------

            if (!risk) {

                risk =
                    calculateRisk(
                        percentage
                    );
            }


            risk =
                String(
                    risk
                ).toUpperCase();


            if (risk === "LOW") {

                low++;

            }
            else if (risk === "MEDIUM") {

                medium++;

            }
            else if (risk === "HIGH") {

                high++;

            }
            else {

                noData++;
            }
        }
    );


    setText(
        "reportLowRisk",
        low
    );


    setText(
        "reportMediumRisk",
        medium
    );


    setText(
        "reportHighRisk",
        high
    );


    setText(
        "reportNoData",
        noData
    );


    const message =
        document.getElementById(
            "riskMessage"
        );


    if (!message) {
        return;
    }


    if (high > 0) {

        message.textContent =
            `${high} student(s) currently have attendance below 65%.`;

    }
    else if (medium > 0) {

        message.textContent =
            `${medium} student(s) are currently between 65% and 74.99%.`;

    }
    else if (low > 0) {

        message.textContent =
            "All students currently meet the 75% attendance requirement.";

    }
    else {

        message.textContent =
            "No student attendance data available.";
    }
}


// =========================================================
// STUDENT ANALYSIS
// =========================================================

function renderStudents(studentList) {

    const tbody =
        document.getElementById(
            "studentReportBody"
        );


    if (!tbody) {
        return;
    }


    if (!studentList.length) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="table-empty">
                    No student attendance data available.
                </td>
            </tr>
        `;

        return;
    }


    const sorted =
        [...studentList].sort(
            function(a, b) {

                const aPercentage =
                    Number(
                        a.attendance_percentage ??
                        a.percentage ??
                        0
                    );


                const bPercentage =
                    Number(
                        b.attendance_percentage ??
                        b.percentage ??
                        0
                    );


                return (
                    aPercentage -
                    bPercentage
                );
            }
        );


    tbody.innerHTML =
        sorted
            .map(
                function(student, index) {

                    const percentage =
                        Number(
                            student.attendance_percentage ??
                            student.percentage ??
                            0
                        );


                    const present =
                        Number(
                            student.present ??
                            student.total_present ??
                            0
                        );


                    const absent =
                        Number(
                            student.absent ??
                            student.total_absent ??
                            0
                        );


                    let risk =
                        student.risk;


                    if (!risk) {

                        if (
                            Number(
                                student.total ??
                                student.total_records ??
                                0
                            ) === 0
                        ) {

                            risk = "NO DATA";

                        }
                        else {

                            risk =
                                calculateRisk(
                                    percentage
                                );
                        }
                    }


                    const safePercentage =
                        Math.max(
                            0,
                            Math.min(
                                100,
                                percentage
                            )
                        );


                    return `

                        <tr>

                            <td>
                                ${index + 1}
                            </td>


                            <td>

                                <div class="report-student-name">

                                    <div class="mini-avatar">

                                        ${escapeHTML(
                                            (
                                                student.name ||
                                                "S"
                                            )
                                                .charAt(0)
                                                .toUpperCase()
                                        )}

                                    </div>


                                    <div>

                                        <strong>
                                            ${escapeHTML(
                                                student.name ||
                                                "Student"
                                            )}
                                        </strong>

                                        <span>
                                            ${escapeHTML(
                                                student.student_id ||
                                                "-"
                                            )}
                                        </span>

                                    </div>

                                </div>

                            </td>


                            <td>

                                ${escapeHTML(
                                    student.usn ||
                                    "-"
                                )}

                            </td>


                            <td>

                                <div class="table-attendance">

                                    <div class="table-progress">

                                        <div
                                            class="table-progress-fill"
                                            style="width:${safePercentage}%">
                                        </div>

                                    </div>


                                    <strong>
                                        ${formatPercentage(
                                            percentage
                                        )}
                                    </strong>

                                </div>

                            </td>


                            <td class="present-cell">

                                ${present}

                            </td>


                            <td class="absent-cell">

                                ${absent}

                            </td>


                            <td>

                                <span
                                    class="report-risk-badge ${getRiskClass(
                                        risk
                                    )}">

                                    ${escapeHTML(
                                        String(
                                            risk
                                        ).toUpperCase()
                                    )}

                                </span>

                            </td>

                        </tr>

                    `;
                }
            )
            .join("");
}


// =========================================================
// RECENT ATTENDANCE
// =========================================================

function renderRecentAttendance(records) {

    const tbody =
        document.getElementById(
            "recentReportBody"
        );


    if (!tbody) {
        return;
    }


    if (!records.length) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    class="table-empty">
                    No recent attendance records available.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        records
            .map(
                function(record) {

                    const date =
                        record.date ||
                        record.attendance_date ||
                        "-";


                    const student =
                        record.student_name ||
                        record.student_name_display ||
                        record.student ||
                        "-";


                    const subject =
                        record.subject_name ||
                        record.subject_name_display ||
                        record.subject ||
                        "-";


                    const status =
                        record.status ||
                        "-";


                    const isPresent =
                        String(status)
                            .toUpperCase() ===
                        "PRESENT";


                    return `

                        <tr>

                            <td>
                                ${escapeHTML(
                                    date
                                )}
                            </td>


                            <td>
                                ${escapeHTML(
                                    student
                                )}
                            </td>


                            <td>
                                ${escapeHTML(
                                    subject
                                )}
                            </td>


                            <td>

                                <span
                                    class="attendance-status ${
                                        isPresent
                                            ? "present"
                                            : "absent"
                                    }">

                                    ${escapeHTML(
                                        status
                                    )}

                                </span>

                            </td>

                        </tr>

                    `;
                }
            )
            .join("");
}


// =========================================================
// ERROR
// =========================================================

function showReportError(message) {

    const safeMessage =
        escapeHTML(
            message
        );


    const subjectReport =
        document.getElementById(
            "subjectReport"
        );


    if (subjectReport) {

        subjectReport.innerHTML = `
            <div class="report-error">
                ${safeMessage}
            </div>
        `;
    }


    const studentReport =
        document.getElementById(
            "studentReportBody"
        );


    if (studentReport) {

        studentReport.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="table-empty">
                    ${safeMessage}
                </td>
            </tr>
        `;
    }


    const recentReport =
        document.getElementById(
            "recentReportBody"
        );


    if (recentReport) {

        recentReport.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    class="table-empty">
                    ${safeMessage}
                </td>
            </tr>
        `;
    }
}


// =========================================================
// REFRESH BUTTON
// =========================================================

const refreshButton =
    document.getElementById(
        "refreshReportBtn"
    );


if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        function() {

            loadReports();

        }
    );
}


// =========================================================
// PRINT BUTTON
// =========================================================

const printButton =
    document.getElementById(
        "printReportBtn"
    );


if (printButton) {

    printButton.addEventListener(
        "click",
        function() {

            window.print();

        }
    );
}


// =========================================================
// LOGOUT BUTTON
// =========================================================

const logoutButton =
    document.getElementById(
        "logoutBtn"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        function() {

            logout();

        }
    );
}


// =========================================================
// LOGOUT
// =========================================================

function logout() {

    localStorage.removeItem(
        "access_token"
    );

    localStorage.removeItem(
        "refresh_token"
    );

    localStorage.removeItem(
        "facultyId"
    );

    localStorage.removeItem(
        "studentId"
    );

    localStorage.removeItem(
        "role"
    );


    window.location.href =
        "../login.html";
}


// =========================================================
// START
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadReports();

    }
);