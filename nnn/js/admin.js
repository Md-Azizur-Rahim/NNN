
/* =========================================================
   COFFEE CORNER - ADMIN JAVASCRIPT
   Administrator Dashboard Management
   Technology: JavaScript + LocalStorage
   ========================================================= */


/* ==================== 1. GLOBAL INITIALIZATION ==================== */

document.addEventListener("DOMContentLoaded", function () {

    if (!requireRole("Administrator")) {
        return;
    }

    const currentUser = getCurrentUser();

    if (currentUser) {
        const welcomeElement = document.getElementById("welcomeUser");

        if (welcomeElement) {
            welcomeElement.textContent = "Welcome, " + currentUser.name;
        }
    }

    renderAnalytics();
    renderMenu();
    renderReviews();
    renderStaff();

    loadMenuFormDefaults();

    const reportTime = document.getElementById("reportTime");

    if (reportTime) {
        reportTime.textContent = "Last updated: " + formatDateTime(getCurrentDateTime());
    }

});


/* ==================== 2. COMMON HELPERS ==================== */

function getAdminElement(id) {
    return document.getElementById(id);
}


function getAdminValue(id) {

    const element = getAdminElement(id);

    return element ? element.value.trim() : "";

}


function setAdminText(id, value) {

    const element = getAdminElement(id);

    if (element) {
        element.textContent = value;
    }

}


function adminEscape(value) {
    return escapeHTML(String(value === null || value === undefined ? "" : value));
}


function getItemUnitPrice(item) {

    return Number(
        item.price ||
        item.unitPrice ||
        item.finalPrice ||
        item.customizedPrice ||
        0
    );

}


function getOrderDate(order) {

    const value = order.createdAt || order.orderDate || "";

    if (!value) {
        return "";
    }

    return String(value).substring(0, 10);

}


function getReviewDate(review) {

    return review.createdAt ||
        review.reviewDate ||
        review.date ||
        "";

}


function getReviewStatus(review) {

    if (review.status) {
        return review.status;
    }

    if (review.response || review.adminResponse) {
        return "Responded";
    }

    return "Pending";

}


function showAdminMessage(elementId, message, type) {

    setMessage(elementId, message, type);

}


/* ==================== 3. SALES ANALYTICS ==================== */


/* 3.1 RENDER ANALYTICS */

function renderAnalytics() {

    const orders = CoffeeData.get("orders") || [];
    const menu = CoffeeData.get("menu") || [];
    const reviews = CoffeeData.get("reviews") || [];

    const today = getCurrentDate();

    let todaySales = 0;
    let todayOrders = 0;

    orders.forEach(function (order) {

        if (getOrderDate(order) !== today) {
            return;
        }

        todayOrders++;

        if (order.paymentStatus === "Paid") {
            todaySales += Number(order.total || 0);
        }

    });


    const activeMenuItems = menu.filter(function (item) {

        return item.availability === "Available";

    }).length;


    const pendingReviews = reviews.filter(function (review) {

        return getReviewStatus(review) === "Pending";

    }).length;


    setAdminText("statSales", formatMoney(todaySales));
    setAdminText("statOrders", todayOrders);
    setAdminText("statMenuItems", activeMenuItems);
    setAdminText("statReviews", pendingReviews);


    renderBestSellingItems();
    renderPeakSales();

}


/* 3.2 BEST SELLING PRODUCTS */

function renderBestSellingItems() {

    const orders = CoffeeData.get("orders") || [];

    const salesData = {};


    orders.forEach(function (order) {

        if (order.paymentStatus !== "Paid") {
            return;
        }

        (order.items || []).forEach(function (item) {

            const itemName = item.name || "Unknown Item";

            const quantity = Number(item.quantity || 0);
            const price = getItemUnitPrice(item);

            if (!salesData[itemName]) {

                salesData[itemName] = {
                    name: itemName,
                    quantity: 0,
                    revenue: 0
                };

            }

            salesData[itemName].quantity += quantity;
            salesData[itemName].revenue += price * quantity;

        });

    });


    const bestSelling = Object.values(salesData)
        .sort(function (a, b) {

            return b.quantity - a.quantity;

        })
        .slice(0, 5);


    const tableBody = getAdminElement("bestSellingTableBody");

    if (!tableBody) {
        return;
    }


    if (bestSelling.length === 0) {

        showEmptyTable(
            "bestSellingTableBody",
            3,
            "No sales data available."
        );

        return;

    }


    tableBody.innerHTML = bestSelling.map(function (item) {

        return `
            <tr>
                <td>${adminEscape(item.name)}</td>
                <td>${item.quantity}</td>
                <td>${formatMoney(item.revenue)}</td>
            </tr>
        `;

    }).join("");

}


