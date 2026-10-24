// =========================================================
// AI ATTEND - FACULTY ATTENDANCE
// FACULTY ASSIGNMENT + PERIOD-WISE ATTENDANCE
// FINAL VERSION
// =========================================================


// =========================================================
// API CONFIGURATION
// =========================================================

const API_BASE_URL = "http://localhost:8000";

const LOGIN_URL = "../login.html";

const FACULTY_DASHBOARD_URL =
    `${API_BASE_URL}/faculty/dashboard/`;

const FACULTY_ASSIGNMENTS_URL =
    `${API_BASE_URL}/allocations/faculty/`;

const ATTENDANCE_URL =
    `${API_BASE_URL}/attendance/`;

const SESSION_URL =
    `${API_BASE_URL}/sessions/`;

const REFRESH_URL =
    `${API_BASE_URL}/api/token/refresh/`;


// =========================================================
// GLOBAL VARIABLES
// =========================================================

let facultyData = null;

let assignments = [];

let subjects = [];

let students = [];

let attendanceRecords = [];

let attendanceSessions = [];

let selectedAssignmentId = "";

let selectedSubjectId = "";

let selectedSemesterId = "";

let selectedSectionId = "";

let selectedDate = "";

let selectedPeriod = 1;

let currentSessionId = null;


// =========================================================
// ELEMENT HELPER
// =========================================================

function $(id) {
    return document.getElementById(id);
}


// =========================================================
// SHOW MESSAGE
// =========================================================

function showMessage(message, type = "success") {

    const box = $("messageBox");

    if (!box) {
        console.log(message);
        return;
    }

    box.hidden = false;

    box.textContent = message;

    box.className =
        `attendance-message ${type}`;
}


// =========================================================
// CLEAR LOGIN
// =========================================================

function clearLogin() {

    localStorage.removeItem("access_token");

    localStorage.removeItem("refresh_token");

    localStorage.removeItem("facultyId");

    localStorage.removeItem("facultyName");

    localStorage.removeItem("studentId");

    localStorage.removeItem("userProfile");
}


// =========================================================
// REFRESH ACCESS TOKEN
// =========================================================

