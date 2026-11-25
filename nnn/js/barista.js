


/* ==================== 1. ACCESS CONTROL ==================== */

document.addEventListener("DOMContentLoaded", function () {

    const currentUser = getCurrentUser();


    // Check login status and account status.

    if (!currentUser || currentUser.status !== "Active") {

        alert("Please login first.");

        window.location.href = "login.html";

        return;

    }


    // Allow Staff or Barista role.

    const userRole = String(currentUser.role || "")
        .trim()
        .toLowerCase();


    if (userRole !== "staff" && userRole !== "barista") {

        alert(
            "Access denied! You are not authorized to access this page."
        );

        redirectToDashboard(currentUser.role);

        return;

    }


    // Display current user's name.

    const welcomeElement = document.getElementById("welcomeUser");

    if (welcomeElement) {

        welcomeElement.textContent =
            "Welcome, " + currentUser.name;

    }


    // Show first dashboard section.

    showSection("queue");


    // Initialize dashboard modules.

    loadStockOptions();

    renderPreparationQueue();

    renderStock();

    renderWasteReports();


    // Automatically synchronize stock units.

    const stockItem = document.getElementById("stockItem");

    const wasteItem = document.getElementById("wasteItem");


    if (stockItem) {

        stockItem.addEventListener("change", syncStockUnit);

    }


    if (wasteItem) {

        wasteItem.addEventListener("change", syncWasteUnit);

    }


    syncStockUnit();

    syncWasteUnit();

});


/* ==================== 2. ORDER PREPARATION QUEUE ==================== */

/*
   FIFO = First In, First Out.

   Older customer orders appear before newer orders.
*/


function renderPreparationQueue() {

    const allOrders = CoffeeData.get("orders") || [];


    const searchElement = document.getElementById("queueSearch");

    const filterElement = document.getElementById("queueStatusFilter");


    const searchText = searchElement

        ? searchElement.value.trim().toLowerCase()

        : "";


    const statusFilter = filterElement

        ? filterElement.value

        : "All";


    // Sort orders using FIFO.

    const sortedOrders = allOrders.slice().sort(function (a, b) {

        const dateA = new Date(a.createdAt || 0).getTime();

        const dateB = new Date(b.createdAt || 0).getTime();


        if (dateA !== dateB) {

            return dateA - dateB;

        }


        return String(a.id).localeCompare(String(b.id));

    });


    // Search and filter orders.

    const filteredOrders = sortedOrders.filter(function (order) {

        const token = String(order.token || "").toLowerCase();

        const customer = String(order.customerName || "").toLowerCase();


        const matchesSearch =

            token.includes(searchText) ||

            customer.includes(searchText);


        const matchesStatus =

            statusFilter === "All" ||

            order.status === statusFilter;


        return matchesSearch && matchesStatus;

    });


    // Update order statistics.

    setText("totalQueueOrders", allOrders.length);


    setText(

        "pendingQueueOrders",

        allOrders.filter(function (order) {

            return order.status === "Pending";

        }).length

    );


    setText(

        "preparingQueueOrders",

        allOrders.filter(function (order) {

            return order.status === "Preparing";

        }).length

    );


    setText(

        "completedQueueOrders",

        allOrders.filter(function (order) {

            return order.status === "Completed";

        }).length

    );


    // Display order information.

    const tableBody = document.getElementById("queueTableBody");


    if (!tableBody) {
        return;
    }


    if (filteredOrders.length === 0) {

        tableBody.innerHTML =

            '<tr><td colspan="7">No orders found.</td></tr>';

        return;

    }


    tableBody.innerHTML = filteredOrders.map(function (order) {

        const items = Array.isArray(order.items)

            ? order.items

            : [];


        const itemNames = items.map(function (item) {

            return escapeHTML(item.name || "Coffee") +

                " × " +

                Number(item.quantity || 1);

        }).join(", ");


        const totalQuantity = items.reduce(function (total, item) {

            return total + Number(item.quantity || 1);

        }, 0);


        return `

            <tr>

                <td>${escapeHTML(order.id)}</td>

                <td>${escapeHTML(order.token)}</td>

                <td>${escapeHTML(order.customerName || "Customer")}</td>

                <td>${itemNames || "-"}</td>

                <td>${totalQuantity}</td>

                <td>${formatDateTime(order.createdAt)}</td>

                <td>${getStatusBadge(order.status)}</td>

            </tr>

        `;

    }).join("");

}


