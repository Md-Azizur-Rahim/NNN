/* =========================================================
   COFFEE CORNER - CUSTOMER JAVASCRIPT
   Customer Dashboard Management
   Technology: JavaScript + LocalStorage
   Programming Style: Procedural JavaScript
   ========================================================= */


/* ==================== 1. INITIALIZATION ==================== */

document.addEventListener("DOMContentLoaded", function () {

    if (!requireRole("Customer")) {
        return;
    }

    const currentUser = getCurrentUser();

    const welcomeUser = document.getElementById("welcomeUser");

    if (welcomeUser && currentUser) {
        welcomeUser.textContent = "Welcome, " + currentUser.name;
    }

    loadCoffeeOptions();
    loadFavoriteOptions();

    

    renderFavorites();
    renderOrderHistory();

  

});


/* ==================== 2. DATA HELPER ==================== */

function getCustomerData(key) {

    const data = CoffeeData.get(key);

    return Array.isArray(data) ? data : [];

}


/* =========================================================
   3. CUSTOM COFFEE BUILDER
   ========================================================= */
// Store the last calculated coffee price
let calculatedCustomPriceResult = null;
let calculatedCustomPriceKey = "";

/* ==================== 3.1 LOAD COFFEE OPTIONS ==================== */

function loadCoffeeOptions() {

    const menu = getCustomerData("menu");

    const coffeeSelect = document.getElementById("coffee");

    if (!coffeeSelect) return;

    const availableItems = menu.filter(function (item) {

        return item.availability === "Available";

    });

    coffeeSelect.innerHTML = `
        <option value="">-- Select Coffee --</option>

        ${availableItems.map(function (item) {

        return `
                <option value="${escapeHTML(item.id)}">
                    ${escapeHTML(item.name)} - ${formatMoney(item.price)}
                </option>
            `;

    }).join("")}
    `;

}


/* ==================== 3.2 PRICE CALCULATION HELPER ==================== */

function getCustomCoffeePrice() {

    const coffeeId = document.getElementById("coffee").value;
    const size = document.getElementById("size").value;
    const milk = document.getElementById("milk").value;
    const sugar = document.getElementById("sugar").value;
    const quantity = Number(document.getElementById("quantity").value);

    // Validate required fields
    if (!coffeeId || !size || !milk || !sugar) {
        return null;
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        return null;
    }

    const menu = getCustomerData("menu");

    const selectedCoffee = menu.find(function (item) {

        return (
            String(item.id) === String(coffeeId) &&
            item.availability === "Available"
        );

    });

    if (!selectedCoffee) {
        return null;
    }

    // Size charge
    let sizeCharge = 0;

    if (size === "Medium") {
        sizeCharge = 20;
    } else if (size === "Large") {
        sizeCharge = 40;
    }

    // Milk charge
    let milkCharge = 0;

    if (milk === "Almond Milk") {
        milkCharge = 30;
    } else if (milk === "Soy Milk") {
        milkCharge = 20;
    }

    // Sugar charge
    let sugarCharge = 0;

    if (sugar === "Extra Sugar") {
        sugarCharge = 5;
    }

    const unitPrice =
        Number(selectedCoffee.price) +
        sizeCharge +
        milkCharge +
        sugarCharge;

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        return null;
    }

    return {

        coffee: selectedCoffee,

        unitPrice: unitPrice,

        totalPrice: unitPrice * quantity,

        quantity: quantity

    };

}


/* ==================== 3.3 CALCULATE CUSTOM PRICE ==================== */

function calculateCustomPrice() {

    const priceDisplay = document.getElementById("estimatedPrice");

    if (!priceDisplay) return 0;

    const result = getCustomCoffeePrice();

    if (!result) {

        calculatedCustomPriceResult = null;
        calculatedCustomPriceKey = "";

        priceDisplay.textContent = formatMoney(0);

        setMessage(
            "builderMessage",
            "Please select all coffee options and enter a valid quantity.",
            "error"
        );

        return 0;

    }

    // Save the calculated price and selected options
    calculatedCustomPriceResult = result;

    calculatedCustomPriceKey = JSON.stringify({

        coffee: document.getElementById("coffee").value,
        size: document.getElementById("size").value,
        milk: document.getElementById("milk").value,
        sugar: document.getElementById("sugar").value,
        quantity: document.getElementById("quantity").value

    });

    priceDisplay.textContent = formatMoney(result.totalPrice);

    clearMessage("builderMessage");

    return result.totalPrice;

}


