// =========================================================
// ADMIN STUDENTS PAGE
// =========================================================

const API_BASE_URL = "http://127.0.0.1:8000";

let allStudents = [];
let allAttendance = [];


// =========================================================
// AUTH TOKEN
// =========================================================

function getToken() {
    return localStorage.getItem("access_token");
}


// =========================================================
// HTML ESCAPE
// =========================================================

function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}


// =========================================================
// API REQUEST
// =========================================================

async function apiRequest(url, options = {}) {

    const token = getToken();

    if (!token) {
        window.location.href = "../login.html";
        return null;
    }

    const response = await fetch(
        `${API_BASE_URL}${url}`,
        {
            ...options,

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
                ...(options.headers || {})
            }
        }
    );

    // -----------------------------------------------------
    // TOKEN EXPIRED
    // -----------------------------------------------------

    if (response.status === 401) {

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        window.location.href = "../login.html";

        return null;
    }

    const text = await response.text();

    let data = {};

    try {

        data = text
            ? JSON.parse(text)
            : {};

    } catch (error) {

        console.error(
            "Invalid API response:",
            text
        );

        throw new Error(
            "Server returned an invalid response."
        );
    }

    if (!response.ok) {

        throw new Error(
            data.detail ||
            data.message ||
            `Request failed: ${response.status}`
        );
    }

    return data;
}


// =========================================================
// LOAD STUDENTS + ATTENDANCE
// =========================================================

