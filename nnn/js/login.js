


/* ==================== 1. GET HTML ELEMENT ==================== */

function getLoginElement(id) {

    return document.getElementById(id);

}


/* ==================== 2. PREDEFINED DEMO ACCOUNTS ==================== */

const DEMO_ACCOUNTS = [

    {
        id: 1,
        username: "admin",
        email: "admin@coffeecorner.com",
        password: "admin123",
        role: "Administrator"
    },

    {
        id: 2,
        username: "customer",
        email: "customer@coffeecorner.com",
        password: "customer123",
        role: "Customer"
    },

    {
        id: 3,
        username: "cashier",
        email: "cashier@coffeecorner.com",
        password: "cashier123",
        role: "Cashier"
    },

    {
        id: 4,
        username: "barista",
        email: "barista@coffeecorner.com",
        password: "barista123",
        role: "Staff"
    }

];


/* ==================== 3. CLEAR LOGIN ERRORS ==================== */

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


/* ==================== 4. CLEAR LOGIN MESSAGE ==================== */

function clearLoginMessage() {

    const loginMessage = getLoginElement("loginMessage");

    if (loginMessage) {

        loginMessage.textContent = "";

        loginMessage.className = "message";

    }

    clearLoginErrors();

}


/* ==================== 5. SHOW LOGIN MESSAGE ==================== */

function showLoginMessage(message, type) {

    const loginMessage = getLoginElement("loginMessage");

    if (!loginMessage) {
        return;
    }

    loginMessage.textContent = message;

    loginMessage.className = "message";

    if (type === "success") {

        loginMessage.classList.add("success");

    } else {

        loginMessage.classList.add("error-message");

    }

}


/* ==================== 6. SHOW FIELD ERROR ==================== */

function showLoginFieldError(fieldId, message) {

    const errorElement = getLoginElement(fieldId + "Error");

    if (errorElement) {

        errorElement.textContent = message;

    }

}


/* ==================== 7. FILL DEMO LOGIN CREDENTIALS ==================== */

function fillDemo(username, password) {

    const usernameInput = getLoginElement("username");

    const passwordInput = getLoginElement("password");

    if (!usernameInput || !passwordInput) {
        return;
    }

    usernameInput.value = username;

    passwordInput.value = password;

    clearLoginMessage();

    usernameInput.focus();

}


/* ==================== 8. VALIDATE LOGIN INPUT ==================== */

function validateLoginInput(username, password) {

    let isValid = true;

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


/* ==================== 9. FIND DEMO ACCOUNT ==================== */

function findLoginUser(username) {

    const loginValue = String(username)
        .trim()
        .toLowerCase();


    // Search only predefined demo accounts.

    const demoAccount = DEMO_ACCOUNTS.find(function (account) {

        return (

            account.username.toLowerCase() === loginValue ||

            account.email.toLowerCase() === loginValue

        );

    });


    if (!demoAccount) {
        return null;
    }


    // Verify the account exists in the in-memory database.

    if (
        typeof CoffeeData === "undefined" ||
        typeof CoffeeData.get !== "function"
    ) {

        return null;

    }


    const users = CoffeeData.get("users");


    const databaseUser = users.find(function (user) {

        return (

            Number(user.id) === demoAccount.id &&

            user.username === demoAccount.username &&

            user.role === demoAccount.role

        );

    });


    if (!databaseUser) {
        return null;
    }


    return {

        id: databaseUser.id,

        name: databaseUser.name,

        username: databaseUser.username,

        email: databaseUser.email,

        role: databaseUser.role,

        status: databaseUser.status,

        password: databaseUser.password

    };

}


/* ==================== 10. CHECK ACCOUNT STATUS ==================== */

function isAccountActive(user) {

    if (!user) {
        return false;
    }

    return String(user.status).toLowerCase() === "active";

}


/* ==================== 11. VERIFY DEMO PASSWORD ==================== */

function verifyDemoPassword(user, password) {

    if (!user) {
        return false;
    }


    const demoAccount = DEMO_ACCOUNTS.find(function (account) {

        return Number(account.id) === Number(user.id);

    });


    if (!demoAccount) {
        return false;
    }


    // Both predefined password and database password must match.

    return (

        demoAccount.password === password &&

        user.password === password

    );

}


/* ==================== 12. LOGIN USER ==================== */

function loginUser() {

    const usernameInput = getLoginElement("username");

    const passwordInput = getLoginElement("password");


    if (!usernameInput || !passwordInput) {
        return false;
    }


    const username = usernameInput.value.trim();

    const password = passwordInput.value;


    // Step 1: Validate inputs.

    if (!validateLoginInput(username, password)) {
        return false;
    }


    // Step 2: Check database availability.

    if (

        typeof CoffeeData === "undefined" ||

        typeof CoffeeData.get !== "function"

    ) {

        showLoginMessage(
            "System data is unavailable. Please refresh the page.",
            "error"
        );

        return false;

    }


    // Step 3: Find predefined demo account.

    const user = findLoginUser(username);


    if (!user) {

        showLoginMessage(
            "Invalid username or password. Registered accounts cannot login.",
            "error"
        );

        return false;

    }


    // Step 4: Verify password.

    if (!verifyDemoPassword(user, password)) {

        showLoginMessage(
            "Invalid username or password. Please try again.",
            "error"
        );

        return false;

    }


    // Step 5: Check account status.

    if (!isAccountActive(user)) {

        showLoginMessage(
            "Your account is inactive or blocked.",
            "error"
        );

        return false;

    }


    // Step 6: Check user role.

    if (!user.role) {

        showLoginMessage(
            "Invalid user role. Please contact administrator.",
            "error"
        );

        return false;

    }


    // Step 7: Set temporary login user.

    if (typeof setCurrentUser !== "function") {

        showLoginMessage(
            "Login session function is unavailable.",
            "error"
        );

        return false;

    }


    const loginSuccess = setCurrentUser(user);


    if (!loginSuccess) {

        showLoginMessage(
            "Unable to initialize login session.",
            "error"
        );

        return false;

    }


    // Step 8: Redirect to appropriate dashboard.

    if (typeof redirectToDashboard === "function") {

        showLoginMessage(
            "Login successful! Redirecting...",
            "success"
        );

        redirectToDashboard(user.role);

    } else {

        showLoginMessage(
            "Dashboard redirection is unavailable.",
            "error"
        );

    }


    return false;

}


/* ==================== 13. SHOW / HIDE PASSWORD ==================== */

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


/* ==================== 14. INITIALIZE LOGIN PAGE ==================== */

document.addEventListener("DOMContentLoaded", function () {

    const usernameInput = getLoginElement("username");

    const passwordInput = getLoginElement("password");


    if (usernameInput) {

        usernameInput.addEventListener("input", function () {

            clearLoginMessage();

        });

    }


    if (passwordInput) {

        passwordInput.addEventListener("input", function () {

            clearLoginMessage();

        });

    }

});


/* ==================== END OF LOGIN JAVASCRIPT ==================== */
