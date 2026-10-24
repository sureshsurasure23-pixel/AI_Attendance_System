
// ============================================================
// ADMIN FACULTY MANAGEMENT
// AI ATTENDANCE MONITORING SYSTEM
// ============================================================

const API_BASE_URL = "http://127.0.0.1:8000";


// ============================================================
// BASIC HELPERS
// ============================================================

function getToken() {
    return localStorage.getItem("access_token");
}


function escapeHTML(value) {

    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;
}


async function apiRequest(endpoint, options = {}) {

    const token = getToken();

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };


    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }


    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers
        }
    );


    if (response.status === 401) {

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        window.location.href = "../login.html";

        throw new Error("Authentication required.");

    }


    if (!response.ok) {

        const errorText =
            await response.text();

        throw new Error(
            `API ${response.status}: ${errorText}`
        );

    }


    return await response.json();
}


// ============================================================
// FACULTY DATA HELPERS
// ============================================================

function getFacultyName(faculty) {

    return (
        faculty.name ||
        faculty.full_name ||
        faculty.faculty_name ||
        faculty.user_name ||
        faculty.username ||
        "Faculty"
    );
}


function getFacultyId(faculty) {

    return (
        faculty.faculty_id ||
        faculty.faculty_code ||
        faculty.employee_id ||
        faculty.staff_id ||
        faculty.code ||
        faculty.id ||
        "-"
    );
}


function getEmail(faculty) {

    return (
        faculty.email ||
        faculty.user_email ||
        faculty.email_address ||
        "-"
    );
}


function getPhone(faculty) {

    return (
        faculty.phone ||
        faculty.mobile ||
        faculty.phone_number ||
        "-"
    );
}


function getDepartment(faculty) {

    if (typeof faculty.department === "object" &&
        faculty.department !== null) {

        return (
            faculty.department.name ||
            faculty.department.department_name ||
            faculty.department.title ||
            "-"
        );
    }


    return (
        faculty.department_name ||
        faculty.department ||
        "-"
    );
}


function getDesignation(faculty) {

    return (
        faculty.designation ||
        faculty.position ||
        faculty.role_name ||
        faculty.title ||
        "-"
    );
}


function getQualification(faculty) {

    return (
        faculty.qualification ||
        faculty.education ||
        faculty.degree ||
        faculty.highest_qualification ||
        "-"
    );
}


function getSubjects(faculty) {

    if (Array.isArray(faculty.subjects)) {

        return faculty.subjects
            .map(subject => {

                if (typeof subject === "object") {

                    return (
                        subject.name ||
                        subject.subject_name ||
                        subject.title ||
                        ""
                    );
                }

                return String(subject);

            })
            .filter(Boolean)
            .join(", ");

    }


    if (typeof faculty.subjects === "string") {
        return faculty.subjects;
    }


    if (faculty.subject_name) {
        return faculty.subject_name;
    }


    return "-";
}


function getStatus(faculty) {

    if (
        faculty.is_active === false ||
        faculty.active === false ||
        faculty.status === "INACTIVE"
    ) {

        return "INACTIVE";

    }


    return "ACTIVE";
}


