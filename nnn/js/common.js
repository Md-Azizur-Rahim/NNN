
/* =========================================================
   COFFEE CORNER - COMMON JAVASCRIPT
   Shared Functions for All User Dashboards
   Updated for Root-Level Actor HTML Files
   ========================================================= */


/* ==================== 1. APPLICATION SETTINGS ==================== */

const CURRENT_USER_KEY = "coffee_current_user";


/* ==================== 2. GET CURRENT USER ==================== */

function getCurrentUser() {

    try {

        const userData = localStorage.getItem(CURRENT_USER_KEY);

        if (!userData) {
            return null;
        }

        return JSON.parse(userData);

    } catch (error) {

        console.error("Unable to get current user:", error);

        return null;

    }

}


/* ==================== 3. SAVE CURRENT USER ==================== */

function setCurrentUser(user) {

    if (!user || typeof user !== "object") {
        return false;
    }

    try {

        localStorage.setItem(
            CURRENT_USER_KEY,
            JSON.stringify(user)
        );

        return true;

    } catch (error) {

        console.error("Unable to save current user:", error);

        return false;

    }

}


/* ==================== 4. CHECK LOGIN STATUS ==================== */

function isLoggedIn() {

    return getCurrentUser() !== null;

}


/* ==================== 5. ROLE AUTHENTICATION ==================== */

function requireRole(requiredRole) {

    const currentUser = getCurrentUser();

    // Check login status
    if (!currentUser) {

        alert("Please login first.");

        window.location.href = getRootPath() + "login.html";

        return false;

    }

    // Check account status
    if (currentUser.status !== "Active") {

        alert(
            "Your account is inactive. Please contact the administrator."
        );

        localStorage.removeItem(CURRENT_USER_KEY);

        window.location.href = getRootPath() + "login.html";

        return false;

    }

    // Check user role
    if (currentUser.role !== requiredRole) {

        alert(
            "Access denied! You are not authorized to access this page."
        );

        redirectToDashboard(currentUser.role);

        return false;

    }

    return true;

}


/* ==================== 6. ROOT PATH HELPER ==================== */

// All actor HTML files are now inside the onn/ root folder.
// Therefore, no ../ path is required.

function getRootPath() {

    return "";

}


/* ==================== 7. DASHBOARD REDIRECTION ==================== */

function redirectToDashboard(role) {

    const rootPath = getRootPath();

    switch (role) {

        case "Administrator":

            window.location.href = rootPath + "admin.html";

            break;


        case "Customer":

            window.location.href = rootPath + "customer.html";

            break;


        case "Cashier":

            window.location.href = rootPath + "cashier.html";

            break;


        case "Staff":

            window.location.href = rootPath + "barista.html";

            break;


        default:

            window.location.href = rootPath + "login.html";

    }

}


/* ==================== 8. LOGOUT FUNCTION ==================== */

function logout() {

    const confirmation = confirm(
        "Are you sure you want to logout?"
    );

    if (!confirmation) {
        return false;
    }

    localStorage.removeItem(CURRENT_USER_KEY);

    localStorage.removeItem("coffee_current_bill");

    window.location.href = getRootPath() + "login.html";

    return true;

}


/* ==================== 9. SECTION NAVIGATION ==================== */

function showSection(sectionId) {

    const sections = document.querySelectorAll(".page-section");

    const navigationButtons = document.querySelectorAll(
        ".topnav button"
    );

    const selectedSection = document.getElementById(sectionId);

    if (!selectedSection) {

        console.error("Section not found:", sectionId);

        return false;

    }

    // Hide all sections
    sections.forEach(function (section) {

        section.classList.remove("active");

    });

    // Remove active navigation styling
    navigationButtons.forEach(function (button) {

        button.classList.remove("active");

    });

    // Display selected section
    selectedSection.classList.add("active");

    // Activate corresponding navigation button
    const activeButton = document.getElementById(
        "nav-" + sectionId
    );

    if (activeButton) {

        activeButton.classList.add("active");

    }

    return true;

}


