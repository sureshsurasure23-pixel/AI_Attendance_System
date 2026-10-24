// =========================================================
// ADMIN ATTENDANCE MANAGEMENT
// =========================================================


// =========================================================
// CONFIGURATION
// =========================================================

const API_BASE_URL =
    "http://127.0.0.1:8000";


// =========================================================
// GLOBAL VARIABLES
// =========================================================

let allAttendance = [];

let selectedAttendanceRecord = null;


// =========================================================
// TOKEN
// =========================================================

function getAccessToken() {

    return (
        localStorage.getItem("access_token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        ""
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
// API REQUEST
// =========================================================

async function apiRequest(
    endpoint,
    options = {}
) {

    const token =
        getAccessToken();

    const requestOptions = {

        ...options,

        headers: {

            ...(options.headers || {}),

            "Content-Type":
                "application/json",

            ...(token
                ? {
                    "Authorization":
                        `Bearer ${token}`
                }
                : {})
        }
    };


    const response =
        await fetch(
            `${API_BASE_URL}${endpoint}`,
            requestOptions
        );


    if (response.status === 401) {

        console.warn(
            "Authentication expired."
        );

        window.location.href =
            "../login.html";

        return null;
    }


    let data = null;


    try {

        data =
            await response.json();

    }
    catch (error) {

        data = null;

    }


    if (!response.ok) {

        const message =
            data?.detail ||
            data?.message ||
            "API request failed.";

        throw new Error(message);
    }


    return data;

}


// =========================================================
// NORMALIZE API RESPONSE
// =========================================================

function normalizeAttendanceResponse(data) {

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
        Array.isArray(data.records)
    ) {

        return data.records;

    }


    if (
        data &&
        Array.isArray(data.attendance)
    ) {

        return data.attendance;

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
// GET RECORD ID
// =========================================================

function getRecordId(record) {

    return (
        record?.id ??
        record?.pk ??
        ""
    );

}


// =========================================================
// GET STUDENT NAME
// =========================================================

function getStudentName(record) {

    if (!record) {

        return "-";

    }


    if (
        typeof record.student_name ===
        "string"
    ) {

        return record.student_name;

    }


    if (
        typeof record.name ===
        "string"
    ) {

        return record.name;

    }


    if (
        record.student &&
        typeof record.student === "object"
    ) {

        return (
            record.student.name ||
            record.student.full_name ||
            record.student.student_name ||
            "-"
        );

    }


    return "-";

}


// =========================================================
// GET STUDENT ID / USN
// =========================================================

function getStudentId(record) {

    if (!record) {

        return "-";

    }


    /*
     * Your Django AttendanceSerializer
     * returns "usn".
     */

    if (record.usn) {

        return String(
            record.usn
        );

    }


    if (record.student_code) {

        return String(
            record.student_code
        );

    }


    if (record.student_id) {

        return String(
            record.student_id
        );

    }


    if (
        record.student &&
        typeof record.student === "object"
    ) {

        return String(
            record.student.usn ||
            record.student.student_id ||
            record.student.student_code ||
            record.student.id ||
            "-"
        );

    }


    if (
        record.student !== undefined &&
        record.student !== null
    ) {

        return String(
            record.student
        );

    }


    return "-";

}


// =========================================================
// GET SUBJECT NAME
// =========================================================

function getSubjectName(record) {

    if (!record) {

        return "-";

    }


    if (
        typeof record.subject_name ===
        "string"
    ) {

        return record.subject_name;

    }


    if (
        typeof record.subject_title ===
        "string"
    ) {

        return record.subject_title;

    }


    if (
        typeof record.subject ===
        "string"
    ) {

        return record.subject;

    }


    if (
        record.subject &&
        typeof record.subject === "object"
    ) {

        return (
            record.subject.name ||
            record.subject.subject_name ||
            record.subject.title ||
            "-"
        );

    }


    return "-";

}


// =========================================================
// GET DATE
// =========================================================

function getAttendanceDate(record) {

    if (!record) {

        return "";

    }


    return (
        record.date ||
        record.attendance_date ||
        record.marked_date ||
        record.created_at ||
        ""
    );

}


// =========================================================
// DATE KEY
// =========================================================

function getDateKey(value) {

    if (!value) {

        return "";

    }


    const text =
        String(value);


    if (
        /^\d{4}-\d{2}-\d{2}/.test(text)
    ) {

        return text.substring(
            0,
            10
        );

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date
        .toISOString()
        .substring(0, 10);

}


// =========================================================
// FORMAT DATE
// =========================================================

function formatAttendanceDate(value) {

    if (!value) {

        return "-";

    }


    /*
     * Avoid timezone problems for
     * YYYY-MM-DD dates.
     */

    const dateKey =
        getDateKey(value);


    if (!dateKey) {

        return escapeHTML(
            String(value)
        );

    }


    const parts =
        dateKey.split("-");


    if (parts.length !== 3) {

        return escapeHTML(
            String(value)
        );

    }


    const date =
        new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        );


    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// =========================================================
// GET STATUS
// =========================================================

function getAttendanceStatus(record) {

    if (!record) {

        return "-";

    }


    const status =
        record.status ||
        record.attendance_status ||
        "";


    if (!status) {

        return "-";

    }


    const normalized =
        String(status)
            .trim()
            .toUpperCase();


    if (
        normalized ===
        "PRESENT"
    ) {

        return "Present";

    }


    if (
        normalized ===
        "ABSENT"
    ) {

        return "Absent";

    }


    return String(status);

}


// =========================================================
// BACKEND STATUS
// =========================================================

function getBackendStatus(status) {

    const normalized =
        String(status || "")
            .trim()
            .toUpperCase();


    if (
        normalized ===
        "PRESENT"
    ) {

        return "PRESENT";

    }


    if (
        normalized ===
        "ABSENT"
    ) {

        return "ABSENT";

    }


    return "";

}


// =========================================================
// GET MARKED BY
// =========================================================

function getMarkedBy(record) {

    if (!record) {

        return "-";

    }


    if (record.marked_by_name) {

        return String(
            record.marked_by_name
        );

    }


    if (
        record.marked_by &&
        typeof record.marked_by === "object"
    ) {

        return (
            record.marked_by.name ||
            record.marked_by.username ||
            record.marked_by.email ||
            "-"
        );

    }


    if (
        record.marked_by !== undefined &&
        record.marked_by !== null
    ) {

        return String(
            record.marked_by
        );

    }


    if (record.faculty_name) {

        return String(
            record.faculty_name
        );

    }


    return "-";

}


// =========================================================
// GET REMARKS
// =========================================================

function getRemarks(record) {

    if (!record) {

        return "-";

    }


    return (
        record.remarks ||
        record.remark ||
        record.notes ||
        "-"
    );

}


// =========================================================
// LOAD ATTENDANCE
// =========================================================

async function loadAttendance() {

    const tableBody =
        document.getElementById(
            "attendanceTableBody"
        );


    if (tableBody) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="admin-table-loading"
                >
                    Loading attendance records...
                </td>

            </tr>

        `;

    }


    try {

        console.log(
            "Loading attendance..."
        );


        const data =
            await apiRequest(
                "/attendance/"
            );


        allAttendance =
            normalizeAttendanceResponse(
                data
            );


        console.log(
            "Attendance records:",
            allAttendance
        );


        updateAttendanceSummary();

        renderAttendanceTable();


    }
    catch (error) {

        console.error(
            "Attendance loading error:",
            error
        );


        allAttendance = [];


        updateAttendanceSummary();


        if (tableBody) {

            tableBody.innerHTML = `

                <tr>

                    <td
                        colspan="7"
                        class="admin-table-empty"
                    >
                        Failed to load attendance records.
                        ${escapeHTML(
                            error.message
                        )}
                    </td>

                </tr>

            `;

        }

    }

}


// =========================================================
// UPDATE SUMMARY
// =========================================================

function updateAttendanceSummary() {

    const total =
        allAttendance.length;


    let present = 0;

    let absent = 0;


    allAttendance.forEach(
        function(record) {

            const status =
                getAttendanceStatus(
                    record
                );


            if (
                status ===
                "Present"
            ) {

                present++;

            }
            else if (
                status ===
                "Absent"
            ) {

                absent++;

            }

        }
    );


    const rate =
        total > 0
            ? ((present / total) * 100)
                .toFixed(2)
            : "0.00";


    const totalElement =
        document.getElementById(
            "totalAttendance"
        );


    const presentElement =
        document.getElementById(
            "presentAttendance"
        );


    const absentElement =
        document.getElementById(
            "absentAttendance"
        );


    const rateElement =
        document.getElementById(
            "attendanceRate"
        );


    if (totalElement) {

        totalElement.textContent =
            total;

    }


    if (presentElement) {

        presentElement.textContent =
            present;

    }


    if (absentElement) {

        absentElement.textContent =
            absent;

    }


    if (rateElement) {

        rateElement.textContent =
            `${rate}%`;

    }

}


// =========================================================
// FILTER ATTENDANCE
// =========================================================

function getFilteredAttendance() {

    const searchInput =
        document.getElementById(
            "attendanceSearch"
        );


    const statusFilter =
        document.getElementById(
            "attendanceStatusFilter"
        );


    const dateFilter =
        document.getElementById(
            "attendanceDateFilter"
        );


    const search =
        (
            searchInput?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const selectedStatus =
        statusFilter?.value ||
        "";


    const selectedDate =
        dateFilter?.value ||
        "";


    return allAttendance.filter(
        function(record) {

            const studentName =
                getStudentName(
                    record
                ).toLowerCase();


            const studentId =
                getStudentId(
                    record
                ).toLowerCase();


            const subject =
                getSubjectName(
                    record
                ).toLowerCase();


            const status =
                getAttendanceStatus(
                    record
                );


            const recordDate =
                getDateKey(
                    getAttendanceDate(
                        record
                    )
                );


            // SEARCH

            if (
                search &&
                !studentName.includes(search) &&
                !studentId.includes(search) &&
                !subject.includes(search)
            ) {

                return false;

            }


            // STATUS

            if (
                selectedStatus &&
                status !== selectedStatus
            ) {

                return false;

            }


            // DATE

            if (
                selectedDate &&
                recordDate !== selectedDate
            ) {

                return false;

            }


            return true;

        }
    );

}


// =========================================================
// RENDER ATTENDANCE TABLE
// =========================================================

function renderAttendanceTable() {

    const tableBody =
        document.getElementById(
            "attendanceTableBody"
        );


    const countElement =
        document.getElementById(
            "filteredAttendanceCount"
        );


    if (!tableBody) {

        return;

    }


    const records =
        getFilteredAttendance();


    if (countElement) {

        countElement.textContent =
            records.length;

    }


    if (
        records.length === 0
    ) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="admin-table-empty"
                >
                    No attendance records found.
                </td>

            </tr>

        `;


        return;

    }


    tableBody.innerHTML =
        records.map(
            function(
                record,
                index
            ) {

                const studentName =
                    getStudentName(
                        record
                    );


                const studentId =
                    getStudentId(
                        record
                    );


                const subject =
                    getSubjectName(
                        record
                    );


                const rawDate =
                    getAttendanceDate(
                        record
                    );


                const displayDate =
                    formatAttendanceDate(
                        rawDate
                    );


                const status =
                    getAttendanceStatus(
                        record
                    );


                let statusClass =
                    "unknown";


                if (
                    status ===
                    "Present"
                ) {

                    statusClass =
                        "present";

                }
                else if (
                    status ===
                    "Absent"
                ) {

                    statusClass =
                        "absent";

                }


                const originalIndex =
                    allAttendance.indexOf(
                        record
                    );


                return `

                    <tr>

                        <td>
                            ${index + 1}
                        </td>


                        <td>

                            <div
                                class="attendance-student-cell"
                            >

                                <div
                                    class="attendance-table-avatar"
                                >
                                    ${escapeHTML(
                                        String(
                                            studentName
                                        )
                                            .charAt(0)
                                            .toUpperCase()
                                    )}
                                </div>


                                <strong>
                                    ${escapeHTML(
                                        String(
                                            studentName
                                        )
                                    )}
                                </strong>

                            </div>

                        </td>


                        <td>
                            ${escapeHTML(
                                String(
                                    studentId
                                )
                            )}
                        </td>


                        <td>
                            ${escapeHTML(
                                String(
                                    subject
                                )
                            )}
                        </td>


                        <td>
                            ${escapeHTML(
                                String(
                                    displayDate
                                )
                            )}
                        </td>


                        <td>

                            <span
                                class="admin-section-badge ${statusClass}"
                            >
                                ${escapeHTML(
                                    String(
                                        status
                                    ).toUpperCase()
                                )}
                            </span>

                        </td>


                        <td>

                            <button
                                type="button"
                                class="attendance-view-btn"
                                data-attendance-index="${originalIndex}"
                            >
                                View
                            </button>

                        </td>

                    </tr>

                `;

            }
        )
        .join("");


    setupViewButtons();

}


// =========================================================
// VIEW BUTTONS
// =========================================================

function setupViewButtons() {

    const tableBody =
        document.getElementById(
            "attendanceTableBody"
        );


    if (!tableBody) {

        return;

    }


    const viewButtons =
        tableBody.querySelectorAll(
            ".attendance-view-btn"
        );


    viewButtons.forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

                    const index =
                        Number(
                            this.dataset
                                .attendanceIndex
                        );


                    const record =
                        allAttendance[index];


                    if (record) {

                        openAttendanceModal(
                            record
                        );

                    }

                }
            );

        }
    );

}


