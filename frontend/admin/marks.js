// =========================================================
// MARKS MANAGEMENT - ADMIN
// =========================================================

const API_BASE_URL = "http://127.0.0.1:8000";

let allMarks = [];
let filteredMarks = [];

let students = [];
let subjects = [];
let facultyMembers = [];

let editingMarkId = null;


// =========================================================
// PAGE LOAD
// =========================================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("📊 marks.js loaded successfully.");

    setupEventListeners();

    loadAllData();

});


// =========================================================
// GET ACCESS TOKEN
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
// GET REFRESH TOKEN
// =========================================================

function getRefreshToken() {

    return (
        localStorage.getItem("refresh_token") ||
        localStorage.getItem("refreshToken") ||
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
// REFRESH JWT TOKEN
// =========================================================

async function refreshAccessToken() {

    const refreshToken =
        getRefreshToken();

    if (!refreshToken) {

        console.warn(
            "⚠️ No refresh token available."
        );

        return false;

    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/token/refresh/`,
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


        const data =
            await response.json();


        console.log(
            "🔄 Token refresh response:",
            data
        );


        if (!response.ok) {

            console.warn(
                "⚠️ Refresh token expired or invalid."
            );

            return false;

        }


        if (!data.access) {

            return false;

        }


        localStorage.setItem(
            "access_token",
            data.access
        );


        console.log(
            "✅ Access token refreshed."
        );


        return true;

    }
    catch (error) {

        console.error(
            "❌ Token refresh error:",
            error
        );

        return false;

    }

}


// =========================================================
// FETCH WITH AUTOMATIC TOKEN REFRESH
// =========================================================

async function fetchWithAuth(
    url,
    options = {},
    retry = true
) {

    options.headers = {
        ...(options.headers || {}),
        ...getAuthHeaders(
            options.method === "POST" ||
            options.method === "PUT" ||
            options.method === "PATCH"
        )
    };


    let response;


    try {

        response =
            await fetch(
                url,
                options
            );

    }
    catch (error) {

        throw new Error(
            "Unable to connect to Django backend."
        );

    }


    // =====================================================
    // TOKEN EXPIRED
    // =====================================================

    if (
        response.status === 401 &&
        retry
    ) {

        console.warn(
            "⚠️ Access token expired. Trying refresh..."
        );


        const refreshed =
            await refreshAccessToken();


        if (refreshed) {

            return fetchWithAuth(
                url,
                options,
                false
            );

        }


        // Refresh failed
        logoutUser();

        throw new Error(
            "Your login session has expired. Please login again."
        );

    }


    return response;

}


// =========================================================
// LOAD ALL DATA
// =========================================================

async function loadAllData() {

    showLoadingState();

    try {

        await Promise.all([
            loadStudents(),
            loadSubjects(),
            loadFaculty(),
            loadMarks()
        ]);


        populateStudentOptions();
        populateSubjectOptions();
        populateFacultyOptions();

        populateSubjectFilter();

        updateSummaryCards();

        applyFilters();

    }
    catch (error) {

        console.error(
            "❌ Loading error:",
            error
        );


        showErrorState(
            error.message ||
            "Unable to load marks."
        );

    }

}


// =========================================================
// EVENT LISTENERS
// =========================================================

function setupEventListeners() {

    const addButton =
        document.getElementById(
            "addMarkBtn"
        );


    const refreshButton =
        document.getElementById(
            "refreshMarksBtn"
        );


    const searchInput =
        document.getElementById(
            "markSearch"
        );


    const gradeFilter =
        document.getElementById(
            "gradeFilter"
        );


    const subjectFilter =
        document.getElementById(
            "markSubjectFilter"
        );


    const markForm =
        document.getElementById(
            "markForm"
        );


    const closeButton =
        document.getElementById(
            "closeMarkModal"
        );


    const cancelButton =
        document.getElementById(
            "cancelMarkBtn"
        );


    const logoutButton =
        document.getElementById(
            "logoutBtn"
        );


    const internalMarks =
        document.getElementById(
            "internalMarks"
        );


    const assignmentMarks =
        document.getElementById(
            "assignmentMarks"
        );


    const labMarks =
        document.getElementById(
            "labMarks"
        );


    const semesterExam =
        document.getElementById(
            "semesterExam"
        );


    if (addButton) {

        addButton.addEventListener(
            "click",
            openAddMarkModal
        );

    }


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            loadAllData
        );

    }


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            applyFilters
        );

    }


    if (gradeFilter) {

        gradeFilter.addEventListener(
            "change",
            applyFilters
        );

    }


    if (subjectFilter) {

        subjectFilter.addEventListener(
            "change",
            applyFilters
        );

    }


    if (markForm) {

        markForm.addEventListener(
            "submit",
            handleMarkSubmit
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeMarkModal
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeMarkModal
        );

    }


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logoutUser
        );

    }


    [
        internalMarks,
        assignmentMarks,
        labMarks,
        semesterExam
    ].forEach(
        function (input) {

            if (input) {

                input.addEventListener(
                    "input",
                    updateMarkPreview
                );

            }

        }
    );


    const modal =
        document.getElementById(
            "markModal"
        );


    if (modal) {

        modal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === modal
                ) {

                    closeMarkModal();

                }

            }
        );

    }

}


// =========================================================
// LOAD STUDENTS
// =========================================================

async function loadStudents() {

    console.log(
        "🎓 Loading students..."
    );


    const response =
        await fetchWithAuth(
            `${API_BASE_URL}/student-profile/list/`,
            {
                method: "GET"
            }
        );


    const data =
        await parseJSONResponse(
            response
        );


    console.log(
        "🎓 Students response:",
        data
    );


    if (!response.ok) {

        throw new Error(
            getAPIErrorMessage(
                data,
                "Unable to load students."
            )
        );

    }


    students =
        normalizeArray(
            data
        );


    console.log(
        "🎓 Students loaded:",
        students.length
    );

}


// =========================================================
// LOAD SUBJECTS
// =========================================================

async function loadSubjects() {

    console.log(
        "📚 Loading subjects..."
    );


    const response =
        await fetchWithAuth(
            `${API_BASE_URL}/subjects/list/`,
            {
                method: "GET"
            }
        );


    const data =
        await parseJSONResponse(
            response
        );


    console.log(
        "📚 Subjects response:",
        data
    );


    if (!response.ok) {

        throw new Error(
            getAPIErrorMessage(
                data,
                "Unable to load subjects."
            )
        );

    }


    subjects =
        normalizeArray(
            data
        );


    console.log(
        "📚 Subjects loaded:",
        subjects.length
    );

}


// =========================================================
// LOAD FACULTY
// =========================================================

async function loadFaculty() {

    console.log(
        "👨‍🏫 Loading faculty..."
    );


    const response =
        await fetchWithAuth(
            `${API_BASE_URL}/faculty/list/`,
            {
                method: "GET"
            }
        );


    const data =
        await parseJSONResponse(
            response
        );


    console.log(
        "👨‍🏫 Faculty response:",
        data
    );


    if (!response.ok) {

        throw new Error(
            getAPIErrorMessage(
                data,
                "Unable to load faculty."
            )
        );

    }


    facultyMembers =
        normalizeArray(
            data
        );


    console.log(
        "👨‍🏫 Faculty loaded:",
        facultyMembers.length
    );

}


// =========================================================
// LOAD MARKS
// =========================================================

async function loadMarks() {

    console.log(
        "📊 Loading marks..."
    );


    /*
     * Marks backend currently uses AllowAny,
     * but fetchWithAuth is still used so that
     * the same authentication system works
     * consistently.
     */

    const response =
        await fetchWithAuth(
            `${API_BASE_URL}/marks/list/`,
            {
                method: "GET"
            }
        );


    const data =
        await parseJSONResponse(
            response
        );


    console.log(
        "📊 Marks API response:",
        data
    );


    if (!response.ok) {

        throw new Error(
            getAPIErrorMessage(
                data,
                "Unable to load marks."
            )
        );

    }


    allMarks =
        normalizeArray(
            data
        );


    filteredMarks =
        [...allMarks];


    console.log(
        "📊 Marks loaded:",
        allMarks.length
    );

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
        Array.isArray(data.students)
    ) {

        return data.students;

    }


    if (
        data &&
        Array.isArray(data.subjects)
    ) {

        return data.subjects;

    }


    if (
        data &&
        Array.isArray(data.faculty)
    ) {

        return data.faculty;

    }


    if (
        data &&
        Array.isArray(data.marks)
    ) {

        return data.marks;

    }


    return [];

}


// =========================================================
// PARSE RESPONSE
// =========================================================

async function parseJSONResponse(
    response
) {

    const text =
        await response.text();


    if (!text) {

        return {};

    }


    try {

        return JSON.parse(
            text
        );

    }
    catch {

        return {
            raw: text
        };

    }

}


// =========================================================
// API ERROR
// =========================================================

function getAPIErrorMessage(
    data,
    fallback
) {

    if (!data) {

        return fallback;

    }


    if (
        typeof data === "string"
    ) {

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

        const key =
            keys[0];


        const value =
            data[key];


        if (
            Array.isArray(value)
        ) {

            return `${key}: ${value.join(", ")}`;

        }


        if (
            typeof value === "string"
        ) {

            return `${key}: ${value}`;

        }

    }


    return fallback;

}


// =========================================================
// STUDENT NAME
// =========================================================

function getStudentName(
    student
) {

    if (
        student === null ||
        student === undefined
    ) {

        return "Unknown Student";

    }


    if (
        typeof student === "object"
    ) {

        return (
            student.name ||
            student.full_name ||
            student.student_name ||
            student.username ||
            `Student ${student.id || ""}`
        );

    }


    const found =
        students.find(
            function (item) {

                return String(
                    item.id
                ) === String(
                    student
                );

            }
        );


    if (found) {

        return (
            found.name ||
            found.full_name ||
            found.student_name ||
            found.username ||
            `Student ${found.id}`
        );

    }


    return `Student ${student}`;

}


// =========================================================
// STUDENT USN
// =========================================================

function getStudentUSN(
    student
) {

    if (
        student &&
        typeof student === "object"
    ) {

        return (
            student.usn ||
            student.USN ||
            "-"
        );

    }


    const found =
        students.find(
            function (item) {

                return String(
                    item.id
                ) === String(
                    student
                );

            }
        );


    return found
        ? (
            found.usn ||
            found.USN ||
            "-"
        )
        : "-";

}


// =========================================================
// SUBJECT NAME
// =========================================================

function getSubjectName(
    subject
) {

    if (
        subject === null ||
        subject === undefined
    ) {

        return "Unknown Subject";

    }


    if (
        typeof subject === "object"
    ) {

        return (
            subject.name ||
            subject.subject_name ||
            subject.title ||
            `Subject ${subject.id || ""}`
        );

    }


    const found =
        subjects.find(
            function (item) {

                return String(
                    item.id
                ) === String(
                    subject
                );

            }
        );


    if (found) {

        return (
            found.name ||
            found.subject_name ||
            found.title ||
            `Subject ${found.id}`
        );

    }


    return `Subject ${subject}`;

}


// =========================================================
// FACULTY NAME
// =========================================================

function getFacultyName(
    faculty
) {

    if (
        faculty === null ||
        faculty === undefined ||
        faculty === ""
    ) {

        return "Not assigned";

    }


    if (
        typeof faculty === "object"
    ) {

        return (
            faculty.name ||
            faculty.full_name ||
            faculty.faculty_name ||
            faculty.username ||
            `Faculty ${faculty.id || ""}`
        );

    }


    const found =
        facultyMembers.find(
            function (item) {

                return String(
                    item.id
                ) === String(
                    faculty
                );

            }
        );


    if (found) {

        return (
            found.name ||
            found.full_name ||
            found.faculty_name ||
            found.username ||
            `Faculty ${found.id}`
        );

    }


    return `Faculty ${faculty}`;

}


// =========================================================
// RELATION ID
// =========================================================

function getRelationId(
    value
) {

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
// POPULATE STUDENT OPTIONS
// =========================================================

function populateStudentOptions() {

    const select =
        document.getElementById(
            "markStudent"
        );


    if (!select) {

        return;

    }


    select.innerHTML = `

        <option value="">
            Select Student
        </option>

    `;


    students.forEach(
        function (student) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                student.id;


            option.textContent =
                `${student.name || "Student"}${
                    student.usn
                        ? ` - ${student.usn}`
                        : ""
                }`;


            select.appendChild(
                option
            );

        }
    );

}


// =========================================================
// POPULATE SUBJECT OPTIONS
// =========================================================

function populateSubjectOptions() {

    const select =
        document.getElementById(
            "markSubject"
        );


    if (!select) {

        return;

    }


    select.innerHTML = `

        <option value="">
            Select Subject
        </option>

    `;


    subjects.forEach(
        function (subject) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                subject.id;


            option.textContent =
                subject.name ||
                subject.subject_name ||
                subject.subject_code ||
                `Subject ${subject.id}`;


            select.appendChild(
                option
            );

        }
    );

}


// =========================================================
// POPULATE FACULTY OPTIONS
// =========================================================

function populateFacultyOptions() {

    const select =
        document.getElementById(
            "markFaculty"
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


            select.appendChild(
                option
            );

        }
    );

}


// =========================================================
// POPULATE SUBJECT FILTER
// =========================================================

function populateSubjectFilter() {

    const select =
        document.getElementById(
            "markSubjectFilter"
        );


    if (!select) {

        return;

    }


    select.innerHTML = `

        <option value="">
            All Subjects
        </option>

    `;


    subjects.forEach(
        function (subject) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                subject.id;


            option.textContent =
                subject.name ||
                subject.subject_name ||
                subject.subject_code ||
                `Subject ${subject.id}`;


            select.appendChild(
                option
            );

        }
    );

}


// =========================================================
// APPLY FILTERS
// =========================================================

function applyFilters() {

    const searchInput =
        document.getElementById(
            "markSearch"
        );


    const gradeFilter =
        document.getElementById(
            "gradeFilter"
        );


    const subjectFilter =
        document.getElementById(
            "markSubjectFilter"
        );


    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const grade =
        gradeFilter
            ? gradeFilter.value
            : "";


    const subject =
        subjectFilter
            ? subjectFilter.value
            : "";


    filteredMarks =
        allMarks.filter(
            function (mark) {

                const studentName =
                    getStudentName(
                        mark.student
                    )
                    .toLowerCase();


                const usn =
                    getStudentUSN(
                        mark.student
                    )
                    .toLowerCase();


                const subjectName =
                    getSubjectName(
                        mark.subject
                    )
                    .toLowerCase();


                const markGrade =
                    String(
                        mark.grade || ""
                    );


                const matchesSearch =
                    !search ||
                    studentName.includes(
                        search
                    ) ||
                    usn.includes(
                        search
                    ) ||
                    subjectName.includes(
                        search
                    );


                const matchesGrade =
                    !grade ||
                    markGrade === grade;


                const markSubjectId =
                    getRelationId(
                        mark.subject
                    );


                const matchesSubject =
                    !subject ||
                    String(
                        markSubjectId
                    ) === String(
                        subject
                    );


                return (
                    matchesSearch &&
                    matchesGrade &&
                    matchesSubject
                );

            }
        );


    renderMarks();

}


// =========================================================
// RENDER MARKS
// =========================================================

function renderMarks() {

    const tableBody =
        document.getElementById(
            "marksTableBody"
        );


    if (!tableBody) {

        return;

    }


    const countElement =
        document.getElementById(
            "filteredMarkCount"
        );


    if (
        countElement
    ) {

        countElement.textContent =
            filteredMarks.length;

    }


    if (
        filteredMarks.length === 0
    ) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="12"
                    style="
                        text-align:center;
                        padding:30px;
                    "
                >
                    No mark records found.
                </td>

            </tr>

        `;

        return;

    }


    let html = "";


    filteredMarks.forEach(
        function (mark, index) {

            const percentage =
                Number(
                    mark.percentage || 0
                );


            const grade =
                mark.grade ||
                "-";


            html += `

                <tr>

                    <td>
                        ${index + 1}
                    </td>


                    <td>
                        ${escapeHTML(
                            getStudentName(
                                mark.student
                            )
                        )}
                    </td>


                    <td>
                        ${escapeHTML(
                            getStudentUSN(
                                mark.student
                            )
                        )}
                    </td>


                    <td>
                        ${escapeHTML(
                            getSubjectName(
                                mark.subject
                            )
                        )}
                    </td>


                    <td>
                        ${Number(
                            mark.internal_marks || 0
                        )}
                    </td>


                    <td>
                        ${Number(
                            mark.assignment_marks || 0
                        )}
                    </td>


                    <td>
                        ${Number(
                            mark.lab_marks || 0
                        )}
                    </td>


                    <td>
                        ${Number(
                            mark.semester_exam || 0
                        )}
                    </td>


                    <td>
                        <strong>
                            ${Number(
                                mark.total_marks || 0
                            )}
                        </strong>
                    </td>


                    <td>
                        ${percentage.toFixed(2)}%
                    </td>


                    <td>
                        <strong>
                            ${escapeHTML(
                                String(grade)
                            )}
                        </strong>
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
                                onclick="editMark(${Number(mark.id)})"
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
                                onclick="deleteMark(${Number(mark.id)})"
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

}


// =========================================================
// SUMMARY CARDS
// =========================================================

function updateSummaryCards() {

    const total =
        allMarks.length;


    let totalPercentage =
        0;


    let passed =
        0;


    let failed =
        0;


    allMarks.forEach(
        function (mark) {

            const percentage =
                Number(
                    mark.percentage || 0
                );


            totalPercentage +=
                percentage;


            if (
                percentage >= 50
            ) {

                passed++;

            }
            else {

                failed++;

            }

        }
    );


    const average =
        total > 0
            ? totalPercentage / total
            : 0;


    const totalElement =
        document.getElementById(
            "totalMarkRecords"
        );


    const averageElement =
        document.getElementById(
            "averagePercentage"
        );


    const passedElement =
        document.getElementById(
            "passedMarkCount"
        );


    const failedElement =
        document.getElementById(
            "failedMarkCount"
        );


    if (totalElement) {

        totalElement.textContent =
            total;

    }


    if (averageElement) {

        averageElement.textContent =
            `${average.toFixed(2)}%`;

    }


    if (passedElement) {

        passedElement.textContent =
            passed;

    }


    if (failedElement) {

        failedElement.textContent =
            failed;

    }

}


// =========================================================
// OPEN ADD MARK MODAL
// =========================================================

function openAddMarkModal() {

    editingMarkId =
        null;


    const modal =
        document.getElementById(
            "markModal"
        );


    const title =
        document.getElementById(
            "markModalTitle"
        );


    const form =
        document.getElementById(
            "markForm"
        );


    if (form) {

        form.reset();

    }


    const idField =
        document.getElementById(
            "markId"
        );


    if (idField) {

        idField.value =
            "";

    }


    if (title) {

        title.textContent =
            "Add Marks";

    }


    clearFormMessage();

    updateMarkPreview();


    if (modal) {

        modal.style.display =
            "flex";

    }

}


// =========================================================
// EDIT MARK
// =========================================================

async function editMark(
    markId
) {

    console.log(
        "✏️ Editing mark:",
        markId
    );


    const mark =
        allMarks.find(
            function (item) {

                return String(
                    item.id
                ) === String(
                    markId
                );

            }
        );


    if (!mark) {

        alert(
            "Mark record not found."
        );

        return;

    }


    editingMarkId =
        mark.id;


    const modal =
        document.getElementById(
            "markModal"
        );


    const title =
        document.getElementById(
            "markModalTitle"
        );


    if (title) {

        title.textContent =
            "Edit Marks";

    }


    setSelectValue(
        "markStudent",
        getRelationId(
            mark.student
        )
    );


    setSelectValue(
        "markSubject",
        getRelationId(
            mark.subject
        )
    );


    setSelectValue(
        "markFaculty",
        getRelationId(
            mark.faculty
        )
    );


    setInputValue(
        "markId",
        mark.id || ""
    );


    setInputValue(
        "internalMarks",
        mark.internal_marks || 0
    );


    setInputValue(
        "assignmentMarks",
        mark.assignment_marks || 0
    );


    setInputValue(
        "labMarks",
        mark.lab_marks || 0
    );


    setInputValue(
        "semesterExam",
        mark.semester_exam || 0
    );


    updateMarkPreview();

    clearFormMessage();


    if (modal) {

        modal.style.display =
            "flex";

    }

}


// =========================================================
// HANDLE MARK SUBMIT
// =========================================================

async function handleMarkSubmit(
    event
) {

    event.preventDefault();


    const student =
        getInputValue(
            "markStudent"
        );


    const subject =
        getInputValue(
            "markSubject"
        );


    const faculty =
        getInputValue(
            "markFaculty"
        );


    const internalMarks =
        Number(
            getInputValue(
                "internalMarks"
            ) || 0
        );


    const assignmentMarks =
        Number(
            getInputValue(
                "assignmentMarks"
            ) || 0
        );


    const labMarks =
        Number(
            getInputValue(
                "labMarks"
            ) || 0
        );


    const semesterExam =
        Number(
            getInputValue(
                "semesterExam"
            ) || 0
        );


    // =====================================================
    // VALIDATION
    // =====================================================

    if (!student) {

        showFormMessage(
            "Please select a student.",
            "error"
        );

        return;

    }


    if (!subject) {

        showFormMessage(
            "Please select a subject.",
            "error"
        );

        return;

    }


    if (!faculty) {

        showFormMessage(
            "Please select a faculty member.",
            "error"
        );

        return;

    }


    if (
        internalMarks < 0 ||
        internalMarks > 40
    ) {

        showFormMessage(
            "Internal marks must be between 0 and 40.",
            "error"
        );

        return;

    }


    if (
        assignmentMarks < 0 ||
        assignmentMarks > 20
    ) {

        showFormMessage(
            "Assignment marks must be between 0 and 20.",
            "error"
        );

        return;

    }


    if (
        labMarks < 0 ||
        labMarks > 20
    ) {

        showFormMessage(
            "Lab marks must be between 0 and 20.",
            "error"
        );

        return;

    }


    if (
        semesterExam < 0 ||
        semesterExam > 80
    ) {

        showFormMessage(
            "Semester exam marks must be between 0 and 80.",
            "error"
        );

        return;

    }


    // =====================================================
    // PAYLOAD
    // =====================================================

    const payload = {

        student:
            Number(student),

        subject:
            Number(subject),

        faculty:
            Number(faculty),

        internal_marks:
            internalMarks,

        assignment_marks:
            assignmentMarks,

        lab_marks:
            labMarks,

        semester_exam:
            semesterExam

    };


    console.log(
        "📤 Marks payload:",
        payload
    );


    try {

        setSaveButtonLoading(
            true
        );


        let url;
        let method;


        if (editingMarkId) {

            url =
                `${API_BASE_URL}/marks/detail/${editingMarkId}/`;

            method =
                "PUT";

        }
        else {

            url =
                `${API_BASE_URL}/marks/list/`;

            method =
                "POST";

        }


        const response =
            await fetchWithAuth(
                url,
                {
                    method:
                        method,

                    headers:
                        getAuthHeaders(
                            true
                        ),

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
            "📊 Save marks response:",
            data
        );


        if (!response.ok) {

            throw new Error(
                getAPIErrorMessage(
                    data,
                    "Unable to save marks."
                )
            );

        }


        showFormMessage(
            editingMarkId
                ? "Marks updated successfully."
                : "Marks added successfully.",
            "success"
        );


        await loadAllData();


        setTimeout(
            function () {

                closeMarkModal();

            },
            700
        );

    }
    catch (error) {

        console.error(
            "❌ Marks save error:",
            error
        );


        showFormMessage(
            error.message ||
            "Unable to save marks.",
            "error"
        );

    }
    finally {

        setSaveButtonLoading(
            false
        );

    }

}


// =========================================================
// DELETE MARK
// =========================================================

async function deleteMark(
    markId
) {

    const mark =
        allMarks.find(
            function (item) {

                return String(
                    item.id
                ) === String(
                    markId
                );

            }
        );


    if (!mark) {

        alert(
            "Mark record not found."
        );

        return;

    }


    const studentName =
        getStudentName(
            mark.student
        );


    const confirmed =
        confirm(
            `Are you sure you want to delete marks for ${studentName}?`
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await fetchWithAuth(
                `${API_BASE_URL}/marks/detail/${markId}/`,
                {
                    method:
                        "DELETE"
                }
            );


        const data =
            await parseJSONResponse(
                response
            );


        if (!response.ok) {

            throw new Error(
                getAPIErrorMessage(
                    data,
                    "Unable to delete marks."
                )
            );

        }


        alert(
            "Marks deleted successfully."
        );


        await loadAllData();

    }
    catch (error) {

        console.error(
            "❌ Delete marks error:",
            error
        );


        alert(
            error.message ||
            "Unable to delete marks."
        );

    }

}


// =========================================================
// MARK PREVIEW
// =========================================================

function updateMarkPreview() {

    const internal =
        Number(
            getInputValue(
                "internalMarks"
            ) || 0
        );


    const assignment =
        Number(
            getInputValue(
                "assignmentMarks"
            ) || 0
        );


    const lab =
        Number(
            getInputValue(
                "labMarks"
            ) || 0
        );


    const exam =
        Number(
            getInputValue(
                "semesterExam"
            ) || 0
        );


    const total =
        internal +
        assignment +
        lab +
        exam;


    const percentage =
        (total / 160) * 100;


    let grade =
        "F";


    if (percentage >= 90) {

        grade = "A+";

    }
    else if (percentage >= 80) {

        grade = "A";

    }
    else if (percentage >= 70) {

        grade = "B";

    }
    else if (percentage >= 60) {

        grade = "C";

    }
    else if (percentage >= 50) {

        grade = "D";

    }


    const totalElement =
        document.getElementById(
            "totalMarksPreview"
        );


    const percentageElement =
        document.getElementById(
            "percentagePreview"
        );


    const gradeElement =
        document.getElementById(
            "gradePreview"
        );


    if (totalElement) {

        totalElement.textContent =
            total;

    }


    if (percentageElement) {

        percentageElement.textContent =
            `${percentage.toFixed(2)}%`;

    }


    if (gradeElement) {

        gradeElement.textContent =
            grade;

    }

}


// =========================================================
// SET SELECT VALUE
// =========================================================

function setSelectValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;

    }


    element.value =
        value === null ||
        value === undefined
            ? ""
            : String(value);

}


// =========================================================
// GET INPUT VALUE
// =========================================================

function getInputValue(
    id
) {

    const element =
        document.getElementById(
            id
        );


    return element
        ? element.value.trim()
        : "";

}


// =========================================================
// SET INPUT VALUE
// =========================================================

function setInputValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.value =
            value;

    }

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
            "markFormMessage"
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
            "markFormMessage"
        );


    if (!element) {

        return;

    }


    element.textContent =
        "";


    element.style.display =
        "none";

}


// =========================================================
// SAVE BUTTON
// =========================================================

function setSaveButtonLoading(
    loading
) {

    const button =
        document.getElementById(
            "saveMarkBtn"
        );


    const buttonText =
        document.getElementById(
            "saveMarkBtnText"
        );


    if (!button) {

        return;

    }


    if (loading) {

        button.disabled =
            true;


        if (buttonText) {

            buttonText.textContent =
                "Saving...";

        }
        else {

            button.textContent =
                "Saving...";

        }

    }
    else {

        button.disabled =
            false;


        if (buttonText) {

            buttonText.textContent =
                "Save Marks";

        }
        else {

            button.textContent =
                "Save Marks";

        }

    }

}


// =========================================================
// CLOSE MODAL
// =========================================================

function closeMarkModal() {

    const modal =
        document.getElementById(
            "markModal"
        );


    if (modal) {

        modal.style.display =
            "none";

    }


    editingMarkId =
        null;


    clearFormMessage();

}


// =========================================================
// LOADING STATE
// =========================================================

function showLoadingState() {

    const tableBody =
        document.getElementById(
            "marksTableBody"
        );


    if (!tableBody) {

        return;

    }


    tableBody.innerHTML = `

        <tr>

            <td
                colspan="12"
                style="
                    text-align:center;
                    padding:40px;
                "
            >

                Loading marks...

            </td>

        </tr>

    `;

}


// =========================================================
// ERROR STATE
// =========================================================

function showErrorState(
    message
) {

    const tableBody =
        document.getElementById(
            "marksTableBody"
        );


    if (!tableBody) {

        return;

    }


    tableBody.innerHTML = `

        <tr>

            <td
                colspan="12"
                style="
                    text-align:center;
                    padding:40px;
                    color:#dc2626;
                "
            >

                <strong>
                    Unable to load marks
                </strong>

                <br><br>

                ${escapeHTML(
                    String(message)
                )}

                <br><br>

                <button
                    type="button"
                    class="admin-secondary-btn"
                    onclick="loadAllData()"
                >
                    🔄 Try Again
                </button>

            </td>

        </tr>

    `;

}


// =========================================================
// LOGOUT
// =========================================================

function logoutUser() {

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
        "refreshToken"
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
        "../login.html";

}


// =========================================================
// HTML ESCAPE
// =========================================================

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value;


    return div.innerHTML;

}


// =========================================================
// GLOBAL FUNCTIONS
// =========================================================

window.editMark =
    editMark;


window.deleteMark =
    deleteMark;


window.openAddMarkModal =
    openAddMarkModal;


window.closeMarkModal =
    closeMarkModal;


window.loadAllData =
    loadAllData;


console.log(
    "📊 marks.js initialized."
);