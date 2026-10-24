// =====================================================
// AI ATTEND - AUTHENTICATION
// Django SimpleJWT + Role Based Login
// =====================================================

const API_BASE_URL = "http://127.0.0.1:8000";

const TOKEN_URL =
    `${API_BASE_URL}/api/token/`;

const PROFILE_URL =
    `${API_BASE_URL}/accounts/profile/`;


// =====================================================
// DOM ELEMENTS
// =====================================================

const loginForm =
    document.getElementById("loginForm");

const usernameInput =
    document.getElementById("username");

const passwordInput =
    document.getElementById("password");

const loginBtn =
    document.getElementById("loginBtn");

const loginBtnText =
    document.getElementById("loginBtnText");

const loginSpinner =
    document.getElementById("loginSpinner");

const loginMessage =
    document.getElementById("loginMessage");

const togglePassword =
    document.getElementById("togglePassword");


// =====================================================
// SHOW MESSAGE
// =====================================================

function showMessage(
    message,
    type = "error"
) {

    if (!loginMessage) {
        return;
    }

    loginMessage.textContent =
        message;

    loginMessage.className =
        `login-message ${type}`;
}


// =====================================================
// CLEAR MESSAGE
// =====================================================

function clearMessage() {

    if (!loginMessage) {
        return;
    }

    loginMessage.textContent =
        "";

    loginMessage.className =
        "login-message";
}


// =====================================================
// LOADING STATE
// =====================================================

function setLoading(isLoading) {

    if (!loginBtn) {
        return;
    }

    loginBtn.disabled =
        isLoading;

    if (isLoading) {

        if (loginBtnText) {

            loginBtnText.textContent =
                "Signing in...";
        }

        if (loginSpinner) {

            loginSpinner.classList.remove(
                "hidden"
            );
        }

    } else {

        if (loginBtnText) {

            loginBtnText.textContent =
                "Sign in";
        }

        if (loginSpinner) {

            loginSpinner.classList.add(
                "hidden"
            );
        }
    }
}


// =====================================================
// SAVE JWT TOKENS
// =====================================================

function saveTokens(data) {

    if (
        !data ||
        !data.access ||
        !data.refresh
    ) {

        console.error(
            "JWT response is missing access or refresh token."
        );

        return false;
    }

    localStorage.setItem(
        "access_token",
        data.access
    );

    localStorage.setItem(
        "refresh_token",
        data.refresh
    );

    console.log(
        "JWT tokens saved."
    );

    return true;
}


// =====================================================
// GET CURRENT USER PROFILE
// =====================================================

async function getCurrentUser() {

    const accessToken =
        localStorage.getItem(
            "access_token"
        );

    if (!accessToken) {

        throw new Error(
            "Authentication token was not found."
        );
    }


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


    let data;


    try {

        data =
            await response.json();

    } catch (error) {

        throw new Error(
            "Invalid profile response from server."
        );
    }


    console.log(
        "Profile API status:",
        response.status
    );


    if (!response.ok) {

        console.error(
            "Profile request failed:",
            data
        );

        throw new Error(
            data.detail ||
            "Unable to retrieve user profile."
        );
    }


    console.log(
        "Current user profile:",
        data
    );


    return data;
}


// =====================================================
// SAVE USER PROFILE
// =====================================================

function saveUserProfile(user) {

    if (!user) {
        return false;
    }


    // -----------------------------------------------
    // BASIC USER INFORMATION
    // -----------------------------------------------

    localStorage.setItem(
        "user_id",
        String(user.id)
    );

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


    // -----------------------------------------------
    // STUDENT PROFILE ID
    // -----------------------------------------------

    if (
        user.role &&
        String(user.role).toUpperCase() ===
        "STUDENT"
    ) {

        if (user.student_id !== undefined &&
            user.student_id !== null) {

            localStorage.setItem(
                "studentId",
                String(user.student_id)
            );

            console.log(
                "Student profile ID saved:",
                user.student_id
            );

        } else {

            console.error(
                "Student profile ID was not returned by the backend."
            );

            return false;
        }
    }


    // -----------------------------------------------
    // FACULTY PROFILE ID
    // -----------------------------------------------

    if (
        user.role &&
        String(user.role).toUpperCase() ===
        "FACULTY"
    ) {

        if (
            user.faculty_id !== undefined &&
            user.faculty_id !== null
        ) {

            localStorage.setItem(
                "facultyId",
                String(user.faculty_id)
            );

            console.log(
                "Faculty profile ID saved:",
                user.faculty_id
            );
        }
    }


    console.log(
        "User profile saved:"
    );

    console.log(
        "User ID:",
        user.id
    );

    console.log(
        "Username:",
        user.username
    );

    console.log(
        "Role:",
        user.role
    );


    return true;
}