// =========================================================
// OPEN ATTENDANCE MODAL
// =========================================================

function openAttendanceModal(record) {

    selectedAttendanceRecord =
        record;


    const modal =
        document.getElementById(
            "attendanceModal"
        );


    const avatar =
        document.getElementById(
            "modalAttendanceAvatar"
        );


    const nameElement =
        document.getElementById(
            "modalStudentName"
        );


    const studentIdElement =
        document.getElementById(
            "modalStudentId"
        );


    const attendanceStudentId =
        document.getElementById(
            "modalAttendanceStudentId"
        );


    const subjectElement =
        document.getElementById(
            "modalAttendanceSubject"
        );


    const dateElement =
        document.getElementById(
            "modalAttendanceDate"
        );


    const statusElement =
        document.getElementById(
            "modalAttendanceStatus"
        );


    const markedByElement =
        document.getElementById(
            "modalAttendanceMarkedBy"
        );


    const remarksElement =
        document.getElementById(
            "modalAttendanceRemarks"
        );


    const statusSelect =
        document.getElementById(
            "modalAttendanceStatusSelect"
        );


    const messageElement =
        document.getElementById(
            "attendanceUpdateMessage"
        );


    const studentName =
        getStudentName(
            record
        );


    const studentId =
        getStudentId(
            record
        );


    const subject =
        getSubjectName(
            record
        );


    const status =
        getAttendanceStatus(
            record
        );


    const date =
        getAttendanceDate(
            record
        );


    const markedBy =
        getMarkedBy(
            record
        );


    const remarks =
        getRemarks(
            record
        );


    if (avatar) {

        avatar.textContent =
            String(
                studentName
            )
                .charAt(0)
                .toUpperCase() ||
            "S";

    }


    if (nameElement) {

        nameElement.textContent =
            studentName;

    }


    if (studentIdElement) {

        studentIdElement.textContent =
            studentId;

    }


    if (attendanceStudentId) {

        attendanceStudentId.textContent =
            studentId;

    }


    if (subjectElement) {

        subjectElement.textContent =
            subject;

    }


    if (dateElement) {

        dateElement.textContent =
            formatAttendanceDate(
                date
            );

    }


    if (statusElement) {

        statusElement.textContent =
            String(
                status
            ).toUpperCase();

    }


    if (markedByElement) {

        markedByElement.textContent =
            markedBy;

    }


    if (remarksElement) {

        remarksElement.textContent =
            remarks;

    }


    if (statusSelect) {

        if (
            status === "Present" ||
            status === "Absent"
        ) {

            statusSelect.value =
                status;

        }
        else {

            statusSelect.value =
                "Present";

        }

    }


    if (messageElement) {

        messageElement.textContent =
            "";

        messageElement.className =
            "attendance-update-message";

    }


    if (modal) {

        modal.hidden =
            false;

        document.body.classList.add(
            "modal-open"
        );

    }

}