/* ==================== 3.4 PLACE CUSTOM ORDER ==================== */

function placeCustomOrder() {

    clearMessage("builderMessage");
    clearErrors();

    const coffeeId = document.getElementById("coffee").value;
    const size = document.getElementById("size").value;
    const milk = document.getElementById("milk").value;
    const sugar = document.getElementById("sugar").value;
    const quantity = Number(document.getElementById("quantity").value);

    // Validate coffee
    if (!coffeeId) {
        showFieldError("coffeeError", "Please select a coffee.");
    }

    // Validate size
    if (!size) {
        showFieldError("sizeError", "Please select a size.");
    }

    // Validate milk
    if (!milk) {
        showFieldError("milkError", "Please select a milk type.");
    }

    // Validate sugar
    if (!sugar) {
        showFieldError("sugarError", "Please select a sugar level.");
    }

    // Validate quantity
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {

        showFieldError(
            "quantityError",
            "Quantity must be between 1 and 20."
        );

    }

    if (
        !coffeeId ||
        !size ||
        !milk ||
        !sugar ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 20
    ) {

        setMessage(
            "builderMessage",
            "Please check all required fields.",
            "error"
        );

        return false;

    }


// Check whether price has been calculated
if (!calculatedCustomPriceResult) {

    setMessage(
        "builderMessage",
        "Please click Calculate Price before placing your order.",
        "error"
    );

    return false;

}

// Check whether selected options have changed after calculation
const currentPriceKey = JSON.stringify({

    coffee: document.getElementById("coffee").value,
    size: document.getElementById("size").value,
    milk: document.getElementById("milk").value,
    sugar: document.getElementById("sugar").value,
    quantity: document.getElementById("quantity").value

});

if (currentPriceKey !== calculatedCustomPriceKey) {

    calculatedCustomPriceResult = null;
    calculatedCustomPriceKey = "";

    setMessage(
        "builderMessage",
        "Your coffee options have changed. Please calculate the price again.",
        "error"
    );

    return false;

}

// Use the last calculated price
const priceResult = calculatedCustomPriceResult;


    // Get current customer
    const currentUser = getCurrentUser();

    if (!currentUser) {
        return false;
    }


    // Get existing orders
    const orders = getCustomerData("orders");


    // Generate order token
    const orderToken = CoffeeData.token();


    // Calculate waiting time
    const pendingOrders = orders.filter(function (order) {

        return (
            order.status === "Pending" ||
            order.status === "Preparing"
        );

    }).length;

    const estimatedWait = 5 + (pendingOrders * 5);


    // Create order
    const newOrder = {

        id: CoffeeData.nextId("orders"),

        token: orderToken,

        customerId: currentUser.id,

        customerName: currentUser.name,

        items: [

            {

                menuItemId: priceResult.coffee.id,

                name: priceResult.coffee.name,

                size: size,

                milk: milk,

                sugar: sugar,

                quantity: quantity,

                price: priceResult.unitPrice

            }

        ],

        subtotal: priceResult.totalPrice,

        total: priceResult.totalPrice,

        status: "Pending",

        paymentStatus: "Unpaid",

        paymentMethod: "",

        estimatedWait: estimatedWait,

        createdAt: getCurrentDateTime()

    };


    // Save order
    orders.push(newOrder);

    if (!CoffeeData.set("orders", orders)) {

        setMessage(
            "builderMessage",
            "Unable to save your order. Please try again.",
            "error"
        );

        return false;

    }


    // Show success message
    setMessage(
        "builderMessage",
        "Order placed successfully! Your token number is " +
        orderToken + ".",
        "success"
    );


 // Reset form after successful order
document.getElementById("coffeeForm").reset();

calculatedCustomPriceResult = null;
calculatedCustomPriceKey = "";

const priceDisplay = document.getElementById("estimatedPrice");

if (priceDisplay) {
    priceDisplay.textContent = formatMoney(0);
}


    // Refresh dashboard
    renderOrderHistory();

    renderFavorites();

    return false;

}


function resetCoffeeForm() {

    const form = document.getElementById("coffeeForm");

    if (form) {
        form.reset();
    }

    calculatedCustomPriceResult = null;
    calculatedCustomPriceKey = "";

    const priceDisplay = document.getElementById("estimatedPrice");

    if (priceDisplay) {
        priceDisplay.textContent = formatMoney(0);
    }

    clearMessage("builderMessage");

    clearErrors();

}


/* =========================================================
   4. FAVORITE ITEMS
   ========================================================= */


