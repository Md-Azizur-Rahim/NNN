
/* =====================================================
   COFFEE CORNER MANAGEMENT SYSTEM
   LOGIN JAVASCRIPT
   ===================================================== */


/* =====================================================
   1. GET HTML ELEMENT
   ===================================================== */

function getLoginElement(id) {
    return document.getElementById(id);
}


/* =====================================================
   2. CLEAR LOGIN ERRORS
   ===================================================== */

function clearLoginErrors() {

    const usernameError = getLoginElement("usernameError");
    const passwordError = getLoginElement("passwordError");

    if (usernameError) {
        usernameError.textContent = "";
    }

    if (passwordError) {
        passwordError.textContent = "";
    }

}


/* =====================================================
   3. CLEAR LOGIN MESSAGE
   ===================================================== */

function clearLoginMessage() {

    const loginMessage = getLoginElement("loginMessage");

    if (loginMessage) {
        loginMessage.textContent = "";
        loginMessage.className = "message";
    }

    clearLoginErrors();

}


/* =====================================================
   4. SHOW LOGIN MESSAGE
   ===================================================== */

function showLoginMessage(message, type) {

    const loginMessage = getLoginElement("loginMessage");

    if (!loginMessage) {
        return;
    }

    loginMessage.textContent = message;

    loginMessage.className = "message " + (type || "error");

}


/* =====================================================
   5. SHOW FIELD ERROR
   ===================================================== */

function showLoginFieldError(fieldId, message) {

    const errorElement = getLoginElement(fieldId + "Error");

    if (errorElement) {
        errorElement.textContent = message;
    }

}


/* =====================================================
   6. FILL DEMO LOGIN CREDENTIALS
   ===================================================== */

function fillDemo(username, password) {

    const usernameInput = getLoginElement("username");
    const passwordInput = getLoginElement("password");

    if (!usernameInput || !passwordInput) {
        return;
    }

    // Automatically fill username
    usernameInput.value = username;

    // Automatically fill password
    passwordInput.value = password;

    // Clear previous errors
    clearLoginErrors();

    // Clear previous login message
    clearLoginMessage();

    // Focus on login button
    usernameInput.focus();

}


/* =====================================================
   7. VALIDATE LOGIN INPUT
   ===================================================== */

function validateLoginInput(username, password) {

    let isValid = true;

    clearLoginErrors();
    clearLoginMessage();

    if (!username) {

        showLoginFieldError(
            "username",
            "Please enter your username or email."
        );

        isValid = false;

    }

    if (!password) {

        showLoginFieldError(
            "password",
            "Please enter your password."
        );

        isValid = false;

    }

    return isValid;

}


/* =====================================================
   8. FIND USER ACCOUNT
   ===================================================== */

function findLoginUser(username) {

    // Get all registered users from CoffeeData
    const users = CoffeeData.get("users") || [];

    const loginValue = String(username).trim().toLowerCase();

    // Find account using username or email
    const user = users.find(function (account) {

        const accountUsername = String(
            account.username || ""
        ).trim().toLowerCase();

        const accountEmail = String(
            account.email || ""
        ).trim().toLowerCase();

        return (
            accountUsername === loginValue ||
            accountEmail === loginValue
        );

    });

    return user || null;

}


/* =====================================================
   9. CHECK ACCOUNT STATUS
   ===================================================== */

function isAccountActive(user) {

    if (!user) {
        return false;
    }

    const status = String(
        user.status || "Active"
    ).toLowerCase();

    return status === "active";

}


/* =====================================================
   10. LOGIN USER
   ===================================================== */

function loginUser() {

    // Get input values
    const usernameInput = getLoginElement("username");
    const passwordInput = getLoginElement("password");

    if (!usernameInput || !passwordInput) {
        return false;
    }

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    // Validate empty fields
    if (!validateLoginInput(username, password)) {
        return false;
    }

    // Check CoffeeData availability
    if (
        typeof CoffeeData === "undefined" ||
        typeof CoffeeData.get !== "function"
    ) {

        showLoginMessage(
            "System data is not available. Please refresh the page.",
            "error"
        );

        return false;

    }

    // Find user account
    const user = findLoginUser(username);

    // Check account existence
    if (!user) {

        showLoginMessage(
            "Invalid username or password. Please try again.",
            "error"
        );

        return false;

    }

    // Check password
    if (String(user.password) !== password) {

        showLoginMessage(
            "Invalid username or password. Please try again.",
            "error"
        );

        return false;

    }

    // Check account status
    if (!isAccountActive(user)) {

        showLoginMessage(
            "Your account is inactive or blocked. Please contact the administrator.",
            "error"
        );

        return false;

    }

    // Check role
    if (!user.role) {

        showLoginMessage(
            "Your account does not have a valid role.",
            "error"
        );

        return false;

    }

    // Save logged-in user information
    if (
        typeof setCurrentUser !== "function"
    ) {

        showLoginMessage(
            "Login session could not be created. Please try again.",
            "error"
        );

        return false;

    }

    const loginSuccess = setCurrentUser(user);

    if (loginSuccess === false) {

        showLoginMessage(
            "Unable to save login session. Please try again.",
            "error"
        );

        return false;

    }

    // Redirect to role-based dashboard
    if (
        typeof redirectToDashboard === "function"
    ) {

        redirectToDashboard(user.role);

    } else {

        showLoginMessage(
            "Dashboard redirection function is not available.",
            "error"
        );

    }

    return false;

}


/* =====================================================
   11. SHOW / HIDE PASSWORD
   Optional functionality
   ===================================================== */

function togglePassword() {

    const passwordInput = getLoginElement("password");
    const showPassword = getLoginElement("showPassword");

    if (!passwordInput || !showPassword) {
        return;
    }

    passwordInput.type = showPassword.checked
        ? "text"
        : "password";

}


/* =====================================================
   12. CLEAR MESSAGE WHEN USER STARTS TYPING
   ===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    const usernameInput = getLoginElement("username");
    const passwordInput = getLoginElement("password");

    if (usernameInput) {

        usernameInput.addEventListener("input", function () {

            clearLoginErrors();
            clearLoginMessage();

        });

    }

    if (passwordInput) {

        passwordInput.addEventListener("input", function () {

            clearLoginErrors();
            clearLoginMessage();

        });

    }

});
