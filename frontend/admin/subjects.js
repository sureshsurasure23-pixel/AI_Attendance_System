
// =========================================================
// SUBJECTS MANAGEMENT - ADMIN
// =========================================================

const API_BASE_URL = "http://127.0.0.1:8000";

let allSubjects = [];
let filteredSubjects = [];

let departments = [];
let facultyMembers = [];

let editingSubjectId = null;


// =========================================================
// PAGE LOAD
// =========================================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("📚 subjects.js loaded successfully.");
    console.log("📚 Subjects page loaded.");

    setupEventListeners();

    loadSubjects();
    loadDepartments();
    loadFaculty();

});


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
// AUTH HEADERS
// =========================================================

function getAuthHeaders(includeJSON = false) {

    const token = getAccessToken();

    const headers = {};

    if (token) {

        headers["Authorization"] =
            `Bearer ${token}`;

    }

    if (includeJSON) {

        headers["Content-Type"] =
            "application/json";

    }

    return headers;
}


// =========================================================
// EVENT LISTENERS
// =========================================================

function setupEventListeners() {

    const addButton =
        document.getElementById("addSubjectBtn");

    const refreshButton =
        document.getElementById("refreshSubjectsBtn");

    const searchInput =
        document.getElementById("subjectSearch");

    const semesterFilter =
        document.getElementById("semesterFilter");

    const departmentFilter =
        document.getElementById("departmentFilter");

    const facultyFilter =
        document.getElementById("facultyFilter");

    const subjectForm =
        document.getElementById("subjectForm");

    const closeButton =
        document.getElementById("closeSubjectModal");

    const cancelButton =
        document.getElementById("cancelSubjectBtn");

    const logoutButton =
        document.getElementById("logoutBtn");


    if (addButton) {

        addButton.addEventListener(
            "click",
            function () {

                openAddSubjectModal();

            }
        );

    }


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            function () {

                loadSubjects();

            }
        );

    }


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            applyFilters
        );

    }


    if (semesterFilter) {

        semesterFilter.addEventListener(
            "change",
            applyFilters
        );

    }


    if (departmentFilter) {

        departmentFilter.addEventListener(
            "change",
            applyFilters
        );

    }


    if (facultyFilter) {

        facultyFilter.addEventListener(
            "change",
            applyFilters
        );

    }


    if (subjectForm) {

        subjectForm.addEventListener(
            "submit",
            handleSubjectSubmit
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeSubjectModal
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeSubjectModal
        );

    }


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            handleLogout
        );

    }


    const modal =
        document.getElementById("subjectModal");

    if (modal) {

        modal.addEventListener(
            "click",
            function (event) {

                if (event.target === modal) {

                    closeSubjectModal();

                }

            }
        );

    }

}


// =========================================================
// LOAD SUBJECTS
// =========================================================