// =====================================================
// SAVE STUDENT ID
// =====================================================
//
// IMPORTANT:
// Student ID is NOT hardcoded.
//
// Backend /accounts/profile/ returns:
//
// SURESH_2026
//     -> student_id = 1
//
// RAHUL_2026
//     -> student_id = 2
//
// =====================================================

function saveStudentId(user) {

    if (!user) {

        console.error(
            "User profile is missing."
        );

        return false;
    }


    if (
        String(user.role || "").toUpperCase() !==
        "STUDENT"
    ) {

        console.error(
            "saveStudentId() called for a non-student user."
        );

        return false;
    }


    if (
        user.student_id === undefined ||
        user.student_id === null
    ) {

        console.error(
            "Backend did not return student_id."
        );

        return false;
    }


    const studentId =
        String(user.student_id);


    localStorage.setItem(
        "studentId",
        studentId
    );


    console.log(
        "Correct Student ID saved:",
        studentId
    );


    return true;
}


// =====================================================
// CLEAR STUDENT ID
// =====================================================

function clearStudentId() {

    localStorage.removeItem(
        "studentId"
    );
}


// =====================================================
// CLEAR FACULTY ID
// =====================================================

function clearFacultyId() {

    localStorage.removeItem(
        "facultyId"
    );
}


// =====================================================
// LOGIN API
// =====================================================

async function login(
    username,
    password
) {

    console.log(
        "Sending login request..."
    );


    let response;


    try {

        response =
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

                    body:
                        JSON.stringify({
                            username:
                                username,

                            password:
                                password
                        })
                }
            );

    } catch (error) {

        console.error(
            "Network error:",
            error
        );

        throw new Error(
            "Unable to connect to the server. Make sure Django is running."
        );
    }


    console.log(
        "Login API status:",
        response.status
    );


    let data;


    try {

        data =
            await response.json();

    } catch (error) {

        throw new Error(
            "The server returned an invalid response."
        );
    }


    if (!response.ok) {

        console.error(
            "Login failed:",
            data
        );


        if (
            data &&
            data.detail
        ) {

            throw new Error(
                data.detail
            );
        }


        throw new Error(
            "Invalid username or password."
        );
    }


    return data;
}


// =====================================================
// REDIRECT USER BASED ON ROLE
// =====================================================

function redirectByRole(user) {

    if (!user) {

        throw new Error(
            "User profile information is missing."
        );
    }


    const normalizedRole =
        String(user.role || "")
            .trim()
            .toUpperCase();


    console.log(
        "Redirecting based on role:",
        normalizedRole
    );


    // =================================================
    // STUDENT
    // =================================================

    if (
        normalizedRole ===
        "STUDENT"
    ) {

        const studentSaved =
            saveStudentId(user);


        if (!studentSaved) {

            throw new Error(
                "Student profile is not connected to this account."
            );
        }


        clearFacultyId();


        console.log(
            "Opening Student Dashboard..."
        );


        window.location.href =
            "student/dashboard.html";


        return;
    }


    // =================================================
    // FACULTY
    // =================================================

    if (
        normalizedRole ===
        "FACULTY"
    ) {

        clearStudentId();


        if (
            user.faculty_id !== undefined &&
            user.faculty_id !== null
        ) {

            localStorage.setItem(
                "facultyId",
                String(user.faculty_id)
            );

            console.log(
                "Faculty ID saved:",
                user.faculty_id
            );
        }


        console.log(
            "Opening Faculty Dashboard..."
        );


        window.location.href =
            "faculty/dashboard.html";


        return;
    }


    // =================================================
    // ADMIN
    // =================================================

    if (
        normalizedRole ===
        "ADMIN"
    ) {

        clearStudentId();
        clearFacultyId();


        console.log(
            "Admin account detected."
        );


        // ---------------------------------------------
        // ADMIN DASHBOARD
        // ---------------------------------------------

        window.location.href =
            "admin/dashboard.html";


        return;
    }


    // =================================================
    // UNKNOWN ROLE
    // =================================================

    console.error(
        "Unknown user role:",
        user.role
    );


    throw new Error(
        "Your account role is not configured correctly."
    );
}


