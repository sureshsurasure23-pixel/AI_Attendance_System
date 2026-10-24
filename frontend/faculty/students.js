// =========================================================
// FACULTY STUDENTS PAGE
// =========================================================

const API_BASE_URL = "http://127.0.0.1:8000";

const accessToken =
    localStorage.getItem("access_token");


// =========================================================
// AUTH CHECK
// =========================================================

if (!accessToken) {

    window.location.href = "../login.html";

}


// =========================================================
// GLOBAL DATA
// =========================================================

let allStudents = [];


// =========================================================
// DOM ELEMENTS
// =========================================================

const tableBody =
    document.getElementById("studentsTableBody");

const searchInput =
    document.getElementById("studentSearch");

const riskFilter =
    document.getElementById("riskFilter");

const emptyStudents =
    document.getElementById("emptyStudents");

const studentMessage =
    document.getElementById("studentMessage");


// =========================================================
// API REQUEST
// =========================================================

async function apiRequest(endpoint) {

    const response =
        await fetch(
            `${API_BASE_URL}${endpoint}`,
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

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

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
// LOAD STUDENTS
// =========================================================

async function loadStudents() {

    try {

        showMessage(
            "Loading student information...",
            "info"
        );


        const dashboard =
            await apiRequest(
                "/faculty/dashboard/"
            );


        if (!dashboard) {
            return;
        }


        // Faculty information
        if (dashboard.faculty) {

            document.getElementById(
                "facultyName"
            ).textContent =
                dashboard.faculty.name ||
                "Faculty";


            document.getElementById(
                "facultyDesignation"
            ).textContent =
                dashboard.faculty.designation ||
                "Faculty";


            const firstLetter =
                (
                    dashboard.faculty.name ||
                    "F"
                )
                .charAt(0)
                .toUpperCase();


            document.getElementById(
                "facultyInitial"
            ).textContent =
                firstLetter;

        }


        allStudents =
            Array.isArray(
                dashboard.students
            )
                ? dashboard.students
                : [];


        updateSummary();

        renderStudents(
            allStudents
        );


        hideMessage();

    }
    catch (error) {

        console.error(
            "Students loading error:",
            error
        );


        showMessage(
            "Unable to load student information.",
            "error"
        );

    }

}


// =========================================================
// SUMMARY
// =========================================================

function updateSummary() {

    const total =
        allStudents.length;


    const low =
        allStudents.filter(
            student =>
                String(student.risk)
                    .toUpperCase() === "LOW"
        ).length;


    const medium =
        allStudents.filter(
            student =>
                String(student.risk)
                    .toUpperCase() === "MEDIUM"
        ).length;


    const high =
        allStudents.filter(
            student =>
                String(student.risk)
                    .toUpperCase() === "HIGH"
        ).length;


    document.getElementById(
        "totalStudents"
    ).textContent = total;


    document.getElementById(
        "lowRisk"
    ).textContent = low;


    document.getElementById(
        "mediumRisk"
    ).textContent = medium;


    document.getElementById(
        "highRisk"
    ).textContent = high;

}


// =========================================================
// RENDER STUDENTS
// =========================================================

function renderStudents(students) {

    tableBody.innerHTML = "";


    if (!students.length) {

        emptyStudents.style.display =
            "block";

        return;

    }


    emptyStudents.style.display =
        "none";


    students.forEach(
        (student, index) => {

            const attendance =
                Number(
                    student.attendance_percentage || 0
                );


            const safeAttendance =
                Math.max(
                    0,
                    Math.min(
                        100,
                        attendance
                    )
                );


            const risk =
                String(
                    student.risk || "NO DATA"
                )
                .toUpperCase();


            const riskClass =
                risk
                    .toLowerCase()
                    .replace(
                        " ",
                        "-"
                    );


            const initials =
                getInitials(
                    student.name
                );


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>


                <td>

                    <div class="student-name-cell">

                        <div class="student-avatar">
                            ${escapeHTML(initials)}
                        </div>

                        <div>

                            <strong>
                                ${escapeHTML(
                                    student.name ||
                                    "Unknown"
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
                        student.usn || "-"
                    )}
                </td>


                <td>
                    ${escapeHTML(
                        String(
                            student.semester ||
                            "-"
                        )
                    )}
                </td>


                <td>

                    <div class="attendance-cell">

                        <div class="attendance-bar">

                            <div
                                class="attendance-bar-fill"
                                style="width:${safeAttendance}%">
                            </div>

                        </div>

                        <strong>
                            ${attendance.toFixed(2)}%
                        </strong>

                    </div>

                </td>


                <td class="present-number">
                    ${Number(
                        student.present || 0
                    )}
                </td>


                <td class="absent-number">
                    ${Number(
                        student.absent || 0
                    )}
                </td>


                <td>

                    <span class="
                        student-risk
                        ${riskClass}
                    ">
                        ${escapeHTML(risk)}
                    </span>

                </td>


                <td>

                    <button
                        class="view-student-btn"
                        type="button">

                        View

                    </button>

                </td>

            `;


            const viewButton =
                row.querySelector(
                    ".view-student-btn"
                );


            viewButton.addEventListener(
                "click",
                () => openStudentModal(student)
            );


            tableBody.appendChild(row);

        }
    );

}


// =========================================================
// FILTER STUDENTS
// =========================================================

function filterStudents() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const selectedRisk =
        riskFilter.value
            .toUpperCase();


    const filtered =
        allStudents.filter(
            student => {

                const name =
                    String(
                        student.name || ""
                    ).toLowerCase();


                const usn =
                    String(
                        student.usn || ""
                    ).toLowerCase();


                const studentId =
                    String(
                        student.student_id || ""
                    ).toLowerCase();


                const matchesSearch =
                    !search ||
                    name.includes(search) ||
                    usn.includes(search) ||
                    studentId.includes(search);


                const risk =
                    String(
                        student.risk ||
                        "NO DATA"
                    )
                    .toUpperCase();


                const matchesRisk =
                    selectedRisk === "ALL" ||
                    risk === selectedRisk;


                return (
                    matchesSearch &&
                    matchesRisk
                );

            }
        );


    renderStudents(filtered);

}


// =========================================================
// STUDENT MODAL
// =========================================================

function openStudentModal(student) {

    document.getElementById(
        "modalAvatar"
    ).textContent =
        getInitials(student.name);


    document.getElementById(
        "modalStudentName"
    ).textContent =
        student.name || "Student";


    document.getElementById(
        "modalStudentId"
    ).textContent =
        student.student_id || "-";


    document.getElementById(
        "modalUSN"
    ).textContent =
        student.usn || "-";


    document.getElementById(
        "modalEmail"
    ).textContent =
        student.email || "-";


    document.getElementById(
        "modalPhone"
    ).textContent =
        student.phone || "-";


    document.getElementById(
        "modalSemester"
    ).textContent =
        student.semester || "-";


    document.getElementById(
        "modalSection"
    ).textContent =
        student.section || "-";


    document.getElementById(
        "modalAttendance"
    ).textContent =
        `${Number(
            student.attendance_percentage || 0
        ).toFixed(2)}%`;


    document.getElementById(
        "modalPresent"
    ).textContent =
        student.present || 0;


    document.getElementById(
        "modalAbsent"
    ).textContent =
        student.absent || 0;


    document.getElementById(
        "modalRisk"
    ).textContent =
        student.risk || "NO DATA";


    document.getElementById(
        "studentModal"
    ).style.display =
        "flex";

}


// =========================================================
// CLOSE MODAL
// =========================================================

function closeStudentModal() {

    document.getElementById(
        "studentModal"
    ).style.display =
        "none";

}


document.getElementById(
    "closeStudentModal"
).addEventListener(
    "click",
    closeStudentModal
);


document.getElementById(
    "studentModal"
).addEventListener(
    "click",
    function(event) {

        if (
            event.target ===
            document.getElementById("studentModal")
        ) {

            closeStudentModal();

        }

    }
);


// =========================================================
// SEARCH / FILTER EVENTS
// =========================================================

searchInput.addEventListener(
    "input",
    filterStudents
);


riskFilter.addEventListener(
    "change",
    filterStudents
);


// =========================================================
// LOGOUT
// =========================================================

document.getElementById(
    "logoutBtn"
).addEventListener(
    "click",
    function() {

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


// =========================================================
// HELPERS
// =========================================================

function getInitials(name) {

    if (!name) {
        return "ST";
    }


    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(
            word =>
                word.charAt(0)
        )
        .join("")
        .toUpperCase();

}


function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value;

    return div.innerHTML;

}


// =========================================================
// MESSAGES
// =========================================================

function showMessage(
    message,
    type = "info"
) {

    studentMessage.textContent =
        message;

    studentMessage.className =
        `student-message ${type}`;

    studentMessage.style.display =
        "block";

}


function hideMessage() {

    studentMessage.style.display =
        "none";

}


// =========================================================
// INITIAL LOAD
// =========================================================

loadStudents();