async function loadSubjects() {

    console.log(
        "📚 Loading subjects from:",
        `${API_BASE_URL}/subjects/list/`
    );


    const tableBody =
        document.getElementById("subjectsTableBody");


    if (tableBody) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    style="text-align:center;"
                >
                    Loading subjects...
                </td>

            </tr>

        `;

    }


    try {

        const token =
            getAccessToken();


        if (!token) {

            console.warn(
                "⚠️ No access token found."
            );

            showTableMessage(
                "Authentication token not found.",
                "error"
            );

            return;

        }


        const response =
            await fetch(
                `${API_BASE_URL}/subjects/list/`,
                {
                    method: "GET",
                    headers: getAuthHeaders()
                }
            );


        console.log(
            "📚 Subject API status:",
            response.status
        );


        const data =
            await parseJSONResponse(response);


        console.log(
            "📚 Subject API response:",
            data
        );


        if (!response.ok) {

            throw new Error(
                getAPIErrorMessage(
                    data,
                    `Failed to load subjects. Status: ${response.status}`
                )
            );

        }


        allSubjects =
            normalizeArray(data);


        console.log(
            "📚 Subject records:",
            allSubjects
        );


        filteredSubjects =
            [...allSubjects];


        populateSemesterFilter();
        populateDepartmentFilter();
        populateFacultyFilter();

        updateSummaryCards();

        applyFilters();


    }
    catch (error) {

        console.error(
            "❌ Error loading subjects:",
            error
        );


        showTableMessage(
            error.message ||
            "Unable to load subjects.",
            "error"
        );

    }

}


// =========================================================
// LOAD DEPARTMENTS
// =========================================================

async function loadDepartments() {

    console.log(
        "🏢 Loading departments..."
    );


    try {

        const possibleEndpoints = [

            `${API_BASE_URL}/departments/list/`,
            `${API_BASE_URL}/department/list/`

        ];


        let response = null;
        let data = null;


        for (
            const endpoint of possibleEndpoints
        ) {

            try {

                response =
                    await fetch(
                        endpoint,
                        {
                            method: "GET",
                            headers: getAuthHeaders()
                        }
                    );


                if (response.ok) {

                    data =
                        await parseJSONResponse(
                            response
                        );

                    break;

                }

            }
            catch (error) {

                console.warn(
                    "⚠️ Department endpoint failed:",
                    endpoint
                );

            }

        }


        if (
            !response ||
            !response.ok
        ) {

            console.warn(
                "⚠️ Department API could not be loaded."
            );

            return;

        }


        departments =
            normalizeArray(data);


        console.log(
            "🏢 Departments:",
            departments
        );


        populateDepartmentOptions();

        populateDepartmentFilter();


    }
    catch (error) {

        console.error(
            "❌ Error loading departments:",
            error
        );

    }

}


// =========================================================
// LOAD FACULTY
// =========================================================

async function loadFaculty() {

    console.log(
        "👨‍🏫 Loading faculty..."
    );


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/faculty/list/`,
                {
                    method: "GET",
                    headers: getAuthHeaders()
                }
            );


        console.log(
            "👨‍🏫 Faculty API status:",
            response.status
        );


        const data =
            await parseJSONResponse(response);


        if (!response.ok) {

            console.warn(
                "⚠️ Faculty API response:",
                data
            );

            return;

        }


        facultyMembers =
            normalizeArray(data);


        console.log(
            "👨‍🏫 Faculty records:",
            facultyMembers
        );


        populateFacultyOptions();

        populateFacultyFilter();


    }
    catch (error) {

        console.error(
            "❌ Error loading faculty:",
            error
        );

    }

}


// =========================================================
// NORMALIZE ARRAY
// =========================================================

function normalizeArray(data) {

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
        Array.isArray(data.data)
    ) {

        return data.data;

    }


    if (
        data &&
        Array.isArray(data.subjects)
    ) {

        return data.subjects;

    }


    return [];

}


// =========================================================
// PARSE JSON RESPONSE
// =========================================================

async function parseJSONResponse(response) {

    const text =
        await response.text();


    if (!text) {

        return {};

    }


    try {

        return JSON.parse(text);

    }
    catch {

        return {
            raw: text
        };

    }

}


// =========================================================
// API ERROR MESSAGE
// =========================================================

function getAPIErrorMessage(
    data,
    fallback
) {

    if (!data) {

        return fallback;

    }


    if (typeof data === "string") {

        return data;

    }


    if (data.detail) {

        return data.detail;

    }


    if (data.message) {

        return data.message;

    }


    if (data.error) {

        return data.error;

    }


    const keys =
        Object.keys(data);


    if (keys.length > 0) {

        const firstKey =
            keys[0];


        const value =
            data[firstKey];


        if (Array.isArray(value)) {

            return `${firstKey}: ${value.join(", ")}`;

        }


        if (typeof value === "string") {

            return `${firstKey}: ${value}`;

        }

    }


    return fallback;

}


