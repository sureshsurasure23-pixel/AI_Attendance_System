/* =========================================================
   AI ATTEND - STUDENT ALERTS
   Complete alerts.js
   ========================================================= */

const API_BASE_URL = "http://127.0.0.1:8000";


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const alertsContainer = document.getElementById("alertsContainer");
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const emptyState = document.getElementById("emptyState");
const errorMessage = document.getElementById("errorMessage");

const unreadCount = document.getElementById("unreadCount");
const markAllReadBtn = document.getElementById("markAllReadBtn");
const refreshBtn = document.getElementById("refreshBtn");
const retryBtn = document.getElementById("retryBtn");

const topStudentName = document.getElementById("topStudentName");
const studentAvatar = document.getElementById("studentAvatar");
const logoutBtn = document.getElementById("logoutBtn");


/* =========================================================
   GET STORED USER DATA
   ========================================================= */

function getStoredUserData() {

    const possibleKeys = [
        "userData",
        "user"
    ];

    for (const key of possibleKeys) {

        const value = localStorage.getItem(key);

        if (!value) {
            continue;
        }

        try {

            const parsed = JSON.parse(value);

            if (parsed && typeof parsed === "object") {
                return parsed;
            }

        } catch (error) {

            console.warn(
                `Could not parse localStorage key: ${key}`
            );
        }
    }

    return null;
}


/* =========================================================
   GET CURRENT STUDENT INFORMATION
   ========================================================= */

function getStudentInfo() {

    let studentId =
        localStorage.getItem("studentId");

    let studentDbId =
        localStorage.getItem("student_db_id");

    const userData =
        getStoredUserData();


    /*
       Try to recover Student ID from userData
       if localStorage studentId is missing.
    */

    if (!studentId && userData) {

        studentId =
            userData.student_id ||
            userData.student_code ||
            userData.studentId ||
            userData.studentID ||
            null;
    }


    /*
       Try to recover database ID.
    */

    if (!studentDbId && userData) {

        studentDbId =
            userData.student_db_id ||
            userData.studentDbId ||
            userData.student_id_pk ||
            null;
    }


    /*
       Save recovered values.
    */

    if (studentId) {

        localStorage.setItem(
            "studentId",
            String(studentId)
        );
    }

    if (studentDbId) {

        localStorage.setItem(
            "student_db_id",
            String(studentDbId)
        );
    }


    return {
        studentId: studentId
            ? String(studentId)
            : null,

        studentDbId: studentDbId
            ? String(studentDbId)
            : null,

        userData: userData
    };
}


/* =========================================================
   ACCESS TOKEN
   ========================================================= */

function getAccessToken() {

    return localStorage.getItem(
        "access_token"
    );
}


/* =========================================================
   PAGE STATE - LOADING
   ========================================================= */

function showLoading() {

    if (loadingState) {
        loadingState.style.display = "flex";
    }

    if (errorState) {
        errorState.style.display = "none";
    }

    if (emptyState) {
        emptyState.style.display = "none";
    }

    if (alertsContainer) {
        alertsContainer.innerHTML = "";
    }
}


/* =========================================================
   PAGE STATE - ERROR
   ========================================================= */

function showError(message) {

    if (loadingState) {
        loadingState.style.display = "none";
    }

    if (errorState) {
        errorState.style.display = "flex";
    }

    if (emptyState) {
        emptyState.style.display = "none";
    }

    if (errorMessage) {
        errorMessage.textContent =
            message || "Something went wrong.";
    }

    if (alertsContainer) {
        alertsContainer.innerHTML = "";
    }
}


/* =========================================================
   PAGE STATE - EMPTY
   ========================================================= */