// =========================================================
// CLOSE ATTENDANCE MODAL
// =========================================================

function closeAttendanceModal() {

    const modal =
        document.getElementById(
            "attendanceModal"
        );


    selectedAttendanceRecord =
        null;


    if (modal) {

        modal.hidden =
            true;

    }


    document.body.classList.remove(
        "modal-open"
    );

}


// =========================================================
// SHOW UPDATE MESSAGE
// =========================================================

function showAttendanceMessage(
    message,
    type = "info"
) {

    const element =
        document.getElementById(
            "attendanceUpdateMessage"
        );


    if (!element) {

        return;

    }


    element.textContent =
        message;


    element.className =
        `attendance-update-message ${type}`;

}


// =========================================================
// UPDATE ATTENDANCE STATUS
// =========================================================

async function updateAttendanceStatus() {

    if (!selectedAttendanceRecord) {

        showAttendanceMessage(
            "No attendance record selected.",
            "error"
        );

        return;

    }


    const attendanceId =
        getRecordId(
            selectedAttendanceRecord
        );


    if (!attendanceId) {

        showAttendanceMessage(
            "Attendance record ID is missing.",
            "error"
        );

        return;

    }


    const statusSelect =
        document.getElementById(
            "modalAttendanceStatusSelect"
        );


    const saveButton =
        document.getElementById(
            "saveAttendanceBtn"
        );


    const newStatus =
        statusSelect?.value ||
        "";


    if (
        newStatus !== "Present" &&
        newStatus !== "Absent"
    ) {

        showAttendanceMessage(
            "Please select a valid attendance status.",
            "error"
        );

        return;

    }


    const currentStatus =
        getAttendanceStatus(
            selectedAttendanceRecord
        );


    if (
        currentStatus ===
        newStatus
    ) {

        showAttendanceMessage(
            "No change needed.",
            "info"
        );

        return;

    }


    const backendStatus =
        getBackendStatus(
            newStatus
        );


    if (!backendStatus) {

        showAttendanceMessage(
            "Invalid attendance status.",
            "error"
        );

        return;

    }


    try {

        if (saveButton) {

            saveButton.disabled =
                true;

            saveButton.textContent =
                "Saving...";

        }


        console.log(
            "Updating attendance:",
            attendanceId,
            backendStatus
        );


        const response =
            await apiRequest(
                `/attendance/${attendanceId}/`,
                {
                    method: "PATCH",

                    body:
                        JSON.stringify({
                            status:
                                backendStatus
                        })
                }
            );


        console.log(
            "Attendance update response:",
            response
        );


        // Update local record

        selectedAttendanceRecord.status =
            backendStatus;


        const localIndex =
            allAttendance.findIndex(
                function(record) {

                    return String(
                        getRecordId(
                            record
                        )
                    ) ===
                    String(
                        attendanceId
                    );

                }
            );


        if (localIndex !== -1) {

            allAttendance[
                localIndex
            ] = {

                ...allAttendance[
                    localIndex
                ],

                ...(response || {}),

                status:
                    backendStatus

            };


            selectedAttendanceRecord =
                allAttendance[
                    localIndex
                ];

        }


        // Update modal

        const statusElement =
            document.getElementById(
                "modalAttendanceStatus"
            );


        if (statusElement) {

            statusElement.textContent =
                newStatus.toUpperCase();

        }


        // Update summary

        updateAttendanceSummary();


        // Update table

        renderAttendanceTable();


        showAttendanceMessage(
            "Attendance updated successfully.",
            "success"
        );


    }
    catch (error) {

        console.error(
            "Attendance update error:",
            error
        );


        showAttendanceMessage(
            error.message ||
            "Failed to update attendance.",
            "error"
        );

    }
    finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Save Attendance";

        }

    }

}