/* ==================== 4.1 LOAD FAVORITE OPTIONS ==================== */

function loadFavoriteOptions() {

    const menu = getCustomerData("menu");

    const select = document.getElementById("favoriteItem");

    if (!select) return;

    const availableItems = menu.filter(function (item) {

        return item.availability === "Available";

    });

    select.innerHTML = `
        <option value="">-- Select Coffee --</option>

        ${availableItems.map(function (item) {

        return `
                <option value="${escapeHTML(item.id)}">
                    ${escapeHTML(item.name)}
                </option>
            `;

    }).join("")}
    `;

}


/* ==================== 4.2 ADD FAVORITE ITEM ==================== */

function addFavoriteItem() {

    clearMessage("favoriteMessage");

    const menuItemId = document.getElementById("favoriteItem").value;

    if (!menuItemId) {

        setMessage(
            "favoriteMessage",
            "Please select a menu item.",
            "error"
        );

        return false;

    }


    const currentUser = getCurrentUser();

    if (!currentUser) {
        return false;
    }


    const menu = getCustomerData("menu");

    const favorites = getCustomerData("favorites");


    const selectedItem = menu.find(function (item) {

        return (
            String(item.id) === String(menuItemId) &&
            item.availability === "Available"
        );

    });


    if (!selectedItem) {

        setMessage(
            "favoriteMessage",
            "Selected menu item is unavailable or not found.",
            "error"
        );

        return false;

    }


    // Check duplicate favorite
    const alreadyFavorite = favorites.some(function (favorite) {

        return (
            String(favorite.customerId) === String(currentUser.id) &&
            String(favorite.menuItemId) === String(menuItemId)
        );

    });


    if (alreadyFavorite) {

        setMessage(
            "favoriteMessage",
            "This item is already in your favorites.",
            "error"
        );

        return false;

    }


    // Create favorite record
    const newFavorite = {

        id: CoffeeData.nextId("favorites"),

        customerId: currentUser.id,

        menuItemId: selectedItem.id,

        itemName: selectedItem.name,

        createdAt: getCurrentDateTime()

    };


    favorites.push(newFavorite);


    if (!CoffeeData.set("favorites", favorites)) {

        setMessage(
            "favoriteMessage",
            "Unable to save favorite item. Please try again.",
            "error"
        );

        return false;

    }


    setMessage(
        "favoriteMessage",
        "Item added to your favorites successfully.",
        "success"
    );


    document.getElementById("favoriteForm").reset();

    renderFavorites();

    return false;

}


/* ==================== 4.3 RENDER FAVORITES ==================== */

function renderFavorites() {

    const currentUser = getCurrentUser();

    if (!currentUser) return;

    const favorites = getCustomerData("favorites");

    const menu = getCustomerData("menu");

    const tableBody = document.getElementById("favoriteTableBody");

    if (!tableBody) return;


    const customerFavorites = favorites.filter(function (favorite) {

        return String(favorite.customerId) === String(currentUser.id);

    });


    if (customerFavorites.length === 0) {

        showEmptyTable(
            "favoriteTableBody",
            5,
            "You have not added any favorite items."
        );

        return;

    }


    tableBody.innerHTML = customerFavorites.map(function (favorite) {

        const item = menu.find(function (menuItem) {

            return String(menuItem.id) === String(favorite.menuItemId);

        });


        const itemName = item
            ? item.name
            : (favorite.itemName || "Deleted Item");

        const itemCategory = item
            ? item.category
            : "Unavailable";

        const itemPrice = item
            ? formatMoney(item.price)
            : "Unavailable";


        return `
            <tr>

                <td>${escapeHTML(favorite.id)}</td>

                <td>${escapeHTML(itemName)}</td>

                <td>${escapeHTML(itemCategory)}</td>

                <td>${itemPrice}</td>

                <td>
                    <button type="button"
                        class="btn btn-small btn-danger"
                        onclick="removeFavorite('${escapeHTML(favorite.id)}')">
                        Remove
                    </button>
                </td>

            </tr>
        `;

    }).join("");

}


/* ==================== 4.4 REMOVE FAVORITE ==================== */

function removeFavorite(favoriteId) {

    if (!confirmDelete("Remove this item from your favorites?")) {
        return;
    }


    const currentUser = getCurrentUser();

    if (!currentUser) return;


    const favorites = getCustomerData("favorites");


    const updatedFavorites = favorites.filter(function (favorite) {

        return !(
            String(favorite.id) === String(favoriteId) &&
            String(favorite.customerId) === String(currentUser.id)
        );

    });


    if (!CoffeeData.set("favorites", updatedFavorites)) {

        setMessage(
            "favoriteMessage",
            "Unable to remove favorite item. Please try again.",
            "error"
        );

        return;

    }


    setMessage(
        "favoriteMessage",
        "Favorite item removed successfully.",
        "success"
    );


    renderFavorites();

}