/* ==================== 10. INITIALIZE DASHBOARD NAVIGATION ==================== */

function initializeDashboard() {

    const sections = document.querySelectorAll(".page-section");

    if (sections.length === 0) {
        return;
    }

    // Get current logged-in user
    const currentUser = getCurrentUser();

    // Display logged-in user's name
    const welcomeElement = document.getElementById("welcomeUser");

    if (welcomeElement && currentUser) {

        welcomeElement.textContent =
            currentUser.name || "User";

    }

    // Activate first dashboard section
    const firstSection = sections[0];

    showSection(firstSection.id);

}


/* ==================== 11. MESSAGE DISPLAY ==================== */

function setMessage(elementId, message, type) {

    const messageElement = document.getElementById(elementId);

    if (!messageElement) {
        return;
    }

    messageElement.textContent = message;

    messageElement.className = "message";

    if (type === "success") {

        messageElement.classList.add("success");

    } else if (type === "error") {

        messageElement.classList.add("error-message");

    }

}


/* ==================== 12. CLEAR MESSAGE ==================== */

function clearMessage(elementId) {

    const messageElement = document.getElementById(elementId);

    if (!messageElement) {
        return;
    }

    messageElement.textContent = "";

    messageElement.className = "message";

}


/* ==================== 13. CLEAR FORM ERRORS ==================== */

function clearErrors() {

    const errorElements = document.querySelectorAll(".error");

    errorElements.forEach(function (element) {

        element.textContent = "";

    });

}


/* ==================== 14. DISPLAY FIELD ERROR ==================== */

function showFieldError(elementId, message) {

    const errorElement = document.getElementById(elementId);

    if (!errorElement) {
        return;
    }

    errorElement.textContent = message;

}


/* ==================== 15. HTML ESCAPE ==================== */

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value).replace(/[&<>"']/g, function (character) {

        const entities = {

            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"

        };

        return entities[character];

    });

}


/* ==================== 16. CURRENCY FORMAT ==================== */

function formatMoney(amount) {

    const value = Number(amount) || 0;

    return "৳ " + value.toLocaleString("en-BD", {

        minimumFractionDigits: 2,
        maximumFractionDigits: 2

    });

}


/* ==================== 17. DATE AND TIME ==================== */

// Returns local date and time in YYYY-MM-DDTHH:mm:ss format.

function getCurrentDateTime() {

    const now = new Date();

    const year = now.getFullYear();

    const month = String(now.getMonth() + 1).padStart(2, "0");

    const day = String(now.getDate()).padStart(2, "0");

    const hours = String(now.getHours()).padStart(2, "0");

    const minutes = String(now.getMinutes()).padStart(2, "0");

    const seconds = String(now.getSeconds()).padStart(2, "0");

    return (
        year + "-" +
        month + "-" +
        day + "T" +
        hours + ":" +
        minutes + ":" +
        seconds
    );

}


// Returns local date in YYYY-MM-DD format.

function getCurrentDate() {

    const today = new Date();

    const year = today.getFullYear();

    const month = String(today.getMonth() + 1).padStart(2, "0");

    const day = String(today.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;

}


// Converts date into DD/MM/YYYY format.

function formatDate(dateValue) {

    if (!dateValue) {
        return "N/A";
    }

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
        return "N/A";
    }

    return date.toLocaleDateString("en-GB");

}


// Converts date and time into readable format.

function formatDateTime(dateValue) {

    if (!dateValue) {
        return "N/A";
    }

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
        return "N/A";
    }

    return date.toLocaleString("en-GB");

}


/* ==================== 18. STATUS BADGE ==================== */

