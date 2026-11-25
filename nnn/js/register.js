


/* ==================== 1. REGISTRATION LIMIT ==================== */

// This counter exists only while this page is open.

let successfulRegistrationCount = 0;

const MAX_REGISTRATIONS = 3;


/* ==================== 2. ERROR FIELD LIST ==================== */

const registerErrorIds = [

    "userTypeError",
    "fullNameError",
    "emailError",
    "phoneError",
    "addressError",
    "preferredOrderError",
    "cashierExperienceError",
    "cashierShiftError",
    "baristaExperienceError",
    "baristaShiftError",
    "usernameError",
    "passwordError",
    "confirmPasswordError",
    "termsError"

];


/* ==================== 3. SET FIELD ERROR ==================== */

function setRegisterFieldError(id, message) {

    const element = document.getElementById(id);

    if (element) {

        element.textContent = message;

    }

}


/* ==================== 4. CLEAR ALL ERRORS ==================== */

function clearRegisterErrors() {

    registerErrorIds.forEach(function (id) {

        setRegisterFieldError(id, "");

    });

}


/* ==================== 5. SHOW MESSAGE ==================== */

function showRegisterMessage(message, type) {

    const element = document.getElementById("registerMessage");

    if (!element) {
        return;
    }

    element.textContent = message;

    element.className = "message";

    if (type === "success") {

        element.classList.add("success");

    }

    else if (type === "error") {

        element.classList.add("error-message");

    }

}


/* ==================== 6. CLEAR MESSAGE ==================== */

function clearRegisterMessage() {

    const element = document.getElementById("registerMessage");

    if (element) {

        element.textContent = "";

        element.className = "message";

    }

}


/* ==================== 7. GET INPUT VALUE ==================== */

function getRegisterValue(id) {

    const element = document.getElementById(id);

    return element ? element.value.trim() : "";

}


/* ==================== 8. GET SELECTED USER TYPE ==================== */

function getSelectedRegisterType() {

    const selected = document.querySelector(
        'input[name="userType"]:checked'
    );

    return selected ? selected.value : "";

}


/* ==================== 9. GET SELECTED RADIO VALUE ==================== */

function getRegisterRadioValue(name) {

    const selected = document.querySelector(
        'input[name="' + name + '"]:checked'
    );

    return selected ? selected.value : "";

}


/* ==================== 10. SHOW ROLE BASED FIELDS ==================== */

function showTypeFields() {

    const selectedRole = getSelectedRegisterType();

    const formBody = document.getElementById("formBody");

    const customerFields = document.getElementById("customerFields");

    const cashierFields = document.getElementById("cashierFields");

    const baristaFields = document.getElementById("baristaFields");


    // Show common registration form.

    if (formBody) {

        formBody.classList.toggle(
            "active",
            selectedRole !== ""
        );

    }


    // Customer fields.

    if (customerFields) {

        customerFields.classList.toggle(
            "active",
            selectedRole === "Customer"
        );

        customerFields.disabled =
            selectedRole !== "Customer";

    }


    // Cashier fields.

    if (cashierFields) {

        cashierFields.classList.toggle(
            "active",
            selectedRole === "Cashier"
        );

        cashierFields.disabled =
            selectedRole !== "Cashier";

    }


    // Barista fields.

    if (baristaFields) {

        baristaFields.classList.toggle(
            "active",
            selectedRole === "Staff"
        );

        baristaFields.disabled =
            selectedRole !== "Staff";

    }


    clearRegisterErrors();

    toggleRegisterButton();

}


/* ==================== 11. REGISTER BUTTON CONTROL ==================== */

function toggleRegisterButton() {

    const selectedRole = getSelectedRegisterType();

    const terms = document.getElementById("terms");

    const button = document.getElementById("registerButton");


    if (!button || !terms) {
        return;
    }


    button.disabled = !(
        selectedRole &&
        terms.checked &&
        successfulRegistrationCount < MAX_REGISTRATIONS
    );

}


/* ==================== 12. EXPERIENCE VALIDATION ==================== */

function validateExperience(inputId, errorId) {

    const value = getRegisterValue(inputId);

    const experience = Number(value);


    if (

        value === "" ||

        !Number.isInteger(experience) ||

        experience < 0 ||

        experience > 40

    ) {

        setRegisterFieldError(

            errorId,

            "Enter experience between 0 and 40 years."

        );

        return false;

    }


    return true;

}


/* ==================== 13. MAIN REGISTRATION FUNCTION ==================== */