/* =========================================================
   5. ORDER TOKEN AND WAITING TIME
   ========================================================= */


/* ==================== 5.1 SEARCH ORDER TOKEN ==================== */

function searchOrderToken() {

    clearMessage("tokenMessage");

    const token = document.getElementById("tokenNo").value.trim();

    const currentUser = getCurrentUser();

    if (!currentUser) return false;


    if (token === "") {

        setMessage(
            "tokenMessage",
            "Please enter your order token.",
            "error"
        );

        return false;

    }


    const orders = getCustomerData("orders");


    // Search only logged-in customer's order
    const order = orders.find(function (item) {

        return (
            String(item.token).toLowerCase() === token.toLowerCase() &&
            String(item.customerId) === String(currentUser.id)
        );

    });


    const tableBody = document.getElementById("tokenTableBody");

    if (!tableBody) return false;


    if (!order) {

        showEmptyTable(
            "tokenTableBody",
            6,
            "No order found with this token."
        );

        setMessage(
            "tokenMessage",
            "Order token not found. Please check your token number.",
            "error"
        );

        return false;

    }


    // Display coffee item names
    const itemNames = (order.items || []).map(function (item) {

        return escapeHTML(item.name) +
            " (x" + Number(item.quantity || 1) + ")";

    }).join(", ");


    // Display tracking information
    tableBody.innerHTML = `
        <tr>

            <td>${escapeHTML(order.token)}</td>

            <td>${itemNames || "N/A"}</td>

            <td>${formatDateTime(order.createdAt)}</td>

            <td>${formatMoney(order.total)}</td>

            <td>${getStatusBadge(order.status)}</td>

            <td>${Number(order.estimatedWait || 0)} minutes</td>

        </tr>
    `;


    setMessage(
        "tokenMessage",
        "Order information found successfully.",
        "success"
    );


    return false;

}


/* =========================================================
   6. ORDER HISTORY AND SPENDING SUMMARY
   ========================================================= */


/* ==================== 6.1 RENDER ORDER HISTORY ==================== */

function renderOrderHistory() {

    const currentUser = getCurrentUser();

    if (!currentUser) return;


    const orders = getCustomerData("orders");


    // Get logged-in customer's orders
    const customerOrders = orders.filter(function (order) {

        return String(order.customerId) === String(currentUser.id);

    });


    // Total Orders
    const totalOrdersElement = document.getElementById("totalOrders");

    if (totalOrdersElement) {
        totalOrdersElement.textContent = customerOrders.length;
    }


    // Total Spending - only paid orders
    const totalSpending = customerOrders.reduce(function (total, order) {

        if (order.paymentStatus === "Paid") {

            return total + Number(
                order.paidAmount !== undefined
                    ? order.paidAmount
                    : order.total || 0
            );

        }

        return total;

    }, 0);


    const spendingElement = document.getElementById("totalSpending");

    if (spendingElement) {
        spendingElement.textContent = formatMoney(totalSpending);
    }


    // Completed Orders
    const completedOrders = customerOrders.filter(function (order) {

        return order.status === "Completed";

    });


    const completedElement = document.getElementById("completedOrders");

    if (completedElement) {
        completedElement.textContent = completedOrders.length;
    }


    // Pending Orders
    const pendingOrders = customerOrders.filter(function (order) {

        return (
            order.status === "Pending" ||
            order.status === "Preparing" ||
            order.status === "Ready"
        );

    });


    const pendingElement = document.getElementById("pendingOrders");

    if (pendingElement) {
        pendingElement.textContent = pendingOrders.length;
    }


    // Display Order History
    const tableBody = document.getElementById("historyTableBody");

    if (!tableBody) return;


    if (customerOrders.length === 0) {

        showEmptyTable(
            "historyTableBody",
            7,
            "You have not placed any orders yet."
        );

        return;

    }


    // Sort orders by newest first
    const sortedOrders = customerOrders.slice().sort(function (a, b) {

        return new Date(b.createdAt) - new Date(a.createdAt);

    });


    tableBody.innerHTML = sortedOrders.map(function (order) {

        const itemNames = (order.items || []).map(function (item) {

            return escapeHTML(item.name) +
                " (x" + Number(item.quantity || 1) + ")";

        }).join(", ");


        return `
            <tr>

                <td>${escapeHTML(order.id)}</td>

                <td>${escapeHTML(order.token)}</td>

                <td>${itemNames || "N/A"}</td>

                <td>${formatDateTime(order.createdAt)}</td>

                <td>${formatMoney(order.total)}</td>

                <td>${getStatusBadge(order.paymentStatus || "Unpaid")}</td>

                <td>${getStatusBadge(order.status || "Pending")}</td>

            </tr>
        `;

    }).join("");

}