async function refreshAccessToken() {

    const refreshToken =
        localStorage.getItem("refresh_token");

    if (!refreshToken) {

        console.warn(
            "No refresh token found."
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

        if (!response.ok) {

            console.error(
                "Refresh token rejected:",
                response.status
            );

            clearLogin();

            return false;
        }

        const data =
            await response.json();

        if (!data.access) {

            clearLogin();

            return false;
        }

        localStorage.setItem(
            "access_token",
            data.access
        );

        console.log(
            "Access token refreshed successfully."
        );

        return true;

    }
    catch (error) {

        console.error(
            "Refresh token error:",
            error
        );

        return false;
    }
}


// =========================================================
// AUTHENTICATED API REQUEST
// =========================================================

async function apiRequest(
    endpoint,
    options = {},
    retry = true
) {

    const token =
        localStorage.getItem("access_token");

    if (!token) {

        window.location.href =
            LOGIN_URL;

        return null;
    }

    const requestOptions = {

        ...options,

        headers: {

            "Content-Type":
                "application/json",

            ...(options.headers || {}),

            "Authorization":
                `Bearer ${token}`
        }
    };

    let response;

    try {

        response =
            await fetch(
                `${API_BASE_URL}${endpoint}`,
                requestOptions
            );

    }
    catch (error) {

        console.error(
            "Network error:",
            error
        );

        throw new Error(
            "Cannot connect to Django server. Make sure Django is running."
        );
    }


    // -----------------------------------------------------
    // TOKEN EXPIRED
    // -----------------------------------------------------

    if (
        response.status === 401 &&
        retry
    ) {

        console.log(
            "Access token invalid. Refreshing..."
        );

        const refreshed =
            await refreshAccessToken();

        if (refreshed) {

            return await apiRequest(
                endpoint,
                options,
                false
            );
        }

        clearLogin();

        showMessage(
            "Your login session has expired. Please login again.",
            "error"
        );

        setTimeout(
            function () {

                window.location.href =
                    LOGIN_URL;

            },
            1500
        );

        return null;
    }


    // -----------------------------------------------------
    // READ RESPONSE
    // -----------------------------------------------------

    let data = null;

    try {

        const text =
            await response.text();

        if (text) {

            try {

                data =
                    JSON.parse(text);

            }
            catch {

                data =
                    text;
            }
        }

    }
    catch {

        data = null;
    }


    // -----------------------------------------------------
    // HANDLE ERROR
    // -----------------------------------------------------

    if (!response.ok) {

        let message =
            `HTTP ${response.status}`;

        if (
            data &&
            typeof data === "object"
        ) {

            if (data.detail) {

                message =
                    String(data.detail);

            }
            else if (data.message) {

                message =
                    String(data.message);

            }
            else {

                const messages = [];

                Object.keys(data).forEach(
                    function (key) {

                        const value =
                            data[key];

                        if (
                            Array.isArray(value)
                        ) {

                            messages.push(
                                `${key}: ${value.join(", ")}`
                            );

                        }
                        else {

                            messages.push(
                                `${key}: ${value}`
                            );
                        }
                    }
                );

                if (messages.length) {

                    message =
                        messages.join(" | ");
                }
            }

        }
        else if (
            typeof data === "string" &&
            data.trim()
        ) {

            message =
                data;
        }

        const error =
            new Error(message);

        error.status =
            response.status;

        error.data =
            data;

        console.error(
            "API ERROR:",
            {
                endpoint,
                status:
                    response.status,
                data
            }
        );

        throw error;
    }

    return data;
}


// =========================================================
// LOAD FACULTY DASHBOARD
// =========================================================

async function loadFacultyDashboard() {

    try {

        console.log(
            "Loading faculty dashboard..."
        );

        const data =
            await apiRequest(
                "/faculty/dashboard/"
            );

        if (!data) {
            return false;
        }

        facultyData =
            data;

        console.log(
            "Faculty dashboard loaded:",
            facultyData
        );

        displayFaculty();

        return true;

    }
    catch (error) {

        console.error(
            "Faculty dashboard error:",
            error
        );

        showMessage(
            `Failed to load faculty data: ${error.message}`,
            "error"
        );

        return false;
    }
}


// =========================================================
// DISPLAY FACULTY
// =========================================================

function displayFaculty() {

    const faculty =
        facultyData?.faculty || {};

    const name =
        faculty.name ||
        "Faculty";

    const designation =
        faculty.designation ||
        "Faculty";

    const nameElement =
        $("facultyName");

    const designationElement =
        $("facultyDesignation");

    const avatar =
        $("facultyAvatar");

    if (nameElement) {

        nameElement.textContent =
            name;
    }

    if (designationElement) {

        designationElement.textContent =
            designation;
    }

    if (avatar) {

        avatar.textContent =
            name
                .charAt(0)
                .toUpperCase();
    }
}


// =========================================================
// LOAD FACULTY ASSIGNMENTS
// =========================================================

async function loadFacultyAssignments() {

    const select =
        $("subjectSelect");

    if (!select) {
        return false;
    }

    try {

        select.innerHTML = `
            <option value="">
                Loading assigned classes...
            </option>
        `;

        const data =
            await apiRequest(
                "/allocations/faculty/"
            );

        if (!data) {
            return false;
        }

        assignments =
            Array.isArray(data.assignments)
                ? data.assignments
                : [];

        console.log(
            "Faculty assignments:",
            assignments
        );


        // -------------------------------------------------
        // NO ASSIGNMENTS
        // -------------------------------------------------

        if (!assignments.length) {

            select.innerHTML = `
                <option value="">
                    No classes assigned
                </option>
            `;

            selectedAssignmentId = "";

            selectedSubjectId = "";

            selectedSemesterId = "";

            selectedSectionId = "";

            students = [];

            resetStudentTable(
                "No classes have been assigned to this faculty."
            );

            return false;
        }


        // -------------------------------------------------
        // BUILD DROPDOWN
        // -------------------------------------------------

        select.innerHTML = "";

        assignments.forEach(
            function (assignment) {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    String(
                        assignment.id
                    );

                const subject =
                    assignment.subject || {};

                const semester =
                    assignment.semester || {};

                const section =
                    assignment.section || {};

                const code =
                    subject.subject_code ||
                    subject.subject_id ||
                    "";

                const name =
                    subject.name ||
                    "Subject";

                const semesterNumber =
                    semester.number ||
                    "";

                const sectionName =
                    section.name ||
                    "";

                option.textContent =
                    `${code} - ${name} | Sem ${semesterNumber} | Section ${sectionName}`;

                select.appendChild(
                    option
                );
            }
        );


        // -------------------------------------------------
        // SELECT FIRST ASSIGNMENT
        // -------------------------------------------------

        select.value =
            String(
                assignments[0].id
            );

        setSelectedAssignment(
            assignments[0].id
        );

        return true;

    }
    catch (error) {

        console.error(
            "Faculty assignments error:",
            error
        );

        select.innerHTML = `
            <option value="">
                Failed to load classes
            </option>
        `;

        assignments = [];

        showMessage(
            `Failed to load faculty assignments: ${error.message}`,
            "error"
        );

        resetStudentTable(
            "Failed to load faculty assignments."
        );

        return false;
    }
}


// =========================================================
// SET SELECTED ASSIGNMENT
// =========================================================

function setSelectedAssignment(
    assignmentId
) {

    const assignment =
        assignments.find(
            function (item) {

                return (
                    Number(item.id) ===
                    Number(assignmentId)
                );
            }
        );

    if (!assignment) {

        selectedAssignmentId = "";

        selectedSubjectId = "";

        selectedSemesterId = "";

        selectedSectionId = "";

        return null;
    }

    selectedAssignmentId =
        String(
            assignment.id
        );

    selectedSubjectId =
        String(
            assignment.subject?.id || ""
        );

    selectedSemesterId =
        String(
            assignment.semester?.id || ""
        );

    selectedSectionId =
        String(
            assignment.section?.id || ""
        );

    console.log(
        "Selected faculty assignment:",
        assignment
    );

    return assignment;
}


// =========================================================
// LOAD SUBJECTS ARRAY
// COMPATIBILITY WITH OTHER FUNCTIONS
// =========================================================

function loadSubjects() {

    subjects =
        assignments.map(
            function (assignment) {

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
                        assignment.subject?.credits,

                    semester:
                        assignment.semester,

                    section:
                        assignment.section,

                    department:
                        assignment.department,

                    assignment_id:
                        assignment.id,

                    academic_year:
                        assignment.academic_year
                };
            }
        );

    console.log(
        "Subjects created from assignments:",
        subjects
    );
}