/* ==================== 3. UPDATE ORDER STATUS ==================== */

function updateOrderStatus() {

    clearMessage("queueMessage");


    const tokenInput = document.getElementById("queueToken");

    const statusInput = document.getElementById("orderStatus");


    if (!tokenInput || !statusInput) {
        return false;
    }


    const token = tokenInput.value.trim();

    const newStatus = statusInput.value;


    // Validate inputs.

    if (!token || !newStatus) {

        setMessage(

            "queueMessage",

            "Please enter an order token and select a status.",

            "error"

        );

        return false;

    }


    // Allowed order statuses.

    const allowedStatuses = [

        "Pending",

        "Preparing",

        "Ready",

        "Completed"

    ];


    if (!allowedStatuses.includes(newStatus)) {

        setMessage(

            "queueMessage",

            "Invalid order status selected.",

            "error"

        );

        return false;

    }


    // Get orders from memory.

    const orders = CoffeeData.get("orders") || [];


    // Find order by token.

    const orderIndex = orders.findIndex(function (item) {

        return String(item.token || "").toLowerCase() ===

            token.toLowerCase();

    });


    if (orderIndex === -1) {

        setMessage(

            "queueMessage",

            "No order found with this token.",

            "error"

        );

        return false;

    }


    const order = orders[orderIndex];


    // Update order status.

    const updatedOrders = orders.slice();


    updatedOrders[orderIndex] = {

        ...order,

        status: newStatus,

        updatedAt: getCurrentDateTime()

    };


    // Save updated orders.

    if (!CoffeeData.set("orders", updatedOrders)) {

        setMessage(

            "queueMessage",

            "Unable to update order. Please try again.",

            "error"

        );

        return false;

    }


    // Reset form.

    const form = document.getElementById("queueForm");

    if (form) {

        form.reset();

    }


    // Refresh queue.

    renderPreparationQueue();


    setMessage(

        "queueMessage",

        "Order " + token +

        " status updated to " + newStatus + ".",

        "success"

    );


    return false;

}


/* ==================== 4. STOCK ITEM OPTIONS ==================== */

function loadStockOptions() {

    const stockItems = CoffeeData.get("stock") || [];


    const stockSelect = document.getElementById("stockItem");

    const wasteSelect = document.getElementById("wasteItem");


    if (!stockSelect || !wasteSelect) {
        return;
    }


    const options = stockItems.map(function (item) {

        return `

            <option value="${escapeHTML(item.id)}">

                ${escapeHTML(item.name)}

            </option>

        `;

    }).join("");


    stockSelect.innerHTML =

        '<option value="">-- Select Stock Item --</option>' +

        options;


    wasteSelect.innerHTML =

        '<option value="">-- Select Product --</option>' +

        options;

}


/* ==================== 5. SYNCHRONIZE STOCK UNIT ==================== */

function syncStockUnit() {

    const stockSelect = document.getElementById("stockItem");

    const quantityInput = document.getElementById("stockQty");

    const unitInput = document.getElementById("stockUnit");


    if (!stockSelect) {
        return;
    }


    const selectedId = stockSelect.value;


    const stockItems = CoffeeData.get("stock") || [];


    const item = stockItems.find(function (stock) {

        return String(stock.id) === String(selectedId);

    });


    if (!item) {

        if (quantityInput) {

            quantityInput.placeholder = "Enter updated quantity";

        }

        if (unitInput) {

            unitInput.value = "";

        }

        return;

    }


    if (quantityInput) {

        quantityInput.placeholder =

            "Current quantity: " + item.quantity;

    }


    if (unitInput) {

        unitInput.value = item.unit || "";

    }

}


