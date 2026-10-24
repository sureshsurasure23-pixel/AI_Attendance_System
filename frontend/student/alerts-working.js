/* =========================================================
   AI ATTEND - STUDENT ALERTS
   ========================================================= */

console.log("🔔 Alerts JavaScript started.");


// =========================================================
// CONFIGURATION
// =========================================================

const API_BASE_URL = "http://127.0.0.1:8000";

const STUDENT_ID_KEY = "studentId";


// =========================================================
// GET STUDENT ID
// =========================================================

function getStudentId() {

    const studentId = Number(
        localStorage.getItem(STUDENT_ID_KEY)
    );

    console.log("👤 Student ID:", studentId);

    if (!studentId) {

        console.error(
            "❌ Student ID not found in localStorage."
        );

        return null;
    }

    return studentId;
}


// =========================================================
// GET ACCESS TOKEN
// =========================================================

function getAccessToken() {

    const token =
        localStorage.getItem("access_token");

    console.log(
        "🔐 Access token:",
        token ? "Available" : "Missing"
    );

    return token;
}


// =========================================================
// DOM READY
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "🚀 Alerts DOM loaded."
        );

        initializeAlertsPage();

    }
);


// =========================================================
// INITIALIZE
// =========================================================

function initializeAlertsPage() {

    setupRefreshButton();

    setupRetryButton();

    setupLogoutButton();

    setupMarkAllReadButton();

    loadNotifications();

}


// =========================================================
// GET ELEMENT
// =========================================================

function getElement(id) {

    return document.getElementById(id);

}


// =========================================================
// LOAD NOTIFICATIONS
// =========================================================