// =========================================================
// LOAD STUDENTS FOR SELECTED ASSIGNMENT
// =========================================================

async function loadStudents() {

    if (!selectedAssignmentId) {

        students = [];

        resetStudentTable(
            "Please select a class."
        );

        return;
    }

    if (!selectedSubjectId) {

        students = [];

        resetStudentTable(
            "Subject information not found."
        );

        return;
    }

    try {

        console.log(
            "Loading students for assignment:",
            {
                assignment:
                    selectedAssignmentId,

                subject:
                    selectedSubjectId,

                semester:
                    selectedSemesterId,

                section:
                    selectedSectionId
            }
        );


        // -------------------------------------------------
        // BACKEND STUDENT ENDPOINT
        // -------------------------------------------------

        const data =
            await apiRequest(
                `/attendance/faculty/subject/${selectedSubjectId}/students/`
            );


        if (
            data &&
            Array.isArray(data.students)
        ) {

            students =
                data.students;

        }
        else {

            students = [];
        }


        // -------------------------------------------------
        // FRONTEND SECTION FILTER
        // -------------------------------------------------

        const assignment =
            assignments.find(
                function (item) {

                    return (
                        Number(item.id) ===
                        Number(selectedAssignmentId)
                    );
                }
            );

        const selectedSectionName =
            assignment?.section?.name || "";


        if (selectedSectionName) {

            students =
                students.filter(
                    function (student) {

                        return (
                            String(
                                student.section || ""
                            )
                                .trim()
                                .toUpperCase()
                            ===
                            String(
                                selectedSectionName
                            )
                                .trim()
                                .toUpperCase()
                        );
                    }
                );
        }


        console.log(
            "Students for selected assignment:",
            students
        );


        if (!students.length) {

            resetStudentTable(
                "No students found for this class and section."
            );
        }

    }
    catch (error) {

        console.error(
            "Subject students error:",
            error
        );

        students = [];

        showMessage(
            `Failed to load students: ${error.message}`,
            "error"
        );

        resetStudentTable(
            "Failed to load students."
        );
    }
}


// =========================================================
// GET TODAY
// =========================================================

