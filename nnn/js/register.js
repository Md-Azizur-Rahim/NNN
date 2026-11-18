
/* =========================================================
   COFFEE CORNER - ROLE BASED REGISTRATION
   Customer, Cashier and Staff Registration
   Technology: JavaScript + LocalStorage
   ========================================================= */


/* ==================== 1. ERROR FIELD LIST ==================== */

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


/* ==================== 2. FIELD ERROR ==================== */

function setRegisterFieldError(id, message) {

    const element = document.getElementById(id);

    if (element) {
        element.textContent = message;
    }

}


/* ==================== 3. CLEAR ERRORS ==================== */

function clearRegisterErrors() {

    registerErrorIds.forEach(function (id) {

        setRegisterFieldError(id, "");

    });

}


/* ==================== 4. SHOW MESSAGE ==================== */

function showRegisterMessage(message, type) {

    const element = document.getElementById("registerMessage");

    if (!element) {
        return;
    }

    element.textContent = message;

    element.className = "message";

    if (type === "success") {

        element.classList.add("success");

    } else if (type === "error") {

        element.classList.add("error-message");

    }

}


/* ==================== 5. CLEAR MESSAGE ==================== */

function clearRegisterMessage() {

    const element = document.getElementById("registerMessage");

    if (element) {

        element.textContent = "";
        element.className = "message";

    }

}


/* ==================== 6. GET SELECTED ROLE ==================== */

function getSelectedRegisterType() {

    const selected = document.querySelector(
        'input[name="userType"]:checked'
    );

    return selected ? selected.value : "";

}


/* ==================== 7. GET SELECTED RADIO VALUE ==================== */

function getRegisterRadioValue(name) {

    const selected = document.querySelector(
        'input[name="' + name + '"]:checked'
    );

    return selected ? selected.value : "";

}


/* ==================== 8. SHOW ROLE BASED FIELDS ==================== */

function showTypeFields() {

    const selectedRole = getSelectedRegisterType();

    const formBody = document.getElementById("formBody");

    const roleFields = {

        Customer: "customerFields",

        Cashier: "cashierFields",

        Staff: "baristaFields"

    };


    // Show common form only after selecting a role

    formBody.classList.toggle(
        "active",
        selectedRole !== ""
    );


    // Show only the selected role's fieldset

    Object.keys(roleFields).forEach(function (role) {

        const fieldset = document.getElementById(
            roleFields[role]
        );

        const isSelected = role === selectedRole;

        fieldset.classList.toggle(
            "active",
            isSelected
        );

        fieldset.disabled = !isSelected;

    });


    clearRegisterErrors();

    toggleRegisterButton();

}


/* ==================== 9. REGISTER BUTTON CONTROL ==================== */

function toggleRegisterButton() {

    const selectedRole = getSelectedRegisterType();

    const terms = document.getElementById("terms");

    const button = document.getElementById("registerButton");

    button.disabled = !(
        selectedRole &&
        terms.checked
    );

}


/* ==================== 10. EXPERIENCE VALIDATION ==================== */

