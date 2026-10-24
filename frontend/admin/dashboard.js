const API_BASE_URL = "http://127.0.0.1:8000";

const accessToken =
    localStorage.getItem("access_token");


if (!accessToken) {

    window.location.href =
        "../login.html";

}


// =========================================================
// API
// =========================================================

async function apiRequest(url) {

    const response =
        await fetch(
            `${API_BASE_URL}${url}`,
            {
                headers: {
                    "Authorization":
                        `Bearer ${accessToken}`
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

        window.location.href =
            "../login.html";

        return null;
    }


    if (!response.ok) {

        throw new Error(
            `Request failed: ${response.status}`
        );

    }


    return response.json();

}


// =========================================================
// HELPERS
// =========================================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value;

    }

}


function percentage(value) {

    return `${Number(value || 0).toFixed(2)}%`;

}


function safePercentage(value) {

    return Math.max(
        0,
        Math.min(
            100,
            Number(value || 0)
        )
    );

}


function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value ?? "");

    return div.innerHTML;

}


// =========================================================
// LOAD DASHBOARD
// =========================================================

async function loadDashboard() {

    try {

        const data =
            await apiRequest(
                "/attendance/admin/dashboard/"
            );


        if (!data) {
            return;
        }


        renderSummary(data);

        renderRisk(data.summary);

        renderSubjects(
            data.subjects || []
        );

        renderShortage(
            data.shortage_students || []
        );


        console.log(
            "Admin dashboard loaded:",
            data
        );

    }
    catch (error) {

        console.error(
            "Admin dashboard error:",
            error
        );


        showError(
            "Unable to load admin dashboard. Make sure Django is running."
        );

    }

}


// =========================================================
// SUMMARY
// =========================================================

function renderSummary(data) {

    const summary =
        data.summary || {};


    const totalStudents =
        Number(
            summary.total_students || 0
        );


    const totalSubjects =
        Number(
            summary.total_subjects || 0
        );


    const totalRecords =
        Number(
            summary.total_attendance_records || 0
        );


    const present =
        Number(
            summary.present_records || 0
        );


    const absent =
        Number(
            summary.absent_records || 0
        );


    const overall =
        Number(
            summary.overall_attendance_percentage || 0
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
        "totalRecords",
        totalRecords
    );


    setText(
        "overallAttendance",
        percentage(overall)
    );


    setText(
        "overviewPercentage",
        percentage(overall)
    );


    setText(
        "presentRecords",
        present
    );


    setText(
        "absentRecords",
        absent
    );


    setText(
        "overviewRecords",
        totalRecords
    );


    const progress =
        document.getElementById(
            "attendanceProgress"
        );


    if (progress) {

        progress.style.width =
            `${safePercentage(overall)}%`;

    }

}


// =========================================================
// RISK
// =========================================================

function renderRisk(summary) {

    setText(
        "safeStudents",
        Number(
            summary.safe_students || 0
        )
    );


    setText(
        "warningStudents",
        Number(
            summary.warning_students || 0
        )
    );


    setText(
        "criticalStudents",
        Number(
            summary.critical_students || 0
        )
    );


    setText(
        "noDataStudents",
        Number(
            summary.no_data_students || 0
        )
    );

}


// =========================================================
// SUBJECTS
// =========================================================

function renderSubjects(subjects) {

    const container =
        document.getElementById(
            "subjectList"
        );


    if (!container) {
        return;
    }


    if (!subjects.length) {

        container.innerHTML = `
            <div class="admin-empty">
                No subject attendance data available.
            </div>
        `;

        return;

    }


    container.innerHTML =
        subjects.map(
            function(subject) {

                const value =
                    safePercentage(
                        subject.attendance_percentage
                    );


                return `

                    <div class="admin-subject-item">

                        <div class="admin-subject-header">

                            <div>

                                <strong>
                                    ${escapeHTML(
                                        subject.subject_name ||
                                        "Subject"
                                    )}
                                </strong>

                                <span>
                                    ${escapeHTML(
                                        subject.subject_code ||
                                        "-"
                                    )}
                                </span>

                            </div>

                            <strong>
                                ${percentage(value)}
                            </strong>

                        </div>


                        <div class="admin-subject-progress">

                            <div
                                style="width:${value}%">
                            </div>

                        </div>


                        <div class="admin-subject-meta">

                            <span>
                                Present:
                                ${Number(
                                    subject.present_classes || 0
                                )}
                            </span>

                            <span>
                                Absent:
                                ${Number(
                                    subject.absent_classes || 0
                                )}
                            </span>

                            <span>
                                Total:
                                ${Number(
                                    subject.total_classes || 0
                                )}
                            </span>

                        </div>

                    </div>

                `;

            }
        )
        .join("");

}


// =========================================================
// SHORTAGE STUDENTS
// =========================================================

function renderShortage(students) {

    const tbody =
        document.getElementById(
            "shortageBody"
        );


    setText(
        "shortageCount",
        `${students.length} Student${students.length === 1 ? "" : "s"}`
    );


    if (!tbody) {
        return;
    }


    if (!students.length) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="admin-table-empty">

                    No students currently have
                    attendance shortage.

                </td>

            </tr>

        `;

        return;

    }


    tbody.innerHTML =
        students.map(
            function(student, index) {

                const attendance =
                    safePercentage(
                        student.attendance_percentage
                    );


                return `

                    <tr>

                        <td>
                            ${index + 1}
                        </td>


                        <td>

                            <div class="admin-student">

                                <div class="admin-mini-avatar">

                                    ${escapeHTML(
                                        (
                                            student.student_name ||
                                            "S"
                                        )
                                        .charAt(0)
                                        .toUpperCase()
                                    )}

                                </div>

                                <div>

                                    <strong>
                                        ${escapeHTML(
                                            student.student_name ||
                                            "Student"
                                        )}
                                    </strong>

                                </div>

                            </div>

                        </td>


                        <td>
                            ${escapeHTML(
                                student.usn || "-"
                            )}
                        </td>


                        <td>

                            <div class="admin-table-attendance">

                                <div class="admin-table-progress">

                                    <div
                                        style="width:${attendance}%">
                                    </div>

                                </div>

                                <strong>
                                    ${percentage(attendance)}
                                </strong>

                            </div>

                        </td>


                        <td class="admin-present">
                            ${Number(
                                student.present || 0
                            )}
                        </td>


                        <td class="admin-absent">
                            ${Number(
                                student.absent || 0
                            )}
                        </td>


                        <td>

                            <span class="admin-needed">

                                ${Number(
                                    student.classes_needed || 0
                                )}
                                classes

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

function showError(message) {

    const subject =
        document.getElementById(
            "subjectList"
        );


    if (subject) {

        subject.innerHTML = `

            <div class="admin-error">
                ${escapeHTML(message)}
            </div>

        `;

    }


    const shortage =
        document.getElementById(
            "shortageBody"
        );


    if (shortage) {

        shortage.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="admin-table-empty">

                    ${escapeHTML(message)}

                </td>

            </tr>

        `;

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

}


// =========================================================
// START
// =========================================================

loadDashboard();