/* 3.3 PEAK SALES HOURS */

function renderPeakSales() {

    const orders = CoffeeData.get("orders") || [];

    const hourlySales = {};


    orders.forEach(function (order) {

        if (order.paymentStatus !== "Paid") {
            return;
        }

        const createdAt = order.createdAt || order.orderDate;

        if (!createdAt) {
            return;
        }

        const dateObject = new Date(createdAt);

        if (isNaN(dateObject.getTime())) {
            return;
        }

        const hour = dateObject.getHours();

        if (!hourlySales[hour]) {

            hourlySales[hour] = {
                hour: hour,
                orders: 0,
                sales: 0
            };

        }

        hourlySales[hour].orders++;
        hourlySales[hour].sales += Number(order.total || 0);

    });


    const peakSales = Object.values(hourlySales)
        .sort(function (a, b) {

            return b.sales - a.sales;

        })
        .slice(0, 5);


    const tableBody = getAdminElement("peakSalesTableBody");

    if (!tableBody) {
        return;
    }


    if (peakSales.length === 0) {

        showEmptyTable(
            "peakSalesTableBody",
            3,
            "No sales records available."
        );

        return;

    }


    tableBody.innerHTML = peakSales.map(function (item) {

        const startHour = String(item.hour).padStart(2, "0");
        const endHour = String((item.hour + 1) % 24).padStart(2, "0");

        const timeLabel = startHour + ":00 - " + endHour + ":00";

        return `
            <tr>
                <td>${timeLabel}</td>
                <td>${item.orders}</td>
                <td>${formatMoney(item.sales)}</td>
            </tr>
        `;

    }).join("");

}


/* 3.4 REFRESH REPORT */

function generateReport() {

    renderAnalytics();

    const reportTime = getAdminElement("reportTime");

    if (reportTime) {

        reportTime.textContent =
            "Last updated: " + formatDateTime(getCurrentDateTime());

    }

    showAdminMessage(
        "menuMessage",
        "Sales report refreshed successfully.",
        "success"
    );

}


/* ==================== 4. MENU MANAGEMENT ==================== */


/* 4.1 LOAD MENU FORM DEFAULTS */

function loadMenuFormDefaults() {

    const availability = getAdminElement("availability");

    if (availability && !availability.value) {
        availability.value = "Available";
    }

}


/* 4.2 SAVE MENU ITEM */