function getToday() {

    const date =
        new Date();

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// =========================================================
// GET SELECTED DAY
// =========================================================

function getSelectedDay() {

    if (!selectedDate) {
        return "";
    }

    const date =
        new Date(
            `${selectedDate}T00:00:00`
        );

    return date.toLocaleDateString(
        "en-IN",
        {
            weekday: "long"
        }
    );
}


// =========================================================
// CHECK MONDAY - SATURDAY
// =========================================================

function isAllowedAttendanceDay() {

    const day =
        getSelectedDay();

    return [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ].includes(day);
}


// =========================================================
// LOAD ATTENDANCE RECORDS
// =========================================================

async function loadAttendanceRecords() {

    try {

        const data =
            await apiRequest(
                "/attendance/"
            );

        if (Array.isArray(data)) {

            attendanceRecords =
                data;

        }
        else if (
            Array.isArray(data?.results)
        ) {

            attendanceRecords =
                data.results;

        }
        else {

            attendanceRecords = [];
        }

        console.log(
            "Attendance records:",
            attendanceRecords
        );

    }
    catch (error) {

        console.error(
            "Attendance records error:",
            error
        );

        attendanceRecords = [];
    }
}


// =========================================================
// LOAD ATTENDANCE SESSIONS
// =========================================================

async function loadAttendanceSessions() {

    try {

        const data =
            await apiRequest(
                "/sessions/"
            );

        if (Array.isArray(data)) {

            attendanceSessions =
                data;

        }
        else if (
            Array.isArray(data?.results)
        ) {

            attendanceSessions =
                data.results;

        }
        else {

            attendanceSessions = [];
        }

        console.log(
            "Attendance sessions:",
            attendanceSessions
        );

    }
    catch (error) {

        console.error(
            "Attendance sessions error:",
            error
        );

        attendanceSessions = [];
    }
}


// =========================================================
// FIND EXISTING SESSION
// =========================================================

function getExistingSession() {

    const faculty =
        facultyData?.faculty || {};

    const facultyId =
        faculty.id ||
        faculty.faculty_id;

    return attendanceSessions.find(
        function (session) {

            const sameFaculty =
                Number(session.faculty) ===
                Number(facultyId);

            const sameSubject =
                Number(session.subject) ===
                Number(selectedSubjectId);

            const sameDate =
                String(
                    session.attendance_date
                ) ===
                String(selectedDate);

            const samePeriod =
                Number(session.period) ===
                Number(selectedPeriod);

            const sameSemester =
                !selectedSemesterId ||
                Number(session.semester) ===
                Number(selectedSemesterId);

            const sameSection =
                !selectedSectionId ||
                Number(session.section) ===
                Number(selectedSectionId);

            return (
                sameFaculty &&
                sameSubject &&
                sameDate &&
                samePeriod &&
                sameSemester &&
                sameSection
            );
        }
    );
}


// =========================================================
// FIND EXISTING ATTENDANCE RECORD
// =========================================================

function getExistingRecord(studentId) {

    const existingSession =
        getExistingSession();

    if (!existingSession) {
        return null;
    }

    const record =
        attendanceRecords.find(
            function (item) {

                const sameStudent =
                    Number(item.student) ===
                    Number(studentId);

                const sameSubject =
                    Number(item.subject) ===
                    Number(selectedSubjectId);

                const sameSession =
                    Number(item.session) ===
                    Number(existingSession.id);

                return (
                    sameStudent &&
                    sameSubject &&
                    sameSession
                );
            }
        );

    return record || null;
}


// =========================================================
// GET STUDENT SUBJECT ATTENDANCE
// =========================================================

function getStudentAttendance(studentId) {

    const records =
        attendanceRecords.filter(
            function (record) {

                return (

                    Number(record.student) ===
                    Number(studentId)

                    &&

                    Number(record.subject) ===
                    Number(selectedSubjectId)

                );
            }
        );

    const total =
        records.length;

    const present =
        records.filter(
            function (record) {

                return (
                    String(record.status)
                        .trim()
                        .toUpperCase() ===
                    "PRESENT"
                );
            }
        ).length;

    const percentage =
        total
            ? (present / total) * 100
            : 0;

    return {

        percentage:
            percentage,

        present:
            present,

        total:
            total
    };
}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        String(value);

    return div.innerHTML;
}


// =========================================================
// RESET TABLE
// =========================================================

