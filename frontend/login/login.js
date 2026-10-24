/* =========================================
   SRINIVAS UNIVERSITY
   ATTENDANCE MONITORING SYSTEM
   LOGIN JAVASCRIPT
========================================= */


/* =========================================
   API CONFIGURATION
========================================= */

const API_BASE_URL = "http://127.0.0.1:8000";

const TOKEN_URL =
    `${API_BASE_URL}/accounts/token/`;

const REFRESH_TOKEN_URL =
    `${API_BASE_URL}/accounts/token/refresh/`;

const PROFILE_URL =
    `${API_BASE_URL}/accounts/profile/`;


/* =========================================
   ELEMENTS
========================================= */

const loginForm =
    document.getElementById("loginForm");

const usernameInput =
    document.getElementById("username");

const passwordInput =
    document.getElementById("password");

const togglePassword =
    document.getElementById("togglePassword");

const loginButton =
    document.getElementById("loginButton");

const loginButtonText =
    document.getElementById("loginButtonText");

const loadingSpinner =
    document.getElementById("loadingSpinner");

const errorMessage =
    document.getElementById("errorMessage");

const successMessage =
    document.getElementById("successMessage");


/* =========================================
   PASSWORD SHOW / HIDE
========================================= */

if (togglePassword) {

    togglePassword.addEventListener(
        "click",
        function () {

            if (passwordInput.type === "password") {

                passwordInput.type = "text";

                togglePassword.textContent = "🙈";

                togglePassword.setAttribute(
                    "aria-label",
                    "Hide password"
                );

            } else {

                passwordInput.type = "password";

                togglePassword.textContent = "👁";

                togglePassword.setAttribute(
                    "aria-label",
                    "Show password"
                );
            }

        }
    );

}


/* =========================================
   MESSAGE FUNCTIONS
========================================= */

function showError(message) {

    if (errorMessage) {

        errorMessage.textContent = message;

        errorMessage.style.display = "block";
    }

    if (successMessage) {

        successMessage.textContent = "";

        successMessage.style.display = "none";
    }
}


function showSuccess(message) {

    if (successMessage) {

        successMessage.textContent = message;

        successMessage.style.display = "block";
    }

    if (errorMessage) {

        errorMessage.textContent = "";

        errorMessage.style.display = "none";
    }
}


function clearMessages() {

    if (errorMessage) {

        errorMessage.textContent = "";

        errorMessage.style.display = "none";
    }

    if (successMessage) {

        successMessage.textContent = "";

        successMessage.style.display = "none";
    }
}


/* =========================================
   LOADING STATE
========================================= */

function setLoading(isLoading) {

    if (loginButton) {

        loginButton.disabled = isLoading;
    }

    if (isLoading) {

        if (loginButtonText) {

            loginButtonText.style.visibility =
                "hidden";
        }

        if (loadingSpinner) {

            loadingSpinner.style.display =
                "block";
        }

    } else {

        if (loginButtonText) {

            loginButtonText.style.visibility =
                "visible";
        }

        if (loadingSpinner) {

            loadingSpinner.style.display =
                "none";
        }
    }
}


/* =========================================
   CLEAR OLD LOGIN DATA
========================================= */

function clearOldUserData() {

    const keys = [

        /* JWT */
        "access_token",
        "refresh_token",

        /* User */
        "user_id",
        "username",
        "user_email",
        "user_role",
        "user",
        "userData",

        /* Student */
        "studentId",
        "student_db_id",
        "studentName",

        /* Faculty */
        "facultyId",

        /* Parent */
        "parent_id",
        "parent_name",

        "parent_student_db_id",
        "parent_student_id",
        "parent_student_name",
        "parent_student_usn",
        "parent_student_semester",
        "parent_student_section",
        "parent_student_department"

    ];

    keys.forEach(function (key) {

        localStorage.removeItem(key);

    });

}


/* =========================================
   SAVE USER DATA
========================================= */

