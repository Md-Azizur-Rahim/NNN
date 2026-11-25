



/* ==================== 1. INITIALIZATION ==================== */

document.addEventListener("DOMContentLoaded", function () {

    if (!requireRole("Customer")) {
        return;
    }

    const currentUser = getCurrentUser();

    const welcomeUser = document.getElementById("welcomeUser");

    if (welcomeUser && currentUser) {

        welcomeUser.textContent =
            "Welcome, " + currentUser.name;

    }

    loadCoffeeOptions();

    loadFavoriteOptions();

    renderFavorites();

    renderOrderHistory();

});


/* ==================== 2. DATA HELPER ==================== */

function getCustomerData(key) {

    if (
        typeof CoffeeData === "undefined" ||
        typeof CoffeeData.get !== "function"
    ) {
        return [];
    }

    const data = CoffeeData.get(key);

    return Array.isArray(data) ? data : [];

}


/* =========================================================
   3. CUSTOM COFFEE BUILDER
   ========================================================= */

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


/* ==================== 3.2 BUILD PRICE KEY ==================== */

// Creates a simple string to verify selected options.
// JSON.stringify is not used.

function buildCustomPriceKey() {

    const coffee = document.getElementById("coffee");

    const size = document.getElementById("size");

    const milk = document.getElementById("milk");

    const sugar = document.getElementById("sugar");

    const quantity = document.getElementById("quantity");


    if (!coffee || !size || !milk || !sugar || !quantity) {
        return "";
    }


    return [

        coffee.value,

        size.value,

        milk.value,

        sugar.value,

        quantity.value

    ].join("|");

}


/* ==================== 3.3 PRICE CALCULATION HELPER ==================== */

function getCustomCoffeePrice() {

    const coffeeId = document.getElementById("coffee").value;

    const size = document.getElementById("size").value;

    const milk = document.getElementById("milk").value;

    const sugar = document.getElementById("sugar").value;

    const quantity = Number(
        document.getElementById("quantity").value
    );


    // Validate required fields.

    if (!coffeeId || !size || !milk || !sugar) {
        return null;
    }


    if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 20
    ) {
        return null;
    }


    // Validate selected options.

    const validSizes = [

        "Small",
        "Medium",
        "Large"

    ];

    const validMilkTypes = [

        "Regular Milk",
        "Low Fat Milk",
        "Soy Milk",
        "Almond Milk",
        "No Milk"

    ];

    const validSugarLevels = [

        "No Sugar",
        "Low Sugar",
        "Normal Sugar",
        "Extra Sugar"

    ];


    if (
        !validSizes.includes(size) ||
        !validMilkTypes.includes(milk) ||
        !validSugarLevels.includes(sugar)
    ) {
        return null;
    }


    // Find selected coffee.

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


    // Size charge.

    let sizeCharge = 0;

    if (size === "Medium") {

        sizeCharge = 20;

    } else if (size === "Large") {

        sizeCharge = 40;

    }


    // Milk charge.

    let milkCharge = 0;

    if (milk === "Almond Milk") {

        milkCharge = 30;

    } else if (milk === "Soy Milk") {

        milkCharge = 20;

    }


    // Sugar charge.

    let sugarCharge = 0;

    if (sugar === "Extra Sugar") {

        sugarCharge = 5;

    }


    // Calculate final unit price.

    const unitPrice =

        Number(selectedCoffee.price) +

        sizeCharge +

        milkCharge +

        sugarCharge;


    if (
        !Number.isFinite(unitPrice) ||
        unitPrice <= 0
    ) {
        return null;
    }


    // Calculate total price.

    const totalPrice = unitPrice * quantity;


    return {

        coffee: selectedCoffee,

        unitPrice: unitPrice,

        totalPrice: totalPrice,

        quantity: quantity

    };

}


/* ==================== 3.4 CALCULATE CUSTOM PRICE ==================== */

function calculateCustomPrice() {

    clearMessage("builderMessage");

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


    // Save calculated result temporarily.

    calculatedCustomPriceResult = result;

    calculatedCustomPriceKey = buildCustomPriceKey();


    // Display calculated price.

    priceDisplay.textContent = formatMoney(result.totalPrice);


    setMessage(

        "builderMessage",

        "Price calculated successfully.",

        "success"

    );


    return result.totalPrice;

}


