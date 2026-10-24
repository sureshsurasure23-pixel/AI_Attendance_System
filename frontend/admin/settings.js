
// =========================================================
// AI ATTEND - ADMIN SETTINGS
// =========================================================

console.log("⚙️ settings.js loaded successfully.");


// =========================================================
// DEFAULT SETTINGS
// =========================================================

const DEFAULT_SETTINGS = {

    adminName: "Administrator",

    adminEmail: "admin@example.com",

    minimumAttendance: 75,

    warningAttendance: 80,

    enableAttendanceAlerts: true,

    enableNotifications: true,

    attendanceNotifications: true,

    feeNotifications: true,

    aiNotifications: true,

    academicYear: "2026-27",

    defaultSemester: "3",

    themeMode: "light"

};


// =========================================================
// STORAGE KEY
// =========================================================

const SETTINGS_STORAGE_KEY =
    "ai_attend_admin_settings";


// =========================================================
// GET SETTINGS
// =========================================================

function getSettings() {

    try {

        const savedSettings =
            localStorage.getItem(
                SETTINGS_STORAGE_KEY
            );


        if (!savedSettings) {

            return {
                ...DEFAULT_SETTINGS
            };

        }


        return {

            ...DEFAULT_SETTINGS,

            ...JSON.parse(savedSettings)

        };

    }
    catch (error) {

        console.error(
            "❌ Failed to read settings:",
            error
        );

        return {
            ...DEFAULT_SETTINGS
        };

    }

}


// =========================================================
// SAVE SETTINGS TO STORAGE
// =========================================================

function saveSettingsToStorage(settings) {

    try {

        localStorage.setItem(
            SETTINGS_STORAGE_KEY,
            JSON.stringify(settings)
        );

        return true;

    }
    catch (error) {

        console.error(
            "❌ Failed to save settings:",
            error
        );

        return false;

    }

}


// =========================================================
// LOAD SETTINGS INTO FORM
// =========================================================

function loadSettings() {

    const settings =
        getSettings();


    document.getElementById(
        "adminName"
    ).value =
        settings.adminName;


    document.getElementById(
        "adminEmail"
    ).value =
        settings.adminEmail;


    document.getElementById(
        "minimumAttendance"
    ).value =
        settings.minimumAttendance;


    document.getElementById(
        "warningAttendance"
    ).value =
        settings.warningAttendance;


    document.getElementById(
        "enableAttendanceAlerts"
    ).checked =
        settings.enableAttendanceAlerts;


    document.getElementById(
        "enableNotifications"
    ).checked =
        settings.enableNotifications;


    document.getElementById(
        "attendanceNotifications"
    ).checked =
        settings.attendanceNotifications;


    document.getElementById(
        "feeNotifications"
    ).checked =
        settings.feeNotifications;


    document.getElementById(
        "aiNotifications"
    ).checked =
        settings.aiNotifications;


    document.getElementById(
        "academicYear"
    ).value =
        settings.academicYear;


    document.getElementById(
        "defaultSemester"
    ).value =
        settings.defaultSemester;


    document.getElementById(
        "themeMode"
    ).value =
        settings.themeMode;


    console.log(
        "⚙️ Settings loaded:",
        settings
    );

}


// =========================================================
// COLLECT SETTINGS FROM FORM
// =========================================================

function collectSettings() {

    return {

        adminName:
            document.getElementById(
                "adminName"
            ).value.trim(),


        adminEmail:
            document.getElementById(
                "adminEmail"
            ).value.trim(),


        minimumAttendance:
            Number(
                document.getElementById(
                    "minimumAttendance"
                ).value
            ),


        warningAttendance:
            Number(
                document.getElementById(
                    "warningAttendance"
                ).value
            ),


        enableAttendanceAlerts:
            document.getElementById(
                "enableAttendanceAlerts"
            ).checked,


        enableNotifications:
            document.getElementById(
                "enableNotifications"
            ).checked,


        attendanceNotifications:
            document.getElementById(
                "attendanceNotifications"
            ).checked,


        feeNotifications:
            document.getElementById(
                "feeNotifications"
            ).checked,


        aiNotifications:
            document.getElementById(
                "aiNotifications"
            ).checked,


        academicYear:
            document.getElementById(
                "academicYear"
            ).value,


        defaultSemester:
            document.getElementById(
                "defaultSemester"
            ).value,


        themeMode:
            document.getElementById(
                "themeMode"
            ).value

    };

}