function saveMenuItem() {

    clearErrors();
    clearMessage("menuMessage");

    const name = getAdminValue("itemName");
    const category = getAdminValue("category");
    const priceInput = getAdminElement("price");
    const price = Number(priceInput.value);
    const availability = getAdminValue("availability");
    const description = getAdminValue("description");
    const itemId = getAdminValue("menuItemId");


    let isValid = true;


    if (!name) {

        showFieldError(
            "itemNameError",
            "Please enter item name."
        );

        isValid = false;

    }


    if (!category) {

        showFieldError(
            "categoryError",
            "Please select a category."
        );

        isValid = false;

    }


    if (
        !priceInput.value ||
        !Number.isFinite(price) ||
        price <= 0
    ) {

        showFieldError(
            "priceError",
            "Please enter a valid price."
        );

        isValid = false;

    }


    if (!isValid) {
        return false;
    }


    const menu = CoffeeData.get("menu") || [];


    const duplicateItem = menu.find(function (item) {

        return (
            String(item.name).toLowerCase() === name.toLowerCase() &&
            String(item.id) !== String(itemId)
        );

    });


    if (duplicateItem) {

        showAdminMessage(
            "menuMessage",
            "This menu item already exists.",
            "error"
        );

        return false;

    }


    /* UPDATE EXISTING ITEM */

    if (itemId !== "") {

        const itemIndex = menu.findIndex(function (item) {

            return String(item.id) === String(itemId);

        });


        if (itemIndex === -1) {

            showAdminMessage(
                "menuMessage",
                "Menu item not found.",
                "error"
            );

            return false;

        }


        menu[itemIndex] = {

            ...menu[itemIndex],

            name: name,
            category: category,
            price: price,
            availability: availability,
            description: description

        };


        if (!CoffeeData.set("menu", menu)) {

            showAdminMessage(
                "menuMessage",
                "Unable to update menu item.",
                "error"
            );

            return false;

        }


        showAdminMessage(
            "menuMessage",
            "Menu item updated successfully.",
            "success"
        );

    }


    /* ADD NEW ITEM */

    else {

        const newItem = {

            id: CoffeeData.nextId("menu"),
            name: name,
            category: category,
            price: price,
            availability: availability,
            description: description,
            createdAt: getCurrentDateTime()

        };


        menu.push(newItem);


        if (!CoffeeData.set("menu", menu)) {

            showAdminMessage(
                "menuMessage",
                "Unable to add menu item.",
                "error"
            );

            return false;

        }


        showAdminMessage(
            "menuMessage",
            "New menu item added successfully.",
            "success"
        );

    }


    resetMenuForm();

    renderMenu();
    renderAnalytics();

    return false;

}


/* 4.3 RENDER MENU ITEMS */

function renderMenu() {

    const menu = CoffeeData.get("menu") || [];

    const searchText = getAdminValue("menuSearch").toLowerCase();

    const categoryFilter = getAdminValue("menuCategoryFilter");

    const statusFilter = getAdminValue("menuStatusFilter");


    const filteredMenu = menu.filter(function (item) {

        const matchesSearch =
            String(item.name || "").toLowerCase().includes(searchText) ||
            String(item.id || "").toLowerCase().includes(searchText) ||
            String(item.description || "").toLowerCase().includes(searchText);


        const matchesCategory =
            categoryFilter === "All" ||
            categoryFilter === "" ||
            item.category === categoryFilter;


        const matchesStatus =
            statusFilter === "All" ||
            statusFilter === "" ||
            item.availability === statusFilter;


        return matchesSearch && matchesCategory && matchesStatus;

    });


    const tableBody = getAdminElement("menuTableBody");

    setAdminText("menuCount", filteredMenu.length + " menu item(s)");


    if (!tableBody) {
        return;
    }


    if (filteredMenu.length === 0) {

        showEmptyTable(
            "menuTableBody",
            7,
            "No menu items found."
        );

        return;

    }


    tableBody.innerHTML = filteredMenu.map(function (item) {

        return `
            <tr>

                <td>${adminEscape(item.id)}</td>

                <td>${adminEscape(item.name)}</td>

                <td>${adminEscape(item.category)}</td>

                <td>${formatMoney(item.price)}</td>

                <td>${adminEscape(item.description || "-")}</td>

                <td>${getStatusBadge(item.availability)}</td>

                <td>

                    <button
                        type="button"
                        class="btn btn-small"
                        onclick="editMenuItem('${adminEscape(item.id)}')">
                        Edit
                    </button>

                    <button
                        type="button"
                        class="btn btn-small btn-danger"
                        onclick="deleteMenuItem('${adminEscape(item.id)}')">
                        Delete
                    </button>

                </td>

            </tr>
        `;

    }).join("");

}


/* Keep compatibility with HTML onkeyup/onchange */

function renderMenuItems() {
    renderMenu();
}


/* 4.4 EDIT MENU ITEM */

function editMenuItem(itemId) {

    const menu = CoffeeData.get("menu") || [];

    const item = menu.find(function (menuItem) {

        return String(menuItem.id) === String(itemId);

    });


    if (!item) {

        showAdminMessage(
            "menuMessage",
            "Menu item not found.",
            "error"
        );

        return;

    }


    getAdminElement("menuItemId").value = item.id;
    getAdminElement("itemName").value = item.name;
    getAdminElement("category").value = item.category;
    getAdminElement("price").value = item.price;
    getAdminElement("availability").value = item.availability;
    getAdminElement("description").value = item.description || "";


    setAdminText("menuFormTitle", "Edit Menu Item");

    const saveButton = getAdminElement("menuSaveButton");

    if (saveButton) {
        saveButton.value = "Update Menu Item";
    }


    showSection("menuSection");

    showAdminMessage(
        "menuMessage",
        "Edit the item information and click Update Menu Item.",
        "success"
    );

}