async function loadNotifications() {

    console.log(
        "🔄 Loading student notifications..."
    );

    showLoading();

    hideError();

    try {

        const studentId =
            getStudentId();

        if (!studentId) {

            throw new Error(
                "Student ID could not be found."
            );

        }


        const accessToken =
            getAccessToken();

        if (!accessToken) {

            throw new Error(
                "Access token not found. Please login again."
            );

        }


        const API_URL =
            `${API_BASE_URL}/notifications/student/${studentId}/`;


        console.log(
            "📡 Notification API:",
            API_URL
        );


        let response =
            await fetch(
                API_URL,
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


        console.log(
            "📡 Notification API status:",
            response.status
        );


        // =================================================
        // TOKEN EXPIRED
        // =================================================

        if (response.status === 401) {

            console.warn(
                "⚠️ Access token expired."
            );

            const refreshToken =
                localStorage.getItem(
                    "refresh_token"
                );


            if (!refreshToken) {

                throw new Error(
                    "Session expired. Please login again."
                );

            }


            const refreshResponse =
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


            if (!refreshResponse.ok) {

                throw new Error(
                    "Session expired. Please login again."
                );

            }


            const refreshData =
                await refreshResponse.json();


            localStorage.setItem(
                "access_token",
                refreshData.access
            );


            console.log(
                "✅ Access token refreshed."
            );


            // Retry API request

            response =
                await fetch(
                    API_URL,
                    {
                        method: "GET",

                        headers: {
                            "Authorization":
                                `Bearer ${refreshData.access}`,

                            "Content-Type":
                                "application/json"
                        }
                    }
                );


            console.log(
                "📡 Retry status:",
                response.status
            );

        }


        // =================================================
        // API ERROR
        // =================================================

        if (!response.ok) {

            throw new Error(
                `Notification API failed with status ${response.status}`
            );

        }


        // =================================================
        // READ JSON
        // =================================================

        const notifications =
            await response.json();


        console.log(
            "🔔 Notifications:",
            notifications
        );


        displayNotifications(
            notifications
        );


        hideLoading();

        showNotificationsContent();


        console.log(
            "🎉 Notifications loaded successfully."
        );


    } catch (error) {

        console.error(
            "❌ Notification error:",
            error
        );


        showError(
            error.message ||
            "Failed to load notifications."
        );

    }

}


// =========================================================
// DISPLAY NOTIFICATIONS
// =========================================================

function displayNotifications(
    notifications
) {

    console.log(
        "📊 Displaying notifications..."
    );


    if (!Array.isArray(notifications)) {

        console.warn(
            "⚠️ Notifications response is not an array."
        );

        notifications = [];

    }


    console.log(
        "🔔 Notifications count:",
        notifications.length
    );


    // =====================================================
    // FIND CONTAINER
    // =====================================================

    const container =
        getElement("alertsContainer");


    if (!container) {

        console.warn(
            "⚠️ alertsContainer not found."
        );

        return;

    }


    // Clear old notifications

    container.innerHTML = "";


    // =====================================================
    // EMPTY STATE
    // =====================================================

    if (notifications.length === 0) {

        container.innerHTML = `
            <div class="empty-notifications">
                <div class="empty-icon">🔔</div>

                <h3>No Notifications</h3>

                <p>
                    You don't have any notifications right now.
                </p>
            </div>
        `;

        updateNotificationCount(
            notifications
        );

        return;

    }


    // =====================================================
    // CREATE NOTIFICATIONS
    // =====================================================

    notifications.forEach(
        function (notification) {

            const item =
                document.createElement("div");


            item.className =
                "notification-item";


            if (!notification.is_read) {

                item.classList.add(
                    "unread"
                );

            }


            const title =
                notification.title ||
                "Notification";


            const message =
                notification.message ||
                "";


            const createdAt =
                formatDate(
                    notification.created_at
                );


            item.innerHTML = `

                <div class="notification-icon">
                    🔔
                </div>

                <div class="notification-content">

                    <h3>
                        ${escapeHTML(title)}
                    </h3>

                    <p>
                        ${escapeHTML(message)}
                    </p>

                    <span class="notification-time">
                        ${createdAt}
                    </span>

                </div>

                ${
                    !notification.is_read
                    ?
                    `<span class="unread-dot"></span>`
                    :
                    ""
                }

            `;


            container.appendChild(
                item
            );

        }
    );


    updateNotificationCount(
        notifications
    );


    console.log(
        "✅ Notifications displayed."
    );

}


// =========================================================
// UPDATE NOTIFICATION COUNT
// =========================================================

function updateNotificationCount(
    notifications
) {

    const total =
        notifications.length;


    const unread =
        notifications.filter(
            function (notification) {

                return !notification.is_read;

            }
        ).length;


    console.log(
        "📬 Unread notifications:",
        unread
    );


    const totalElement =
        getElement("notificationCount");


    if (totalElement) {

        totalElement.textContent =
            total;

    }


    const unreadElement =
        getElement("unreadCount");


    if (unreadElement) {

        unreadElement.textContent =
            unread;

    }


    // Common alternate IDs

    const badge =
        getElement("notificationBadge");


    if (badge) {

        badge.textContent =
            unread;

        badge.style.display =
            unread > 0
                ? "inline-flex"
                : "none";

    }

}


// =========================================================
// MARK ALL AS READ
// =========================================================

async function markAllNotificationsAsRead() {

    console.log(
        "📖 Mark all notifications as read."
    );


    try {

        const studentId =
            getStudentId();


        if (!studentId) {

            throw new Error(
                "Student ID could not be found."
            );

        }


        const accessToken =
            getAccessToken();


        if (!accessToken) {

            throw new Error(
                "Access token not found."
            );

        }


        // First get all notifications

        const API_URL =
            `${API_BASE_URL}/notifications/student/${studentId}/`;


        const response =
            await fetch(
                API_URL,
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


        if (!response.ok) {

            throw new Error(
                `Unable to get notifications. Status: ${response.status}`
            );

        }


        const notifications =
            await response.json();


        console.log(
            "📬 Notifications to update:",
            notifications.length
        );


        // =================================================
        // UPDATE EACH UNREAD NOTIFICATION
        // =================================================

        for (
            const notification
            of notifications
        ) {

            if (
                notification.is_read
            ) {

                continue;

            }


            const detailURL =
                `${API_BASE_URL}/notifications/detail/${notification.id}/`;


            const updateResponse =
                await fetch(
                    detailURL,
                    {
                        method: "PUT",

                        headers: {
                            "Authorization":
                                `Bearer ${accessToken}`,

                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            is_read: true
                        })
                    }
                );


            console.log(
                `📖 Notification ${notification.id} update status:`,
                updateResponse.status
            );


            if (!updateResponse.ok) {

                console.warn(
                    `⚠️ Could not mark notification ${notification.id} as read.`
                );

            }

        }


        console.log(
            "✅ All notifications marked as read."
        );


        // Reload notifications

        await loadNotifications();


    } catch (error) {

        console.error(
            "❌ Mark all read error:",
            error
        );


        showError(
            error.message ||
            "Unable to mark notifications as read."
        );

    }

}


// =========================================================
// MARK ALL READ BUTTON
// =========================================================

function setupMarkAllReadButton() {

    const button =
        getElement(
            "markAllReadBtn"
        );


    if (!button) {

        console.warn(
            "⚠️ markAllReadBtn not found."
        );

        return;

    }


    button.addEventListener(
        "click",
        async function () {

            button.disabled =
                true;


            try {

                await markAllNotificationsAsRead();

            } finally {

                button.disabled =
                    false;

            }

        }
    );

}


// =========================================================
// REFRESH BUTTON
// =========================================================

function setupRefreshButton() {

    const button =
        getElement(
            "refreshBtn"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        async function () {

            console.log(
                "🔄 Manual notification refresh..."
            );


            button.disabled =
                true;


            try {

                await loadNotifications();

            } finally {

                button.disabled =
                    false;

            }

        }
    );

}


// =========================================================
// RETRY BUTTON
// =========================================================

function setupRetryButton() {

    const button =
        getElement(
            "retryBtn"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        async function () {

            console.log(
                "🔁 Retrying notifications..."
            );


            await loadNotifications();

        }
    );

}


// =========================================================
// LOGOUT
// =========================================================

function setupLogoutButton() {

    const button =
        getElement(
            "logoutBtn"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        function (event) {

            event.preventDefault();


            console.log(
                "🚪 Logging out..."
            );


            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "refresh_token"
            );

            localStorage.removeItem(
                "studentId"
            );


            window.location.href =
                "login.html";

        }
    );

}