// =====================================================
// LOGIN FORM
// =====================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            clearMessage();


            const username =
                usernameInput
                    ? usernameInput.value.trim()
                    : "";


            const password =
                passwordInput
                    ? passwordInput.value
                    : "";


            // -----------------------------------------
            // VALIDATE USERNAME
            // -----------------------------------------

            if (!username) {

                showMessage(
                    "Please enter your username."
                );


                if (usernameInput) {

                    usernameInput.focus();
                }


                return;
            }


            // -----------------------------------------
            // VALIDATE PASSWORD
            // -----------------------------------------

            if (!password) {

                showMessage(
                    "Please enter your password."
                );


                if (passwordInput) {

                    passwordInput.focus();
                }


                return;
            }


            setLoading(true);


            try {

                // =====================================
                // STEP 1
                // JWT LOGIN
                // =====================================

                const tokenData =
                    await login(
                        username,
                        password
                    );


                console.log(
                    "Django authentication successful."
                );


                // =====================================
                // STEP 2
                // SAVE JWT TOKENS
                // =====================================

                const tokensSaved =
                    saveTokens(
                        tokenData
                    );


                if (!tokensSaved) {

                    throw new Error(
                        "JWT tokens were not returned by the server."
                    );
                }


                // =====================================
                // STEP 3
                // GET USER PROFILE
                // =====================================

                const user =
                    await getCurrentUser();


                // =====================================
                // STEP 4
                // SAVE USER INFORMATION
                // =====================================

                const profileSaved =
                    saveUserProfile(
                        user
                    );


                if (!profileSaved) {

                    throw new Error(
                        "User profile could not be saved."
                    );
                }


                // =====================================
                // STEP 5
                // LOG AUTHENTICATED USER
                // =====================================

                console.log(
                    "Authenticated username:",
                    user.username
                );


                console.log(
                    "Authenticated role:",
                    user.role
                );


                if (
                    user.student_id !== undefined
                ) {

                    console.log(
                        "Authenticated Student ID:",
                        user.student_id
                    );
                }


                if (
                    user.faculty_id !== undefined
                ) {

                    console.log(
                        "Authenticated Faculty ID:",
                        user.faculty_id
                    );
                }


                // =====================================
                // SUCCESS MESSAGE
                // =====================================

                showMessage(
                    "Login successful. Opening your dashboard...",
                    "success"
                );


                // =====================================
                // STEP 6
                // ROLE-BASED REDIRECT
                // =====================================

                setTimeout(
                    function() {

                        try {

                            redirectByRole(
                                user
                            );

                        } catch (redirectError) {

                            console.error(
                                "Redirect error:",
                                redirectError
                            );

                            showMessage(
                                redirectError.message ||
                                "Unable to open dashboard."
                            );
                        }

                    },
                    400
                );


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                // -------------------------------------
                // REMOVE INVALID LOGIN DATA
                // -------------------------------------

                localStorage.removeItem(
                    "access_token"
                );

                localStorage.removeItem(
                    "refresh_token"
                );

                localStorage.removeItem(
                    "user_id"
                );

                localStorage.removeItem(
                    "username"
                );

                localStorage.removeItem(
                    "user_email"
                );

                localStorage.removeItem(
                    "user_role"
                );

                localStorage.removeItem(
                    "studentId"
                );

                localStorage.removeItem(
                    "facultyId"
                );


                showMessage(
                    error.message ||
                    "Unable to login. Please try again."
                );


            } finally {

                setLoading(false);
            }
        }
    );
}


// =====================================================
// SHOW / HIDE PASSWORD
// =====================================================

if (
    togglePassword &&
    passwordInput
) {

    togglePassword.addEventListener(
        "click",
        function() {

            const isPassword =
                passwordInput.type ===
                "password";


            if (isPassword) {

                passwordInput.type =
                    "text";


                togglePassword.textContent =
                    "🙈";

            } else {

                passwordInput.type =
                    "password";


                togglePassword.textContent =
                    "👁";
            }
        }
    );
}


// =====================================================
// CHECK EXISTING LOGIN
// =====================================================

function isLoggedIn() {

    const accessToken =
        localStorage.getItem(
            "access_token"
        );


    const refreshToken =
        localStorage.getItem(
            "refresh_token"
        );


    return Boolean(
        accessToken &&
        refreshToken
    );
}


// =====================================================
// DEBUG INFORMATION
// =====================================================

console.log(
    "AI Attend authentication loaded."
);


console.log(
    "JWT endpoint:",
    TOKEN_URL
);


console.log(
    "Profile endpoint:",
    PROFILE_URL
);