async function loadStudents() {

    const tableBody =
        document.getElementById("studentTableBody");

    if (tableBody) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="table-empty">
                    Loading students...
                </td>
            </tr>
        `;
    }

    try {

        // -------------------------------------------------
        // LOAD STUDENTS
        // -------------------------------------------------

        const studentData =
            await apiRequest(
                "/student-profile/list/"
            );

        // -------------------------------------------------
        // LOAD ATTENDANCE
        // -------------------------------------------------

        const attendanceData =
            await apiRequest(
                "/attendance/"
            );

        // -------------------------------------------------
        // STORE STUDENTS
        // -------------------------------------------------

        if (Array.isArray(studentData)) {

            allStudents = studentData;

        } else if (
            studentData &&
            Array.isArray(studentData.results)
        ) {

            allStudents = studentData.results;

        } else {

            allStudents = [];
        }

        // -------------------------------------------------
        // STORE ATTENDANCE
        // -------------------------------------------------

        if (Array.isArray(attendanceData)) {

            allAttendance = attendanceData;

        } else if (
            attendanceData &&
            Array.isArray(attendanceData.results)
        ) {

            allAttendance = attendanceData.results;

        } else {

            allAttendance = [];
        }

        console.log(
            "Students loaded:",
            allStudents
        );

        console.log(
            "Attendance loaded:",
            allAttendance
        );

        // -------------------------------------------------
        // UPDATE PAGE
        // -------------------------------------------------

        updateSummaryCards();

        populateSemesterFilter();

        renderStudents();

    } catch (error) {

        console.error(
            "Failed to load students:",
            error
        );

        showError(
            error.message ||
            "Failed to load students."
        );
    }
}


// =========================================================
// SET TEXT
// =========================================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value ?? "-";
    }
}


// =========================================================
// STUDENT NAME
// =========================================================

function getStudentName(student) {

    return (
        student.name ||
        student.student_name ||
        "Student"
    );
}


// =========================================================
// STUDENT ID
// =========================================================

function getStudentID(student) {

    return (
        student.student_id ||
        student.id ||
        "-"
    );
}


// =========================================================
// USN
// =========================================================

function getUSN(student) {

    return (
        student.usn ||
        student.USN ||
        "-"
    );
}


// =========================================================
// EMAIL
// =========================================================

function getEmail(student) {

    return (
        student.email ||
        "-"
    );
}


// =========================================================
// PHONE
// =========================================================

function getPhone(student) {

    return (
        student.phone ||
        "-"
    );
}


// =========================================================
// DEPARTMENT
// =========================================================

function getDepartment(student) {

    return (
        student.department_name ||
        student.department ||
        "-"
    );
}


// =========================================================
// SEMESTER
// =========================================================

function getSemester(student) {

    return (
        student.semester ??
        "-"
    );
}


// =========================================================
// SECTION
// =========================================================

function getSection(student) {

    return (
        student.section ||
        "-"
    );
}


// =========================================================
// GET ATTENDANCE STUDENT ID
// =========================================================

function getAttendanceStudentId(record) {

    if (
        record.student !== undefined &&
        record.student !== null
    ) {
        return record.student;
    }

    if (
        record.student_id !== undefined &&
        record.student_id !== null
    ) {
        return record.student_id;
    }

    if (
        record.student_profile !== undefined &&
        record.student_profile !== null
    ) {
        return record.student_profile;
    }

    return null;
}


// =========================================================
// GET ATTENDANCE STATUS
// =========================================================

function getAttendanceStatus(record) {

    return String(
        record.status ||
        record.attendance_status ||
        ""
    ).toUpperCase();
}


// =========================================================
// ATTENDANCE STATISTICS
// =========================================================

function getAttendanceStats(studentId) {

    const records =
        allAttendance.filter(
            record =>
                Number(
                    getAttendanceStudentId(record)
                ) === Number(studentId)
        );

    const total =
        records.length;

    if (total === 0) {

        return {
            total: 0,
            present: 0,
            absent: 0,
            percentage: null
        };
    }

    const present =
        records.filter(
            record =>
                getAttendanceStatus(record) ===
                "PRESENT"
        ).length;

    const absent =
        records.filter(
            record =>
                getAttendanceStatus(record) ===
                "ABSENT"
        ).length;

    const percentage =
        (present / total) * 100;

    return {
        total,
        present,
        absent,
        percentage
    };
}


// =========================================================
// GET ATTENDANCE PERCENTAGE
// =========================================================

function getAttendance(student) {

    const stats =
        getAttendanceStats(
            student.id
        );

    if (
        stats.percentage !== null
    ) {

        return stats.percentage;
    }

    const apiValue =
        Number(
            student.attendance_percentage ??
            student.attendance ??
            -1
        );

    if (apiValue >= 0) {

        return Math.max(
            0,
            Math.min(
                100,
                apiValue
            )
        );
    }

    return null;
}


// =========================================================
// ATTENDANCE RISK
// =========================================================

function getRisk(student) {

    const attendance =
        getAttendance(student);

    if (attendance === null) {
        return "NO DATA";
    }

    if (attendance < 75) {
        return "HIGH";
    }

    if (attendance < 85) {
        return "MEDIUM";
    }

    return "LOW";
}


// =========================================================
// RISK LABEL
// =========================================================

function getRiskLabel(risk) {

    switch (risk) {

        case "HIGH":
            return "HIGH RISK";

        case "MEDIUM":
            return "MEDIUM RISK";

        case "LOW":
            return "LOW RISK";

        default:
            return "NO DATA";
    }
}


// =========================================================
// UPDATE SUMMARY CARDS
// =========================================================

function updateSummaryCards() {

    const totalStudents =
        allStudents.length;

    const activeStudents =
        allStudents.filter(
            student =>
                student.is_active !== false
        ).length;

    const semesters =
        new Set(
            allStudents
                .map(
                    student =>
                        student.semester
                )
                .filter(
                    value =>
                        value !== undefined &&
                        value !== null &&
                        value !== ""
                )
        );

    const lowAttendance =
        allStudents.filter(
            student => {

                const attendance =
                    getAttendance(student);

                return (
                    attendance !== null &&
                    attendance < 75
                );
            }
        ).length;

    setText(
        "totalStudents",
        totalStudents
    );

    setText(
        "activeStudents",
        activeStudents
    );

    setText(
        "totalSemesters",
        semesters.size
    );

    setText(
        "lowAttendance",
        lowAttendance
    );
}


// =========================================================
// POPULATE SEMESTER FILTER
// =========================================================

function populateSemesterFilter() {

    const select =
        document.getElementById(
            "semesterFilter"
        );

    if (!select) {
        return;
    }

    const semesters =
        [
            ...new Set(
                allStudents
                    .map(
                        student =>
                            student.semester
                    )
                    .filter(
                        value =>
                            value !== undefined &&
                            value !== null &&
                            value !== ""
                    )
            )
        ].sort(
            (a, b) =>
                Number(a) - Number(b)
        );

    select.innerHTML = `
        <option value="">
            All Semesters
        </option>
    `;

    semesters.forEach(
        semester => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                semester;

            option.textContent =
                `Semester ${semester}`;

            select.appendChild(
                option
            );
        }
    );
}


// =========================================================
// RENDER STUDENTS
// =========================================================

function renderStudents() {

    const tableBody =
        document.getElementById(
            "studentTableBody"
        );

    if (!tableBody) {
        return;
    }

    const searchInput =
        document.getElementById(
            "studentSearch"
        );

    const riskFilter =
        document.getElementById(
            "riskFilter"
        );

    const semesterFilter =
        document.getElementById(
            "semesterFilter"
        );

    const search =
        (
            searchInput?.value ||
            ""
        )
            .trim()
            .toLowerCase();

    const selectedRisk =
        riskFilter?.value ||
        "";

    const selectedSemester =
        semesterFilter?.value ||
        "";

    const filteredStudents =
        allStudents.filter(
            student => {

                const name =
                    String(
                        getStudentName(student)
                    ).toLowerCase();

                const studentID =
                    String(
                        getStudentID(student)
                    ).toLowerCase();

                const usn =
                    String(
                        getUSN(student)
                    ).toLowerCase();

                const matchesSearch =
                    !search ||
                    name.includes(search) ||
                    studentID.includes(search) ||
                    usn.includes(search);

                const risk =
                    getRisk(student);

                const matchesRisk =
                    !selectedRisk ||
                    risk === selectedRisk;

                const matchesSemester =
                    !selectedSemester ||
                    String(
                        getSemester(student)
                    ) ===
                    String(
                        selectedSemester
                    );

                return (
                    matchesSearch &&
                    matchesRisk &&
                    matchesSemester
                );
            }
        );

    setText(
        "filteredStudentCount",
        filteredStudents.length
    );

    if (
        filteredStudents.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    class="table-empty"
                >
                    No students found.
                </td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML =
        filteredStudents
            .map(
                (
                    student,
                    index
                ) =>
                    createStudentRow(
                        student,
                        index
                    )
            )
            .join("");

    attachStudentActions();
}


// =========================================================
// CREATE STUDENT ROW
// =========================================================

function createStudentRow(
    student,
    index
) {

    const name =
        getStudentName(student);

    const studentID =
        escapeHTML(
            String(
                getStudentID(student)
            )
        );

    const usn =
        escapeHTML(
            String(
                getUSN(student)
            )
        );

    const email =
        escapeHTML(
            String(
                getEmail(student)
            )
        );

    const department =
        escapeHTML(
            String(
                getDepartment(student)
            )
        );

    const semester =
        escapeHTML(
            String(
                getSemester(student)
            )
        );

    const section =
        escapeHTML(
            String(
                getSection(student)
            )
        );

    const attendance =
        getAttendance(student);

    const risk =
        getRisk(student);

    const attendanceText =
        attendance === null
            ? "-"
            : `${attendance.toFixed(2)}%`;

    const riskText =
        getRiskLabel(risk);

    const riskClass =
        risk
            .toLowerCase()
            .replace(/\s+/g, "-");

    return `
        <tr>

            <td>
                ${index + 1}
            </td>

            <td>

                <div class="student-table-name">

                    <div class="student-table-avatar">
                        ${escapeHTML(
                            name
                                .charAt(0)
                                .toUpperCase()
                        )}
                    </div>

                    <div>

                        <strong>
                            ${escapeHTML(name)}
                        </strong>

                        <span>
                            ${studentID}
                        </span>

                    </div>

                </div>

            </td>

            <td>
                ${usn}
            </td>

            <td>
                ${email}
            </td>

            <td>
                ${department}
            </td>

            <td>
                ${semester}
            </td>

            <td>
                ${section}
            </td>

            <td>

                <div class="student-attendance-cell">

                    <strong>
                        ${attendanceText}
                    </strong>

                    <span
                        class="student-risk-badge ${riskClass}"
                    >
                        ${riskText}
                    </span>

                </div>

            </td>

            <td>

                <button
                    type="button"
                    class="student-view-btn"
                    data-student-id="${student.id}"
                >
                    View
                </button>

            </td>

        </tr>
    `;
}


// =========================================================
// ATTACH VIEW BUTTONS
// =========================================================

function attachStudentActions() {

    const buttons =
        document.querySelectorAll(
            ".student-view-btn"
        );

    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                function() {

                    const id =
                        this.dataset.studentId;

                    openStudentModal(id);
                }
            );
        }
    );
}


// =========================================================
// OPEN STUDENT MODAL
// =========================================================

function openStudentModal(id) {

    const student =
        allStudents.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!student) {
        return;
    }

    const name =
        getStudentName(student);

    const stats =
        getAttendanceStats(
            student.id
        );

    const attendance =
        getAttendance(student);

    const risk =
        getRisk(student);

    // -----------------------------------------------------
    // HEADER
    // -----------------------------------------------------

    setText(
        "modalStudentName",
        name
    );

    setText(
        "modalStudentId",
        getStudentID(student)
    );

    // -----------------------------------------------------
    // BASIC INFORMATION
    // -----------------------------------------------------

    setText(
        "modalUSN",
        getUSN(student)
    );

    setText(
        "modalEmail",
        getEmail(student)
    );

    setText(
        "modalPhone",
        getPhone(student)
    );

    setText(
        "modalDepartment",
        getDepartment(student)
    );

    setText(
        "modalSemester",
        getSemester(student)
    );

    setText(
        "modalSection",
        getSection(student)
    );

    // -----------------------------------------------------
    // ATTENDANCE
    // -----------------------------------------------------

    setText(
        "modalAttendance",
        attendance === null
            ? "-"
            : `${attendance.toFixed(2)}%`
    );

    setText(
        "modalPresent",
        stats.total === 0
            ? "-"
            : stats.present
    );

    setText(
        "modalAbsent",
        stats.total === 0
            ? "-"
            : stats.absent
    );

    setText(
        "modalRisk",
        getRiskLabel(risk)
    );

    // -----------------------------------------------------
    // ADDRESS
    // -----------------------------------------------------

    setText(
        "modalAddress",
        student.address || "-"
    );

    // -----------------------------------------------------
    // AVATAR
    // -----------------------------------------------------

    const avatar =
        document.getElementById(
            "modalStudentAvatar"
        );

    if (avatar) {

        avatar.textContent =
            name
                .charAt(0)
                .toUpperCase();
    }

    // -----------------------------------------------------
    // SHOW MODAL
    // -----------------------------------------------------

    const modal =
        document.getElementById(
            "studentModal"
        );

    if (modal) {
        modal.hidden = false;
    }
}


// =========================================================
// CLOSE MODAL
// =========================================================

function closeStudentModal() {

    const modal =
        document.getElementById(
            "studentModal"
        );

    if (modal) {
        modal.hidden = true;
    }
}


// =========================================================
// SHOW ERROR
// =========================================================

function showError(message) {

    const tableBody =
        document.getElementById(
            "studentTableBody"
        );

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = `
        <tr>

            <td
                colspan="9"
                class="table-empty"
            >
                ${escapeHTML(
                    String(message)
                )}
            </td>

        </tr>
    `;
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
        "studentId"
    );

    localStorage.removeItem(
        "facultyId"
    );

    localStorage.removeItem(
        "role"
    );

    localStorage.removeItem(
        "user"
    );

    window.location.href =
        "../login.html";
}


// =========================================================
// PAGE EVENTS
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        // -------------------------------------------------
        // LOAD DATA
        // -------------------------------------------------

        loadStudents();


        // -------------------------------------------------
        // SEARCH
        // -------------------------------------------------

        const search =
            document.getElementById(
                "studentSearch"
            );

        if (search) {

            search.addEventListener(
                "input",
                renderStudents
            );
        }


        // -------------------------------------------------
        // RISK FILTER
        // -------------------------------------------------

        const riskFilter =
            document.getElementById(
                "riskFilter"
            );

        if (riskFilter) {

            riskFilter.addEventListener(
                "change",
                renderStudents
            );
        }


        // -------------------------------------------------
        // SEMESTER FILTER
        // -------------------------------------------------

        const semesterFilter =
            document.getElementById(
                "semesterFilter"
            );

        if (semesterFilter) {

            semesterFilter.addEventListener(
                "change",
                renderStudents
            );
        }


        // -------------------------------------------------
        // REFRESH
        // -------------------------------------------------

        const refreshButton =
            document.getElementById(
                "refreshStudentsBtn"
            );

        if (refreshButton) {

            refreshButton.addEventListener(
                "click",
                loadStudents
            );
        }


        // -------------------------------------------------
        // CLOSE MODAL BUTTON
        // -------------------------------------------------

        const closeButton =
            document.getElementById(
                "closeStudentModal"
            );

        if (closeButton) {

            closeButton.addEventListener(
                "click",
                closeStudentModal
            );
        }


        // -------------------------------------------------
        // CLICK OUTSIDE MODAL
        // -------------------------------------------------

        const modal =
            document.getElementById(
                "studentModal"
            );

        if (modal) {

            modal.addEventListener(
                "click",
                function(event) {

                    if (
                        event.target ===
                        modal
                    ) {

                        closeStudentModal();
                    }
                }
            );
        }


        // -------------------------------------------------
        // ESCAPE KEY
        // -------------------------------------------------

        document.addEventListener(
            "keydown",
            function(event) {

                if (
                    event.key ===
                    "Escape"
                ) {

                    closeStudentModal();
                }
            }
        );


        // -------------------------------------------------
        // LOGOUT
        // -------------------------------------------------

        const logoutButton =
            document.getElementById(
                "logoutBtn"
            );

        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                logout
            );
        }

    }
);