// =========================================================
// GET DEPARTMENT NAME
// =========================================================

function getDepartmentName(subject) {

    if (
        subject.department_name
    ) {

        return subject.department_name;

    }


    if (
        subject.department &&
        typeof subject.department === "object"
    ) {

        return (
            subject.department.name ||
            subject.department.department_name ||
            subject.department.code ||
            `Department ${subject.department.id || ""}`
        );

    }


    const departmentId =
        subject.department;


    const department =
        departments.find(
            function (item) {

                return String(
                    item.id
                ) === String(
                    departmentId
                );

            }
        );


    if (department) {

        return (
            department.name ||
            department.department_name ||
            department.code ||
            `Department ${department.id}`
        );

    }


    return "Not assigned";

}


// =========================================================
// GET FACULTY NAME
// =========================================================

function getFacultyName(subject) {

    if (
        subject.faculty_name
    ) {

        return subject.faculty_name;

    }


    if (
        subject.faculty &&
        typeof subject.faculty === "object"
    ) {

        return (
            subject.faculty.name ||
            subject.faculty.full_name ||
            subject.faculty.faculty_name ||
            subject.faculty.username ||
            `Faculty ${subject.faculty.id || ""}`
        );

    }


    const facultyId =
        subject.faculty;


    if (
        facultyId === null ||
        facultyId === undefined ||
        facultyId === ""
    ) {

        return "Not assigned";

    }


    const faculty =
        facultyMembers.find(
            function (item) {

                return String(
                    item.id
                ) === String(
                    facultyId
                );

            }
        );


    if (faculty) {

        return (
            faculty.name ||
            faculty.full_name ||
            faculty.faculty_name ||
            faculty.username ||
            `Faculty ${faculty.id}`
        );

    }


    return "Not assigned";

}


// =========================================================
// GET SUBJECT NAME
// =========================================================

function getSubjectName(subject) {

    return (
        subject.name ||
        subject.subject_name ||
        "Unnamed Subject"
    );

}


// =========================================================
// POPULATE DEPARTMENT OPTIONS
// =========================================================

function populateDepartmentOptions() {

    const select =
        document.getElementById(
            "subjectDepartment"
        );


    if (!select) {

        return;

    }


    select.innerHTML = `

        <option value="">
            Select Department
        </option>

    `;


    departments.forEach(
        function (department) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                department.id;


            option.textContent =
                department.name ||
                department.department_name ||
                department.code ||
                `Department ${department.id}`;


            select.appendChild(option);

        }
    );

}


// =========================================================
// POPULATE FACULTY OPTIONS
// =========================================================

function populateFacultyOptions() {

    const select =
        document.getElementById(
            "subjectFaculty"
        );


    if (!select) {

        return;

    }


    select.innerHTML = `

        <option value="">
            Select Faculty
        </option>

    `;


    facultyMembers.forEach(
        function (faculty) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                faculty.id;


            option.textContent =
                faculty.name ||
                faculty.full_name ||
                faculty.faculty_name ||
                faculty.username ||
                `Faculty ${faculty.id}`;


            select.appendChild(option);

        }
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
                allSubjects
                    .map(
                        subject =>
                            subject.semester
                    )
                    .filter(
                        value =>
                            value !== null &&
                            value !== undefined &&
                            value !== ""
                    )
            )
        ]
        .sort(
            function (a, b) {

                return Number(a) -
                    Number(b);

            }
        );


    select.innerHTML = `

        <option value="">
            All Semesters
        </option>

    `;


    semesters.forEach(
        function (semester) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                semester;


            option.textContent =
                `Semester ${semester}`;


            select.appendChild(option);

        }
    );

}


// =========================================================
// POPULATE DEPARTMENT FILTER
// =========================================================

