
// =========================================================
// FEES MANAGEMENT — ADMIN PORTAL
// =========================================================

const API_BASE_URL = "http://127.0.0.1:8000";

let feeRecords = [];
let filteredFeeRecords = [];
let students = [];

let editingFeeId = null;


// =========================================================
// PAGE LOAD
// =========================================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("💰 fees.js loaded successfully.");
    console.log("💰 Fees page loaded.");

    setupFeeEvents();

    loadStudents();
    loadFees();

});


// =========================================================
// ACCESS TOKEN
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
// REFRESH ACCESS TOKEN
// =========================================================

async function refreshAccessToken() {

    const refreshToken =
        localStorage.getItem("refresh_token");

    if (!refreshToken) {

        console.warn(
            "⚠️ No refresh token available."
        );

        return false;
    }


    try {

        const response = await fetch(
            `${API_BASE_URL}/api/token/refresh/`,
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
                "⚠️ Token refresh failed."
            );

            return false;
        }


        const data =
            await response.json();


        if (!data.access) {

            return false;
        }


        localStorage.setItem(
            "access_token",
            data.access
        );


        console.log(
            "🔄 Access token refreshed."
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
// AUTHENTICATED FETCH
// =========================================================

async function authenticatedFetch(
    url,
    options = {},
    retry = true
) {

    const token =
        getAccessToken();


    if (!token) {

        throw new Error(
            "Authentication token not found."
        );
    }


    const headers = {

        ...(options.headers || {}),

        "Authorization":
            `Bearer ${token}`,

        "Content-Type":
            "application/json"

    };


    const response =
        await fetch(
            url,
            {
                ...options,
                headers
            }
        );


    // -----------------------------------------------------
    // TOKEN EXPIRED
    // -----------------------------------------------------

    if (
        response.status === 401 &&
        retry
    ) {

        console.warn(
            "⚠️ Access token expired. Refreshing..."
        );


        const refreshed =
            await refreshAccessToken();


        if (refreshed) {

            return authenticatedFetch(
                url,
                options,
                false
            );
        }
    }


    return response;
}


// =========================================================
// HTML ESCAPE
// =========================================================

function escapeHTML(value) {

    const div =
        document.createElement("div");


    div.textContent =
        value == null
            ? ""
            : String(value);


    return div.innerHTML;
}


// =========================================================
// FORMAT CURRENCY
// =========================================================

function formatCurrency(value) {

    const amount =
        Number(value) || 0;


    return amount.toLocaleString(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2
        }
    );

}


// =========================================================
// FORMAT DATE
// =========================================================

function formatDate(dateValue) {

    if (!dateValue) {

        return "—";
    }


    const date =
        new Date(dateValue);


    if (Number.isNaN(date.getTime())) {

        return escapeHTML(
            String(dateValue)
        );
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


// =========================================================
// SET MESSAGE
// =========================================================

function showMessage(
    message,
    type = "info"
) {

    const section =
        document.getElementById(
            "feeMessageSection"
        );


    const messageBox =
        document.getElementById(
            "feeMessage"
        );


    if (!section || !messageBox) {

        return;
    }


    section.style.display =
        "block";


    messageBox.className =
        `fee-message ${type}`;


    messageBox.innerHTML =
        escapeHTML(message);
}


// =========================================================
// HIDE MESSAGE
// =========================================================

function hideMessage() {

    const section =
        document.getElementById(
            "feeMessageSection"
        );


    if (section) {

        section.style.display =
            "none";
    }

}


// =========================================================
// LOAD STUDENTS
// =========================================================

async function loadStudents() {

    console.log(
        "👨‍🎓 Loading students..."
    );


    try {

        const response =
            await authenticatedFetch(
                `${API_BASE_URL}/student-profile/list/`
            );


        console.log(
            "👨‍🎓 Student API status:",
            response.status
        );


        if (!response.ok) {

            throw new Error(
                `Student API failed: ${response.status}`
            );
        }


        const data =
            await response.json();


        students =
            Array.isArray(data)
                ? data
                : (
                    data.results ||
                    data.data ||
                    []
                );


        console.log(
            "👨‍🎓 Students:",
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
            "feeStudent"
        );


    if (!select) {

        console.warn(
            "⚠️ feeStudent not found."
        );

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
                `${student.student_id || student.id} - ${student.name || "Student"}`;


            select.appendChild(
                option
            );

        }
    );

}


// =========================================================
// LOAD FEES
// =========================================================

async function loadFees() {

    console.log(
        "💰 Loading fee records..."
    );


    const tableBody =
        document.getElementById(
            "feesTableBody"
        );


    if (!tableBody) {

        console.error(
            "❌ feesTableBody not found."
        );

        return;
    }


    tableBody.innerHTML = `

        <tr>

            <td
                colspan="9"
                style="text-align:center;"
            >
                Loading fee records...
            </td>

        </tr>

    `;


    try {

        const token =
            getAccessToken();


        console.log(
            "🔐 Token available:",
            token
                ? "YES"
                : "NO"
        );


        if (!token) {

            throw new Error(
                "Authentication failed. Please login again."
            );
        }


        const response =
            await authenticatedFetch(
                `${API_BASE_URL}/fees/list/`
            );


        console.log(
            "💰 Fees API status:",
            response.status
        );


        if (!response.ok) {

            const errorText =
                await response.text();


            console.error(
                "❌ Fees API error:",
                errorText
            );


            throw new Error(
                `Fees API failed with status ${response.status}`
            );
        }


        const data =
            await response.json();


        console.log(
            "💰 Fees API response:",
            data
        );


        feeRecords =
            Array.isArray(data)
                ? data
                : (
                    data.results ||
                    data.data ||
                    []
                );


        console.log(
            "💰 Fee records:",
            feeRecords
        );


        filteredFeeRecords =
            [...feeRecords];


        updateFeeSummary();

        applyFeeFilters();

        hideMessage();

    }
    catch (error) {

        console.error(
            "❌ Failed to load fees:",
            error
        );


        feeRecords = [];
        filteredFeeRecords = [];


        updateFeeSummary();


        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    style="
                        text-align:center;
                        padding:40px;
                    "
                >

                    <strong>
                        Unable to load fee records
                    </strong>

                    <br>

                    <span style="color:#dc2626;">
                        ${escapeHTML(error.message)}
                    </span>

                    <br><br>

                    <button
                        type="button"
                        class="admin-primary-btn"
                        onclick="loadFees()"
                    >
                        Try Again
                    </button>

                </td>

            </tr>

        `;

    }

}


// =========================================================
// UPDATE SUMMARY
// =========================================================

function updateFeeSummary() {

    const totalRecords =
        feeRecords.length;


    let totalFee = 0;
    let totalPaid = 0;
    let totalBalance = 0;


    let paidCount = 0;
    let partialCount = 0;
    let pendingCount = 0;


    feeRecords.forEach(
        function (fee) {

            totalFee +=
                Number(
                    fee.total_fee
                ) || 0;


            totalPaid +=
                Number(
                    fee.paid_fee
                ) || 0;


            totalBalance +=
                Number(
                    fee.balance_fee
                ) || 0;


            const status =
                String(
                    fee.status || ""
                ).toLowerCase();


            if (status === "paid") {

                paidCount++;

            }
            else if (status === "partial") {

                partialCount++;

            }
            else if (status === "pending") {

                pendingCount++;
            }

        }
    );


    setText(
        "totalFeeRecords",
        totalRecords
    );


    setText(
        "totalFeeAmount",
        formatCurrency(totalFee)
    );


    setText(
        "totalPaidAmount",
        formatCurrency(totalPaid)
    );


    setText(
        "totalBalanceAmount",
        formatCurrency(totalBalance)
    );


    setText(
        "paidFeeCount",
        paidCount
    );


    setText(
        "partialFeeCount",
        partialCount
    );


    setText(
        "pendingFeeCount",
        pendingCount
    );

}


// =========================================================
// SET TEXT
// =========================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;
    }

}


// =========================================================
// APPLY FILTERS
// =========================================================

function applyFeeFilters() {

    const searchInput =
        document.getElementById(
            "feeSearch"
        );


    const statusFilter =
        document.getElementById(
            "feeStatusFilter"
        );


    const dateFilter =
        document.getElementById(
            "feeDateFilter"
        );


    const search =
        (
            searchInput?.value ||
            ""
        )
        .trim()
        .toLowerCase();


    const status =
        statusFilter?.value ||
        "all";


    const selectedDate =
        dateFilter?.value ||
        "";


    filteredFeeRecords =
        feeRecords.filter(
            function (fee) {

                // -----------------------------------------
                // SEARCH
                // -----------------------------------------

                const studentName =
                    String(
                        fee.student_name ||
                        ""
                    )
                    .toLowerCase();


                const usn =
                    String(
                        fee.usn ||
                        ""
                    )
                    .toLowerCase();


                const receipt =
                    String(
                        fee.receipt_number ||
                        ""
                    )
                    .toLowerCase();


                const matchesSearch =
                    !search ||
                    studentName.includes(search) ||
                    usn.includes(search) ||
                    receipt.includes(search);


                // -----------------------------------------
                // STATUS
                // -----------------------------------------

                const matchesStatus =
                    status === "all" ||
                    String(
                        fee.status || ""
                    ) === status;


                // -----------------------------------------
                // DATE
                // -----------------------------------------

                let matchesDate = true;


                if (selectedDate) {

                    matchesDate =
                        String(
                            fee.due_date || ""
                        )
                        .startsWith(
                            selectedDate
                        );
                }


                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesDate
                );

            }
        );


    renderFeeTable(
        filteredFeeRecords
    );


    setText(
        "filteredFeeCount",
        filteredFeeRecords.length
    );

}


// =========================================================
// RENDER FEE TABLE
// =========================================================

function renderFeeTable(records) {

    const tableBody =
        document.getElementById(
            "feesTableBody"
        );


    if (!tableBody) {

        console.error(
            "❌ feesTableBody not found."
        );

        return;
    }


    // -----------------------------------------------------
    // EMPTY
    // -----------------------------------------------------

    if (
        !records ||
        records.length === 0
    ) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    style="
                        text-align:center;
                        padding:40px;
                    "
                >

                    No fee records found.

                </td>

            </tr>

        `;


        return;
    }


    // -----------------------------------------------------
    // ROWS
    // -----------------------------------------------------

    tableBody.innerHTML =
        records
            .map(
                function (fee) {

                    const status =
                        String(
                            fee.status ||
                            "Pending"
                        );


                    const statusClass =
                        status
                            .toLowerCase()
                            .replace(
                                /\s+/g,
                                "-"
                            );


                    return `

                        <tr>

                            <!-- STUDENT -->

                            <td>

                                <div
                                    class="admin-user"
                                    style="
                                        min-width:150px;
                                    "
                                >

                                    <div
                                        class="admin-user-avatar"
                                    >
                                        ${escapeHTML(
                                            (
                                                fee.student_name ||
                                                "S"
                                            )
                                            .charAt(0)
                                            .toUpperCase()
                                        )}
                                    </div>

                                    <div>

                                        <strong>
                                            ${escapeHTML(
                                                fee.student_name ||
                                                "Unknown Student"
                                            )}
                                        </strong>

                                    </div>

                                </div>

                            </td>


                            <!-- USN -->

                            <td>

                                ${escapeHTML(
                                    fee.usn ||
                                    "—"
                                )}

                            </td>


                            <!-- TOTAL -->

                            <td>

                                <strong>
                                    ${formatCurrency(
                                        fee.total_fee
                                    )}
                                </strong>

                            </td>


                            <!-- PAID -->

                            <td>

                                ${formatCurrency(
                                    fee.paid_fee
                                )}

                            </td>


                            <!-- BALANCE -->

                            <td>

                                <strong>
                                    ${formatCurrency(
                                        fee.balance_fee
                                    )}
                                </strong>

                            </td>


                            <!-- STATUS -->

                            <td>

                                <span
                                    class="
                                        admin-section-badge
                                        ${statusClass}
                                    "
                                >

                                    ${escapeHTML(
                                        status
                                    )}

                                </span>

                            </td>


                            <!-- DUE DATE -->

                            <td>

                                ${formatDate(
                                    fee.due_date
                                )}

                            </td>


                            <!-- RECEIPT -->

                            <td>

                                ${escapeHTML(
                                    fee.receipt_number ||
                                    "—"
                                )}

                            </td>


                            <!-- ACTIONS -->

                            <td>

                                <div
                                    style="
                                        display:flex;
                                        gap:8px;
                                    "
                                >

                                    <button
                                        type="button"
                                        class="admin-secondary-btn"
                                        onclick="editFee(${Number(fee.id)})"
                                    >
                                        ✏️ Edit
                                    </button>


                                    <button
                                        type="button"
                                        class="admin-delete-btn"
                                        onclick="deleteFee(${Number(fee.id)})"
                                    >
                                        🗑️ Delete
                                    </button>

                                </div>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


// =========================================================
// OPEN ADD FEE MODAL
// =========================================================

function openAddFeeModal() {

    editingFeeId = null;


    const modal =
        document.getElementById(
            "feeModal"
        );


    const title =
        document.getElementById(
            "feeModalTitle"
        );


    const form =
        document.getElementById(
            "feeForm"
        );


    if (!modal || !form) {

        console.error(
            "❌ Fee modal/form not found."
        );

        return;
    }


    form.reset();


    document.getElementById(
        "paidFee"
    ).value = "0";


    document.getElementById(
        "balanceFeePreview"
    ).textContent =
        "₹0.00";


    if (title) {

        title.textContent =
            "Add Fee";
    }


    clearFormMessage();


    modal.style.display =
        "flex";

}


// =========================================================
// EDIT FEE
// =========================================================

function editFee(feeId) {

    const fee =
        feeRecords.find(
            function (record) {

                return Number(
                    record.id
                ) === Number(feeId);

            }
        );


    if (!fee) {

        console.error(
            "❌ Fee record not found:",
            feeId
        );

        return;
    }


    editingFeeId =
        Number(feeId);


    const modal =
        document.getElementById(
            "feeModal"
        );


    const title =
        document.getElementById(
            "feeModalTitle"
        );


    if (!modal) {

        return;
    }


    if (title) {

        title.textContent =
            "Edit Fee";
    }


    setValue(
        "feeStudent",
        fee.student
    );


    setValue(
        "totalFee",
        fee.total_fee
    );


    setValue(
        "paidFee",
        fee.paid_fee
    );


    setValue(
        "paymentDate",
        fee.payment_date
    );


    setValue(
        "dueDate",
        fee.due_date
    );


    setValue(
        "receiptNumber",
        fee.receipt_number
    );


    setValue(
        "feeRemarks",
        fee.remarks
    );


    updateBalancePreview();

    clearFormMessage();


    modal.style.display =
        "flex";

}


// =========================================================
// SET INPUT VALUE
// =========================================================

function setValue(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.value =
            value ?? "";
    }

}


// =========================================================
// CLOSE FEE MODAL
// =========================================================

function closeFeeModal() {

    const modal =
        document.getElementById(
            "feeModal"
        );


    if (modal) {

        modal.style.display =
            "none";
    }


    editingFeeId = null;


    clearFormMessage();

}


// =========================================================
// UPDATE BALANCE PREVIEW
// =========================================================

function updateBalancePreview() {

    const total =
        Number(
            document.getElementById(
                "totalFee"
            )?.value
        ) || 0;


    const paid =
        Number(
            document.getElementById(
                "paidFee"
            )?.value
        ) || 0;


    const balance =
        Math.max(
            0,
            total - paid
        );


    const preview =
        document.getElementById(
            "balanceFeePreview"
        );


    if (preview) {

        preview.textContent =
            formatCurrency(balance);
    }

}


// =========================================================
// SAVE FEE
// =========================================================

async function saveFee(event) {

    event.preventDefault();


    const student =
        document.getElementById(
            "feeStudent"
        )?.value;


    const totalFee =
        Number(
            document.getElementById(
                "totalFee"
            )?.value
        );


    const paidFee =
        Number(
            document.getElementById(
                "paidFee"
            )?.value
        );


    const paymentDate =
        document.getElementById(
            "paymentDate"
        )?.value || null;


    const dueDate =
        document.getElementById(
            "dueDate"
        )?.value;


    const receiptNumber =
        document.getElementById(
            "receiptNumber"
        )?.value
        .trim();


    const remarks =
        document.getElementById(
            "feeRemarks"
        )?.value
        .trim();


    // -----------------------------------------------------
    // VALIDATION
    // -----------------------------------------------------

    if (!student) {

        showFormMessage(
            "Please select a student.",
            "error"
        );

        return;
    }


    if (
        Number.isNaN(totalFee) ||
        totalFee < 0
    ) {

        showFormMessage(
            "Please enter a valid total fee.",
            "error"
        );

        return;
    }


    if (
        Number.isNaN(paidFee) ||
        paidFee < 0
    ) {

        showFormMessage(
            "Please enter a valid paid amount.",
            "error"
        );

        return;
    }


    if (paidFee > totalFee) {

        showFormMessage(
            "Paid fee cannot be greater than total fee.",
            "error"
        );

        return;
    }


    if (!dueDate) {

        showFormMessage(
            "Please select a due date.",
            "error"
        );

        return;
    }


    const payload = {

        student:
            Number(student),

        total_fee:
            totalFee.toFixed(2),

        paid_fee:
            paidFee.toFixed(2),

        payment_date:
            paymentDate,

        due_date:
            dueDate,

        receipt_number:
            receiptNumber || null,

        remarks:
            remarks || null

    };


    console.log(
        "💾 Fee payload:",
        payload
    );


    const saveButton =
        document.getElementById(
            "saveFeeBtn"
        );


    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.textContent =
            "⏳ Saving...";
    }


    try {

        let url;
        let method;


        if (editingFeeId) {

            url =
                `${API_BASE_URL}/fees/detail/${editingFeeId}/`;

            method =
                "PUT";

        }
        else {

            url =
                `${API_BASE_URL}/fees/list/`;

            method =
                "POST";
        }


        const response =
            await authenticatedFetch(
                url,
                {
                    method,
                    body:
                        JSON.stringify(payload)
                }
            );


        console.log(
            "💾 Save fee status:",
            response.status
        );


        const responseData =
            await response.json()
                .catch(
                    () => ({})
                );


        if (!response.ok) {

            console.error(
                "❌ Save fee error:",
                responseData
            );


            throw new Error(
                getAPIErrorMessage(
                    responseData
                )
            );
        }


        console.log(
            "✅ Fee saved:",
            responseData
        );


        showFormMessage(
            editingFeeId
                ? "Fee updated successfully."
                : "Fee added successfully.",
            "success"
        );


        setTimeout(
            function () {

                closeFeeModal();

                loadFees();

            },
            700
        );

    }
    catch (error) {

        console.error(
            "❌ Fee save failed:",
            error
        );


        showFormMessage(
            error.message ||
                "Unable to save fee.",
            "error"
        );

    }
    finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "💾 Save Fee";
        }

    }

}


// =========================================================
// DELETE FEE
// =========================================================

async function deleteFee(feeId) {

    const fee =
        feeRecords.find(
            function (record) {

                return Number(
                    record.id
                ) === Number(feeId);

            }
        );


    if (!fee) {

        return;
    }


    const studentName =
        fee.student_name ||
        "this student";


    const confirmed =
        window.confirm(
            `Delete fee record for ${studentName}?\n\nThis action cannot be undone.`
        );


    if (!confirmed) {

        return;
    }


    try {

        const response =
            await authenticatedFetch(
                `${API_BASE_URL}/fees/detail/${feeId}/`,
                {
                    method: "DELETE"
                }
            );


        console.log(
            "🗑️ Delete fee status:",
            response.status
        );


        if (!response.ok) {

            const data =
                await response.json()
                    .catch(
                        () => ({})
                    );


            throw new Error(
                getAPIErrorMessage(
                    data
                )
            );
        }


        console.log(
            "✅ Fee deleted successfully."
        );


        loadFees();

    }
    catch (error) {

        console.error(
            "❌ Delete fee failed:",
            error
        );


        alert(
            error.message ||
                "Unable to delete fee record."
        );

    }

}


// =========================================================
// API ERROR MESSAGE
// =========================================================

function getAPIErrorMessage(
    data
) {

    if (!data) {

        return "Request failed.";
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


    const messages = [];


    Object.keys(data).forEach(
        function (key) {

            const value =
                data[key];


            if (Array.isArray(value)) {

                messages.push(
                    `${key}: ${value.join(", ")}`
                );

            }
            else if (
                typeof value === "string"
            ) {

                messages.push(
                    `${key}: ${value}`
                );

            }

        }
    );


    return messages.length
        ? messages.join(" | ")
        : "Request failed.";
}


// =========================================================
// FORM MESSAGE
// =========================================================

function showFormMessage(
    message,
    type = "info"
) {

    const element =
        document.getElementById(
            "feeFormMessage"
        );


    if (!element) {

        return;
    }


    element.textContent =
        message;


    element.className =
        `attendance-update-message ${type}`;

}


// =========================================================
// CLEAR FORM MESSAGE
// =========================================================

function clearFormMessage() {

    const element =
        document.getElementById(
            "feeFormMessage"
        );


    if (!element) {

        return;
    }


    element.textContent =
        "";


    element.className =
        "attendance-update-message";

}


// =========================================================
// EVENT SETUP
// =========================================================

function setupFeeEvents() {

    // -----------------------------------------------------
    // REFRESH
    // -----------------------------------------------------

    const refreshButton =
        document.getElementById(
            "refreshFeesBtn"
        );


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            loadFees
        );

    }


    // -----------------------------------------------------
    // SEARCH
    // -----------------------------------------------------

    const search =
        document.getElementById(
            "feeSearch"
        );


    if (search) {

        search.addEventListener(
            "input",
            applyFeeFilters
        );

    }


    // -----------------------------------------------------
    // STATUS FILTER
    // -----------------------------------------------------

    const statusFilter =
        document.getElementById(
            "feeStatusFilter"
        );


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            applyFeeFilters
        );

    }


    // -----------------------------------------------------
    // DATE FILTER
    // -----------------------------------------------------

    const dateFilter =
        document.getElementById(
            "feeDateFilter"
        );


    if (dateFilter) {

        dateFilter.addEventListener(
            "change",
            applyFeeFilters
        );

    }


    // -----------------------------------------------------
    // ADD FEE
    // -----------------------------------------------------

    const addButton =
        document.getElementById(
            "addFeeBtn"
        );


    if (addButton) {

        addButton.addEventListener(
            "click",
            openAddFeeModal
        );

    }


    // -----------------------------------------------------
    // CLOSE MODAL
    // -----------------------------------------------------

    const closeButton =
        document.getElementById(
            "closeFeeModal"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeFeeModal
        );

    }


    // -----------------------------------------------------
    // CANCEL
    // -----------------------------------------------------

    const cancelButton =
        document.getElementById(
            "cancelFeeBtn"
        );


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeFeeModal
        );

    }


    // -----------------------------------------------------
    // FORM SUBMIT
    // -----------------------------------------------------

    const form =
        document.getElementById(
            "feeForm"
        );


    if (form) {

        form.addEventListener(
            "submit",
            saveFee
        );

    }


    // -----------------------------------------------------
    // BALANCE PREVIEW
    // -----------------------------------------------------

    const totalInput =
        document.getElementById(
            "totalFee"
        );


    const paidInput =
        document.getElementById(
            "paidFee"
        );


    if (totalInput) {

        totalInput.addEventListener(
            "input",
            updateBalancePreview
        );

    }


    if (paidInput) {

        paidInput.addEventListener(
            "input",
            updateBalancePreview
        );

    }


    // -----------------------------------------------------
    // CLOSE MODAL WHEN CLICKING OUTSIDE
    // -----------------------------------------------------

    const modal =
        document.getElementById(
            "feeModal"
        );


    if (modal) {

        modal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === modal
                ) {

                    closeFeeModal();
                }

            }
        );

    }


    // -----------------------------------------------------
    // ESC KEY
    // -----------------------------------------------------

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {

                const modal =
                    document.getElementById(
                        "feeModal"
                    );


                if (
                    modal &&
                    modal.style.display ===
                        "flex"
                ) {

                    closeFeeModal();
                }

            }

        }
    );


    // -----------------------------------------------------
    // LOGOUT
    // -----------------------------------------------------

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

                localStorage.removeItem(
                    "accessToken"
                );

                localStorage.removeItem(
                    "token"
                );


                window.location.href =
                    "/index.html";

            }
        );

    }

}


// =========================================================
// GLOBAL FUNCTIONS
// =========================================================

window.loadFees =
    loadFees;

window.editFee =
    editFee;

window.deleteFee =
    deleteFee;

window.openAddFeeModal =
    openAddFeeModal;

window.closeFeeModal =
    closeFeeModal;

window.applyFeeFilters =
    applyFeeFilters;