/* ==================== 3.5 PLACE CUSTOM ORDER ==================== */

function placeCustomOrder() {

    clearMessage("builderMessage");

    clearErrors();


    const coffeeId = document.getElementById("coffee").value;

    const size = document.getElementById("size").value;

    const milk = document.getElementById("milk").value;

    const sugar = document.getElementById("sugar").value;

    const quantity = Number(
        document.getElementById("quantity").value
    );


    // Validate coffee.

    if (!coffeeId) {

        showFieldError(
            "coffeeError",
            "Please select a coffee."
        );

    }


    // Validate size.

    if (!size) {

        showFieldError(
            "sizeError",
            "Please select a size."
        );

    }


    // Validate milk.

    if (!milk) {

        showFieldError(
            "milkError",
            "Please select a milk type."
        );

    }


    // Validate sugar.

    if (!sugar) {

        showFieldError(
            "sugarError",
            "Please select a sugar level."
        );

    }


    // Validate quantity.

    if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 20
    ) {

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


    // Check whether price has been calculated.

    if (!calculatedCustomPriceResult) {

        setMessage(

            "builderMessage",

            "Please click Calculate Price before placing your order.",

            "error"

        );

        return false;

    }


    // Check whether options changed after calculation.

    const currentPriceKey = buildCustomPriceKey();


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


    // Verify current menu price again.

    const priceResult = getCustomCoffeePrice();


    if (!priceResult) {

        calculatedCustomPriceResult = null;

        calculatedCustomPriceKey = "";

        setMessage(

            "builderMessage",

            "Selected coffee is unavailable. Please select another item.",

            "error"

        );

        return false;

    }


    // Get current customer.

    const currentUser = getCurrentUser();


    if (!currentUser) {

        setMessage(

            "builderMessage",

            "Please login again.",

            "error"

        );

        return false;

    }


    // Get existing orders.

    const orders = getCustomerData("orders");


    // Generate unique order token.

    const orderToken = CoffeeData.token();


    // Calculate pending orders.

    const pendingOrders = orders.filter(function (order) {

        return (

            order.status === "Pending" ||

            order.status === "Preparing"

        );

    }).length;


    // Calculate estimated waiting time.

    const estimatedWait = 5 + (pendingOrders * 5);


    // Create new order.

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


    // Save order in memory.

    const updatedOrders = orders.concat(newOrder);


    if (!CoffeeData.set("orders", updatedOrders)) {

        setMessage(

            "builderMessage",

            "Unable to save your order. Please try again.",

            "error"

        );

        return false;

    }


    // Show success message.

    setMessage(

        "builderMessage",

        "Order placed successfully! Your token number is " +

        orderToken + ".",

        "success"

    );


    // Reset form.

    const coffeeForm = document.getElementById("coffeeForm");

    if (coffeeForm) {

        coffeeForm.reset();

    }


    calculatedCustomPriceResult = null;

    calculatedCustomPriceKey = "";


    const priceDisplay = document.getElementById("estimatedPrice");

    if (priceDisplay) {

        priceDisplay.textContent = formatMoney(0);

    }


    // Refresh dashboard.

    renderOrderHistory();

    renderFavorites();


    return false;

}


/* ==================== 3.6 RESET COFFEE FORM ==================== */

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


    const favoriteSelect = document.getElementById("favoriteItem");

    if (!favoriteSelect) return false;


    const menuItemId = favoriteSelect.value;


    if (!menuItemId) {

        setMessage(

            "favoriteMessage",

            "Please select a menu item.",

            "error"

        );

        return false;

    }


    const currentUser = getCurrentUser();

    if (!currentUser) return false;


    const menu = getCustomerData("menu");

    const favorites = getCustomerData("favorites");


    // Find selected menu item.

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


    // Check duplicate favorite.

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


    // Create favorite record.

    const newFavorite = {

        id: CoffeeData.nextId("favorites"),

        customerId: currentUser.id,

        menuItemId: selectedItem.id,

        itemName: selectedItem.name,

        createdAt: getCurrentDateTime()

    };


    const updatedFavorites = favorites.concat(newFavorite);


    // Save favorite.

    if (!CoffeeData.set("favorites", updatedFavorites)) {

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


    const favoriteForm = document.getElementById("favoriteForm");

    if (favoriteForm) {

        favoriteForm.reset();

    }


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


    // Get only current customer's favorites.

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

        return false;

    }


    const currentUser = getCurrentUser();

    if (!currentUser) return false;


    const favorites = getCustomerData("favorites");


    // Remove only the current customer's selected favorite.

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

        return false;

    }


    setMessage(

        "favoriteMessage",

        "Favorite item removed successfully.",

        "success"

    );


    renderFavorites();

    return false;

}