/* 4.5 DELETE MENU ITEM */

function deleteMenuItem(itemId) {

    if (!confirmDelete("Are you sure you want to delete this menu item?")) {
        return;
    }


    const menu = CoffeeData.get("menu") || [];

    const item = menu.find(function (menuItem) {

        return String(menuItem.id) === String(itemId);

    });


    if (!item) {

        showAdminMessage(
            "menuMessage",
            "Menu item not found.",
            "error"
        );

        return;

    }


    const updatedMenu = menu.filter(function (menuItem) {

        return String(menuItem.id) !== String(itemId);

    });


    if (!CoffeeData.set("menu", updatedMenu)) {

        showAdminMessage(
            "menuMessage",
            "Unable to delete menu item.",
            "error"
        );

        return;

    }


    showAdminMessage(
        "menuMessage",
        "Menu item deleted successfully.",
        "success"
    );


    renderMenu();
    renderAnalytics();

}


/* 4.6 RESET MENU FORM */

function resetMenuForm() {

    const form = getAdminElement("menuForm");

    if (form) {
        form.reset();
    }

    getAdminElement("menuItemId").value = "";

    setAdminText("menuFormTitle", "Add New Menu Item");

    const saveButton = getAdminElement("menuSaveButton");

    if (saveButton) {
        saveButton.value = "Add Menu Item";
    }

    clearErrors();
    loadMenuFormDefaults();

}


/* ==================== 5. REVIEW MANAGEMENT ==================== */


/* 5.1 RENDER REVIEWS */

function renderReviews() {

    const reviews = CoffeeData.get("reviews") || [];

    const searchText = getAdminValue("reviewSearch").toLowerCase();

    const ratingFilter = getAdminValue("ratingFilter");

    const typeFilter = getAdminValue("reviewTypeFilter");


    const filteredReviews = reviews.filter(function (review) {

        const searchableText = [

            review.id || "",
            review.customerName || "",
            review.itemName || "",
            review.type || "",
            review.comment || ""

        ].join(" ").toLowerCase();


        const matchesSearch = searchableText.includes(searchText);


        const matchesRating =
            ratingFilter === "All" ||
            ratingFilter === "" ||
            String(review.rating) === String(ratingFilter);


        const matchesType =
            typeFilter === "All" ||
            typeFilter === "" ||
            review.type === typeFilter;


        return matchesSearch && matchesRating && matchesType;

    });


    const tableBody = getAdminElement("reviewTableBody");

    setAdminText("reviewCount", filteredReviews.length + " review(s)");


    if (!tableBody) {
        return;
    }


    if (filteredReviews.length === 0) {

        showEmptyTable(
            "reviewTableBody",
            8,
            "No reviews found."
        );

        return;

    }


    tableBody.innerHTML = filteredReviews.map(function (review) {

        const response = review.response || review.adminResponse || "";

        const reviewStatus = getReviewStatus(review);

        const reviewDate = getReviewDate(review);

        return `
            <tr>

                <td>${adminEscape(review.id || "-")}</td>

                <td>${adminEscape(review.customerName || "Customer")}</td>

                <td>${adminEscape(review.type || "Coffee Shop")}</td>

                <td>${adminEscape(review.rating || 0)} / 5</td>

                <td>${adminEscape(review.comment || "-")}</td>

                <td>${reviewDate ? formatDateTime(reviewDate) : "-"}</td>

                <td>${getStatusBadge(reviewStatus)}</td>

                <td>

                    <button
                        type="button"
                        class="btn btn-small"
                        onclick="respondToReview('${adminEscape(review.id)}')">
                        Respond
                    </button>

                </td>

            </tr>
        `;

    }).join("");

}


/* 5.2 SELECT REVIEW FOR RESPONSE */

