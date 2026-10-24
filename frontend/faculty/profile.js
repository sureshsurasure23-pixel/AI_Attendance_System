// =========================================================
// FACULTY PROFILE
// =========================================================

const API_BASE_URL =
    "http://127.0.0.1:8000";


// =========================================================
// AUTHENTICATION
// =========================================================

const accessToken =
    localStorage.getItem("access_token");


if (!accessToken) {

    window.location.href =
        "../login.html";

}


// =========================================================
// API REQUEST
// =========================================================

async function apiRequest(url) {

    const response =
        await fetch(
            API_BASE_URL + url,
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


    if (response.status === 401) {

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
            "role"
        );

        window.location.href =
            "../login.html";

        return null;
    }


    if (!response.ok) {

        throw new Error(
            `API Error: ${response.status}`
        );

    }


    return await response.json();
}


// =========================================================
// LOAD PROFILE
// =========================================================

async function loadFacultyProfile() {

    try {

        showMessage(
            "Loading faculty profile...",
            "loading"
        );


        const data =
            await apiRequest(
                "/faculty/dashboard/"
            );


        if (!data) {
            return;
        }


        const faculty =
            data.faculty || {};

        const statistics =
            data.statistics || {};


        // =============================================
        // FACULTY INFORMATION
        // =============================================

        const facultyId =
            faculty.faculty_id || "-";


        const name =
            faculty.name || "Faculty";


        const email =
            faculty.email || "-";


        const phone =
            faculty.phone || "-";


        const designation =
            faculty.designation || "-";


        const department =
            faculty.department || "-";


        // =============================================
        // INITIAL
        // =============================================

        const initial =
            name
                .trim()
                .charAt(0)
                .toUpperCase();


        setText(
            "facultyInitial",
            initial
        );


        setText(
            "profileAvatar",
            initial
        );


        // =============================================
        // TOPBAR
        // =============================================

        setText(
            "facultyName",
            name
        );


        setText(
            "facultyDesignation",
            designation
        );


        // =============================================
        // PROFILE HERO
        // =============================================

        setText(
            "profileName",
            name
        );


        setText(
            "profileDesignation",
            designation
        );


        // =============================================
        // PERSONAL DETAILS
        // =============================================

        setText(
            "facultyId",
            facultyId
        );


        setText(
            "detailName",
            name
        );


        setText(
            "facultyEmail",
            email
        );


        setText(
            "facultyPhone",
            phone
        );


        setText(
            "facultyDesignationDetail",
            designation
        );


        setText(
            "facultyDepartment",
            department
        );


        // =============================================
        // ACADEMIC STATISTICS
        // =============================================

        const totalStudents =
            Number(
                statistics.total_students || 0
            );


        const totalSubjects =
            Number(
                statistics.total_subjects || 0
            );


        const attendancePercentage =
            Number(
                statistics.attendance_percentage || 0
            );


        setText(
            "totalStudents",
            totalStudents
        );


        setText(
            "totalSubjects",
            totalSubjects
        );


        setText(
            "attendancePercentage",
            attendancePercentage.toFixed(2) + "%"
        );


        setText(
            "departmentName",
            department
        );


        hideMessage();

        console.log(
            "Faculty profile loaded successfully:",
            data
        );

    }

    catch (error) {

        console.error(
            "Profile loading error:",
            error
        );


        showMessage(
            "Unable to load faculty profile. Make sure Django is running.",
            "error"
        );

    }
}


// =========================================================
// SET TEXT SAFELY
// =========================================================

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.textContent =
            value;

    }

}


// =========================================================
// MESSAGE
// =========================================================

function showMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "profileMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        "profile-message " + type;


    element.style.display =
        "block";

}


function hideMessage() {

    const element =
        document.getElementById(
            "profileMessage"
        );


    if (element) {

        element.style.display =
            "none";

    }

}


// =========================================================
// LOGOUT
// =========================================================

const logoutButton =
    document.getElementById(
        "logoutBtn"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        function () {

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
                "role"
            );

            window.location.href =
                "../login.html";

        }
    );

}


// =========================================================
// START
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    loadFacultyProfile
);