function populateDepartmentFilter() {

    const select =
        document.getElementById(
            "departmentFilter"
        );


    if (!select) {

        return;

    }


    select.innerHTML = `

        <option value="">
            All Departments
        </option>

    `;


    const usedDepartments = [];


    allSubjects.forEach(
        function (subject) {

            const id =
                subject.department &&
                typeof subject.department === "object"
                    ? subject.department.id
                    : subject.department;


            if (
                id !== null &&
                id !== undefined &&
                id !== ""
            ) {

                if (
                    !usedDepartments.includes(
                        String(id)
                    )
                ) {

                    usedDepartments.push(
                        String(id)
                    );

                }

            }

        }
    );


    usedDepartments.forEach(
        function (id) {

            const department =
                departments.find(
                    function (item) {

                        return String(
                            item.id
                        ) === String(id);

                    }
                );


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                id;


            option.textContent =
                department
                    ? (
                        department.name ||
                        department.department_name ||
                        department.code
                    )
                    : `Department ${id}`;


            select.appendChild(option);

        }
    );

}


// =========================================================
// POPULATE FACULTY FILTER
// =========================================================

function populateFacultyFilter() {

    const select =
        document.getElementById(
            "facultyFilter"
        );


    if (!select) {

        return;

    }


    select.innerHTML = `

        <option value="">
            All Faculty
        </option>

    `;


    const usedFaculty = [];


    allSubjects.forEach(
        function (subject) {

            const id =
                subject.faculty &&
                typeof subject.faculty === "object"
                    ? subject.faculty.id
                    : subject.faculty;


            if (
                id !== null &&
                id !== undefined &&
                id !== ""
            ) {

                if (
                    !usedFaculty.includes(
                        String(id)
                    )
                ) {

                    usedFaculty.push(
                        String(id)
                    );

                }

            }

        }
    );


    usedFaculty.forEach(
        function (id) {

            const faculty =
                facultyMembers.find(
                    function (item) {

                        return String(
                            item.id
                        ) === String(id);

                    }
                );


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                id;


            option.textContent =
                faculty
                    ? (
                        faculty.name ||
                        faculty.full_name ||
                        faculty.faculty_name ||
                        faculty.username
                    )
                    : `Faculty ${id}`;


            select.appendChild(option);

        }
    );

}


// =========================================================
// APPLY FILTERS
// =========================================================

function applyFilters() {

    const searchInput =
        document.getElementById(
            "subjectSearch"
        );


    const semesterFilter =
        document.getElementById(
            "semesterFilter"
        );


    const departmentFilter =
        document.getElementById(
            "departmentFilter"
        );


    const facultyFilter =
        document.getElementById(
            "facultyFilter"
        );


    const search =
        (
            searchInput
                ? searchInput.value
                : ""
        )
        .trim()
        .toLowerCase();


    const semester =
        semesterFilter
            ? semesterFilter.value
            : "";


    const department =
        departmentFilter
            ? departmentFilter.value
            : "";


    const faculty =
        facultyFilter
            ? facultyFilter.value
            : "";


    filteredSubjects =
        allSubjects.filter(
            function (subject) {

                const subjectId =
                    String(
                        subject.subject_id || ""
                    )
                    .toLowerCase();


                const subjectCode =
                    String(
                        subject.subject_code || ""
                    )
                    .toLowerCase();


                const subjectName =
                    getSubjectName(
                        subject
                    )
                    .toLowerCase();


                const departmentName =
                    getDepartmentName(
                        subject
                    )
                    .toLowerCase();


                const facultyName =
                    getFacultyName(
                        subject
                    )
                    .toLowerCase();


                const matchesSearch =
                    !search ||
                    subjectId.includes(search) ||
                    subjectCode.includes(search) ||
                    subjectName.includes(search) ||
                    departmentName.includes(search) ||
                    facultyName.includes(search);


                const matchesSemester =
                    !semester ||
                    String(
                        subject.semester
                    ) === String(
                        semester
                    );


                const subjectDepartment =
                    subject.department &&
                    typeof subject.department === "object"
                        ? subject.department.id
                        : subject.department;


                const matchesDepartment =
                    !department ||
                    String(
                        subjectDepartment
                    ) === String(
                        department
                    );


                const subjectFaculty =
                    subject.faculty &&
                    typeof subject.faculty === "object"
                        ? subject.faculty.id
                        : subject.faculty;


                const matchesFaculty =
                    !faculty ||
                    String(
                        subjectFaculty
                    ) === String(
                        faculty
                    );


                return (
                    matchesSearch &&
                    matchesSemester &&
                    matchesDepartment &&
                    matchesFaculty
                );

            }
        );


    renderSubjects();

}


