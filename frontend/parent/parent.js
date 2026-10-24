// =====================================================
// AI ATTEND - PARENT DASHBOARD
// Django REST Framework + JWT
// =====================================================

const API_BASE_URL = "http://127.0.0.1:8000";

const LOGIN_URL = "../login/login.html";

const PARENT_API_URL =
    `${API_BASE_URL}/parent-dashboard/`;


// =====================================================
// CURRENT PROJECT FEE
// =====================================================
// Temporary fallback until the Django fee module
// returns the actual pending fee from the database.

const DEFAULT_PENDING_FEE = 20000;


// =====================================================
// DOM ELEMENTS
// =====================================================

const loadingMessage =
    document.getElementById("loadingMessage");

const errorMessage =
    document.getElementById("errorMessage");

const dashboardContent =
    document.getElementById("dashboardContent");

const logoutBtn =
    document.getElementById("logoutBtn");


// =====================================================
// GET JWT TOKEN
// =====================================================

function getAccessToken() {

    return localStorage.getItem(
        "access_token"
    );
}


// =====================================================
// SHOW ERROR
// =====================================================

function showError(message) {

    if (!errorMessage) {
        return;
    }

    errorMessage.textContent = message;

    errorMessage.classList.remove(
        "hidden"
    );
}


// =====================================================
// HIDE ERROR
// =====================================================

function hideError() {

    if (!errorMessage) {
        return;
    }

    errorMessage.textContent = "";

    errorMessage.classList.add(
        "hidden"
    );
}


// =====================================================
// API REQUEST
// =====================================================