function getStatusBadge(status) {

    const safeStatus = escapeHTML(status || "Unknown");

    let badgeClass = "";

    switch (String(status || "").toLowerCase()) {

        case "active":
        case "available":
        case "completed":
        case "paid":
        case "ready":

            badgeClass = "status-success";

            break;


        case "pending":
        case "preparing":
        case "low stock":

            badgeClass = "status-warning";

            break;


        case "blocked":
        case "inactive":
        case "unavailable":
        case "expired":
        case "damaged":
        case "spoiled":
        case "out of stock":
        case "cancelled":
        case "unpaid":

            badgeClass = "status-danger";

            break;


        default:

            badgeClass = "status-neutral";

    }

    return '<span class="status-badge ' +
        badgeClass + '">' + safeStatus + '</span>';

}


/* ==================== 19. EMPTY TABLE MESSAGE ==================== */

function showEmptyTable(tableBodyId, columnCount, message) {

    const tableBody = document.getElementById(tableBodyId);

    if (!tableBody) {
        return;
    }

    const safeColumnCount = Math.max(
        1,
        Number(columnCount) || 1
    );

    const safeMessage = escapeHTML(
        message || "No records found."
    );

    tableBody.innerHTML =
        '<tr><td colspan="' + safeColumnCount +
        '" style="text-align:center; padding:20px;">' +
        safeMessage +
        '</td></tr>';

}


/* ==================== 20. SEARCH HELPER ==================== */

function searchRecords(records, searchText, fields) {

    if (!Array.isArray(records)) {
        return [];
    }

    if (!Array.isArray(fields)) {
        return records;
    }

    const keyword = String(searchText || "").toLowerCase().trim();

    if (!keyword) {
        return records;
    }

    return records.filter(function (record) {

        return fields.some(function (field) {

            return String(record[field] || "")
                .toLowerCase()
                .includes(keyword);

        });

    });

}


/* ==================== 21. GET USER BY ID ==================== */

function getUserById(userId) {

    if (
        typeof CoffeeData === "undefined" ||
        !CoffeeData
    ) {

        console.error("CoffeeData is not loaded.");

        return null;

    }

    const users = CoffeeData.get("users");

    return users.find(function (user) {

        return Number(user.id) === Number(userId);

    }) || null;

}


/* ==================== 22. GET CUSTOMER ORDERS ==================== */

function getCustomerOrders(customerId) {

    if (
        typeof CoffeeData === "undefined" ||
        !CoffeeData
    ) {

        console.error("CoffeeData is not loaded.");

        return [];

    }

    const orders = CoffeeData.get("orders");

    return orders.filter(function (order) {

        return Number(order.customerId) === Number(customerId);

    });

}


/* ==================== 23. GET ORDER BY TOKEN ==================== */

function getOrderByToken(orderToken) {

    if (
        typeof CoffeeData === "undefined" ||
        !CoffeeData
    ) {

        console.error("CoffeeData is not loaded.");

        return null;

    }

    const orders = CoffeeData.get("orders");

    return orders.find(function (order) {

        return String(order.token || "").toLowerCase() ===
            String(orderToken || "").toLowerCase();

    }) || null;

}


/* ==================== 24. TABLE HTML HELPER ==================== */

function makeTable(records, columns) {

    if (
        !Array.isArray(records) ||
        records.length === 0 ||
        !Array.isArray(columns)
    ) {

        return "";

    }

    let html = "";

    records.forEach(function (record) {

        html += "<tr>";

        columns.forEach(function (column) {

            const value = record[column] ?? "";

            html += "<td>" + escapeHTML(value) + "</td>";

        });

        html += "</tr>";

    });

    return html;

}


/* ==================== 25. CONFIRM DELETE ==================== */

function confirmDelete(message) {

    return confirm(
        message || "Are you sure you want to delete this record?"
    );

}


/* ==================== 26. INITIALIZE COMMON FEATURES ==================== */
document.addEventListener("DOMContentLoaded", function () {

    document.querySelectorAll("form").forEach(function (form) {
        form.noValidate = true;
    });

    initializeDashboard();

});;