// =========================================================
// REFRESH BUTTON
// =========================================================

function setupRefreshButton() {

    const button =
        document.getElementById(
            "refreshAttendanceBtn"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        async function() {

            const originalText =
                button.textContent;


            button.disabled =
                true;


            button.textContent =
                "Loading...";


            try {

                await loadAttendance();

            }
            finally {

                button.disabled =
                    false;

                button.textContent =
                    originalText;

            }

        }
    );

}


// =========================================================
// SEARCH FILTER
// =========================================================

function setupSearchFilter() {

    const searchInput =
        document.getElementById(
            "attendanceSearch"
        );


    if (!searchInput) {

        return;

    }


    searchInput.addEventListener(
        "input",
        function() {

            renderAttendanceTable();

        }
    );

}


// =========================================================
// STATUS FILTER
// =========================================================

function setupStatusFilter() {

    const statusFilter =
        document.getElementById(
            "attendanceStatusFilter"
        );


    if (!statusFilter) {

        return;

    }


    statusFilter.addEventListener(
        "change",
        function() {

            renderAttendanceTable();

        }
    );

}


// =========================================================
// DATE FILTER
// =========================================================

function setupDateFilter() {

    const dateFilter =
        document.getElementById(
            "attendanceDateFilter"
        );


    if (!dateFilter) {

        return;

    }


    dateFilter.addEventListener(
        "change",
        function() {

            renderAttendanceTable();

        }
    );

}