function resetStudentTable(
    message =
        "Select a subject to load students."
) {

    const tbody =
        $("studentTableBody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = `

        <tr>

            <td
                colspan="5"
                class="attendance-empty"
            >

                ${escapeHTML(message)}

            </td>

        </tr>

    `;

    updateSummary();
}


// =========================================================
// RENDER STUDENTS
// =========================================================

function renderStudents() {

    const tbody =
        $("studentTableBody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    if (!students.length) {

        resetStudentTable(
            "No students found."
        );

        return;
    }

    students.forEach(
        function (student, index) {

            const attendance =
                getStudentAttendance(
                    student.id
                );

            const existing =
                getExistingRecord(
                    student.id
                );

            let currentStatus =
                "";

            if (existing) {

                currentStatus =
                    String(
                        existing.status || ""
                    )
                        .trim()
                        .toUpperCase();
            }


            const row =
                document.createElement(
                    "tr"
                );

            row.dataset.studentId =
                String(student.id);


            const name =
                student.name ||
                "Student";

            const usn =
                student.usn ||
                student.student_id ||
                "-";


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td>

                    <strong
                        class="student-name"
                    >

                        ${escapeHTML(name)}

                    </strong>

                </td>

                <td>

                    ${escapeHTML(usn)}

                </td>

                <td>

                    <div
                        class="current-attendance"
                    >

                        <strong>

                            ${attendance.percentage.toFixed(2)}%

                        </strong>

                        <span>

                            ${attendance.present}
                            Present /
                            ${attendance.total}
                            Classes

                        </span>

                    </div>

                </td>

                <td>

                    <select
                        class="attendance-status"
                    >

                        <option
                            value=""
                            ${currentStatus === "" ? "selected" : ""}
                        >
                            Select Status
                        </option>

                        <option
                            value="PRESENT"
                            ${currentStatus === "PRESENT" ? "selected" : ""}
                        >
                            Present
                        </option>

                        <option
                            value="ABSENT"
                            ${currentStatus === "ABSENT" ? "selected" : ""}
                        >
                            Absent
                        </option>

                    </select>

                </td>
            `;


            tbody.appendChild(row);


            const select =
                row.querySelector(
                    ".attendance-status"
                );

            if (select) {

                select.addEventListener(
                    "change",
                    updateSummary
                );
            }
        }
    );

    updateSummary();
}


// =========================================================
// UPDATE SUMMARY
// =========================================================

function updateSummary() {

    const rows =
        document.querySelectorAll(
            "#studentTableBody tr[data-student-id]"
        );

    let present = 0;

    let absent = 0;

    rows.forEach(
        function (row) {

            const select =
                row.querySelector(
                    ".attendance-status"
                );

            if (!select) {
                return;
            }

            if (
                select.value ===
                "PRESENT"
            ) {

                present++;
            }

            if (
                select.value ===
                "ABSENT"
            ) {

                absent++;
            }
        }
    );

    const total =
        rows.length;

    const percentage =
        total
            ? (present / total) * 100
            : 0;


    if ($("studentCount")) {

        $("studentCount").textContent =
            total;
    }

    if ($("presentCount")) {

        $("presentCount").textContent =
            present;
    }

    if ($("absentCount")) {

        $("absentCount").textContent =
            absent;
    }

    if ($("classPercentage")) {

        $("classPercentage").textContent =
            `${percentage.toFixed(0)}%`;
    }

    if ($("saveSummary")) {

        if (
            present === 0 &&
            absent === 0
        ) {

            $("saveSummary").textContent =
                "No attendance selected";

        }
        else {

            $("saveSummary").textContent =
                `${present} Present · ${absent} Absent · ${total} Students`;
        }
    }
}


// =========================================================
// MARK ALL PRESENT
// =========================================================

function markAllPresent() {

    const selects =
        document.querySelectorAll(
            ".attendance-status"
        );

    if (!selects.length) {

        showMessage(
            "Load students first.",
            "error"
        );

        return;
    }

    selects.forEach(
        function (select) {

            select.value =
                "PRESENT";
        }
    );

    updateSummary();
}


// =========================================================
// MARK ALL ABSENT
// =========================================================

function markAllAbsent() {

    const selects =
        document.querySelectorAll(
            ".attendance-status"
        );

    if (!selects.length) {

        showMessage(
            "Load students first.",
            "error"
        );

        return;
    }

    selects.forEach(
        function (select) {

            select.value =
                "ABSENT";
        }
    );

    updateSummary();
}


// =========================================================
// CREATE OR GET ATTENDANCE SESSION
// IMPORTANT:
// SEND ASSIGNMENT ID
// BACKEND DECIDES SEMESTER + SECTION
// =========================================================