/* =========================================================
   7. REFRESH CUSTOMER DASHBOARD
   ========================================================= */

window.addEventListener("focus", function () {

    if (!getCurrentUser()) return;

    loadCoffeeOptions();

    loadFavoriteOptions();

    renderFavorites();

    renderOrderHistory();

});

window.addEventListener("storage", function (event) {

    if (
        event.key === "coffee_corner_orders" ||
        event.key === "coffee_corner_favorites" ||
        event.key === "coffee_corner_menu"
    ) {

        loadCoffeeOptions();

        loadFavoriteOptions();

        renderFavorites();

        renderOrderHistory();

    }

});

/* =========================================================
   8. CUSTOMER REVIEW MANAGEMENT
   ========================================================= */


/* ==================== 8.1 REVIEW CHARACTER COUNTER ==================== */

function countReview() {

    const reviewText = document.getElementById("reviewText");
    const reviewCounter = document.getElementById("reviewCounter");

    if (!reviewText || !reviewCounter) {
        return;
    }

    reviewCounter.textContent =
        reviewText.value.length + " / 200";

}


/* ==================== 8.2 SAVE CUSTOMER REVIEW ==================== */

function saveReview() {

    clearMessage("reviewMessage");
    clearErrors();

    const ratingInput = document.getElementById("reviewRating");
    const reviewTextInput = document.getElementById("reviewText");

    if (!ratingInput || !reviewTextInput) {
        return false;
    }

    const rating = Number(ratingInput.value);
    const comment = reviewTextInput.value.trim();

    let isValid = true;


    // Validate Rating
    if (
        !ratingInput.value ||
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
    ) {

        showFieldError(
            "reviewRatingError",
            "Please select a valid rating."
        );

        isValid = false;

    }


    // Validate Review Text
    if (comment.length < 10) {

        showFieldError(
            "reviewTextError",
            "Review must contain at least 10 characters."
        );

        isValid = false;

    } else if (comment.length > 200) {

        showFieldError(
            "reviewTextError",
            "Review cannot exceed 200 characters."
        );

        isValid = false;

    }


    if (!isValid) {

        setMessage(
            "reviewMessage",
            "Please correct the errors before submitting.",
            "error"
        );

        return false;

    }


    // Get Logged-in Customer
    const currentUser = getCurrentUser();

    if (!currentUser || currentUser.id === undefined) {

        setMessage(
            "reviewMessage",
            "Unable to identify your account. Please login again.",
            "error"
        );

        return false;

    }


    // Get Existing Reviews
    const reviews = CoffeeData.get("reviews");


    // Create New Review
    const newReview = {

        id: CoffeeData.nextId("reviews"),

        customerId: currentUser.id,

        customerName: currentUser.name || "Customer",

        type: "Coffee Shop",

        rating: rating,

        comment: comment,

        createdAt: getCurrentDateTime(),

        status: "Pending",

        response: ""

    };


    // Save Review
    reviews.push(newReview);

    if (!CoffeeData.set("reviews", reviews)) {

        setMessage(
            "reviewMessage",
            "Unable to save your review. Please try again.",
            "error"
        );

        return false;

    }


    // Reset Review Form
    const reviewForm = document.getElementById("reviewForm");

    if (reviewForm) {
        reviewForm.reset();
    }

    clearErrors();

    countReview();


    // Show Success Message
    setMessage(
        "reviewMessage",
        "Thank you! Your review has been submitted successfully.",
        "success"
    );


    return false;

}


/* ==================== 8.3 REVIEW FORM INITIALIZATION ==================== */

document.addEventListener("DOMContentLoaded", function () {

    countReview();

    const reviewForm = document.getElementById("reviewForm");

    if (reviewForm) {

        reviewForm.addEventListener("reset", function () {

            window.setTimeout(countReview, 0);

        });

    }

});



/* =========================================================
   9. END OF CUSTOMER JAVASCRIPT
   ========================================================= */