function respondToReview(reviewId) {

    const reviews = CoffeeData.get("reviews") || [];

    const review = reviews.find(function (item) {

        return String(item.id) === String(reviewId);

    });


    if (!review) {

        showAdminMessage(
            "reviewMessage",
            "Review not found.",
            "error"
        );

        return;

    }


    getAdminElement("responseReviewId").value = review.id;

    getAdminElement("adminResponse").value =
        review.response || review.adminResponse || "";


    showSection("reviewsSection");

    showAdminMessage(
        "reviewMessage",
        "Write your response in the review response form.",
        "success"
    );

}


/* 5.3 SAVE REVIEW RESPONSE */

function saveReviewResponse() {

    clearErrors();
    clearMessage("reviewMessage");


    const reviewId = getAdminValue("responseReviewId");

    const response = getAdminValue("adminResponse");


    let isValid = true;


    if (!reviewId) {

        showFieldError(
            "responseReviewIdError",
            "Please enter or select a review ID."
        );

        isValid = false;

    }


    if (!response) {

        showFieldError(
            "adminResponseError",
            "Please enter an admin response."
        );

        isValid = false;

    }


    if (!isValid) {
        return false;
    }


    const reviews = CoffeeData.get("reviews") || [];

    const reviewIndex = reviews.findIndex(function (item) {

        return String(item.id) === String(reviewId);

    });


    if (reviewIndex === -1) {

        showAdminMessage(
            "reviewMessage",
            "Review not found.",
            "error"
        );

        return false;

    }


    reviews[reviewIndex].response = response;
    reviews[reviewIndex].adminResponse = response;
    reviews[reviewIndex].status = "Responded";
    reviews[reviewIndex].respondedAt = getCurrentDateTime();


    if (!CoffeeData.set("reviews", reviews)) {

        showAdminMessage(
            "reviewMessage",
            "Unable to save review response.",
            "error"
        );

        return false;

    }


    showAdminMessage(
        "reviewMessage",
        "Review response saved successfully.",
        "success"
    );


    resetResponseForm();

    renderReviews();
    renderAnalytics();

    return false;

}


/* 5.4 RESET RESPONSE FORM */

function resetResponseForm() {

    const form = getAdminElement("responseForm");

    if (form) {
        form.reset();
    }

    clearErrors();

}


/* ==================== 6. STAFF ACCOUNT MANAGEMENT ==================== */


/* 6.1 RENDER STAFF */

function renderStaff() {

    const staff = CoffeeData.get("staff") || [];

    const searchText = getAdminValue("staffSearch").toLowerCase();

    const roleFilter = getAdminValue("staffRoleFilter");

    const statusFilter = getAdminValue("staffStatusFilter");


    const filteredStaff = staff.filter(function (member) {

        const searchableText = [

            member.id || "",
            member.name || "",
            member.email || ""

        ].join(" ").toLowerCase();


        const matchesSearch = searchableText.includes(searchText);


        const matchesRole =
            roleFilter === "All" ||
            roleFilter === "" ||
            member.role === roleFilter;


        const matchesStatus =
            statusFilter === "All" ||
            statusFilter === "" ||
            member.status === statusFilter;


        return matchesSearch && matchesRole && matchesStatus;

    });


    const tableBody = getAdminElement("staffTableBody");

    setAdminText("staffCount", filteredStaff.length + " staff member(s)");


    if (!tableBody) {
        return;
    }


    if (filteredStaff.length === 0) {

        showEmptyTable(
            "staffTableBody",
            6,
            "No staff members found."
        );

        return;

    }


    tableBody.innerHTML = filteredStaff.map(function (member) {

        return `
            <tr>

                <td>${adminEscape(member.id)}</td>

                <td>${adminEscape(member.name)}</td>

                <td>${adminEscape(member.email)}</td>

                <td>${adminEscape(member.role)}</td>

                <td>${getStatusBadge(member.status)}</td>

                <td>

                    <button
                        type="button"
                        class="btn btn-small"
                        onclick="editStaff('${adminEscape(member.id)}')">
                        Edit
                    </button>

                    <button
                        type="button"
                        class="btn btn-small btn-danger"
                        onclick="deleteStaff('${adminEscape(member.id)}')">
                        Block
                    </button>

                </td>

            </tr>
        `;

    }).join("");

}