async function createAttendanceSession() {

    if (!selectedAssignmentId) {

        throw new Error(
            "Please select a class."
        );
    }

    if (!selectedSubjectId) {

        throw new Error(
            "Please select a subject."
        );
    }

    if (!selectedDate) {

        throw new Error(
            "Please select a date."
        );
    }


    selectedPeriod =
        Number(
            $("periodSelect")?.value ||
            selectedPeriod ||
            1
        );


    if (!isAllowedAttendanceDay()) {

        throw new Error(
            `${getSelectedDay()} is not allowed. Please select Monday to Saturday.`
        );
    }


    // -----------------------------------------------------
    // CHECK EXISTING SESSION
    // -----------------------------------------------------

    await loadAttendanceSessions();

    const existingSession =
        getExistingSession();

    if (existingSession) {

        currentSessionId =
            existingSession.id;

        console.log(
            "Using existing attendance session:",
            existingSession
        );

        return existingSession;
    }


    // -----------------------------------------------------
    // CREATE SESSION USING ASSIGNMENT
    // -----------------------------------------------------

    const sessionData = {

        subject:
            Number(selectedSubjectId),

        assignment:
            Number(selectedAssignmentId),

        attendance_date:
            selectedDate,

        period:
            selectedPeriod
    };


    console.log(
        "Creating attendance session:",
        sessionData
    );


    const data =
        await apiRequest(
            "/sessions/start/",
            {
                method: "POST",

                body:
                    JSON.stringify(
                        sessionData
                    )
            }
        );


    if (!data) {

        throw new Error(
            "No response received from attendance session API."
        );
    }


    // -----------------------------------------------------
    // NEW SESSION RESPONSE
    // Backend returns:
    // {
    //   success: true,
    //   message: "...",
    //   assignment: {...},
    //   session: {...}
    // }
    // -----------------------------------------------------

    const session =
        data.session || data;


    if (!session.id) {

        throw new Error(
            "Attendance session was not created."
        );
    }


    currentSessionId =
        session.id;


    attendanceSessions.push(
        session
    );


    console.log(
        "Attendance session created:",
        session
    );


    return session;
}


// =========================================================
// SAVE ATTENDANCE
// =========================================================

async function saveAttendance() {

    const rows =
        document.querySelectorAll(
            "#studentTableBody tr[data-student-id]"
        );

    if (!rows.length) {

        showMessage(
            "No students available.",
            "error"
        );

        return;
    }


    // -----------------------------------------------------
    // GET CURRENT ASSIGNMENT
    // -----------------------------------------------------

    selectedAssignmentId =
        $("subjectSelect")?.value ||
        "";


    const assignment =
        assignments.find(
            function (item) {

                return (
                    Number(item.id) ===
                    Number(selectedAssignmentId)
                );
            }
        );


    if (!assignment) {

        showMessage(
            "Please select a class.",
            "error"
        );

        return;
    }


    setSelectedAssignment(
        selectedAssignmentId
    );


    // -----------------------------------------------------
    // DATE + PERIOD
    // -----------------------------------------------------

    selectedDate =
        $("attendanceDate")?.value ||
        "";

    selectedPeriod =
        Number(
            $("periodSelect")?.value ||
            1
        );


    if (!selectedSubjectId) {

        showMessage(
            "Please select a subject.",
            "error"
        );

        return;
    }


    if (!selectedDate) {

        showMessage(
            "Please select a date.",
            "error"
        );

        return;
    }


    if (!isAllowedAttendanceDay()) {

        showMessage(
            `${getSelectedDay()} is not allowed. Please select Monday to Saturday.`,
            "error"
        );

        return;
    }


    // -----------------------------------------------------
    // COLLECT ATTENDANCE
    // -----------------------------------------------------

    const attendance = [];

    const missing = [];


    rows.forEach(
        function (row) {

            const studentId =
                Number(
                    row.dataset.studentId
                );

            const select =
                row.querySelector(
                    ".attendance-status"
                );

            const status =
                select?.value ||
                "";

            const name =
                row.querySelector(
                    ".student-name"
                )?.textContent.trim()
                ||
                `Student ${studentId}`;


            if (
                status !== "PRESENT" &&
                status !== "ABSENT"
            ) {

                missing.push(name);

                return;
            }


            attendance.push({

                student:
                    studentId,

                status:
                    status
            });
        }
    );


    if (missing.length) {

        showMessage(
            `Please select status for: ${missing.join(", ")}`,
            "error"
        );

        return;
    }


    // -----------------------------------------------------
    // DISABLE SAVE BUTTON
    // -----------------------------------------------------

    const button =
        $("saveAttendanceBtn");

    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Saving...";
    }


    try {

        // -------------------------------------------------
        // CREATE / GET SESSION
        // -------------------------------------------------

        const session =
            await createAttendanceSession();


        // -------------------------------------------------
        // BULK ATTENDANCE PAYLOAD
        // -------------------------------------------------

        const payload = {

            subject:
                Number(selectedSubjectId),

            session:
                Number(session.id),

            attendance:
                attendance
        };


        console.log(
            "Saving bulk attendance:",
            payload
        );


        // -------------------------------------------------
        // SAVE TO BACKEND
        // -------------------------------------------------

        const result =
            await apiRequest(
                "/attendance/faculty/bulk/",
                {
                    method: "POST",

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        console.log(
            "Bulk attendance response:",
            result
        );


        // -------------------------------------------------
        // SUCCESS
        // -------------------------------------------------

        showMessage(
            `Attendance saved successfully for ${getSelectedDay()} · Period ${selectedPeriod}.`,
            "success"
        );


        // -------------------------------------------------
        // REFRESH DATA
        // -------------------------------------------------

        await loadAttendanceRecords();

        await loadAttendanceSessions();

        renderStudents();


    }
    catch (error) {

        console.error(
            "Save attendance error:",
            error
        );

        showMessage(
            `Attendance save failed: ${error.message}`,
            "error"
        );

    }
    finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Save Attendance";
        }
    }
}


