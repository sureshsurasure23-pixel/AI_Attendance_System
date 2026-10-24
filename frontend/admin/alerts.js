// =========================================================
// AI ATTEND — ADMIN ALERTS / NOTIFICATIONS
// =========================================================

const API_BASE_URL = "http://127.0.0.1:8000";

const NOTIFICATIONS_API =
    `${API_BASE_URL}/notifications/`;

const STUDENTS_API =
    `${API_BASE_URL}/student-profile/list/`;


// =========================================================
// GLOBAL DATA
// =========================================================

let notifications = [];
let students = [];


// =========================================================
// DOM READY
// =========================================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("🔔 Alerts page loaded.");

    setupEventListeners();

    loadStudents();

    loadNotifications();

});


// =========================================================
// AUTH TOKEN
// =========================================================

function getAccessToken() {

    return (
        localStorage.getItem("access_token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token")
    );

}


// =========================================================
// AUTH HEADERS
// =========================================================

function getAuthHeaders() {

    const token = getAccessToken();

    return {

        "Content-Type": "application/json",

        "Authorization":
            `Bearer ${token}`

    };

}


// =========================================================
// EVENT LISTENERS
// =========================================================

function setupEventListeners() {


    // SEARCH

    const searchInput =
        document.getElementById(
            "notificationSearch"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            applyFilters
        );

    }


    // STATUS FILTER

    const statusFilter =
        document.getElementById(
            "notificationStatusFilter"
        );


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            applyFilters
        );

    }


    // REFRESH

    const refreshButton =
        document.getElementById(
            "refreshNotificationsBtn"
        );


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            function () {

                loadNotifications();

            }
        );

    }


    // CREATE

    const createButton =
        document.getElementById(
            "createNotificationBtn"
        );


    if (createButton) {

        createButton.addEventListener(
            "click",
            openCreateModal
        );

    }


    // FORM

    const form =
        document.getElementById(
            "notificationForm"
        );


    if (form) {

        form.addEventListener(
            "submit",
            saveNotification
        );

    }


    // CLOSE CREATE/EDIT MODAL

    const closeModal =
        document.getElementById(
            "closeNotificationModal"
        );


    if (closeModal) {

        closeModal.addEventListener(
            "click",
            closeNotificationModal
        );

    }


    // CANCEL

    const cancelButton =
        document.getElementById(
            "cancelNotificationBtn"
        );


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeNotificationModal
        );

    }


    // CLOSE VIEW MODAL

    const closeViewModal =
        document.getElementById(
            "closeViewNotificationModal"
        );


    if (closeViewModal) {

        closeViewModal.addEventListener(
            "click",
            closeViewNotificationModal
        );

    }


    // LOGOUT

    const logoutButton =
        document.getElementById(
            "logoutBtn"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logout
        );

    }


    // CLOSE MODALS WHEN CLICKING OUTSIDE

    const notificationModal =
        document.getElementById(
            "notificationModal"
        );


    if (notificationModal) {

        notificationModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    notificationModal
                ) {

                    closeNotificationModal();

                }

            }
        );

    }


    const viewModal =
        document.getElementById(
            "viewNotificationModal"
        );


    if (viewModal) {

        viewModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    viewModal
                ) {

                    closeViewNotificationModal();

                }

            }
        );

    }

}


// =========================================================
// LOAD STUDENTS
// =========================================================

async function loadStudents() {

    const token = getAccessToken();


    if (!token) {

        console.warn(
            "⚠️ No access token found."
        );

        return;

    }


    try {

        const response =
            await fetch(
                STUDENTS_API,
                {
                    method: "GET",
                    headers: getAuthHeaders()
                }
            );


        if (!response.ok) {

            throw new Error(
                `Student API returned ${response.status}`
            );

        }


        const data =
            await response.json();


        students =
            Array.isArray(data)
                ? data
                : (
                    data.results ||
                    data.students ||
                    []
                );


        console.log(
            "👨‍🎓 Students loaded:",
            students
        );


        populateStudentSelect();


    }
    catch (error) {

        console.error(
            "❌ Failed to load students:",
            error
        );

    }

}


// =========================================================
// POPULATE STUDENT SELECT
// =========================================================