// =========================================================
// VALIDATE SETTINGS
// =========================================================

function validateSettings(settings) {

    if (
        !settings.adminName
    ) {

        alert(
            "Please enter the administrator name."
        );

        return false;

    }


    if (
        !settings.adminEmail
    ) {

        alert(
            "Please enter the administrator email."
        );

        return false;

    }


    if (
        !settings.adminEmail.includes("@")
    ) {

        alert(
            "Please enter a valid email address."
        );

        return false;

    }


    if (
        Number.isNaN(
            settings.minimumAttendance
        ) ||
        settings.minimumAttendance < 0 ||
        settings.minimumAttendance > 100
    ) {

        alert(
            "Minimum attendance must be between 0 and 100."
        );

        return false;

    }


    if (
        Number.isNaN(
            settings.warningAttendance
        ) ||
        settings.warningAttendance < 0 ||
        settings.warningAttendance > 100
    ) {

        alert(
            "Warning attendance must be between 0 and 100."
        );

        return false;

    }


    if (
        settings.warningAttendance <
        settings.minimumAttendance
    ) {

        alert(
            "Warning attendance should not be lower than minimum attendance."
        );

        return false;

    }


    return true;

}


// =========================================================
// SHOW MESSAGE
// =========================================================

function showSettingsMessage(
    message,
    type = "success"
) {

    const messageBox =
        document.getElementById(
            "settingsMessage"
        );


    if (!messageBox) {

        return;

    }


    messageBox.textContent =
        message;


    messageBox.hidden =
        false;


    if (type === "error") {

        messageBox.style.background =
            "#fef2f2";

        messageBox.style.color =
            "#b91c1c";

    }
    else {

        messageBox.style.background =
            "#eff6ff";

        messageBox.style.color =
            "#1d4ed8";

    }


    setTimeout(
        function() {

            messageBox.hidden =
                true;

        },
        3000
    );

}


// =========================================================
// SAVE BUTTON
// =========================================================

function handleSaveSettings() {

    const settings =
        collectSettings();


    if (
        !validateSettings(
            settings
        )
    ) {

        return;

    }


    const saved =
        saveSettingsToStorage(
            settings
        );


    if (!saved) {

        showSettingsMessage(
            "Unable to save settings.",
            "error"
        );

        return;

    }


    console.log(
        "✅ Settings saved:",
        settings
    );


    showSettingsMessage(
        "Settings saved successfully."
    );

}


// =========================================================
// RESET BUTTON
// =========================================================

function handleResetSettings() {

    const confirmed =
        confirm(
            "Reset all settings to their default values?"
        );


    if (!confirmed) {

        return;

    }


    saveSettingsToStorage(
        DEFAULT_SETTINGS
    );


    loadSettings();


    showSettingsMessage(
        "Settings have been reset."
    );


    console.log(
        "↩️ Settings reset."
    );

}


// =========================================================
// LOGOUT
// =========================================================

function logout() {

    const confirmed =
        confirm(
            "Are you sure you want to logout?"
        );


    if (!confirmed) {

        return;

    }


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
// INITIALIZE SETTINGS PAGE
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        console.log(
            "⚙️ Settings page loaded."
        );


        loadSettings();


        const saveButton =
            document.getElementById(
                "saveSettingsBtn"
            );


        if (saveButton) {

            saveButton.addEventListener(
                "click",
                handleSaveSettings
            );

        }


        const resetButton =
            document.getElementById(
                "resetSettingsBtn"
            );


        if (resetButton) {

            resetButton.addEventListener(
                "click",
                handleResetSettings
            );

        }


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


        console.log(
            "✅ Settings page initialized."
        );

    }
);