// =========================================================
// LOAD BUTTON
// =========================================================

function setupLoadButton() {

    const button =
        $("loadAttendanceBtn");

    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        async function () {

            selectedAssignmentId =
                $("subjectSelect")?.value ||
                "";


            setSelectedAssignment(
                selectedAssignmentId
            );


            selectedDate =
                $("attendanceDate")?.value ||
                "";


            selectedPeriod =
                Number(
                    $("periodSelect")?.value ||
                    1
                );


            currentSessionId =
                null;


            if (!selectedAssignmentId) {

                showMessage(
                    "Please select a class.",
                    "error"
                );

                return;
            }


            if (!selectedDate) {

                showMessage(
                    "Please select a date.",
                    "error"
                );

                return;
            }


            if (!isAllowedAttendanceDay()) {

                showMessage(
                    `${getSelectedDay()} is not allowed. Please select Monday to Saturday.`,
                    "error"
                );

                return;
            }


            button.disabled =
                true;

            button.textContent =
                "Loading...";


            try {

                await loadStudents();

                await loadAttendanceRecords();

                await loadAttendanceSessions();

                renderStudents();

                updateAttendanceDay();


                showMessage(
                    `${getSelectedDay()} · Period ${selectedPeriod} loaded.`,
                    "success"
                );

            }
            catch (error) {

                console.error(
                    "Load attendance error:",
                    error
                );

                showMessage(
                    error.message,
                    "error"
                );

            }
            finally {

                button.disabled =
                    false;

                button.textContent =
                    "↻ Load";
            }
        }
    );
}


// =========================================================
// SUBJECT / ASSIGNMENT CHANGE
// =========================================================

function setupSubjectChange() {

    const select =
        $("subjectSelect");

    if (!select) {
        return;
    }


    select.addEventListener(
        "change",
        async function () {

            selectedAssignmentId =
                select.value;


            setSelectedAssignment(
                selectedAssignmentId
            );


            currentSessionId =
                null;


            students = [];


            resetStudentTable(
                "Loading students..."
            );


            if (!selectedAssignmentId) {
                return;
            }


            try {

                await loadStudents();

                await loadAttendanceRecords();

                await loadAttendanceSessions();

                renderStudents();

                updateAttendanceDay();

            }
            catch (error) {

                console.error(
                    "Assignment change error:",
                    error
                );

                showMessage(
                    error.message,
                    "error"
                );
            }
        }
    );
}


// =========================================================
// DATE CHANGE
// =========================================================

function setupDateChange() {

    const input =
        $("attendanceDate");

    if (!input) {
        return;
    }


    input.addEventListener(
        "change",
        function () {

            selectedDate =
                input.value;

            currentSessionId =
                null;

            updateAttendanceDay();
        }
    );
}


// =========================================================
// PERIOD CHANGE
// =========================================================

function setupPeriodChange() {

    const select =
        $("periodSelect");

    if (!select) {
        return;
    }


    select.addEventListener(
        "change",
        async function () {

            selectedPeriod =
                Number(
                    select.value
                ) || 1;


            currentSessionId =
                null;


            console.log(
                "Selected period:",
                selectedPeriod
            );


            updateAttendanceDay();


            if (
                selectedSubjectId &&
                selectedDate
            ) {

                await loadAttendanceRecords();

                await loadAttendanceSessions();

                renderStudents();
            }
        }
    );
}


// =========================================================
// UPDATE DAY DISPLAY
// =========================================================