/* ==================== 6. SYNCHRONIZE WASTE UNIT ==================== */

function syncWasteUnit() {

    const wasteSelect = document.getElementById("wasteItem");

    const unitInput = document.getElementById("wasteUnit");


    if (!wasteSelect || !unitInput) {
        return;
    }


    const selectedId = wasteSelect.value;


    const stockItems = CoffeeData.get("stock") || [];


    const item = stockItems.find(function (stock) {

        return String(stock.id) === String(selectedId);

    });


    unitInput.value = item ? item.unit || "" : "";

}


/* ==================== 7. STOCK STATUS ==================== */

function stockStatus(item) {

    const quantity = Number(item.quantity || 0);

    const minimum = Number(item.minimum || 0);


    if (quantity <= 0) {

        return "Out of Stock";

    }


    if (quantity <= minimum) {

        return "Low Stock";

    }


    return "Available";

}


/* ==================== 8. RENDER STOCK INFORMATION ==================== */

function renderStock() {

    const allStock = CoffeeData.get("stock") || [];


    const searchElement = document.getElementById("stockSearch");

    const filterElement = document.getElementById("stockStatusFilter");


    const searchText = searchElement

        ? searchElement.value.trim().toLowerCase()

        : "";


    const statusFilter = filterElement

        ? filterElement.value

        : "All";


    // Search and filter stock items.

    const filteredStock = allStock.filter(function (item) {

        const name = String(item.name || "").toLowerCase();

        const category = String(item.category || "").toLowerCase();


        const matchesSearch =

            name.includes(searchText) ||

            category.includes(searchText);


        const matchesStatus =

            statusFilter === "All" ||

            stockStatus(item) === statusFilter;


        return matchesSearch && matchesStatus;

    });


    // Update stock statistics.

    setText("totalStockItems", allStock.length);


    setText(

        "availableStockItems",

        allStock.filter(function (item) {

            return stockStatus(item) === "Available";

        }).length

    );


    setText(

        "lowStockItems",

        allStock.filter(function (item) {

            return stockStatus(item) === "Low Stock";

        }).length

    );


    setText(

        "outOfStockItems",

        allStock.filter(function (item) {

            return stockStatus(item) === "Out of Stock";

        }).length

    );


    // Display stock table.

    const tableBody = document.getElementById("stockTableBody");


    if (!tableBody) {
        return;
    }


    if (filteredStock.length === 0) {

        tableBody.innerHTML =

            '<tr><td colspan="7">No stock items found.</td></tr>';

        return;

    }


    tableBody.innerHTML = filteredStock.map(function (item) {

        return `

            <tr>

                <td>${escapeHTML(item.id)}</td>

                <td>${escapeHTML(item.name)}</td>

                <td>${escapeHTML(item.category || "-")}</td>

                <td>${Number(item.quantity || 0)}</td>

                <td>${escapeHTML(item.unit || "-")}</td>

                <td>${Number(item.minimum || 0)}</td>

                <td>${getStatusBadge(stockStatus(item))}</td>

            </tr>

        `;

    }).join("");

}


/* ==================== 9. UPDATE STOCK QUANTITY ==================== */