function getJoinedDate(faculty) {

    const rawDate =
        faculty.joined_date ||
        faculty.date_joined ||
        faculty.created_at ||
        faculty.created ||
        null;


    if (!rawDate) {
        return "-";
    }


    const date =
        new Date(rawDate);


    if (Number.isNaN(date.getTime())) {
        return String(rawDate);
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


function getAddress(faculty) {

    return (
        faculty.address ||
        faculty.location ||
        "-"
    );
}


// ============================================================
// NORMALIZE API RESPONSE
// ============================================================

function normalizeFacultyResponse(data) {

    if (Array.isArray(data)) {
        return data;
    }


    if (Array.isArray(data.results)) {
        return data.results;
    }


    if (Array.isArray(data.faculty)) {
        return data.faculty;
    }


    if (Array.isArray(data.faculties)) {
        return data.faculties;
    }


    if (Array.isArray(data.data)) {
        return data.data;
    }


    return [];
}


// ============================================================
// GLOBAL DATA
// ============================================================

let allFaculty = [];


// ============================================================
// LOAD FACULTY
// ============================================================

async function loadFaculty() {

    const tableBody =
        document.getElementById(
            "facultyTableBody"
        );


    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = `
        <tr>
            <td colspan="8" class="table-empty">
                Loading faculty...
            </td>
        </tr>
    `;


    try {

       console.log(
    "👨‍🏫 Loading faculty from:",
    `${API_BASE_URL}/faculty/list/`
);


        const data =
    await apiRequest("/faculty/list/");


        console.log(
            "👨‍🏫 Faculty API response:",
            data
        );


        allFaculty =
            normalizeFacultyResponse(data);


        console.log(
            "👨‍🏫 Faculty records:",
            allFaculty
        );


        updateSummaryCards();

        populateDepartmentFilter();

        renderFacultyTable();


    } catch (error) {

        console.error(
            "❌ Faculty API error:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="table-empty">

                    <strong>
                        Unable to load faculty
                    </strong>

                    <br><br>

                    ${escapeHTML(error.message)}

                </td>
            </tr>
        `;

    }

}


// ============================================================
// SUMMARY CARDS
// ============================================================

function updateSummaryCards() {

    const total =
        allFaculty.length;


    const active =
        allFaculty.filter(
            faculty =>
                getStatus(faculty) === "ACTIVE"
        ).length;


    const departments =
        new Set(
            allFaculty
                .map(getDepartment)
                .filter(
                    value =>
                        value &&
                        value !== "-"
                )
        ).size;


    const subjects =
        new Set(
            allFaculty
                .flatMap(faculty => {

                    const value =
                        getSubjects(faculty);


                    if (
                        !value ||
                        value === "-"
                    ) {
                        return [];
                    }


                    return value
                        .split(",")
                        .map(item => item.trim())
                        .filter(Boolean);

                })
        ).size;


    const totalElement =
        document.getElementById(
            "totalFaculty"
        );


    const activeElement =
        document.getElementById(
            "activeFaculty"
        );


    const departmentElement =
        document.getElementById(
            "totalDepartments"
        );


    const subjectElement =
        document.getElementById(
            "totalSubjects"
        );


    if (totalElement) {
        totalElement.textContent =
            total;
    }


    if (activeElement) {
        activeElement.textContent =
            active;
    }


    if (departmentElement) {
        departmentElement.textContent =
            departments;
    }


    if (subjectElement) {
        subjectElement.textContent =
            subjects;
    }

}


// ============================================================
// DEPARTMENT FILTER
// ============================================================

function populateDepartmentFilter() {

    const select =
        document.getElementById(
            "departmentFilter"
        );


    if (!select) {
        return;
    }


    const departments =
        [
            ...new Set(
                allFaculty
                    .map(getDepartment)
                    .filter(
                        department =>
                            department &&
                            department !== "-"
                    )
            )
        ]
        .sort();


    select.innerHTML = `
        <option value="">
            All Departments
        </option>
    `;


    departments.forEach(
        department => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                department;


            option.textContent =
                department;


            select.appendChild(
                option
            );

        }
    );

}


// ============================================================
// FILTER FACULTY
// ============================================================

function getFilteredFaculty() {

    const searchInput =
        document.getElementById(
            "facultySearch"
        );


    const departmentSelect =
        document.getElementById(
            "departmentFilter"
        );


    const statusSelect =
        document.getElementById(
            "statusFilter"
        );


    const search =
        (
            searchInput?.value ||
            ""
        )
        .trim()
        .toLowerCase();


    const department =
        departmentSelect?.value ||
        "";


    const status =
        statusSelect?.value ||
        "";


    return allFaculty.filter(
        faculty => {

            const name =
                getFacultyName(
                    faculty
                )
                .toLowerCase();


            const facultyId =
                String(
                    getFacultyId(
                        faculty
                    )
                )
                .toLowerCase();


            const email =
                getEmail(
                    faculty
                )
                .toLowerCase();


            const facultyDepartment =
                getDepartment(
                    faculty
                );


            const facultyStatus =
                getStatus(
                    faculty
                );


            const matchesSearch =
                !search ||
                name.includes(search) ||
                facultyId.includes(search) ||
                email.includes(search);


            const matchesDepartment =
                !department ||
                facultyDepartment === department;


            const matchesStatus =
                !status ||
                facultyStatus === status;


            return (
                matchesSearch &&
                matchesDepartment &&
                matchesStatus
            );

        }
    );

}


// ============================================================
// RENDER FACULTY TABLE
// ============================================================

function renderFacultyTable() {

    const tableBody =
        document.getElementById(
            "facultyTableBody"
        );


    const countElement =
        document.getElementById(
            "filteredFacultyCount"
        );


    if (!tableBody) {
        return;
    }


    const facultyList =
        getFilteredFaculty();


    if (countElement) {

        countElement.textContent =
            facultyList.length;

    }


    if (facultyList.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="table-empty">

                    No faculty members found.

                </td>
            </tr>
        `;

        return;
    }


    tableBody.innerHTML =
        facultyList
            .map(
                (faculty, index) => {

                    const name =
                        getFacultyName(
                            faculty
                        );


                    const facultyId =
                        getFacultyId(
                            faculty
                        );


                    const email =
                        getEmail(
                            faculty
                        );


                    const department =
                        getDepartment(
                            faculty
                        );


                    const designation =
                        getDesignation(
                            faculty
                        );


                    const status =
                        getStatus(
                            faculty
                        );


                    const initials =
                        name
                            .trim()
                            .charAt(0)
                            .toUpperCase();


                    const statusClass =
                        status
                            .toLowerCase();


                    return `

                        <tr>

                            <td>
                                ${index + 1}
                            </td>


                            <td>

                                <div class="student-table-name">

                                    <div class="student-table-avatar">
                                        ${escapeHTML(initials)}
                                    </div>

                                    <div>

                                        <strong>
                                            ${escapeHTML(name)}
                                        </strong>

                                    </div>

                                </div>

                            </td>


                            <td>
                                ${escapeHTML(
                                    String(facultyId)
                                )}
                            </td>


                            <td>
                                ${escapeHTML(email)}
                            </td>


                            <td>
                                ${escapeHTML(
                                    String(department)
                                )}
                            </td>


                            <td>
                                ${escapeHTML(
                                    String(designation)
                                )}
                            </td>


                            <td>

                                <span
                                    class="admin-section-badge ${statusClass}">

                                    ${escapeHTML(status)}

                                </span>

                            </td>


                            <td>

                                <button
                                    type="button"
                                    class="student-view-btn"
                                    data-faculty-index="${allFaculty.indexOf(faculty)}">

                                    View

                                </button>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


// ============================================================
// FACULTY MODAL
// ============================================================

function openFacultyModal(faculty) {

    const modal =
        document.getElementById(
            "facultyModal"
        );


    if (!modal) {
        return;
    }


    const name =
        getFacultyName(
            faculty
        );


    const facultyId =
        getFacultyId(
            faculty
        );


    const setText =
        (id, value) => {

            const element =
                document.getElementById(id);


            if (element) {

                element.textContent =
                    value ?? "-";

            }

        };


    setText(
        "modalFacultyName",
        name
    );


    setText(
        "modalFacultyId",
        facultyId
    );


    setText(
        "modalFacultyCode",
        facultyId
    );


    setText(
        "modalFacultyEmail",
        getEmail(faculty)
    );


    setText(
        "modalFacultyPhone",
        getPhone(faculty)
    );


    setText(
        "modalFacultyDepartment",
        getDepartment(faculty)
    );


    setText(
        "modalFacultyDesignation",
        getDesignation(faculty)
    );


    setText(
        "modalFacultyQualification",
        getQualification(faculty)
    );


    setText(
        "modalFacultySubjects",
        getSubjects(faculty)
    );


    setText(
        "modalFacultyStatus",
        getStatus(faculty)
    );


    setText(
        "modalFacultyJoined",
        getJoinedDate(faculty)
    );


    setText(
        "modalFacultyAddress",
        getAddress(faculty)
    );


    const avatar =
        document.getElementById(
            "modalFacultyAvatar"
        );


    if (avatar) {

        avatar.textContent =
            name
                .trim()
                .charAt(0)
                .toUpperCase() ||
            "F";

    }


    modal.hidden = false;

    document.body.style.overflow =
        "hidden";

}


// ============================================================
// CLOSE MODAL
// ============================================================

function closeFacultyModal() {

    const modal =
        document.getElementById(
            "facultyModal"
        );


    if (!modal) {
        return;
    }


    modal.hidden = true;

    document.body.style.overflow =
        "";

}


// ============================================================
// EVENT LISTENERS
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {


        // ----------------------------------------------------
        // INITIAL LOAD
        // ----------------------------------------------------

        loadFaculty();


        // ----------------------------------------------------
        // SEARCH
        // ----------------------------------------------------

        const searchInput =
            document.getElementById(
                "facultySearch"
            );


        if (searchInput) {

            searchInput.addEventListener(
                "input",
                renderFacultyTable
            );

        }


        // ----------------------------------------------------
        // DEPARTMENT FILTER
        // ----------------------------------------------------

        const departmentFilter =
            document.getElementById(
                "departmentFilter"
            );


        if (departmentFilter) {

            departmentFilter.addEventListener(
                "change",
                renderFacultyTable
            );

        }


        // ----------------------------------------------------
        // STATUS FILTER
        // ----------------------------------------------------

        const statusFilter =
            document.getElementById(
                "statusFilter"
            );


        if (statusFilter) {

            statusFilter.addEventListener(
                "change",
                renderFacultyTable
            );

        }


        // ----------------------------------------------------
        // REFRESH
        // ----------------------------------------------------

        const refreshButton =
            document.getElementById(
                "refreshFacultyBtn"
            );


        if (refreshButton) {

            refreshButton.addEventListener(
                "click",
                loadFaculty
            );

        }


        // ----------------------------------------------------
        // VIEW BUTTONS
        // ----------------------------------------------------

        const tableBody =
            document.getElementById(
                "facultyTableBody"
            );


        if (tableBody) {

            tableBody.addEventListener(
                "click",
                function (event) {

                    const button =
                        event.target.closest(
                            "[data-faculty-index]"
                        );


                    if (!button) {
                        return;
                    }


                    const index =
                        Number(
                            button.dataset
                                .facultyIndex
                        );


                    const faculty =
                        allFaculty[index];


                    if (faculty) {

                        openFacultyModal(
                            faculty
                        );

                    }

                }
            );

        }


        // ----------------------------------------------------
        // CLOSE MODAL BUTTON
        // ----------------------------------------------------

        const closeButton =
            document.getElementById(
                "closeFacultyModal"
            );


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                closeFacultyModal
            );

        }


        // ----------------------------------------------------
        // CLICK OUTSIDE MODAL
        // ----------------------------------------------------

        const modal =
            document.getElementById(
                "facultyModal"
            );


        if (modal) {

            modal.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target === modal
                    ) {

                        closeFacultyModal();

                    }

                }
            );

        }


        // ----------------------------------------------------
        // ESC KEY
        // ----------------------------------------------------

        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Escape"
                ) {

                    closeFacultyModal();

                }

            }
        );


        // ----------------------------------------------------
        // LOGOUT
        // ----------------------------------------------------

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

                    window.location.href =
                        "../login.html";

                }
            );

        }

    }
);