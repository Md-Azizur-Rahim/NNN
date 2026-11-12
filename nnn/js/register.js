
/* =========================================================
   COFFEE CORNER - REGISTER JAVASCRIPT
   Customer Registration and Validation
   Technology: JavaScript + LocalStorage
   ========================================================= */


/* ==================== 1. CUSTOMER REGISTRATION ==================== */

function registerCustomer() {

    clearErrors();

    clearMessage("registerMessage");


    /* ==================== 2. GET FORM VALUES ==================== */

    const fullName = document.getElementById("fullName").value.trim();

    const email = document.getElementById("email").value.trim();

    const phone = document.getElementById("phone").value.trim();

    const address = document.getElementById("address").value.trim();

    const username = document.getElementById("newUsername").value.trim();

    const password = document.getElementById("newPassword").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;


    let isValid = true;


    /* ==================== 3. NAME VALIDATION ==================== */

    if (fullName === "") {

        showFieldError(
            "fullNameError",
            "Please enter your full name."
        );

        isValid = false;

    } else if (fullName.length < 2) {

        showFieldError(
            "fullNameError",
            "Name must contain at least 2 characters."
        );

        isValid = false;

    }


    /* ==================== 4. EMAIL VALIDATION ==================== */

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email === "") {

        showFieldError(
            "emailError",
            "Please enter your email address."
        );

        isValid = false;

    } else if (!emailPattern.test(email)) {

        showFieldError(
            "emailError",
            "Please enter a valid email address."
        );

        isValid = false;

    }


    /* ==================== 5. PHONE VALIDATION ==================== */

    const phonePattern = /^01[3-9]\d{8}$/;

    if (phone === "") {

        showFieldError(
            "phoneError",
            "Please enter your phone number."
        );

        isValid = false;

    } else if (!phonePattern.test(phone)) {

        showFieldError(
            "phoneError",
            "Enter a valid 11-digit Bangladeshi mobile number."
        );

        isValid = false;

    }


    /* ==================== 6. ADDRESS VALIDATION ==================== */

    if (address === "") {

        showFieldError(
            "addressError",
            "Please enter your address."
        );

        isValid = false;

    }


    /* ==================== 7. USERNAME VALIDATION ==================== */

    if (username === "") {

        showFieldError(
            "usernameError",
            "Please choose a username."
        );

        isValid = false;

    } else if (username.length < 4) {

        showFieldError(
            "usernameError",
            "Username must contain at least 4 characters."
        );

        isValid = false;

    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {

        showFieldError(
            "usernameError",
            "Username can contain letters, numbers and underscore only."
        );

        isValid = false;

    }


    /* ==================== 8. PASSWORD VALIDATION ==================== */

    if (password.trim() === "") {

        showFieldError(
            "passwordError",
            "Please enter a password."
        );

        isValid = false;

    } else if (password.length < 6) {

        showFieldError(
            "passwordError",
            "Password must contain at least 6 characters."
        );

        isValid = false;

    }


    /* ==================== 9. CONFIRM PASSWORD ==================== */

    if (confirmPassword === "") {

        showFieldError(
            "confirmPasswordError",
            "Please confirm your password."
        );

        isValid = false;

    } else if (password !== confirmPassword) {

        showFieldError(
            "confirmPasswordError",
            "Passwords do not match."
        );

        isValid = false;

    }


    if (!isValid) {
        return false;
    }


    /* ==================== 10. GET EXISTING USERS ==================== */

    const users = CoffeeData.get("users");


    /* ==================== 11. CHECK DUPLICATE USERNAME ==================== */

    const existingUsername = users.find(function (user) {

        return String(user.username || "").toLowerCase() ===
            username.toLowerCase();

    });


    if (existingUsername) {

        showFieldError(
            "usernameError",
            "This username is already registered."
        );

        return false;

    }


    /* ==================== 12. CHECK DUPLICATE EMAIL ==================== */

    const existingEmail = users.find(function (user) {

        return String(user.email || "").toLowerCase() ===
            email.toLowerCase();

    });


    if (existingEmail) {

        showFieldError(
            "emailError",
            "This email address is already registered."
        );

        return false;

    }


    /* ==================== 13. CREATE CUSTOMER ACCOUNT ==================== */

    const newCustomer = {

        id: CoffeeData.nextId("users"),

        name: fullName,

        email: email,

        phone: phone,

        address: address,

        username: username,

        password: password,

        role: "Customer",

        status: "Active",

        createdAt: getCurrentDateTime()

    };


    /* ==================== 14. SAVE CUSTOMER DATA ==================== */

    users.push(newCustomer);

    const saved = CoffeeData.set("users", users);


    if (!saved) {

        setMessage(
            "registerMessage",
            "Registration failed. Please try again.",
            "error"
        );

        return false;

    }


    /* ==================== 15. SUCCESS MESSAGE ==================== */

    setMessage(
        "registerMessage",
        "Registration successful! You can now log in.",
        "success"
    );


    /* ==================== 16. RESET FORM ==================== */

    document.getElementById("registerForm").reset();


    /* ==================== 17. REDIRECT TO LOGIN ==================== */

    setTimeout(function () {

        window.location.href = getRootPath() + "login.html";

    }, 1500);


    return false;

}


/* ==================== 18. CLEAR REGISTRATION MESSAGE ==================== */

function clearRegisterMessage() {

    clearMessage("registerMessage");

    clearErrors();

}


/* ==================== 19. REGISTRATION PAGE INITIALIZATION ==================== */

document.addEventListener("DOMContentLoaded", function () {

    const registerForm = document.getElementById("registerForm");

    if (!registerForm) {
        return;
    }

    clearRegisterMessage();

});