// =========================================================
// RENDER SUBJECT TABLE
// =========================================================

function renderSubjects() {

    const tableBody =
        document.getElementById(
            "subjectsTableBody"
        );


    if (!tableBody) {

        console.warn(
            "⚠️ subjectsTableBody not found."
        );

        return;

    }


    if (
        filteredSubjects.length === 0
    ) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    style="
                        text-align:center;
                        padding:30px;
                    "
                >
                    No subject records found.
                </td>

            </tr>

        `;


        updateRecordCount(0);

        return;

    }


    let html = "";


    filteredSubjects.forEach(
        function (subject) {

            const departmentName =
                getDepartmentName(
                    subject
                );


            const facultyName =
                getFacultyName(
                    subject
                );


            const credits =
                subject.credits ??
                0;


            const semester =
                subject.semester ??
                "-";


            html += `

                <tr>

                    <td>

                        <strong>
                            ${escapeHTML(
                                String(
                                    subject.subject_id ||
                                    "-"
                                )
                            )}
                        </strong>

                    </td>


                    <td>

                        <span
                            class="admin-section-badge"
                        >
                            ${escapeHTML(
                                String(
                                    subject.subject_code ||
                                    "-"
                                )
                            )}
                        </span>

                    </td>


                    <td>

                        <strong>
                            ${escapeHTML(
                                String(
                                    getSubjectName(
                                        subject
                                    )
                                )
                            )}
                        </strong>

                    </td>


                    <td>
                        ${escapeHTML(
                            String(credits)
                        )}
                    </td>


                    <td>
                        Semester
                        ${escapeHTML(
                            String(semester)
                        )}
                    </td>


                    <td>
                        ${escapeHTML(
                            String(
                                departmentName
                            )
                        )}
                    </td>


                    <td>

                        ${facultyName === "Not assigned"
                            ? `
                                <span class="admin-section-badge">
                                    Not Assigned
                                </span>
                              `
                            : escapeHTML(
                                String(
                                    facultyName
                                )
                            )
                        }

                    </td>


                    <td>

                        <div
                            style="
                                display:flex;
                                gap:8px;
                                flex-wrap:wrap;
                            "
                        >

                            <button
                                type="button"
                                class="admin-secondary-btn"
                                onclick="editSubject(${Number(subject.id)})"
                            >
                                ✏️ Edit
                            </button>


                            <button
                                type="button"
                                class="admin-logout-btn"
                                style="
                                    color:#dc2626;
                                    border:none;
                                    background:#fee2e2;
                                "
                                onclick="deleteSubject(${Number(subject.id)})"
                            >
                                🗑️ Delete
                            </button>

                        </div>

                    </td>

                </tr>

            `;

        }
    );


    tableBody.innerHTML =
        html;


    updateRecordCount(
        filteredSubjects.length
    );

}


// =========================================================
// UPDATE RECORD COUNT
// =========================================================

function updateRecordCount(count) {

    const element =
        document.getElementById(
            "subjectRecordCount"
        );


    if (element) {

        element.textContent =
            `${count} ${
                count === 1
                    ? "record"
                    : "records"
            }`;

    }

}


// =========================================================
// SUMMARY CARDS
// =========================================================

function updateSummaryCards() {

    const totalSubjects =
        document.getElementById(
            "totalSubjects"
        );


    const totalSemesters =
        document.getElementById(
            "totalSemesters"
        );


    const totalDepartments =
        document.getElementById(
            "totalDepartments"
        );


    const assignedFaculty =
        document.getElementById(
            "assignedFaculty"
        );


    const semesters =
        new Set();


    const departmentIds =
        new Set();


    const facultyIds =
        new Set();


    allSubjects.forEach(
        function (subject) {

            if (
                subject.semester !==
                null &&
                subject.semester !==
                undefined &&
                subject.semester !== ""
            ) {

                semesters.add(
                    String(
                        subject.semester
                    )
                );

            }


            const departmentId =
                subject.department &&
                typeof subject.department === "object"
                    ? subject.department.id
                    : subject.department;


            if (
                departmentId !==
                null &&
                departmentId !==
                undefined &&
                departmentId !== ""
            ) {

                departmentIds.add(
                    String(
                        departmentId
                    )
                );

            }


            const facultyId =
                subject.faculty &&
                typeof subject.faculty === "object"
                    ? subject.faculty.id
                    : subject.faculty;


            if (
                facultyId !==
                null &&
                facultyId !==
                undefined &&
                facultyId !== ""
            ) {

                facultyIds.add(
                    String(
                        facultyId
                    )
                );

            }

        }
    );


    if (totalSubjects) {

        totalSubjects.textContent =
            allSubjects.length;

    }


    if (totalSemesters) {

        totalSemesters.textContent =
            semesters.size;

    }


    if (totalDepartments) {

        totalDepartments.textContent =
            departmentIds.size;

    }


    if (assignedFaculty) {

        assignedFaculty.textContent =
            facultyIds.size;

    }

}


// =========================================================
// OPEN ADD MODAL
// =========================================================

function openAddSubjectModal() {

    editingSubjectId = null;


    const modal =
        document.getElementById(
            "subjectModal"
        );


    const title =
        document.getElementById(
            "subjectModalTitle"
        );


    const form =
        document.getElementById(
            "subjectForm"
        );


    if (form) {

        form.reset();

    }


    const credits =
        document.getElementById(
            "subjectCredits"
        );


    if (credits) {

        credits.value = 4;

    }


    if (title) {

        title.textContent =
            "Add Subject";

    }


    clearFormMessage();


    if (modal) {

        modal.style.display =
            "flex";

    }

}


// =========================================================
// OPEN EDIT MODAL
// =========================================================

async function editSubject(subjectId) {

    console.log(
        "✏️ Editing subject:",
        subjectId
    );


    const subject =
        allSubjects.find(
            function (item) {

                return String(
                    item.id
                ) === String(
                    subjectId
                );

            }
        );


    if (!subject) {

        alert(
            "Subject record not found."
        );

        return;

    }


    editingSubjectId =
        subject.id;


    const modal =
        document.getElementById(
            "subjectModal"
        );


    const title =
        document.getElementById(
            "subjectModalTitle"
        );


    if (title) {

        title.textContent =
            "Edit Subject";

    }


    setInputValue(
        "subjectId",
        subject.subject_id || ""
    );


    setInputValue(
        "subjectCode",
        subject.subject_code || ""
    );


    setInputValue(
        "subjectName",
        getSubjectName(subject)
    );


    setInputValue(
        "subjectCredits",
        subject.credits ?? 4
    );


    setInputValue(
        "subjectSemester",
        subject.semester ?? ""
    );


    setSelectValue(
        "subjectDepartment",
        getRelationId(
            subject.department
        )
    );


    setSelectValue(
        "subjectFaculty",
        getRelationId(
            subject.faculty
        )
    );


    clearFormMessage();


    if (modal) {

        modal.style.display =
            "flex";

    }

}


// =========================================================
// HANDLE FORM SUBMIT
// =========================================================

async function handleSubjectSubmit(event) {

    event.preventDefault();


    const subjectId =
        getInputValue(
            "subjectId"
        );


    const subjectCode =
        getInputValue(
            "subjectCode"
        );


    const subjectName =
        getInputValue(
            "subjectName"
        );


    const credits =
        Number(
            getInputValue(
                "subjectCredits"
            )
        );


    const semester =
        Number(
            getInputValue(
                "subjectSemester"
            )
        );


    const department =
        getInputValue(
            "subjectDepartment"
        );


    const faculty =
        getInputValue(
            "subjectFaculty"
        );


    if (!subjectId) {

        showFormMessage(
            "Please enter Subject ID.",
            "error"
        );

        return;

    }


    if (!subjectCode) {

        showFormMessage(
            "Please enter Subject Code.",
            "error"
        );

        return;

    }


    if (!subjectName) {

        showFormMessage(
            "Please enter Subject Name.",
            "error"
        );

        return;

    }


    if (!credits || credits < 1) {

        showFormMessage(
            "Credits must be at least 1.",
            "error"
        );

        return;

    }


    if (!semester || semester < 1) {

        showFormMessage(
            "Please enter a valid semester.",
            "error"
        );

        return;

    }


    if (!department) {

        showFormMessage(
            "Please select a department.",
            "error"
        );

        return;

    }


    const payload = {

        subject_id:
            subjectId,

        subject_code:
            subjectCode,

        name:
            subjectName,

        credits:
            credits,

        semester:
            semester,

        department:
            Number(department),

        faculty:
            faculty
                ? Number(faculty)
                : null

    };


    console.log(
        "📤 Subject payload:",
        payload
    );


    try {

        setSaveButtonLoading(true);


        let url = "";
        let method = "";


        if (editingSubjectId) {

            url =
                `${API_BASE_URL}/subjects/detail/${editingSubjectId}/`;

            method =
                "PUT";

        }
        else {

            url =
                `${API_BASE_URL}/subjects/list/`;

            method =
                "POST";

        }


        console.log(
            "📚 Subject request:",
            method,
            url
        );


        const response =
            await fetch(
                url,
                {
                    method:
                        method,

                    headers:
                        getAuthHeaders(true),

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        const data =
            await parseJSONResponse(
                response
            );


        console.log(
            "📚 Subject save response:",
            data
        );


        if (!response.ok) {

            throw new Error(
                getAPIErrorMessage(
                    data,
                    "Unable to save subject."
                )
            );

        }


        showFormMessage(
            editingSubjectId
                ? "Subject updated successfully."
                : "Subject added successfully.",
            "success"
        );


        await loadSubjects();


        setTimeout(
            function () {

                closeSubjectModal();

            },
            700
        );


    }
    catch (error) {

        console.error(
            "❌ Subject save error:",
            error
        );


        showFormMessage(
            error.message ||
            "Unable to save subject.",
            "error"
        );

    }
    finally {

        setSaveButtonLoading(false);

    }

}


// =========================================================
// DELETE SUBJECT
// =========================================================

async function deleteSubject(subjectId) {

    console.log(
        "🗑️ Delete subject:",
        subjectId
    );


    const subject =
        allSubjects.find(
            function (item) {

                return String(
                    item.id
                ) === String(
                    subjectId
                );

            }
        );


    if (!subject) {

        alert(
            "Subject record not found."
        );

        return;

    }


    const subjectName =
        getSubjectName(subject);


    const confirmed =
        confirm(
            `Are you sure you want to delete "${subjectName}"?`
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/subjects/detail/${subjectId}/`,
                {
                    method:
                        "DELETE",

                    headers:
                        getAuthHeaders()
                }
            );


        const data =
            await parseJSONResponse(
                response
            );


        console.log(
            "🗑️ Delete response:",
            data
        );


        if (!response.ok) {

            throw new Error(
                getAPIErrorMessage(
                    data,
                    "Unable to delete subject."
                )
            );

        }


        alert(
            "Subject deleted successfully."
        );


        await loadSubjects();

    }
    catch (error) {

        console.error(
            "❌ Delete subject error:",
            error
        );


        alert(
            error.message ||
            "Unable to delete subject."
        );

    }

}