/* =========================================================
   5. ORDER TOKEN AND WAITING TIME
   ========================================================= */


/* ==================== 5.1 SEARCH ORDER TOKEN ==================== */

function searchOrderToken() {

    clearMessage("tokenMessage");


    const tokenInput = document.getElementById("tokenNo");

    const tableBody = document.getElementById("tokenTableBody");


    if (!tokenInput || !tableBody) return false;


    const token = tokenInput.value.trim();

    const currentUser = getCurrentUser();

    if (!currentUser) return false;


    if (!token) {

        setMessage(

            "tokenMessage",

            "Please enter your order token.",

            "error"

        );

        return false;

    }


    const orders = getCustomerData("orders");


    // Search only the logged-in customer's order.

    const order = orders.find(function (item) {

        return (

            String(item.token).toLowerCase() === token.toLowerCase() &&

            String(item.customerId) === String(currentUser.id)

        );

    });


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


    // Display item names.

    const itemNames = (order.items || []).map(function (item) {

        return escapeHTML(item.name) +

            " (x" + Number(item.quantity || 1) + ")";

    }).join(", ");


    // Display tracking information.

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


    // Get logged-in customer's orders.

    const customerOrders = orders.filter(function (order) {

        return String(order.customerId) === String(currentUser.id);

    });


    // Total orders.

    const totalOrdersElement = document.getElementById("totalOrders");

    if (totalOrdersElement) {

        totalOrdersElement.textContent = customerOrders.length;

    }


    // Total spending from paid orders only.

    const totalSpending = customerOrders.reduce(function (total, order) {

        if (order.paymentStatus === "Paid") {

            const paidAmount =

                order.paidAmount !== undefined

                    ? order.paidAmount

                    : order.total || 0;


            return total + Number(paidAmount);

        }

        return total;

    }, 0);


    const spendingElement = document.getElementById("totalSpending");

    if (spendingElement) {

        spendingElement.textContent = formatMoney(totalSpending);

    }


    // Completed orders.

    const completedOrders = customerOrders.filter(function (order) {

        return order.status === "Completed";

    });


    const completedElement = document.getElementById("completedOrders");

    if (completedElement) {

        completedElement.textContent = completedOrders.length;

    }


    // Pending orders.

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


    // Order history table.

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


    // Sort orders by newest first.

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

// Refresh when the user returns to the current browser tab.
// No storage event is used.

window.addEventListener("focus", function () {

    if (!getCurrentUser()) return;

    loadCoffeeOptions();

    loadFavoriteOptions();

    renderFavorites();

    renderOrderHistory();

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


    // Validate rating.

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


    // Validate review text.

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


    // Get logged-in customer.

    const currentUser = getCurrentUser();


    if (!currentUser || currentUser.id === undefined) {

        setMessage(

            "reviewMessage",

            "Unable to identify your account. Please login again.",

            "error"

        );

        return false;

    }


    // Get existing reviews.

    const reviews = getCustomerData("reviews");


    // Create new review.

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


    // Save review in memory.

    const updatedReviews = reviews.concat(newReview);


    if (!CoffeeData.set("reviews", updatedReviews)) {

        setMessage(

            "reviewMessage",

            "Unable to save your review. Please try again.",

            "error"

        );

        return false;

    }


    // Reset review form.

    const reviewForm = document.getElementById("reviewForm");

    if (reviewForm) {

        reviewForm.reset();

    }


    clearErrors();

    countReview();


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

            countReview();

        });

    }

});


/* =========================================================
   9. END OF CUSTOMER JAVASCRIPT
   ========================================================= */