// =========================================================
// MODAL EVENTS
// =========================================================

function setupModalEvents() {

    const modal =
        document.getElementById(
            "attendanceModal"
        );


    const closeButton =
        document.getElementById(
            "closeAttendanceModal"
        );


    const saveButton =
        document.getElementById(
            "saveAttendanceBtn"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeAttendanceModal
        );

    }


    if (saveButton) {

        saveButton.addEventListener(
            "click",
            updateAttendanceStatus
        );

    }


    if (modal) {

        modal.addEventListener(
            "click",
            function(event) {

                if (
                    event.target ===
                    modal
                ) {

                    closeAttendanceModal();

                }

            }
        );

    }


    document.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Escape" &&
                modal &&
                !modal.hidden
            ) {

                closeAttendanceModal();

            }

        }
    );

}


// =========================================================
// LOGOUT
// =========================================================

function setupLogout() {

    const logoutButton =
        document.getElementById(
            "logoutBtn"
        );


    if (!logoutButton) {

        return;

    }


    logoutButton.addEventListener(
        "click",
        function() {

            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "accessToken"
            );

            localStorage.removeItem(
                "refresh_token"
            );

            localStorage.removeItem(
                "refreshToken"
            );

            localStorage.removeItem(
                "token"
            );


            window.location.href =
                "../login.html";

        }
    );

}


// =========================================================
// INITIALIZE
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        console.log(
            "Admin Attendance Page Loaded"
        );


        setupRefreshButton();

        setupSearchFilter();

        setupStatusFilter();

        setupDateFilter();

        setupModalEvents();

        setupLogout();


        await loadAttendance();


        console.log(
            "Admin Attendance Page Ready"
        );

    }
);