function updateStockQuantity() {

    clearMessage("stockMessage");


    const stockSelect = document.getElementById("stockItem");

    const quantityInput = document.getElementById("stockQty");

    const unitInput = document.getElementById("stockUnit");


    if (!stockSelect || !quantityInput || !unitInput) {
        return false;
    }


    const selectedId = stockSelect.value;

    const quantity = Number(quantityInput.value);

    const unit = unitInput.value.trim();


    const stockItems = CoffeeData.get("stock") || [];


    // Find selected stock item.

    const itemIndex = stockItems.findIndex(function (stock) {

        return String(stock.id) === String(selectedId);

    });


    if (itemIndex === -1) {

        setMessage(

            "stockMessage",

            "Please select a valid stock item.",

            "error"

        );

        return false;

    }


    // Validate quantity.

    if (

        quantityInput.value.trim() === "" ||

        !Number.isFinite(quantity) ||

        quantity < 0

    ) {

        setMessage(

            "stockMessage",

            "Quantity must be zero or a positive number.",

            "error"

        );

        return false;

    }


    // Validate unit.

    if (!unit) {

        setMessage(

            "stockMessage",

            "Please enter the stock unit.",

            "error"

        );

        return false;

    }


    // Create updated stock array.

    const updatedStock = stockItems.slice();


    updatedStock[itemIndex] = {

        ...stockItems[itemIndex],

        quantity: quantity,

        unit: unit,

        updatedAt: getCurrentDateTime()

    };


    // Save updated stock.

    if (!CoffeeData.set("stock", updatedStock)) {

        setMessage(

            "stockMessage",

            "Stock could not be updated.",

            "error"

        );

        return false;

    }


    // Reset form.

    const form = document.getElementById("stockForm");

    if (form) {

        form.reset();

    }


    loadStockOptions();

    syncStockUnit();

    renderStock();


    setMessage(

        "stockMessage",

        "Stock quantity updated successfully.",

        "success"

    );


    return false;

}


/* ==================== 10. SUBMIT WASTE REPORT ==================== */

function submitWasteReport() {

    clearMessage("wasteMessage");


    const wasteSelect = document.getElementById("wasteItem");

    const quantityInput = document.getElementById("wasteQty");

    const reasonInput = document.getElementById("reason");

    const detailsInput = document.getElementById("wasteDetails");


    if (
        !wasteSelect ||
        !quantityInput ||
        !reasonInput ||
        !detailsInput
    ) {
        return false;
    }


    const selectedId = wasteSelect.value;

    const quantity = Number(quantityInput.value);

    const reason = reasonInput.value;

    const details = detailsInput.value.trim();


    const stockItems = CoffeeData.get("stock") || [];


    // Find selected stock item.

    const itemIndex = stockItems.findIndex(function (stock) {

        return String(stock.id) === String(selectedId);

    });


    if (itemIndex === -1) {

        setMessage(

            "wasteMessage",

            "Please select a valid product.",

            "error"

        );

        return false;

    }


    const item = stockItems[itemIndex];


    // Validate quantity.

    if (

        quantityInput.value.trim() === "" ||

        !Number.isFinite(quantity) ||

        quantity <= 0

    ) {

        setMessage(

            "wasteMessage",

            "Enter a valid damaged quantity.",

            "error"

        );

        return false;

    }


    // Check available stock.

    if (quantity > Number(item.quantity)) {

        setMessage(

            "wasteMessage",

            "Damaged quantity cannot exceed available stock.",

            "error"

        );

        return false;

    }


    // Validate reason.

    const allowedReasons = [

        "Expired",

        "Damaged",

        "Spoiled",

        "Contaminated",

        "Other"

    ];


    if (!allowedReasons.includes(reason)) {

        setMessage(

            "wasteMessage",

            "Please select a valid damage reason.",

            "error"

        );

        return false;

    }


    // Verify current user.

    const currentUser = getCurrentUser();


    if (!currentUser) {

        setMessage(

            "wasteMessage",

            "Unable to identify staff account. Please login again.",

            "error"

        );

        return false;

    }


    const reports = CoffeeData.get("wasteReports") || [];


    // Store previous quantity for rollback.

    const oldQuantity = Number(item.quantity);


    // Create waste report.

    const report = {

        id: CoffeeData.nextId("wasteReports"),

        itemName: item.name,

        quantity: quantity,

        unit: item.unit,

        reason: reason,

        details: details,

        reportedBy: currentUser.name,

        createdAt: getCurrentDateTime()

    };


    // Reduce stock quantity.

    const updatedStock = stockItems.slice();


    updatedStock[itemIndex] = {

        ...item,

        quantity: oldQuantity - quantity,

        updatedAt: getCurrentDateTime()

    };


    // Save updated stock first.

    if (!CoffeeData.set("stock", updatedStock)) {

        setMessage(

            "wasteMessage",

            "Unable to update stock. Report was not saved.",

            "error"

        );

        return false;

    }


    // Save waste report.

    const updatedReports = reports.concat(report);


    if (!CoffeeData.set("wasteReports", updatedReports)) {

        // Restore previous stock quantity.

        const restoredStock = updatedStock.slice();


        restoredStock[itemIndex] = {

            ...restoredStock[itemIndex],

            quantity: oldQuantity

        };


        CoffeeData.set("stock", restoredStock);


        setMessage(

            "wasteMessage",

            "Unable to save report. Previous stock quantity was restored.",

            "error"

        );

        return false;

    }


    // Reset waste form.

    const form = document.getElementById("wasteForm");

    if (form) {

        form.reset();

    }


    // Refresh dashboard information.

    loadStockOptions();

    syncStockUnit();

    syncWasteUnit();

    renderStock();

    renderWasteReports();


    setMessage(

        "wasteMessage",

        "Waste report submitted and stock quantity adjusted successfully.",

        "success"

    );


    return false;

}