function populateStudentSelect() {

    const select =
        document.getElementById(
            "notificationStudent"
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

            const id =
                student.id ||
                student.student_id;


            const name =
                student.name ||
                student.student_name ||
                "Student";


            const usn =
                student.usn ||
                student.USN ||
                "";


            if (!id) {

                return;

            }


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                id;


            option.textContent =
                usn
                    ? `${name} (${usn})`
                    : name;


            select.appendChild(
                option
            );

        }
    );

}


// =========================================================
// LOAD NOTIFICATIONS
// =========================================================

async function loadNotifications() {

    const tableBody =
        document.getElementById(
            "notificationTableBody"
        );


    if (tableBody) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="table-empty">

                    Loading notifications...

                </td>

            </tr>

        `;

    }


    const token =
        getAccessToken();


    if (!token) {

        showTableMessage(
            "Authentication required. Please login again."
        );

        return;

    }


    try {

        const response =
            await fetch(
                NOTIFICATIONS_API,
                {
                    method: "GET",
                    headers: getAuthHeaders()
                }
            );


        if (response.status === 401) {

            showTableMessage(
                "Session expired. Please login again."
            );

            return;

        }


        if (!response.ok) {

            throw new Error(
                `Notification API returned ${response.status}`
            );

        }


        const data =
            await response.json();


        notifications =
            Array.isArray(data)
                ? data
                : (
                    data.results ||
                    data.notifications ||
                    []
                );


        console.log(
            "🔔 Notifications loaded:",
            notifications
        );


        updateSummary();


        applyFilters();


    }
    catch (error) {

        console.error(
            "❌ Failed to load notifications:",
            error
        );


        showTableMessage(
            "Unable to load notifications."
        );

    }

}


// =========================================================
// UPDATE SUMMARY
// =========================================================

function updateSummary() {

    const total =
        notifications.length;


    const unread =
        notifications.filter(
            function (notification) {

                return !notification.is_read;

            }
        ).length;


    const read =
        notifications.filter(
            function (notification) {

                return notification.is_read;

            }
        ).length;


    setText(
        "totalNotifications",
        total
    );


    setText(
        "unreadNotifications",
        unread
    );


    setText(
        "readNotifications",
        read
    );

}


// =========================================================
// FILTER NOTIFICATIONS
// =========================================================

function applyFilters() {

    const searchInput =
        document.getElementById(
            "notificationSearch"
        );


    const statusFilter =
        document.getElementById(
            "notificationStatusFilter"
        );


    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const status =
        statusFilter
            ? statusFilter.value
            : "";


    const filtered =
        notifications.filter(
            function (notification) {

                const studentName =
                    String(
                        notification.student_name ||
                        ""
                    ).toLowerCase();


                const usn =
                    String(
                        notification.usn ||
                        ""
                    ).toLowerCase();


                const title =
                    String(
                        notification.title ||
                        ""
                    ).toLowerCase();


                const message =
                    String(
                        notification.message ||
                        ""
                    ).toLowerCase();


                const matchesSearch =
                    !search ||
                    studentName.includes(search) ||
                    usn.includes(search) ||
                    title.includes(search) ||
                    message.includes(search);


                let matchesStatus =
                    true;


                if (status === "read") {

                    matchesStatus =
                        notification.is_read === true;

                }


                if (status === "unread") {

                    matchesStatus =
                        notification.is_read === false;

                }


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    renderNotifications(
        filtered
    );


    setText(
        "filteredNotificationCount",
        filtered.length
    );

}


// =========================================================
// RENDER NOTIFICATIONS
// =========================================================

function renderNotifications(
    notificationList
) {

    const tableBody =
        document.getElementById(
            "notificationTableBody"
        );


    if (!tableBody) {

        return;

    }


    if (
        !notificationList ||
        notificationList.length === 0
    ) {

        showTableMessage(
            "No notifications found."
        );

        return;

    }


    let html = "";


    notificationList.forEach(
        function (
            notification,
            index
        ) {

            const id =
                notification.id;


            const studentName =
                notification.student_name ||
                "Student";


            const usn =
                notification.usn ||
                "-";


            const title =
                notification.title ||
                "-";


            const message =
                notification.message ||
                "-";


            const isRead =
                notification.is_read === true;


            const statusText =
                isRead
                    ? "READ"
                    : "UNREAD";


            const created =
                formatDate(
                    notification.created_at
                );


            html += `

                <tr>

                    <td>
                        ${index + 1}
                    </td>


                    <td>

                        <strong>
                            ${escapeHTML(
                                studentName
                            )}
                        </strong>

                    </td>


                    <td>
                        ${escapeHTML(
                            usn
                        )}
                    </td>


                    <td>

                        <strong>
                            ${escapeHTML(
                                title
                            )}
                        </strong>

                    </td>


                    <td>

                        <div
                            class="notification-message-preview">

                            ${escapeHTML(
                                message
                            )}

                        </div>

                    </td>


                    <td>

                        <span
                            class="notification-status ${isRead ? "read" : "unread"}">

                            ${statusText}

                        </span>

                    </td>


                    <td>
                        ${created}
                    </td>


                    <td>

                        <div
                            class="notification-actions">

                            <button
                                type="button"
                                class="admin-view-btn"
                                onclick="viewNotification(${id})">

                                View

                            </button>


                            <button
                                type="button"
                                class="admin-edit-btn"
                                onclick="editNotification(${id})">

                                Edit

                            </button>


                            <button
                                type="button"
                                class="admin-delete-btn"
                                onclick="deleteNotification(${id})">

                                Delete

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
// CREATE NOTIFICATION
// =========================================================

function openCreateModal() {

    const form =
        document.getElementById(
            "notificationForm"
        );


    if (form) {

        form.reset();

    }


    setText(
        "notificationModalTitle",
        "Create Notification"
    );


    setValue(
        "notificationId",
        ""
    );


    const modal =
        document.getElementById(
            "notificationModal"
        );


    if (modal) {

        modal.hidden = false;

    }

}


// =========================================================
// EDIT NOTIFICATION
// =========================================================

function editNotification(id) {

    const notification =
        notifications.find(
            function (item) {

                return Number(item.id) ===
                    Number(id);

            }
        );


    if (!notification) {

        alert(
            "Notification not found."
        );

        return;

    }


    setText(
        "notificationModalTitle",
        "Edit Notification"
    );


    setValue(
        "notificationId",
        notification.id
    );


    setValue(
        "notificationStudent",
        notification.student
    );


    setValue(
        "notificationTitle",
        notification.title
    );


    setValue(
        "notificationMessage",
        notification.message
    );


    const readCheckbox =
        document.getElementById(
            "notificationRead"
        );


    if (readCheckbox) {

        readCheckbox.checked =
            notification.is_read === true;

    }


    const modal =
        document.getElementById(
            "notificationModal"
        );


    if (modal) {

        modal.hidden = false;

    }

}


// =========================================================
// SAVE NOTIFICATION
// =========================================================

async function saveNotification(
    event
) {

    event.preventDefault();


    const id =
        document.getElementById(
            "notificationId"
        ).value;


    const student =
        document.getElementById(
            "notificationStudent"
        ).value;


    const title =
        document.getElementById(
            "notificationTitle"
        ).value.trim();


    const message =
        document.getElementById(
            "notificationMessage"
        ).value.trim();


    const isRead =
        document.getElementById(
            "notificationRead"
        ).checked;


    if (!student) {

        alert(
            "Please select a student."
        );

        return;

    }


    if (!title) {

        alert(
            "Please enter a notification title."
        );

        return;

    }


    if (!message) {

        alert(
            "Please enter a notification message."
        );

        return;

    }


    const payload = {

        student:
            Number(student),

        title:
            title,

        message:
            message,

        is_read:
            isRead

    };


    try {

        let url =
            NOTIFICATIONS_API;


        let method =
            "POST";


        if (id) {

            url =
                `${API_BASE_URL}/notifications/detail/${id}/`;

            method =
                "PUT";

        }


        const response =
            await fetch(
                url,
                {
                    method:
                        method,

                    headers:
                        getAuthHeaders(),

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            console.error(
                "Notification save error:",
                data
            );


            alert(
                "Failed to save notification."
            );

            return;

        }


        alert(
            id
                ? "Notification updated successfully."
                : "Notification created successfully."
        );


        closeNotificationModal();


        loadNotifications();


    }
    catch (error) {

        console.error(
            "❌ Save notification error:",
            error
        );


        alert(
            "Unable to connect to the server."
        );

    }

}


// =========================================================
// VIEW NOTIFICATION
// =========================================================

function viewNotification(id) {

    const notification =
        notifications.find(
            function (item) {

                return Number(item.id) ===
                    Number(id);

            }
        );


    if (!notification) {

        alert(
            "Notification not found."
        );

        return;

    }


    setText(
        "viewNotificationTitle",
        notification.title ||
        "Notification"
    );


    setText(
        "viewNotificationStudent",
        notification.student_name ||
        "Student"
    );


    setText(
        "viewStudentName",
        notification.student_name ||
        "-"
    );


    setText(
        "viewStudentUSN",
        notification.usn ||
        "-"
    );


    setText(
        "viewNotificationStatus",
        notification.is_read
            ? "READ"
            : "UNREAD"
    );


    setText(
        "viewNotificationCreated",
        formatDate(
            notification.created_at
        )
    );


    setText(
        "viewNotificationMessage",
        notification.message ||
        "-"
    );


    const modal =
        document.getElementById(
            "viewNotificationModal"
        );


    if (modal) {

        modal.hidden = false;

    }

}


// =========================================================
// DELETE NOTIFICATION
// =========================================================

async function deleteNotification(id) {

    const notification =
        notifications.find(
            function (item) {

                return Number(item.id) ===
                    Number(id);

            }
        );


    if (!notification) {

        return;

    }


    const confirmed =
        confirm(
            `Delete notification "${notification.title}"?`
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/notifications/detail/${id}/`,
                {
                    method:
                        "DELETE",

                    headers:
                        getAuthHeaders()
                }
            );


        if (!response.ok) {

            const errorData =
                await response.json()
                    .catch(
                        function () {
                            return {};
                        }
                    );


            console.error(
                "Delete error:",
                errorData
            );


            alert(
                "Failed to delete notification."
            );

            return;

        }


        alert(
            "Notification deleted successfully."
        );


        loadNotifications();


    }
    catch (error) {

        console.error(
            "❌ Delete notification error:",
            error
        );


        alert(
            "Unable to connect to the server."
        );

    }

}


// =========================================================
// CLOSE CREATE / EDIT MODAL
// =========================================================

function closeNotificationModal() {

    const modal =
        document.getElementById(
            "notificationModal"
        );


    if (modal) {

        modal.hidden = true;

    }

}


// =========================================================
// CLOSE VIEW MODAL
// =========================================================

function closeViewNotificationModal() {

    const modal =
        document.getElementById(
            "viewNotificationModal"
        );


    if (modal) {

        modal.hidden = true;

    }

}


// =========================================================
// TABLE MESSAGE
// =========================================================

function showTableMessage(
    message
) {

    const tableBody =
        document.getElementById(
            "notificationTableBody"
        );


    if (!tableBody) {

        return;

    }


    tableBody.innerHTML = `

        <tr>

            <td
                colspan="8"
                class="table-empty">

                ${escapeHTML(
                    message
                )}

            </td>

        </tr>

    `;

}


// =========================================================
// SET TEXT
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
// SET INPUT VALUE
// =========================================================

function setValue(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.value =
            value ?? "";

    }

}


// =========================================================
// FORMAT DATE
// =========================================================

function formatDate(
    dateValue
) {

    if (!dateValue) {

        return "-";

    }


    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";

    }


    return date.toLocaleString(
        "en-IN",
        {
            dateStyle:
                "medium",

            timeStyle:
                "short"
        }
    );

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
        String(
            value ?? ""
        );


    return div.innerHTML;

}


// =========================================================
// LOGOUT
// =========================================================

function logout() {

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
        "user_email"
    );

    localStorage.removeItem(
        "user_role"
    );

    localStorage.removeItem(
        "studentName"
    );

    localStorage.removeItem(
        "username"
    );

    localStorage.removeItem(
        "user_id"
    );


    window.location.href =
        "../login.html";

}


// =========================================================
// DEBUG
// =========================================================

console.log(
    "🔔 alerts.js loaded successfully."
);