// =========================================================
// CLOSE MODAL
// =========================================================

function closeSubjectModal() {

    const modal =
        document.getElementById(
            "subjectModal"
        );


    if (modal) {

        modal.style.display =
            "none";

    }


    editingSubjectId =
        null;


    clearFormMessage();

}


// =========================================================
// FORM MESSAGE
// =========================================================

function showFormMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "subjectFormMessage"
        );


    if (!element) {

        return;

    }


    element.textContent =
        message;


    element.style.display =
        "block";


    element.className =
        `attendance-update-message ${type}`;

}


function clearFormMessage() {

    const element =
        document.getElementById(
            "subjectFormMessage"
        );


    if (!element) {

        return;

    }


    element.textContent =
        "";


    element.style.display =
        "none";

}


function showTableMessage(
    message,
    type = "info"
) {

    const tableBody =
        document.getElementById(
            "subjectsTableBody"
        );


    if (!tableBody) {

        return;

    }


    tableBody.innerHTML = `

        <tr>

            <td
                colspan="8"
                style="
                    text-align:center;
                    padding:30px;
                "
            >
                ${escapeHTML(
                    String(message)
                )}
            </td>

        </tr>

    `;

}


// =========================================================
// FORM HELPERS
// =========================================================

function getInputValue(id) {

    const element =
        document.getElementById(id);


    return element
        ? element.value.trim()
        : "";

}