function validateExperience(inputId, errorId) {

    const value = document.getElementById(inputId).value.trim();

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


/* ==================== 11. MAIN REGISTRATION FUNCTION ==================== */

function registerAccount() {

    clearRegisterErrors();

    clearRegisterMessage();


    /* GET SELECTED ROLE */

    const role = getSelectedRegisterType();

    let isValid = true;


    if (!role) {

        setRegisterFieldError(
            "userTypeError",
            "Please select an account type."
        );

        return false;

    }


    /* GET COMMON INFORMATION */

    const fullName = document.getElementById(
        "fullName"
    ).value.trim();

    const email = document.getElementById(
        "email"
    ).value.trim().toLowerCase();

    const phone = document.getElementById(
        "phone"
    ).value.trim();

    const address = document.getElementById(
        "address"
    ).value.trim();


    /* GET ACCOUNT INFORMATION */

    const username = document.getElementById(
        "newUsername"
    ).value.trim();

    const password = document.getElementById(
        "newPassword"
    ).value;

    const confirmPassword = document.getElementById(
        "confirmPassword"
    ).value;


    /* ==================== 12. NAME VALIDATION ==================== */

    if (fullName.length < 2) {

        setRegisterFieldError(
            "fullNameError",
            "Please enter a valid full name."
        );

        isValid = false;

    }


    /* ==================== 13. EMAIL VALIDATION ==================== */

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {

        setRegisterFieldError(
            "emailError",
            "Please enter a valid email address."
        );

        isValid = false;

    }


    /* ==================== 14. PHONE VALIDATION ==================== */

    const phonePattern = /^01[3-9]\d{8}$/;

    if (!phonePattern.test(phone)) {

        setRegisterFieldError(
            "phoneError",
            "Enter a valid 11-digit Bangladeshi mobile number."
        );

        isValid = false;

    }


    /* ==================== 15. ADDRESS VALIDATION ==================== */

    if (address.length < 3) {

        setRegisterFieldError(
            "addressError",
            "Please enter your address."
        );

        isValid = false;

    }


    /* ==================== 16. ROLE SPECIFIC VALIDATION ==================== */

    let roleDetails = {};


    // CUSTOMER

    if (role === "Customer") {

        const preferredOrder = document.getElementById(
            "preferredOrder"
        ).value;

        const favoriteCoffee = document.getElementById(
            "favoriteCoffee"
        ).value;


        if (!preferredOrder) {

            setRegisterFieldError(
                "preferredOrderError",
                "Please select your preferred order type."
            );

            isValid = false;

        }


        roleDetails = {

            preferredOrder: preferredOrder,

            favoriteCoffee: favoriteCoffee

        };

    }


    // CASHIER

    else if (role === "Cashier") {

        const experienceValid = validateExperience(
            "cashierExperience",
            "cashierExperienceError"
        );

        const preferredShift = getRegisterRadioValue(
            "cashierShift"
        );


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


        roleDetails = {

            experienceYears: document.getElementById(
                "cashierExperience"
            ).value,

            preferredShift: preferredShift

        };

    }


    // STAFF / BARISTA

    else if (role === "Staff") {

        const experienceValid = validateExperience(
            "baristaExperience",
            "baristaExperienceError"
        );

        const preferredShift = getRegisterRadioValue(
            "baristaShift"
        );


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


        const skills = Array.from(

            document.querySelectorAll(
                'input[name="baristaSkills"]:checked'
            )

        ).map(function (input) {

            return input.value;

        });


        roleDetails = {

            experienceYears: document.getElementById(
                "baristaExperience"
            ).value,

            preferredShift: preferredShift,

            skills: skills

        };

    }


    /* ==================== 17. USERNAME VALIDATION ==================== */

    if (username.length < 4) {

        setRegisterFieldError(
            "usernameError",
            "Username must contain at least 4 characters."
        );

        isValid = false;

    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {

        setRegisterFieldError(
            "usernameError",
            "Use letters, numbers and underscore only."
        );

        isValid = false;

    }


    /* ==================== 18. PASSWORD VALIDATION ==================== */

    if (password.length < 6) {

        setRegisterFieldError(
            "passwordError",
            "Password must contain at least 6 characters."
        );

        isValid = false;

    }


    /* ==================== 19. CONFIRM PASSWORD ==================== */

    if (confirmPassword === "") {

        setRegisterFieldError(
            "confirmPasswordError",
            "Please confirm your password."
        );

        isValid = false;

    } else if (password !== confirmPassword) {

        setRegisterFieldError(
            "confirmPasswordError",
            "Passwords do not match."
        );

        isValid = false;

    }


    /* ==================== 20. TERMS VALIDATION ==================== */

    const terms = document.getElementById("terms").checked;

    if (!terms) {

        setRegisterFieldError(
            "termsError",
            "Please accept the terms and conditions."
        );

        isValid = false;

    }


    if (!isValid) {
        return false;
    }


    /* ==================== 21. CHECK DATABASE ==================== */

    if (
        typeof CoffeeData === "undefined" ||
        typeof CoffeeData.get !== "function"
    ) {

        showRegisterMessage(
            "System data is unavailable. Please refresh the page.",
            "error"
        );

        return false;

    }


    const users = CoffeeData.get("users") || [];


    /* ==================== 22. CHECK DUPLICATE USERNAME ==================== */

    const existingUsername = users.find(function (user) {

        return String(user.username || "").toLowerCase() ===
            username.toLowerCase();

    });


    if (existingUsername) {

        setRegisterFieldError(
            "usernameError",
            "This username is already registered."
        );

        return false;

    }


    /* ==================== 23. CHECK DUPLICATE EMAIL ==================== */

    const existingEmail = users.find(function (user) {

        return String(user.email || "").toLowerCase() === email;

    });


    if (existingEmail) {

        setRegisterFieldError(
            "emailError",
            "This email address is already registered."
        );

        return false;

    }


    /* ==================== 24. CREATE USER ACCOUNT ==================== */

    const createdAt = typeof getCurrentDateTime === "function"
        ? getCurrentDateTime()
        : new Date().toISOString();


    // Customer accounts are Active.
    // Cashier and Staff applications remain Pending.

    const accountStatus = role === "Customer"
        ? "Active"
        : "Pending";


    const newUser = {

        id: CoffeeData.nextId("users"),

        name: fullName,

        email: email,

        phone: phone,

        address: address,

        username: username,

        password: password,

        role: role,

        status: accountStatus,

        ...roleDetails,

        createdAt: createdAt

    };


    /* ==================== 25. SAVE USER DATA ==================== */

    const updatedUsers = users.concat([newUser]);

    const userSaved = CoffeeData.set(
        "users",
        updatedUsers
    );


    if (!userSaved) {

        showRegisterMessage(
            "Unable to save registration. Please try again.",
            "error"
        );

        return false;

    }


    /* ==================== 26. SAVE STAFF APPLICATION ==================== */

    if (role === "Cashier" || role === "Staff") {

        const staff = CoffeeData.get("staff") || [];


        const newStaffApplication = {

            id: CoffeeData.nextId("staff"),

            userId: newUser.id,

            name: fullName,

            email: email,

            phone: phone,

            address: address,

            role: role,

            status: "Pending",

            ...roleDetails,

            createdAt: createdAt

        };


        const updatedStaff = staff.concat([
            newStaffApplication
        ]);


        const staffSaved = CoffeeData.set(
            "staff",
            updatedStaff
        );


        // Roll back the user account if staff application
        // could not be saved.

        if (!staffSaved) {

            CoffeeData.set("users", users);

            showRegisterMessage(
                "Unable to save staff application. Please try again.",
                "error"
            );

            return false;

        }

    }


    /* ==================== 27. SUCCESS MESSAGE ==================== */

    let successMessage = "";


    if (role === "Customer") {

        successMessage =
            "Customer registration successful! You can now log in.";

    } else if (role === "Cashier") {

        successMessage =
            "Cashier application submitted successfully! Please wait for Administrator approval.";

    } else {

        successMessage =
            "Staff / Barista application submitted successfully! Please wait for Administrator approval.";

    }


    /* ==================== 28. RESET FORM ==================== */

    resetRegisterForm();

    showRegisterMessage(
        successMessage,
        "success"
    );


    /* ==================== 29. CUSTOMER REDIRECTION ==================== */

    if (role === "Customer") {

        setTimeout(function () {

            const rootPath = typeof getRootPath === "function"
                ? getRootPath()
                : "";

            window.location.href = rootPath + "login.html";

        }, 1500);

    }


    return false;

}


/* ==================== 30. RESET REGISTRATION FORM ==================== */

function resetRegisterForm() {

    const form = document.getElementById("registerForm");

    form.reset();

    clearRegisterErrors();

    clearRegisterMessage();

    showTypeFields();

    toggleRegisterButton();

}


/* ==================== 31. PAGE INITIALIZATION ==================== */

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