/* 6.2 SAVE STAFF */

function saveStaff() {

    clearErrors();
    clearMessage("staffMessage");


    const name = getAdminValue("staffName");

    const email = getAdminValue("staffEmail").toLowerCase();

    const role = getAdminValue("staffRole");

    const password = getAdminElement("staffPassword").value;

    const staffId = getAdminValue("staffId");


    const status = getAdminElement("staffActive").checked
        ? "Active"
        : "Blocked";


    let isValid = true;


    if (!name) {

        showFieldError(
            "staffNameError",
            "Please enter staff name."
        );

        isValid = false;

    }


    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailPattern.test(email)) {

        showFieldError(
            "staffEmailError",
            "Please enter a valid email address."
        );

        isValid = false;

    }


    if (role !== "Cashier" && role !== "Staff") {

        showFieldError(
            "staffRoleError",
            "Please select a valid staff role."
        );

        isValid = false;

    }


    if (staffId === "" && password.length < 6) {

        showFieldError(
            "staffPasswordError",
            "Password must contain at least 6 characters."
        );

        isValid = false;

    }


    if (password !== "" && password.length < 6) {

        showFieldError(
            "staffPasswordError",
            "Password must contain at least 6 characters."
        );

        isValid = false;

    }


    if (!isValid) {
        return false;
    }


    const staff = CoffeeData.get("staff") || [];

    const users = CoffeeData.get("users") || [];


    /* CHECK DUPLICATE EMAIL */

    const duplicateStaff = staff.find(function (member) {

        return (
            String(member.email || "").toLowerCase() === email &&
            String(member.id) !== String(staffId)
        );

    });


    const duplicateUser = users.find(function (user) {

        return (
            String(user.email || "").toLowerCase() === email &&
            (user.role === "Cashier" || user.role === "Staff") &&
            String(user.id) !== String(
                staff.find(function (member) {
                    return String(member.id) === String(staffId);
                })?.userId || ""
            )
        );

    });


    if (duplicateStaff || duplicateUser) {

        showAdminMessage(
            "staffMessage",
            "This email is already registered.",
            "error"
        );

        return false;

    }


    /* UPDATE EXISTING STAFF */

    if (staffId !== "") {

        const staffIndex = staff.findIndex(function (member) {

            return String(member.id) === String(staffId);

        });


        if (staffIndex === -1) {

            showAdminMessage(
                "staffMessage",
                "Staff member not found.",
                "error"
            );

            return false;

        }


        const oldStaff = staff[staffIndex];


        staff[staffIndex] = {

            ...oldStaff,

            name: name,
            email: email,
            role: role,
            status: status

        };


        const linkedUser = users.find(function (user) {

            return (
                String(user.id) === String(oldStaff.userId) ||
                String(user.email || "").toLowerCase() ===
                String(oldStaff.email || "").toLowerCase()
            );

        });


        if (linkedUser) {

            linkedUser.name = name;
            linkedUser.email = email;
            linkedUser.role = role;
            linkedUser.status = status;

            if (password !== "") {
                linkedUser.password = password;
            }

        }


        if (
            !CoffeeData.set("staff", staff) ||
            !CoffeeData.set("users", users)
        ) {

            showAdminMessage(
                "staffMessage",
                "Unable to update staff account.",
                "error"
            );

            return false;

        }


        showAdminMessage(
            "staffMessage",
            "Staff information updated successfully.",
            "success"
        );

    }


    /* ADD NEW STAFF */

    else {

        const usernameBase = email.split("@")[0];

        let username = usernameBase;

        let counter = 1;


        while (users.some(function (user) {

            return String(user.username || "").toLowerCase() === username;

        })) {

            username = usernameBase + counter;

            counter++;

        }


        const userId = CoffeeData.nextId("users");

        const staffRecordId = CoffeeData.nextId("staff");


        const newUser = {

            id: userId,
            name: name,
            username: username,
            email: email,
            phone: "",
            address: "",
            password: password,
            role: role,
            status: status,
            createdAt: getCurrentDateTime()

        };


        const newStaff = {

            id: staffRecordId,
            userId: userId,
            name: name,
            email: email,
            role: role,
            status: status,
            createdAt: getCurrentDateTime()

        };


        users.push(newUser);
        staff.push(newStaff);


        if (
            !CoffeeData.set("users", users) ||
            !CoffeeData.set("staff", staff)
        ) {

            showAdminMessage(
                "staffMessage",
                "Unable to create staff account.",
                "error"
            );

            return false;

        }


        showAdminMessage(
            "staffMessage",
            "Staff account created successfully. Username: " + username,
            "success"
        );

    }


    resetStaffForm();

    renderStaff();
    renderAnalytics();

    return false;

}