function saveUserData(user) {

    /* -----------------------------------------
       BASIC USER INFORMATION
    ----------------------------------------- */

    if (
        user.id !== undefined &&
        user.id !== null
    ) {

        localStorage.setItem(
            "user_id",
            String(user.id)
        );
    }

    localStorage.setItem(
        "username",
        user.username || ""
    );

    localStorage.setItem(
        "user_email",
        user.email || ""
    );

    localStorage.setItem(
        "user_role",
        user.role || ""
    );


    /* -----------------------------------------
       SAVE COMPLETE USER PROFILE
    ----------------------------------------- */

    try {

        localStorage.setItem(
            "userData",
            JSON.stringify(user)
        );

        localStorage.setItem(
            "user",
            JSON.stringify(user)
        );

    } catch (error) {

        console.warn(
            "Unable to save complete user profile:",
            error
        );
    }


    /* -----------------------------------------
       STUDENT INFORMATION
    ----------------------------------------- */

    if (
        user.student_id !== undefined &&
        user.student_id !== null &&
        user.student_id !== ""
    ) {

        localStorage.setItem(
            "studentId",
            String(user.student_id)
        );

    } else {

        localStorage.removeItem(
            "studentId"
        );
    }


    if (
        user.student_db_id !== undefined &&
        user.student_db_id !== null &&
        user.student_db_id !== ""
    ) {

        localStorage.setItem(
            "student_db_id",
            String(user.student_db_id)
        );

    } else {

        localStorage.removeItem(
            "student_db_id"
        );
    }


    /* -----------------------------------------
       STUDENT NAME
    ----------------------------------------- */

    if (
        user.student_name !== undefined &&
        user.student_name !== null &&
        user.student_name !== ""
    ) {

        localStorage.setItem(
            "studentName",
            String(user.student_name)
        );

    } else if (
        user.role === "STUDENT" &&
        user.username
    ) {

        /*
           Do not assume username is the student's
           real name. Only use it as a fallback.
        */

        localStorage.removeItem(
            "studentName"
        );

    } else {

        localStorage.removeItem(
            "studentName"
        );
    }


    /* -----------------------------------------
       FACULTY INFORMATION
    ----------------------------------------- */

    if (
        user.faculty_id !== undefined &&
        user.faculty_id !== null &&
        user.faculty_id !== ""
    ) {

        localStorage.setItem(
            "facultyId",
            String(user.faculty_id)
        );

    } else {

        localStorage.removeItem(
            "facultyId"
        );
    }


    /* -----------------------------------------
       PARENT INFORMATION
    ----------------------------------------- */

    if (
        user.parent_id !== undefined &&
        user.parent_id !== null &&
        user.parent_id !== ""
    ) {

        localStorage.setItem(
            "parent_id",
            String(user.parent_id)
        );

    } else {

        localStorage.removeItem(
            "parent_id"
        );
    }


    if (
        user.parent_name !== undefined &&
        user.parent_name !== null &&
        user.parent_name !== ""
    ) {

        localStorage.setItem(
            "parent_name",
            String(user.parent_name)
        );

    } else {

        localStorage.removeItem(
            "parent_name"
        );
    }


    /* -----------------------------------------
       PARENT'S LINKED STUDENT
    ----------------------------------------- */

    if (
        String(user.role || "").toUpperCase() === "PARENT" &&
        user.student_db_id !== undefined &&
        user.student_db_id !== null &&
        user.student_db_id !== ""
    ) {

        localStorage.setItem(
            "parent_student_db_id",
            String(user.student_db_id)
        );

        localStorage.setItem(
            "parent_student_id",
            user.student_id || ""
        );

        localStorage.setItem(
            "parent_student_name",
            user.student_name || ""
        );

        localStorage.setItem(
            "parent_student_usn",
            user.student_usn || ""
        );

        localStorage.setItem(
            "parent_student_semester",
            user.student_semester || ""
        );

        localStorage.setItem(
            "parent_student_section",
            user.student_section || ""
        );

        localStorage.setItem(
            "parent_student_department",
            user.student_department || ""
        );

    } else {

        localStorage.removeItem(
            "parent_student_db_id"
        );

        localStorage.removeItem(
            "parent_student_id"
        );

        localStorage.removeItem(
            "parent_student_name"
        );

        localStorage.removeItem(
            "parent_student_usn"
        );

        localStorage.removeItem(
            "parent_student_semester"
        );

        localStorage.removeItem(
            "parent_student_section"
        );

        localStorage.removeItem(
            "parent_student_department"
        );
    }

}


/* =========================================
   GET USER PROFILE
========================================= */

async function getUserProfile(accessToken) {

    const response =
        await fetch(
            PROFILE_URL,
            {
                method: "GET",

                headers: {

                    "Accept":
                        "application/json",

                    "Authorization":
                        `Bearer ${accessToken}`
                }
            }
        );


    if (!response.ok) {

        let errorData = {};

        try {

            errorData =
                await response.json();

        } catch (error) {

            /* Ignore JSON parsing error */
        }

        console.error(
            "Profile request failed:",
            response.status,
            errorData
        );

        throw new Error(
            "Unable to load user profile."
        );
    }


    return await response.json();
}