function updateAttendanceDay() {

    const dateInput =
        $("attendanceDate");

    const dayText =
        $("attendanceDayText");

    if (!dateInput || !dayText) {
        return;
    }


    if (!dateInput.value) {

        dayText.textContent =
            "Select class, date and period before marking students.";

        return;
    }


    const date =
        new Date(
            `${dateInput.value}T00:00:00`
        );


    const day =
        date.toLocaleDateString(
            "en-IN",
            {
                weekday: "long"
            }
        );


    const allowedDays = [

        "Monday",

        "Tuesday",

        "Wednesday",

        "Thursday",

        "Friday",

        "Saturday"
    ];


    if (
        !allowedDays.includes(day)
    ) {

        dayText.textContent =
            `${day} is not a college attendance day. Please select Monday to Saturday.`;

        return;
    }


    const assignment =
        assignments.find(
            function (item) {

                return (
                    Number(item.id) ===
                    Number(selectedAssignmentId)
                );
            }
        );


    let classText = "";


    if (assignment) {

        const semester =
            assignment.semester?.number ||
            "";

        const section =
            assignment.section?.name ||
            "";

        classText =
            ` · Sem ${semester} · Section ${section}`;
    }


    dayText.textContent =
        `${day} · Period ${selectedPeriod}${classText}`;
}


// =========================================================
// MARK BUTTONS
// =========================================================

function setupMarkButtons() {

    const presentButton =
        $("markAllPresentBtn");

    const absentButton =
        $("markAllAbsentBtn");


    if (presentButton) {

        presentButton.addEventListener(
            "click",
            markAllPresent
        );
    }


    if (absentButton) {

        absentButton.addEventListener(
            "click",
            markAllAbsent
        );
    }
}


// =========================================================
// SAVE BUTTON
// =========================================================

function setupSaveButton() {

    const button =
        $("saveAttendanceBtn");

    if (button) {

        button.addEventListener(
            "click",
            saveAttendance
        );
    }
}


// =========================================================
// LOGOUT
// =========================================================

function setupLogout() {

    const button =
        $("logoutBtn");

    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        function () {

            clearLogin();

            window.location.href =
                LOGIN_URL;
        }
    );
}


// =========================================================
// INITIALIZE
// =========================================================

async function initialize() {

    console.log(
        "===================================="
    );

    console.log(
        "AI ATTEND FACULTY ATTENDANCE"
    );

    console.log(
        "FACULTY ASSIGNMENT VERSION"
    );

    console.log(
        "===================================="
    );


    // -----------------------------------------------------
    // DATE
    // -----------------------------------------------------

    const dateInput =
        $("attendanceDate");


    selectedDate =
        getToday();


    const periodSelect =
        $("periodSelect");


    if (periodSelect) {

        selectedPeriod =
            Number(
                periodSelect.value
            ) || 1;
    }


    if (dateInput) {

        dateInput.value =
            selectedDate;
    }


    updateAttendanceDay();


    // -----------------------------------------------------
    // BUTTONS
    // -----------------------------------------------------

    setupLoadButton();

    setupSubjectChange();

    setupDateChange();

    setupPeriodChange();

    setupMarkButtons();

    setupSaveButton();

    setupLogout();


    // -----------------------------------------------------
    // FACULTY DATA
    // -----------------------------------------------------

    const loaded =
        await loadFacultyDashboard();


    if (!loaded) {
        return;
    }


    // -----------------------------------------------------
    // LOAD FACULTY ASSIGNMENTS
    // -----------------------------------------------------

    const assignmentsLoaded =
        await loadFacultyAssignments();


    if (!assignmentsLoaded) {
        return;
    }


    // -----------------------------------------------------
    // CREATE COMPATIBILITY SUBJECT ARRAY
    // -----------------------------------------------------

    loadSubjects();


    // -----------------------------------------------------
    // LOAD FIRST ASSIGNMENT
    // -----------------------------------------------------

    if (
        assignments.length > 0
    ) {

        selectedAssignmentId =
            String(
                assignments[0].id
            );


        setSelectedAssignment(
            selectedAssignmentId
        );


        if ($("subjectSelect")) {

            $("subjectSelect").value =
                selectedAssignmentId;
        }


        await loadStudents();

        await loadAttendanceRecords();

        await loadAttendanceSessions();

        renderStudents();

        updateAttendanceDay();
    }


    console.log(
        "Faculty attendance page ready."
    );
}


// =========================================================
// START
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    initialize
);