function setInputValue(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.value =
            value;

    }

}


function setSelectValue(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (!element) {

        return;

    }


    const stringValue =
        value === null ||
        value === undefined
            ? ""
            : String(value);


    element.value =
        stringValue;


    /*
     * If the option does not yet exist,
     * keep the select empty rather than
     * displaying the wrong faculty/department.
     */

}


// =========================================================
// RELATION ID
// =========================================================

function getRelationId(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "";

    }


    if (
        typeof value === "object"
    ) {

        return (
            value.id ||
            value.pk ||
            ""
        );

    }


    return value;

}


// =========================================================
// SAVE BUTTON LOADING
// =========================================================

function setSaveButtonLoading(
    loading
) {

    const button =
        document.getElementById(
            "saveSubjectBtn"
        );


    if (!button) {

        return;

    }


    if (loading) {

        button.disabled =
            true;


        button.dataset.originalText =
            button.textContent;


        button.textContent =
            "Saving...";

    }
    else {

        button.disabled =
            false;


        button.textContent =
            button.dataset.originalText ||
            "Save Subject";

    }

}


// =========================================================
// LOGOUT
// =========================================================

function handleLogout() {

    localStorage.removeItem(
        "access_token"
    );

    localStorage.removeItem(
        "accessToken"
    );

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "refresh_token"
    );

    localStorage.removeItem(
        "user_role"
    );

    localStorage.removeItem(
        "user_email"
    );

    localStorage.removeItem(
        "username"
    );

    localStorage.removeItem(
        "user_id"
    );

    localStorage.removeItem(
        "studentName"
    );


    window.location.href =
        "/login.html";

}


// =========================================================
// HTML ESCAPE
// =========================================================

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value;


    return div.innerHTML;

}


// =========================================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// =========================================================

window.editSubject =
    editSubject;


window.deleteSubject =
    deleteSubject;


window.openAddSubjectModal =
    openAddSubjectModal;


window.closeSubjectModal =
    closeSubjectModal;


// =========================================================
// DEBUG
// =========================================================

console.log(
    "📚 subjects.js initialized."
);