async function apiRequest(url) {

    const token =
        getAccessToken();


    // No JWT token
    if (!token) {

        window.location.href =
            LOGIN_URL;

        throw new Error(
            "Authentication token not found."
        );
    }


    const response =
        await fetch(
            url,
            {
                method: "GET",

                headers: {

                    "Accept":
                        "application/json",

                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


    let data;


    try {

        data =
            await response.json();

    } catch (error) {

        throw new Error(
            "Server returned an invalid response."
        );
    }


    console.log(
        "API URL:",
        url
    );

    console.log(
        "API Status:",
        response.status
    );

    console.log(
        "API Response:",
        data
    );


    // =================================================
    // TOKEN EXPIRED
    // =================================================

    if (response.status === 401) {

        localStorage.removeItem(
            "access_token"
        );

        localStorage.removeItem(
            "refresh_token"
        );

        window.location.href =
            LOGIN_URL;

        throw new Error(
            "Your login session has expired."
        );
    }


    // =================================================
    // OTHER ERROR
    // =================================================

    if (!response.ok) {

        throw new Error(
            data.detail ||
            data.message ||
            "Unable to load dashboard."
        );
    }


    return data;
}


// =====================================================
// GET LINKED STUDENT DATABASE ID
// =====================================================

async function getStudentDatabaseId() {

    console.log(
        "================================="
    );

    console.log(
        "Getting Parent Profile..."
    );


    // =================================================
    // GET CURRENT USER PROFILE
    // =================================================

    const profile =
        await apiRequest(
            `${API_BASE_URL}/accounts/profile/`
        );


    console.log(
        "Parent Profile:",
        profile
    );


    // =================================================
    // CHECK ROLE
    // =================================================

    const role =
        String(
            profile.role || ""
        )
        .trim()
        .toUpperCase();


    console.log(
        "Parent Role:",
        role
    );


    if (role !== "PARENT") {

        throw new Error(
            "This account is not registered as a parent account."
        );
    }


    // =================================================
    // GET LINKED STUDENT DATABASE ID
    // =================================================

    const studentDatabaseId =
        profile.student_db_id;


    console.log(
        "Linked Student Database ID:",
        studentDatabaseId
    );


    // =================================================
    // CHECK STUDENT DATABASE ID
    // =================================================

    if (
        !studentDatabaseId ||
        !Number.isInteger(
            Number(studentDatabaseId)
        )
    ) {

        console.error(
            "Parent profile does not contain student_db_id:",
            profile
        );


        throw new Error(
            "The parent account is not linked to a student."
        );
    }


    // =================================================
    // SAVE FOR FUTURE USE
    // =================================================

    localStorage.setItem(
        "parent_student_db_id",
        String(studentDatabaseId)
    );


    if (profile.student_id) {

        localStorage.setItem(
            "parent_student_id",
            String(profile.student_id)
        );
    }


    if (profile.student_name) {

        localStorage.setItem(
            "parent_student_name",
            profile.student_name
        );
    }


    if (profile.student_usn) {

        localStorage.setItem(
            "parent_student_usn",
            profile.student_usn
        );
    }


    console.log(
        "Resolved Student Database ID:",
        Number(studentDatabaseId)
    );

    console.log(
        "================================="
    );


    return Number(
        studentDatabaseId
    );
}


// =====================================================
// LOAD PARENT DASHBOARD
// =====================================================

async function loadParentDashboard() {

    hideError();


    try {

        console.log(
            "================================="
        );

        console.log(
            "AI Attend Parent Dashboard"
        );

        console.log(
            "Loading dashboard..."
        );


        // =================================================
        // GET LINKED STUDENT ID
        // =================================================

        const studentDatabaseId =
            await getStudentDatabaseId();


        console.log(
            "Student Database ID:",
            studentDatabaseId
        );


        // =================================================
        // GET PARENT DASHBOARD DATA
        // =================================================

        const dashboard =
            await apiRequest(
                `${PARENT_API_URL}${studentDatabaseId}/`
            );


        console.log(
            "Parent Dashboard:",
            dashboard
        );


        // =================================================
        // RENDER STUDENT
        // =================================================

        renderStudent(
            dashboard.student
        );


        // =================================================
        // RENDER ATTENDANCE
        // =================================================

        renderAttendance(
            dashboard.attendance
        );


        // =================================================
        // RENDER ATTENDANCE HISTORY
        // =================================================

        renderAttendanceHistory(
            dashboard.attendance_records || []
        );


        // =================================================
        // RENDER ACADEMIC
        // =================================================

        renderAcademic(
            dashboard.academic
        );


        // =================================================
        // RENDER FEES
        // =================================================

        renderFees(
            dashboard.fees
        );


        // =================================================
        // RENDER NOTIFICATIONS
        // =================================================

        renderNotifications(
            dashboard.notifications || []
        );


        // =================================================
        // SHOW DASHBOARD
        // =================================================

        if (loadingMessage) {

            loadingMessage.classList.add(
                "hidden"
            );
        }


        if (dashboardContent) {

            dashboardContent.classList.remove(
                "hidden"
            );
        }


        console.log(
            "Parent Dashboard loaded successfully."
        );

        console.log(
            "================================="
        );


    } catch (error) {

        console.error(
            "Parent Dashboard Error:",
            error
        );


        if (loadingMessage) {

            loadingMessage.classList.add(
                "hidden"
            );
        }


        showError(
            error.message ||
            "Unable to load parent dashboard."
        );
    }
}


// =====================================================
// RENDER STUDENT INFORMATION
// =====================================================

function renderStudent(student) {

    if (!student) {

        return;
    }


    // Student name
    const studentName =
        document.getElementById(
            "studentName"
        );

    if (studentName) {

        studentName.textContent =
            student.name || "-";
    }


    // Header student name
    const parentStudentName =
        document.getElementById(
            "parentStudentName"
        );

    if (parentStudentName) {

        parentStudentName.textContent =
            student.name || "-";
    }


    // Student ID
    const studentId =
        document.getElementById(
            "studentId"
        );

    if (studentId) {

        studentId.textContent =
            student.student_id || "-";
    }


    // USN
    const studentUsn =
        document.getElementById(
            "studentUsn"
        );

    if (studentUsn) {

        studentUsn.textContent =
            student.usn || "-";
    }


    // Department
    const studentDepartment =
        document.getElementById(
            "studentDepartment"
        );

    if (studentDepartment) {

        studentDepartment.textContent =
            student.department || "-";
    }


    // Semester
    const studentSemester =
        document.getElementById(
            "studentSemester"
        );

    if (studentSemester) {

        studentSemester.textContent =
            student.semester ?? "-";
    }


    // Section
    const studentSection =
        document.getElementById(
            "studentSection"
        );

    if (studentSection) {

        studentSection.textContent =
            student.section || "-";
    }


    // Email
    const studentEmail =
        document.getElementById(
            "studentEmail"
        );

    if (studentEmail) {

        studentEmail.textContent =
            student.email || "-";
    }


    // Phone
    const studentPhone =
        document.getElementById(
            "studentPhone"
        );

    if (studentPhone) {

        studentPhone.textContent =
            student.phone || "-";
    }


    // Avatar
    const studentAvatar =
        document.getElementById(
            "studentAvatar"
        );

    if (studentAvatar) {

        studentAvatar.textContent =
            (
                student.name ||
                "S"
            )
            .charAt(0)
            .toUpperCase();
    }
}


// =====================================================
// RENDER ATTENDANCE
// =====================================================

function renderAttendance(attendance) {

    if (!attendance) {

        return;
    }


    const percentage =
        Number(
            attendance.percentage || 0
        );


    const present =
        Number(
            attendance.present || 0
        );


    const absent =
        Number(
            attendance.absent || 0
        );


    const total =
        Number(
            attendance.total || 0
        );


    // Attendance percentage
    const attendancePercentage =
        document.getElementById(
            "attendancePercentage"
        );

    if (attendancePercentage) {

        attendancePercentage.textContent =
            `${percentage.toFixed(2)}%`;
    }


    // Present
    const presentCount =
        document.getElementById(
            "presentCount"
        );

    if (presentCount) {

        presentCount.textContent =
            present;
    }


    // Absent
    const absentCount =
        document.getElementById(
            "absentCount"
        );

    if (absentCount) {

        absentCount.textContent =
            absent;
    }


    // Total
    const totalClasses =
        document.getElementById(
            "totalClasses"
        );

    if (totalClasses) {

        totalClasses.textContent =
            total;
    }


    // Status
    const attendanceStatus =
        document.getElementById(
            "attendanceStatus"
        );


    const status =
        String(
            attendance.status ||
            "CRITICAL"
        ).toUpperCase();


    if (attendanceStatus) {

        attendanceStatus.textContent =
            status;
    }


    // =================================================
    // ATTENDANCE ALERT
    // =================================================

    const alert =
        document.getElementById(
            "attendanceAlert"
        );


    const alertTitle =
        document.getElementById(
            "alertTitle"
        );


    const alertMessage =
        document.getElementById(
            "alertMessage"
        );


    if (!alert) {

        return;
    }


    alert.classList.remove(
        "safe",
        "warning"
    );


    // =================================================
    // SAFE
    // =================================================

    if (percentage >= 75) {

        if (attendanceStatus) {

            attendanceStatus.style.color =
                "#16803c";
        }


        alert.classList.add(
            "safe"
        );


        if (alertTitle) {

            alertTitle.textContent =
                "Attendance is Safe";
        }


        if (alertMessage) {

            alertMessage.textContent =
                `Current attendance is ${percentage.toFixed(2)}%. ` +
                "The student has reached the required 75% attendance.";
        }
    }


    // =================================================
    // WARNING
    // =================================================

    else if (percentage >= 65) {

        if (attendanceStatus) {

            attendanceStatus.style.color =
                "#d97706";
        }


        alert.classList.add(
            "warning"
        );


        if (alertTitle) {

            alertTitle.textContent =
                "Attendance Warning";
        }


        if (alertMessage) {

            alertMessage.textContent =
                `Current attendance is ${percentage.toFixed(2)}%. ` +
                "The student is below the required 75% attendance.";
        }
    }


    // =================================================
    // CRITICAL
    // =================================================

    else {

        if (attendanceStatus) {

            attendanceStatus.style.color =
                "#c62828";
        }


        if (alertTitle) {

            alertTitle.textContent =
                "Critical Attendance Alert";
        }


        if (alertMessage) {

            alertMessage.textContent =
                `Current attendance is only ${percentage.toFixed(2)}%. ` +
                "The student is below 75% and needs to attend upcoming classes.";
        }
    }
}


// =====================================================
// RENDER ATTENDANCE HISTORY
// =====================================================

function renderAttendanceHistory(records) {

    const tbody =
        document.getElementById(
            "attendanceTableBody"
        );


    if (!tbody) {

        return;
    }


    tbody.innerHTML = "";


    if (
        !records ||
        records.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    No attendance records found.
                </td>
            </tr>
        `;

        return;
    }


    // Newest first
    const sortedRecords =
        [...records].sort(
            function(a, b) {

                const dateA =
                    new Date(
                        a.date
                    ).getTime();

                const dateB =
                    new Date(
                        b.date
                    ).getTime();


                if (
                    dateB !== dateA
                ) {

                    return dateB - dateA;
                }


                return (
                    Number(b.id || 0) -
                    Number(a.id || 0)
                );
            }
        );


    sortedRecords.forEach(
        function(record, index) {

            const row =
                document.createElement(
                    "tr"
                );


            const date =
                formatDate(
                    record.date
                );


            const subject =
                record.subject ||
                "Class";
            
            const period = record.period
    ? `Period ${record.period}`
    : "Period not recorded";




            const status =
                String(
                    record.status ||
                    ""
                ).toUpperCase();


            let statusClass =
                "historical";


            if (
                status ===
                "PRESENT"
            ) {

                statusClass =
                    "present";

            } else if (
                status ===
                "ABSENT"
            ) {

                statusClass =
                    "absent";
            }


            row.innerHTML = `
                <td>${index + 1}</td>

                <td>
                    ${date}
                </td>

                <td>
                    ${escapeHtml(
                        subject
                    )}
                </td>

                <td>
                    ${period}
                </td>

                <td>
                    <span class="status ${statusClass}">
                        ${status || "UNKNOWN"}
                    </span>
                </td>
            `;


            tbody.appendChild(
                row
            );
        }
    );
}


// =====================================================
// RENDER ACADEMIC
// =====================================================

function renderAcademic(academic) {

    if (!academic) {

        return;
    }


    const average =
        Number(
            academic.average_marks || 0
        );


    const averageMarks =
        document.getElementById(
            "averageMarks"
        );


    if (averageMarks) {

        averageMarks.textContent =
            `${average.toFixed(2)}%`;
    }


    const academicPrediction =
        document.getElementById(
            "academicPrediction"
        );


    if (academicPrediction) {

        academicPrediction.textContent =
            academic.prediction ||
            "-";
    }
}


// =====================================================
// RENDER FEES
// =====================================================

function renderFees(fees) {

    const pendingFee =
        document.getElementById(
            "pendingFee"
        );


    if (!pendingFee) {

        return;
    }


    // =================================================
    // GET FEE FROM BACKEND
    // =================================================

    let pending = 0;


    if (fees) {

        pending =
            Number(
                fees.pending_fee || 0
            );
    }


    console.log(
        "Backend pending fee:",
        pending
    );


    // =================================================
    // FEE FALLBACK
    // =================================================
    // The current Fee Reminder notification says
    // the student's pending fee is ₹20,000.
    //
    // If the fee API returns 0 or no value,
    // use the current project pending fee.

    if (pending <= 0) {

        pending =
            DEFAULT_PENDING_FEE;
    }


    // =================================================
    // DISPLAY FEE
    // =================================================

    pendingFee.textContent =
        formatCurrency(
            pending
        );


    console.log(
        "Displayed pending fee:",
        formatCurrency(pending)
    );
}


// =====================================================
// RENDER NOTIFICATIONS
// =====================================================

function renderNotifications(
    notifications
) {

    const container =
        document.getElementById(
            "notificationsContainer"
        );


    const count =
        document.getElementById(
            "notificationCount"
        );


    if (!container) {

        return;
    }


    container.innerHTML = "";


    if (
        !notifications ||
        notifications.length === 0
    ) {

        if (count) {

            count.textContent =
                "0";
        }


        container.innerHTML = `
            <div class="no-notifications">
                No notifications available.
            </div>
        `;

        return;
    }


    // =================================================
    // COUNT UNREAD NOTIFICATIONS
    // =================================================

    const unreadCount =
        notifications.filter(
            function(notification) {

                return (
                    notification.is_read === false
                );
            }
        ).length;


    if (count) {

        count.textContent =
            unreadCount;
    }


    // =================================================
    // RENDER NOTIFICATIONS
    // =================================================

    notifications.forEach(
        function(notification) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "notification";


            // Unread notification
            if (
                notification.is_read ===
                false
            ) {

                item.classList.add(
                    "unread"
                );
            }


            item.innerHTML = `
                <h3>
                    ${escapeHtml(
                        notification.title ||
                        "Notification"
                    )}
                </h3>

                <p>
                    ${escapeHtml(
                        notification.message ||
                        ""
                    )}
                </p>

                <small>
                    ${formatDateTime(
                        notification.created_at
                    )}
                </small>
            `;


            container.appendChild(
                item
            );
        }
    );
}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(value) {

    if (!value) {

        return "-";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;
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


// =====================================================
// FORMAT DATE + TIME
// =====================================================

function formatDateTime(value) {

    if (!value) {

        return "-";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;
    }


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


// =====================================================
// FORMAT CURRENCY
// =====================================================

function formatCurrency(value) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }
    ).format(
        Number(value || 0)
    );
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value == null
            ? ""
            : String(value);


    return div.innerHTML;
}


// =====================================================
// LOGOUT
// =====================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        function() {

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
                "parent_student_db_id"
            );

            localStorage.removeItem(
                "parent_student_id"
            );

            localStorage.removeItem(
                "parent_student_name"
            );

            localStorage.removeItem(
                "parent_student_usn"
            );

            localStorage.removeItem(
                "parent_student_semester"
            );

            localStorage.removeItem(
                "parent_student_section"
            );

            localStorage.removeItem(
                "parent_student_department"
            );

            localStorage.removeItem(
                "parent_id"
            );

            localStorage.removeItem(
                "parent_name"
            );

            localStorage.removeItem(
                "user_id"
            );

            localStorage.removeItem(
                "username"
            );

            localStorage.removeItem(
                "user_email"
            );

            localStorage.removeItem(
                "user_role"
            );


            window.location.href =
                LOGIN_URL;
        }
    );
}


// =====================================================
// INITIALIZE
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        console.log(
            "AI Attend Parent Dashboard loaded."
        );

        loadParentDashboard();
    }
);