/* =========================================
   REFRESH ACCESS TOKEN
========================================= */

async function refreshAccessToken() {

    const refreshToken =
        localStorage.getItem(
            "refresh_token"
        );

    if (!refreshToken) {

        return null;
    }


    try {

        const response =
            await fetch(
                REFRESH_TOKEN_URL,
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body: JSON.stringify({

                        refresh:
                            refreshToken

                    })
                }
            );


        if (!response.ok) {

            return null;
        }


        const data =
            await response.json();


        if (data.access) {

            localStorage.setItem(
                "access_token",
                data.access
            );
        }


        return data.access || null;

    } catch (error) {

        console.error(
            "Token refresh error:",
            error
        );

        return null;
    }

}


/* =========================================
   VERIFY PROFILE MATCHES LOGIN
========================================= */

function verifyLoggedInUser(
    enteredUsername,
    user
) {

    const entered =
        String(
            enteredUsername || ""
        )
        .trim()
        .toLowerCase();


    const returnedUsername =
        String(
            user.username || ""
        )
        .trim()
        .toLowerCase();


    console.log(
        "Login username:",
        enteredUsername
    );

    console.log(
        "Profile username:",
        user.username
    );

    console.log(
        "Profile user ID:",
        user.id
    );

    console.log(
        "Profile role:",
        user.role
    );

    console.log(
        "Profile student ID:",
        user.student_id
    );

    console.log(
        "Profile student DB ID:",
        user.student_db_id
    );


    /*
       This is an important security check.

       If the user enters SURESH_2026 but Django
       returns RAHUL_2026, do not save Rahul's
       information into the browser.
    */

    if (
        entered &&
        returnedUsername &&
        entered !== returnedUsername
    ) {

        console.error(
            "LOGIN USER MISMATCH"
        );

        console.error(
            "Entered:",
            enteredUsername
        );

        console.error(
            "Returned:",
            user.username
        );

        return false;
    }


    return true;
}


/* =========================================
   REDIRECT BASED ON ROLE
========================================= */

function redirectByRole(user) {

    const role =
        String(
            user.role || ""
        )
        .trim()
        .toUpperCase();


    console.log(
        "Logged-in role:",
        role
    );


    /* =====================================
       ADMIN
    ===================================== */

    if (role === "ADMIN") {

        window.location.href =
            "../admin/dashboard.html";

        return;
    }


    /* =====================================
       FACULTY
    ===================================== */

    if (role === "FACULTY") {

        window.location.href =
            "../faculty/dashboard.html";

        return;
    }


    /* =====================================
       STUDENT
    ===================================== */

    if (role === "STUDENT") {

        window.location.href =
            "../student/dashboard.html";

        return;
    }


    /* =====================================
       PARENT
    ===================================== */

    if (role === "PARENT") {

        console.log(
            "Parent detected."
        );

        console.log(
            "Linked Student DB ID:",
            user.student_db_id
        );


        if (
            user.student_db_id === undefined ||
            user.student_db_id === null ||
            user.student_db_id === ""
        ) {

            showError(
                "Parent account is not linked to a student."
            );

            setLoading(false);

            return;
        }


        window.location.href =
            "../parent/parent.html";

        return;
    }


    /* =====================================
       UNKNOWN ROLE
    ===================================== */

    showError(
        "Your account role is not configured. Please contact the administrator."
    );

    setLoading(false);

}