// =========================================================
// FORMAT DATE
// =========================================================

function formatDate(
    dateString
) {

    if (!dateString) {

        return "Recently";

    }


    try {

        const date =
            new Date(dateString);


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

    } catch (error) {

        return "Recently";

    }

}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(value) {

    if (
        value === undefined ||
        value === null
    ) {

        return "";

    }


    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// =========================================================
// SHOW LOADING
// =========================================================

function showLoading() {

    const loading =
        getElement(
            "loadingState"
        );


    const content =
        getElement(
            "notificationsContent"
        );


    if (loading) {

        loading.style.display =
            "block";

    }


    if (content) {

        content.style.display =
            "none";

    }

}


// =========================================================
// HIDE LOADING
// =========================================================

function hideLoading() {

    const loading =
        getElement(
            "loadingState"
        );


    if (loading) {

        loading.style.display =
            "none";

    }

}


// =========================================================
// SHOW NOTIFICATION CONTENT
// =========================================================

function showNotificationsContent() {

    const content =
        getElement(
            "notificationsContent"
        );


    if (content) {

        content.style.display =
            "block";

    }

}


// =========================================================
// SHOW ERROR
// =========================================================

function showError(message) {

    hideLoading();


    const errorState =
        getElement(
            "errorState"
        );


    const errorMessage =
        getElement(
            "errorMessage"
        );


    const content =
        getElement(
            "notificationsContent"
        );


    if (content) {

        content.style.display =
            "none";

    }


    if (errorMessage) {

        errorMessage.textContent =
            message;

    }


    if (errorState) {

        errorState.style.display =
            "block";

    }

}


// =========================================================
// HIDE ERROR
// =========================================================

function hideError() {

    const errorState =
        getElement(
            "errorState"
        );


    if (errorState) {

        errorState.style.display =
            "none";

    }

}


// =========================================================
// FINISHED
// =========================================================

console.log(
    "✅ NEW alerts.js loaded successfully."
);

