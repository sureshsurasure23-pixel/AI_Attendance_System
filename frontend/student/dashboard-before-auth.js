// =====================================================
// AI ATTEND - STUDENT DASHBOARD
// =====================================================

const API_URL =
    "http://127.0.0.1:8000/ai/dashboard/student/2/";

const REFRESH_URL =
    "http://127.0.0.1:8000/api/token/refresh/";


// =====================================================
// REFRESH TOKEN
// =====================================================

async function refreshAccessToken() {

    const refreshToken =
        localStorage.getItem("refresh_token");

    if (!refreshToken) {
        console.error("Refresh token missing.");
        return false;
    }

    try {

        const response = await fetch(
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


        if (!response.ok) {

            console.error(
                "Refresh failed:",
                data
            );

            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "refresh_token"
            );

            return false;
        }


        localStorage.setItem(
            "access_token",
            data.access
        );


        console.log(
            "New access token saved."
        );


        return true;

    } catch (error) {

        console.error(
            "Refresh error:",
            error
        );

        return false;
    }
}


// =====================================================
// GET DASHBOARD DATA
// =====================================================

async function getDashboardData() {

    let token =
        localStorage.getItem(
            "access_token"
        );


    if (!token) {

        console.error(
            "Access token missing."
        );

        window.location.href =
            "../login.html";

        return null;
    }


    let response =
        await fetch(
            API_URL,
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


    // TOKEN EXPIRED

    if (response.status === 401) {

        console.log(
            "Access token expired."
        );


        const refreshed =
            await refreshAccessToken();


        if (!refreshed) {

            window.location.href =
                "../login.html";

            return null;
        }


        token =
            localStorage.getItem(
                "access_token"
            );


        response =
            await fetch(
                API_URL,
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
    }


    if (!response.ok) {

        console.error(
            "Dashboard API error:",
            response.status
        );

        const errorData =
            await response.json();

        console.error(
            errorData
        );

        return null;
    }


    return await response.json();
}


// =====================================================
// SAFE TEXT
// =====================================================

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (!element) {

        console.warn(
            `Missing HTML element: ${id}`
        );

        return;
    }


    element.textContent =
        value ?? "-";
}


// =====================================================
// SAFE WIDTH
// =====================================================

function setWidth(id, value) {

    const element =
        document.getElementById(id);


    if (!element) return;


    const number =
        Number(value) || 0;


    element.style.width =
        `${Math.max(0, Math.min(100, number))}%`;
}


// =====================================================
// DISPLAY DASHBOARD
// =====================================================

function displayDashboard(data) {

    console.log(
        "Dashboard data:",
        data
    );


    // -------------------------------------------------
    // STUDENT
    // -------------------------------------------------

    const student =
        data.student || {};


    const name =
        student.name || "Student";


    setText(
        "studentName",
        name
    );


    setText(
        "topStudentName",
        name
    );


    setText(
        "studentId",
        student.id
    );


    const avatar =
        document.getElementById(
            "studentAvatar"
        );


    if (avatar) {

        avatar.textContent =
            name.charAt(0).toUpperCase();

    }


    // -------------------------------------------------
    // OVERALL RISK
    // -------------------------------------------------

    setText(
        "overallRisk",
        data.early_warning?.overall_risk
    );


    // -------------------------------------------------
    // ATTENDANCE
    // -------------------------------------------------

    const attendance =
        data.attendance || {};


    const percentage =
        Number(
            attendance.percentage
        ) || 0;


    const present =
        Number(
            attendance.present
        ) || 0;


    const total =
        Number(
            attendance.total_classes
        ) || 0;


    const absent =
        Number(
            attendance.absent
        ) || 0;


    setText(
        "attendancePercentage",
        percentage
    );


    setText(
        "attendanceRisk",
        `Risk: ${attendance.risk_level ?? "-"}`
    );


    setWidth(
        "attendanceProgress",
        percentage
    );


    setText(
        "presentClasses",
        present
    );


    setText(
        "totalClasses",
        total
    );


    // CLASSES CARD

    setText(
        "presentClasses2",
        present
    );


    setText(
        "totalClasses2",
        total
    );


    setText(
        "absentClasses",
        absent
    );


    // -------------------------------------------------
    // ACADEMIC
    // -------------------------------------------------

    const academic =
        data.academic || {};


    const marks =
        Number(
            academic.average_marks
        ) || 0;


    setText(
        "averageMarks",
        marks
    );


    setText(
        "academicRisk",
        `Risk: ${academic.risk_level ?? "-"}`
    );


    setWidth(
        "marksProgress",
        marks
    );


    // -------------------------------------------------
    // AI PREDICTION
    // -------------------------------------------------

    const prediction =
        data.ml_prediction || {};


    setText(
        "mlRisk",
        prediction.risk_level
    );


    setText(
        "confidence",
        prediction.confidence
    );


    setText(
        "predictionStatus",
        prediction.prediction_status
    );


    // -------------------------------------------------
    // EARLY WARNING
    // -------------------------------------------------

    const warning =
        data.early_warning || {};


    setText(
        "earlyWarningRisk",
        warning.overall_risk
    );


    setText(
        "riskScore",
        warning.risk_score
    );


    // -------------------------------------------------
    // RECOMMENDATIONS
    // -------------------------------------------------

    const container =
        document.getElementById(
            "recommendations"
        );


    if (container) {

        container.innerHTML = "";


        const recommendations =
            warning.recommendations || [];


        if (
            recommendations.length === 0
        ) {

            container.textContent =
                "No recommendations available.";

        } else {

            recommendations.forEach(
                recommendation => {

                    const item =
                        document.createElement(
                            "div"
                        );


                    item.className =
                        "recommendation";


                    item.textContent =
                        "• " + recommendation;


                    container.appendChild(
                        item
                    );

                }
            );
        }
    }


    // -------------------------------------------------
    // ATTENDANCE SHORTAGE
    // -------------------------------------------------

    const shortage =
        data.attendance_shortage || {};


    setText(
        "currentAttendance",
        `${shortage.current_percentage ?? percentage}%`
    );


    setText(
        "requiredAttendance",
        `${shortage.required_percentage ?? 75}%`
    );


    setText(
        "classesToAttend",
        shortage.classes_to_attend ?? 0
    );


    setText(
        "shortageMessage",
        shortage.message
    );


    // -------------------------------------------------
    // AI REASON
    // -------------------------------------------------

    setText(
        "aiReason",
        prediction.reason
    );


    console.log(
        "Dashboard display completed."
    );
}


// =====================================================
// LOAD DASHBOARD
// =====================================================

async function loadDashboard() {

    console.log(
        "AI Student Dashboard started."
    );


    console.log(
        "Loading student dashboard..."
    );


    const data =
        await getDashboardData();


    if (!data) {

        console.error(
            "Dashboard could not be loaded."
        );

        return;
    }


    console.log(
        "Dashboard data received:",
        data
    );


    displayDashboard(
        data
    );


    console.log(
        "Dashboard loaded successfully."
    );
}


// =====================================================
// REFRESH BUTTON
// =====================================================

const refreshBtn =
    document.getElementById(
        "refreshBtn"
    );


if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        loadDashboard
    );

}


// =====================================================
// LOGOUT
// =====================================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        function () {

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


// =====================================================
// START
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    loadDashboard
);