/* =========================================
   LOGIN FORM
========================================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            clearMessages();


            const username =
                usernameInput.value.trim();

            const password =
                passwordInput.value;


            /* =================================
               VALIDATION
            ================================= */

            if (!username) {

                showError(
                    "Please enter your username."
                );

                usernameInput.focus();

                return;
            }


            if (!password) {

                showError(
                    "Please enter your password."
                );

                passwordInput.focus();

                return;
            }


            setLoading(true);


            try {

                /* =================================
                   CLEAR PREVIOUS USER SESSION
                ================================= */

                clearOldUserData();


                /* =================================
                   STEP 1 — GET JWT TOKEN
                ================================= */

                console.log(
                    "Requesting JWT token..."
                );


                const tokenResponse =
                    await fetch(
                        TOKEN_URL,
                        {
                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                username:
                                    username,

                                password:
                                    password

                            })
                        }
                    );


                let tokenData = {};


                try {

                    tokenData =
                        await tokenResponse.json();

                } catch (jsonError) {

                    console.error(
                        "Unable to read token response:",
                        jsonError
                    );
                }


                /* =================================
                   INVALID LOGIN
                ================================= */

                if (!tokenResponse.ok) {

                    console.error(
                        "Login failed:",
                        tokenData
                    );


                    let message =
                        "Invalid username or password.";


                    if (tokenData.detail) {

                        message =
                            tokenData.detail;
                    }


                    showError(message);

                    setLoading(false);

                    return;
                }


                /* =================================
                   CHECK JWT RESPONSE
                ================================= */

                if (
                    !tokenData.access ||
                    !tokenData.refresh
                ) {

                    throw new Error(
                        "JWT tokens were not returned by the server."
                    );
                }


                /* =================================
                   STEP 2 — SAVE JWT
                ================================= */

                localStorage.setItem(
                    "access_token",
                    tokenData.access
                );

                localStorage.setItem(
                    "refresh_token",
                    tokenData.refresh
                );


                console.log(
                    "JWT login successful."
                );


                /* =================================
                   STEP 3 — GET PROFILE
                ================================= */

                let user;


                try {

                    user =
                        await getUserProfile(
                            tokenData.access
                        );

                } catch (profileError) {

                    console.warn(
                        "Profile request failed. Trying token refresh..."
                    );


                    const newAccessToken =
                        await refreshAccessToken();


                    if (!newAccessToken) {

                        throw profileError;
                    }


                    user =
                        await getUserProfile(
                            newAccessToken
                        );
                }


                /* =================================
                   STEP 4 — VERIFY USER
                ================================= */

                console.log(
                    "User profile received."
                );


                const userMatches =
                    verifyLoggedInUser(
                        username,
                        user
                    );


                if (!userMatches) {

                    /*
                       Remove the incorrect session.

                       Example:
                       Entered Suresh
                       Django returned Rahul
                    */

                    clearOldUserData();


                    showError(
                        "Login account mismatch. You entered " +
                        username +
                        ", but the server returned a different user account. Please check the Django user/login configuration."
                    );


                    setLoading(false);

                    return;
                }


                /* =================================
                   STEP 5 — VERIFY ROLE
                ================================= */

                const role =
                    String(
                        user.role || ""
                    )
                    .trim()
                    .toUpperCase();


                if (!role) {

                    clearOldUserData();


                    showError(
                        "Your account role is missing. Please contact the administrator."
                    );


                    setLoading(false);

                    return;
                }


                /* =================================
                   STEP 6 — SAVE USER
                ================================= */

                saveUserData(user);


                /* =================================
                   STEP 7 — VERIFY SAVED DATA
                ================================= */

                console.log(
                    "Saved login information:"
                );

                console.log(
                    "Username:",
                    localStorage.getItem(
                        "username"
                    )
                );

                console.log(
                    "User ID:",
                    localStorage.getItem(
                        "user_id"
                    )
                );

                console.log(
                    "Student ID:",
                    localStorage.getItem(
                        "studentId"
                    )
                );

                console.log(
                    "Student DB ID:",
                    localStorage.getItem(
                        "student_db_id"
                    )
                );

                console.log(
                    "Role:",
                    localStorage.getItem(
                        "user_role"
                    )
                );


                /* =================================
                   STEP 8 — SUCCESS
                ================================= */

                showSuccess(
                    `Welcome ${user.username || username}! Redirecting...`
                );


                /* =================================
                   STEP 9 — REDIRECT
                ================================= */

                setTimeout(
                    function () {

                        redirectByRole(user);

                    },
                    700
                );


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                /*
                   Do not leave a partially-created
                   session in Local Storage.
                */

                clearOldUserData();


                if (
                    error.message ===
                    "Unable to load user profile."
                ) {

                    showError(
                        "Login succeeded, but the user profile could not be loaded. Please make sure the Django profile API is working."
                    );

                } else {

                    showError(
                        "Unable to connect to the server. Make sure Django is running on port 8000."
                    );
                }


                setLoading(false);
            }

        }
    );

}


/* =========================================
   ENTER KEY SUPPORT
========================================= */

if (usernameInput && passwordInput) {

    usernameInput.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                passwordInput.focus();
            }

        }
    );

}


/* =========================================
   CLEAR ERROR WHEN USER TYPES
========================================= */

if (usernameInput) {

    usernameInput.addEventListener(
        "input",
        clearMessages
    );
}


if (passwordInput) {

    passwordInput.addEventListener(
        "input",
        clearMessages
    );
}