/* ==================== 11. RENDER WASTE REPORTS ==================== */

function renderWasteReports() {

    const allReports =

        (CoffeeData.get("wasteReports") || [])

            .slice()

            .reverse();


    const searchElement = document.getElementById("wasteSearch");

    const filterElement = document.getElementById("wasteReasonFilter");


    const searchText = searchElement

        ? searchElement.value.trim().toLowerCase()

        : "";


    const reasonFilter = filterElement

        ? filterElement.value

        : "All";


    // Filter waste reports.

    const filteredReports = allReports.filter(function (report) {

        const itemName = String(report.itemName || "").toLowerCase();

        const reportId = String(report.id || "").toLowerCase();

        const reason = String(report.reason || "");


        const matchesSearch =

            itemName.includes(searchText) ||

            reportId.includes(searchText);


        const matchesReason =

            reasonFilter === "All" ||

            reason === reasonFilter;


        return matchesSearch && matchesReason;

    });


    const tableBody = document.getElementById("wasteTableBody");


    if (!tableBody) {
        return;
    }


    if (filteredReports.length === 0) {

        tableBody.innerHTML =

            '<tr><td colspan="8">No waste reports found.</td></tr>';

        return;

    }


    // Display waste reports.

    tableBody.innerHTML = filteredReports.map(function (report) {

        return `

            <tr>

                <td>${escapeHTML(report.id)}</td>

                <td>${escapeHTML(report.itemName)}</td>

                <td>${Number(report.quantity || 0)}</td>

                <td>${escapeHTML(report.unit || "-")}</td>

                <td>${escapeHTML(report.reason || "-")}</td>

                <td>${escapeHTML(report.details || "-")}</td>

                <td>${escapeHTML(report.reportedBy || "-")}</td>

                <td>${formatDateTime(report.createdAt)}</td>

            </tr>

        `;

    }).join("");

}


/* ==================== 12. COMMON HELPER ==================== */

function setText(elementId, value) {

    const element = document.getElementById(elementId);


    if (element) {

        element.textContent = value;

    }

}


/* ==================== 13. RESET QUEUE FORM ==================== */

function resetQueueForm() {

    const form = document.getElementById("queueForm");


    if (form) {

        form.reset();

    }


    clearMessage("queueMessage");

}


/* ==================== 14. RESET STOCK FORM ==================== */

function resetStockForm() {

    const form = document.getElementById("stockForm");


    if (form) {

        form.reset();

    }


    syncStockUnit();

    clearMessage("stockMessage");

}


/* ==================== 15. RESET WASTE FORM ==================== */

function resetWasteForm() {

    const form = document.getElementById("wasteForm");


    if (form) {

        form.reset();

    }


    syncWasteUnit();

    clearMessage("wasteMessage");

}


/* ==================== END OF BARISTA JAVASCRIPT ==================== */