function registerAccount() {

    clearRegisterErrors();

    clearRegisterMessage();


    // Check maximum registration limit.

    if (successfulRegistrationCount >= MAX_REGISTRATIONS) {

        showRegisterMessage(

            "Maximum 3 demo registrations have been completed.",

            "error"

        );

        return false;

    }


    // Get selected role.

    const role = getSelectedRegisterType();


    let isValid = true;


    if (

        role !== "Customer" &&

        role !== "Cashier" &&

        role !== "Staff"

    ) {

        setRegisterFieldError(

            "userTypeError",

            "Please select an account type."

        );

        return false;

    }


    // Get personal information.

    const fullName = getRegisterValue("fullName");

    const email = getRegisterValue("email").toLowerCase();

    const phone = getRegisterValue("phone");

    const address = getRegisterValue("address");


    // Get account information.

    const username = getRegisterValue("newUsername");

    const passwordElement = document.getElementById("newPassword");

    const confirmElement = document.getElementById("confirmPassword");


    const password = passwordElement ? passwordElement.value : "";

    const confirmPassword = confirmElement ? confirmElement.value : "";


    /* ==================== 14. NAME VALIDATION ==================== */

    if (fullName.length < 2) {

        setRegisterFieldError(

            "fullNameError",

            "Please enter a valid full name."

        );

        isValid = false;

    }


    /* ==================== 15. EMAIL VALIDATION ==================== */

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailPattern.test(email)) {

        setRegisterFieldError(

            "emailError",

            "Please enter a valid email address."

        );

        isValid = false;

    }


    /* ==================== 16. PHONE VALIDATION ==================== */

    const phonePattern = /^01[3-9]\d{8}$/;


    if (!phonePattern.test(phone)) {

        setRegisterFieldError(

            "phoneError",

            "Enter a valid 11-digit Bangladeshi mobile number."

        );

        isValid = false;

    }


    /* ==================== 17. ADDRESS VALIDATION ==================== */

    if (address.length < 3) {

        setRegisterFieldError(

            "addressError",

            "Please enter your address."

        );

        isValid = false;

    }


    /* ==================== 18. CUSTOMER VALIDATION ==================== */

    if (role === "Customer") {

        const preferredOrder = getRegisterValue("preferredOrder");


        if (!preferredOrder) {

            setRegisterFieldError(

                "preferredOrderError",

                "Please select your preferred order type."

            );

            isValid = false;

        }

    }


    /* ==================== 19. CASHIER VALIDATION ==================== */

    if (role === "Cashier") {

        const experienceValid = validateExperience(

            "cashierExperience",

            "cashierExperienceError"

        );


        const preferredShift = getRegisterRadioValue("cashierShift");


        if (!experienceValid) {

            isValid = false;

        }


        if (!preferredShift) {

            setRegisterFieldError(

                "cashierShiftError",

                "Please select your preferred shift."

            );

            isValid = false;

        }

    }


    /* ==================== 20. BARISTA VALIDATION ==================== */

    if (role === "Staff") {

        const experienceValid = validateExperience(

            "baristaExperience",

            "baristaExperienceError"

        );


        const preferredShift = getRegisterRadioValue("baristaShift");


        if (!experienceValid) {

            isValid = false;

        }


        if (!preferredShift) {

            setRegisterFieldError(

                "baristaShiftError",

                "Please select your preferred shift."

            );

            isValid = false;

        }

    }


    /* ==================== 21. USERNAME VALIDATION ==================== */

    if (username.length < 4) {

        setRegisterFieldError(

            "usernameError",

            "Username must contain at least 4 characters."

        );

        isValid = false;

    }

    else if (!/^[a-zA-Z0-9_]+$/.test(username)) {

        setRegisterFieldError(

            "usernameError",

            "Use letters, numbers and underscore only."

        );

        isValid = false;

    }


    /* ==================== 22. PASSWORD VALIDATION ==================== */

    if (password.length < 6) {

        setRegisterFieldError(

            "passwordError",

            "Password must contain at least 6 characters."

        );

        isValid = false;

    }


    /* ==================== 23. CONFIRM PASSWORD ==================== */

    if (confirmPassword === "") {

        setRegisterFieldError(

            "confirmPasswordError",

            "Please confirm your password."

        );

        isValid = false;

    }

    else if (password !== confirmPassword) {

        setRegisterFieldError(

            "confirmPasswordError",

            "Passwords do not match."

        );

        isValid = false;

    }


    /* ==================== 24. TERMS VALIDATION ==================== */

    const terms = document.getElementById("terms");


    if (!terms || !terms.checked) {

        setRegisterFieldError(

            "termsError",

            "Please accept the terms and conditions."

        );

        isValid = false;

    }


    // Stop if validation fails.

    if (!isValid) {

        return false;

    }


    /* ==================== 25. DEMO REGISTRATION ==================== */

    /*
       Important:

       No account object is created.
       Username is not saved.
       Password is not saved.
       No user data is added to the login system.

       Only the successful submission counter increases.
    */


    successfulRegistrationCount++;


    /* ==================== 26. RESET FORM ==================== */

    const form = document.getElementById("registerForm");

    if (form) {

        form.reset();

    }


    showTypeFields();

    toggleRegisterButton();


    /* ==================== 27. SUCCESS MESSAGE ==================== */

    let successMessage =

        "Registration form submitted successfully! ";


    successMessage +=

        "Demo submissions completed: " +

        successfulRegistrationCount +

        " of " +

        MAX_REGISTRATIONS +

        ".";


    successMessage +=

        " No account has been created or saved. " +

        "You cannot use these registration credentials to login.";


    if (successfulRegistrationCount >= MAX_REGISTRATIONS) {

        successMessage +=

            " The maximum demo registration limit has been reached.";

    }


    showRegisterMessage(

        successMessage,

        "success"

    );


    return false;

}


/* ==================== 28. RESET REGISTRATION FORM ==================== */

function resetRegisterForm() {

    const form = document.getElementById("registerForm");


    if (form) {

        form.reset();

    }


    clearRegisterErrors();

    clearRegisterMessage();

    showTypeFields();

    toggleRegisterButton();

}


/* ==================== 29. PAGE INITIALIZATION ==================== */

document.addEventListener("DOMContentLoaded", function () {

    const registerForm = document.getElementById("registerForm");


    if (!registerForm) {
        return;
    }


    clearRegisterErrors();

    clearRegisterMessage();

    showTypeFields();

    toggleRegisterButton();


});