function showEmpty() {

    if (loadingState) {
        loadingState.style.display = "none";
    }

    if (errorState) {
        errorState.style.display = "none";
    }

    if (emptyState) {
        emptyState.style.display = "flex";
    }

    if (alertsContainer) {
        alertsContainer.innerHTML = "";
    }
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatDate(dateValue) {

    if (!dateValue) {
        return "";
    }

    const date =
        new Date(dateValue);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
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


/* =========================================================
   GET NOTIFICATION ICON
   ========================================================= */

function getNotificationIcon(notification) {

    const type =
        String(
            notification.type ||
            notification.notification_type ||
            notification.category ||
            ""
        ).toLowerCase();

    const title =
        String(
            notification.title ||
            notification.subject ||
            ""
        ).toLowerCase();

    const message =
        String(
            notification.message ||
            notification.description ||
            notification.body ||
            ""
        ).toLowerCase();

    const text =
        `${type} ${title} ${message}`;


    if (
        text.includes("attendance") ||
        text.includes("absent") ||
        text.includes("shortage") ||
        text.includes("percentage")
    ) {
        return "⚠";
    }


    if (
        text.includes("ai") ||
        text.includes("prediction") ||
        text.includes("risk")
    ) {
        return "✦";
    }


    if (
        text.includes("academic") ||
        text.includes("mark") ||
        text.includes("exam") ||
        text.includes("result")
    ) {
        return "▤";
    }


    if (
        text.includes("success") ||
        text.includes("completed")
    ) {
        return "✓";
    }


    return "🔔";
}


/* =========================================================
   UPDATE STUDENT INFORMATION
   ========================================================= */

function updateStudentInfo(
    notifications = []
) {

    const student =
        getStudentInfo();

    let name = "Student";


    /*
       Get name from localStorage userData.
    */

    if (student.userData) {

        name =
            student.userData.name ||
            student.userData.full_name ||
            student.userData.fullName ||
            student.userData.username ||
            name;
    }


    /*
       Try notification student name.
    */

    if (
        Array.isArray(notifications) &&
        notifications.length > 0
    ) {

        const notification =
            notifications[0];

        name =
            notification.student_name ||
            notification.student?.name ||
            notification.student?.full_name ||
            name;
    }


    if (topStudentName) {

        topStudentName.textContent =
            name;
    }


    if (studentAvatar) {

        const firstLetter =
            String(name)
                .trim()
                .charAt(0)
                .toUpperCase();

        studentAvatar.textContent =
            firstLetter || "S";
    }
}


/* =========================================================
   REFRESH JWT ACCESS TOKEN
   ========================================================= */

async function refreshAccessToken() {

    const refreshToken =
        localStorage.getItem(
            "refresh_token"
        );

    if (!refreshToken) {

        console.warn(
            "Refresh token not found."
        );

        return false;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/accounts/token/refresh/`,
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


        if (!response.ok) {

            console.warn(
                "Token refresh failed:",
                response.status
            );

            return false;
        }


        const data =
            await response.json();


        if (!data.access) {

            console.warn(
                "No access token returned."
            );

            return false;
        }


        localStorage.setItem(
            "access_token",
            data.access
        );


        return true;

    } catch (error) {

        console.error(
            "Token refresh error:",
            error
        );

        return false;
    }
}


/* =========================================================
   GET NOTIFICATIONS FROM API
   ========================================================= */

async function fetchNotifications() {

    const student =
        getStudentInfo();


    console.log(
        "======================================"
    );

    console.log(
        "AI ATTEND - ALERTS API"
    );

    console.log(
        "Student ID:",
        student.studentId
    );

    console.log(
        "Student DB ID:",
        student.studentDbId
    );

    console.log(
        "Access token available:",
        Boolean(getAccessToken())
    );

    console.log(
        "======================================"
    );


    /*
       Student ID is required.
    */

    if (!student.studentId) {

        showError(
            "Student ID could not be found. Please login again."
        );

        return;
    }


    let token =
        getAccessToken();


    /*
       Access token is required.
    */

    if (!token) {

        showError(
            "Login session expired. Please login again."
        );

        return;
    }


    /*
       Correct notification endpoint.
    */

    const url =
        `${API_BASE_URL}/notifications/student/${encodeURIComponent(student.studentId)}/`;


    console.log(
        "Notifications URL:",
        url
    );


    try {

        let response =
            await fetch(
                url,
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


        /*
           If JWT expired, refresh it.
        */

        if (response.status === 401) {

            console.log(
                "Access token expired. Refreshing..."
            );


            const refreshed =
                await refreshAccessToken();


            if (!refreshed) {

                showError(
                    "Your login session has expired. Please login again."
                );

                return;
            }


            token =
                getAccessToken();


            response =
                await fetch(
                    url,
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


        /*
           Handle API errors.
        */

        if (!response.ok) {

            let message =
                `Unable to load alerts. Server returned ${response.status}.`;


            try {

                const errorData =
                    await response.json();


                if (errorData.detail) {

                    message =
                        errorData.detail;

                } else if (errorData.message) {

                    message =
                        errorData.message;
                }

            } catch (error) {

                console.warn(
                    "Could not read error response."
                );
            }


            console.error(
                "Notification API error:",
                response.status
            );


            showError(message);

            return;
        }


        /*
           Read JSON response.
        */

        const data =
            await response.json();


        console.log(
            "Notifications API response:",
            data
        );


        let notifications = [];


        /*
           Support normal DRF list.
        */

        if (Array.isArray(data)) {

            notifications =
                data;
        }


        /*
           Support paginated DRF response.
        */

        else if (
            data &&
            Array.isArray(data.results)
        ) {

            notifications =
                data.results;
        }


        /*
           Support:
           {
              notifications: [...]
           }
        */

        else if (
            data &&
            Array.isArray(
                data.notifications
            )
        ) {

            notifications =
                data.notifications;
        }


        /*
           Support:
           {
              data: [...]
           }
        */

        else if (
            data &&
            Array.isArray(data.data)
        ) {

            notifications =
                data.data;
        }


        updateStudentInfo(
            notifications
        );


        renderNotifications(
            notifications
        );

    } catch (error) {

        console.error(
            "Notifications connection error:",
            error
        );


        showError(
            "Could not connect to the attendance server. Make sure Django is running."
        );
    }
}


/* =========================================================
   RENDER NOTIFICATIONS
   ========================================================= */

function renderNotifications(
    notifications
) {

    if (loadingState) {
        loadingState.style.display =
            "none";
    }

    if (errorState) {
        errorState.style.display =
            "none";
    }


    /*
       No notifications.
    */

    if (
        !Array.isArray(notifications) ||
        notifications.length === 0
    ) {

        if (unreadCount) {
            unreadCount.textContent =
                "0";
        }

        showEmpty();

        return;
    }


    if (emptyState) {
        emptyState.style.display =
            "none";
    }


    if (alertsContainer) {
        alertsContainer.innerHTML =
            "";
    }


    let unread = 0;


    notifications.forEach(
        notification => {

            /*
               Determine read status.
            */

            const isRead =
                notification.is_read === true ||
                notification.read === true;


            if (!isRead) {
                unread++;
            }


            /*
               Create notification card.
            */

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "notification-item" +
                (
                    isRead
                        ? ""
                        : " unread"
                );


            /*
               Notification title.
            */

            const title =
                notification.title ||
                notification.subject ||
                notification.heading ||
                "Notification";


            /*
               Notification message.
            */

            const message =
                notification.message ||
                notification.description ||
                notification.body ||
                notification.text ||
                "No message available.";


            /*
               Notification date.
            */

            const createdAt =
                notification.created_at ||
                notification.timestamp ||
                notification.date ||
                notification.created ||
                notification.sent_at ||
                null;


            /*
               Notification ID.
            */

            const notificationId =
                notification.id;


            /*
               Card HTML.
            */

            item.innerHTML = `

                <div class="notification-icon">
                    ${getNotificationIcon(notification)}
                </div>


                <div class="notification-content">

                    <h3>
                        ${escapeHTML(title)}
                    </h3>


                    <p>
                        ${escapeHTML(message)}
                    </p>


                    <div class="notification-time">

                        ${escapeHTML(
                            formatDate(createdAt)
                        )}

                    </div>

                </div>


                <div class="notification-action">

                    ${
                        !isRead
                        ?
                        `
                            <button
                                class="notification-read-btn"
                                type="button"
                                data-id="${escapeHTML(
                                    notificationId
                                )}">

                                Mark Read

                            </button>
                        `
                        :
                        `
                            <span class="notification-read-label">

                                ✓ Read

                            </span>
                        `
                    }

                </div>

            `;


            /*
               Mark individual notification as read.
            */

            const readButton =
                item.querySelector(
                    ".notification-read-btn"
                );


            if (readButton) {

                readButton.addEventListener(
                    "click",
                    async function () {

                        await markNotificationRead(
                            notificationId,
                            item,
                            readButton
                        );
                    }
                );
            }


            if (alertsContainer) {

                alertsContainer.appendChild(
                    item
                );
            }
        }
    );


    /*
       Update unread number.
    */

    if (unreadCount) {

        unreadCount.textContent =
            unread;
    }
}


/* =========================================================
   MARK ONE NOTIFICATION AS READ
   ========================================================= */

async function markNotificationRead(
    notificationId,
    item,
    button
) {

    if (!notificationId) {

        console.warn(
            "Notification ID missing."
        );

        return;
    }


    let token =
        getAccessToken();


    if (!token) {

        return;
    }


    try {

        button.disabled =
            true;

        button.textContent =
            "Updating...";


        let response =
            await fetch(
                `${API_BASE_URL}/notifications/${notificationId}/read/`,
                {
                    method: "PATCH",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        is_read: true
                    })
                }
            );


        /*
           Refresh JWT if expired.
        */

        if (response.status === 401) {

            const refreshed =
                await refreshAccessToken();


            if (!refreshed) {

                button.disabled =
                    false;

                button.textContent =
                    "Mark Read";

                return;
            }


            token =
                getAccessToken();


            response =
                await fetch(
                    `${API_BASE_URL}/notifications/${notificationId}/read/`,
                    {
                        method: "PATCH",

                        headers: {
                            "Authorization":
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            is_read: true
                        })
                    }
                );
        }


        if (!response.ok) {

            console.error(
                "Mark read failed:",
                response.status
            );


            button.disabled =
                false;

            button.textContent =
                "Mark Read";

            return;
        }


        /*
           Update UI.
        */

        item.classList.remove(
            "unread"
        );


        const readLabel =
            createReadLabel();


        button.replaceWith(
            readLabel
        );


        updateUnreadCount();

    } catch (error) {

        console.error(
            "Mark notification read error:",
            error
        );


        button.disabled =
            false;

        button.textContent =
            "Mark Read";
    }
}


/* =========================================================
   CREATE READ LABEL
   ========================================================= */

function createReadLabel() {

    const label =
        document.createElement(
            "span"
        );


    label.className =
        "notification-read-label";


    label.textContent =
        "✓ Read";


    return label;
}


/* =========================================================
   UPDATE UNREAD COUNT
   ========================================================= */

function updateUnreadCount() {

    const unreadItems =
        document.querySelectorAll(
            ".notification-item.unread"
        );


    if (unreadCount) {

        unreadCount.textContent =
            unreadItems.length;
    }
}


/* =========================================================
   MARK ALL NOTIFICATIONS AS READ
   ========================================================= */

async function markAllNotificationsRead() {

    const buttons =
        Array.from(
            document.querySelectorAll(
                ".notification-read-btn"
            )
        );


    if (buttons.length === 0) {

        if (unreadCount) {
            unreadCount.textContent =
                "0";
        }

        return;
    }


    if (markAllReadBtn) {

        markAllReadBtn.disabled =
            true;

        markAllReadBtn.textContent =
            "Updating...";
    }


    /*
       Process every unread notification.
    */

    for (const button of buttons) {

        const notificationId =
            button.dataset.id;


        const item =
            button.closest(
                ".notification-item"
            );


        await markNotificationRead(
            notificationId,
            item,
            button
        );
    }


    if (markAllReadBtn) {

        markAllReadBtn.disabled =
            false;

        markAllReadBtn.textContent =
            "✓ Mark All Read";
    }


    updateUnreadCount();
}


/* =========================================================
   LOAD ALERTS
   ========================================================= */

async function loadAlerts() {

    showLoading();

    await fetchNotifications();
}


/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {

    const keysToRemove = [

        "access_token",
        "refresh_token",

        "studentId",
        "student_db_id",

        "role",
        "user_role",

        "user",
        "userData",

        "user_id",
        "username",
        "user_email",

        "studentName"
    ];


    keysToRemove.forEach(
        key => {

            localStorage.removeItem(
                key
            );
        }
    );


    window.location.href =
        "../login/login.html";
}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        function () {

            loadAlerts();
        }
    );
}


if (retryBtn) {

    retryBtn.addEventListener(
        "click",
        function () {

            loadAlerts();
        }
    );
}


if (markAllReadBtn) {

    markAllReadBtn.addEventListener(
        "click",
        function () {

            markAllNotificationsRead();
        }
    );
}


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            logout();
        }
    );
}


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const student =
            getStudentInfo();


        console.log(
            "======================================"
        );

        console.log(
            "AI ATTEND - ALERTS PAGE"
        );

        console.log(
            "Student ID:",
            student.studentId
        );

        console.log(
            "Student DB ID:",
            student.studentDbId
        );

        console.log(
            "Access token available:",
            Boolean(
                getAccessToken()
            )
        );

        console.log(
            "======================================"
        );


        /*
           Load notifications.
        */

        loadAlerts();
    }
);