/* 6.3 EDIT STAFF */

function editStaff(staffId) {

    const staff = CoffeeData.get("staff") || [];

    const member = staff.find(function (item) {

        return String(item.id) === String(staffId);

    });


    if (!member) {

        showAdminMessage(
            "staffMessage",
            "Staff member not found.",
            "error"
        );

        return;

    }


    getAdminElement("staffId").value = member.id;

    getAdminElement("staffName").value = member.name;

    getAdminElement("staffEmail").value = member.email;

    getAdminElement("staffRole").value = member.role;

    getAdminElement("staffPassword").value = "";


    getAdminElement("staffActive").checked =
        member.status === "Active";

    getAdminElement("staffBlocked").checked =
        member.status !== "Active";


    setAdminText("staffFormTitle", "Edit Staff Information");


    const saveButton = getAdminElement("staffSaveButton");

    if (saveButton) {
        saveButton.value = "Update Staff";
    }


    showSection("staffSection");

    showAdminMessage(
        "staffMessage",
        "Update the staff information and click Save.",
        "success"
    );

}


/* 6.4 BLOCK / DEACTIVATE STAFF */

function deleteStaff(staffId) {

    if (!confirmDelete("Are you sure you want to block this staff account?")) {
        return;
    }


    const staff = CoffeeData.get("staff") || [];

    const users = CoffeeData.get("users") || [];


    const staffIndex = staff.findIndex(function (member) {

        return String(member.id) === String(staffId);

    });


    if (staffIndex === -1) {

        showAdminMessage(
            "staffMessage",
            "Staff member not found.",
            "error"
        );

        return;

    }


    const member = staff[staffIndex];


    member.status = "Blocked";


    const linkedUser = users.find(function (user) {

        return (
            String(user.id) === String(member.userId) ||
            String(user.email || "").toLowerCase() ===
            String(member.email || "").toLowerCase()
        );

    });


    if (linkedUser) {
        linkedUser.status = "Blocked";
    }


    if (
        !CoffeeData.set("staff", staff) ||
        !CoffeeData.set("users", users)
    ) {

        showAdminMessage(
            "staffMessage",
            "Unable to block staff account.",
            "error"
        );

        return;

    }


    showAdminMessage(
        "staffMessage",
        "Staff account blocked successfully.",
        "success"
    );


    renderStaff();
    renderAnalytics();

}


/* 6.5 RESET STAFF FORM */

function resetStaffForm() {

    const form = getAdminElement("staffForm");

    if (form) {
        form.reset();
    }


    getAdminElement("staffId").value = "";

    getAdminElement("staffActive").checked = true;


    setAdminText("staffFormTitle", "Add New Staff");


    const saveButton = getAdminElement("staffSaveButton");

    if (saveButton) {
        saveButton.value = "Add Staff";
    }


    clearErrors();

}


/* ==================== 7. STORAGE EVENT ==================== */

/*
   Update Admin Dashboard when another browser tab
   changes menu, orders, reviews, or staff data.
*/

window.addEventListener("storage", function (event) {

    if (!event.key) {
        return;
    }


    const refreshKeys = [

        "coffee_corner_orders",
        "coffee_corner_menu",
        "coffee_corner_reviews",
        "coffee_corner_staff",
        "coffee_corner_users"

    ];


    if (refreshKeys.includes(event.key)) {

        renderAnalytics();
        renderMenu();
        renderReviews();
        renderStaff();

    }

});


/* ==================== 8. REFRESH ON WINDOW FOCUS ==================== */

window.addEventListener("focus", function () {

    renderAnalytics();
    renderMenu();
    renderReviews();
    renderStaff();

});


/* ==================== END OF ADMIN JAVASCRIPT ==================== */
