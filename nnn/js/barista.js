/* =====================================================
   COFFEE CORNER - BARISTA / STAFF DASHBOARD
   Complete Updated JavaScript
   Uses: data.js and common.js
   ===================================================== */


/* ==================== 1. ACCESS CONTROL ==================== */

document.addEventListener("DOMContentLoaded", function () {

    const currentUser = getCurrentUser();

    // User must be logged in and Active.
    if (!currentUser || currentUser.status !== "Active") {
        localStorage.removeItem("coffee_current_user");
        window.location.href = "../login.html";
        return;
    }

    // Accept Staff or Barista role.
    const userRole = String(currentUser.role || "").trim().toLowerCase();

    if (userRole !== "staff" && userRole !== "barista") {

        alert("Access denied! You are not authorized to access this page.");

        if (typeof redirectToDashboard === "function") {
            redirectToDashboard(currentUser.role);
        } else {
            window.location.href = "../login.html";
        }

        return;
    }

    // Display logged-in user's name.
    const welcomeElement = document.getElementById("welcomeUser");

    if (welcomeElement) {
        welcomeElement.textContent = "Welcome, " + currentUser.name;
    }

    // Show first dashboard section.
    if (typeof showSection === "function") {
        showSection("queue");
    }

    // Initialize all dashboard modules.
    loadStockOptions();

    renderPreparationQueue();
    renderStock();
    renderWasteReports();

    // Automatically update units when stock item changes.
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
   Older orders will appear before newer orders.
*/

function renderPreparationQueue() {

    const allOrders = CoffeeData.get("orders");

    const searchElement = document.getElementById("queueSearch");
    const filterElement = document.getElementById("queueStatusFilter");

    const searchText = searchElement
        ? searchElement.value.trim().toLowerCase()
        : "";

    const statusFilter = filterElement
        ? filterElement.value
        : "All";

    // FIFO sorting.
    const sortedOrders = allOrders.slice().sort(function (a, b) {

        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();

        if (dateA !== dateB) {
            return dateA - dateB;
        }

        return String(a.id).localeCompare(String(b.id));
    });


    // Search and status filtering.
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


    // Update statistics.
    setText("totalQueueOrders", allOrders.length);

    setText(
        "pendingQueueOrders",
        allOrders.filter(o => o.status === "Pending").length
    );

    setText(
        "preparingQueueOrders",
        allOrders.filter(o => o.status === "Preparing").length
    );

    setText(
        "completedQueueOrders",
        allOrders.filter(o => o.status === "Completed").length
    );


    // Display orders.
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

        const items = Array.isArray(order.items) ? order.items : [];

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

    const tokenInput = document.getElementById("queueToken");
    const statusInput = document.getElementById("orderStatus");

    const token = tokenInput.value.trim();
    const newStatus = statusInput.value;

    if (!token || !newStatus) {

        setMessage(
            "queueMessage",
            "Please enter an order token and select a status.",
            "error"
        );

        return false;
    }


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


    const orders = CoffeeData.get("orders");

    const order = orders.find(function (item) {
        return String(item.token).toLowerCase() === token.toLowerCase();
    });


    if (!order) {

        setMessage(
            "queueMessage",
            "No order found with this token.",
            "error"
        );

        return false;
    }


    order.status = newStatus;
    order.updatedAt = new Date().toISOString();


    if (!CoffeeData.set("orders", orders)) {

        setMessage(
            "queueMessage",
            "Unable to update order. Please try again.",
            "error"
        );

        return false;
    }


    document.getElementById("queueForm").reset();

    renderPreparationQueue();

    setMessage(
        "queueMessage",
        "Order " + token + " status updated to " + newStatus + ".",
        "success"
    );

    return false;
}


/* ==================== 4. STOCK ITEM OPTIONS ==================== */

function loadStockOptions() {

    const stockItems = CoffeeData.get("stock");

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
        '<option value="">-- Select Stock Item --</option>' + options;

    wasteSelect.innerHTML =
        '<option value="">-- Select Product --</option>' + options;

}


/* ==================== 5. SYNCHRONIZE STOCK UNIT ==================== */

function syncStockUnit() {

    const selectedId = document.getElementById("stockItem").value;

    const stockItems = CoffeeData.get("stock");

    const item = stockItems.find(function (stock) {
        return String(stock.id) === String(selectedId);
    });

    const quantityInput = document.getElementById("stockQty");
    const unitInput = document.getElementById("stockUnit");

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

    const selectedId = document.getElementById("wasteItem").value;

    const stockItems = CoffeeData.get("stock");

    const item = stockItems.find(function (stock) {
        return String(stock.id) === String(selectedId);
    });

    const unitInput = document.getElementById("wasteUnit");

    if (unitInput) {
        unitInput.value = item ? item.unit || "" : "";
    }

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

    const allStock = CoffeeData.get("stock");

    const searchElement = document.getElementById("stockSearch");
    const filterElement = document.getElementById("stockStatusFilter");

    const searchText = searchElement
        ? searchElement.value.trim().toLowerCase()
        : "";

    const statusFilter = filterElement
        ? filterElement.value
        : "All";


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


    // Update stock summary.
    setText("totalStockItems", allStock.length);

    setText(
        "availableStockItems",
        allStock.filter(item => stockStatus(item) === "Available").length
    );

    setText(
        "lowStockItems",
        allStock.filter(item => stockStatus(item) === "Low Stock").length
    );

    setText(
        "outOfStockItems",
        allStock.filter(item => stockStatus(item) === "Out of Stock").length
    );


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

    const selectedId = document.getElementById("stockItem").value;

    const quantity = Number(document.getElementById("stockQty").value);

    const unit = document.getElementById("stockUnit").value.trim();

    const stockItems = CoffeeData.get("stock");

    const item = stockItems.find(function (stock) {
        return String(stock.id) === String(selectedId);
    });


    if (!item) {

        setMessage(
            "stockMessage",
            "Please select a valid stock item.",
            "error"
        );

        return false;
    }


    if (!Number.isFinite(quantity) || quantity < 0) {

        setMessage(
            "stockMessage",
            "Quantity must be zero or a positive number.",
            "error"
        );

        return false;
    }


    if (!unit) {

        setMessage(
            "stockMessage",
            "Please enter the stock unit.",
            "error"
        );

        return false;
    }


    // Update stock.
    item.quantity = quantity;
    item.unit = unit;


    if (!CoffeeData.set("stock", stockItems)) {

        setMessage(
            "stockMessage",
            "Stock could not be saved.",
            "error"
        );

        return false;
    }


    document.getElementById("stockForm").reset();

    loadStockOptions();
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

    const selectedId = document.getElementById("wasteItem").value;

    const quantity = Number(document.getElementById("wasteQty").value);

    const reason = document.getElementById("reason").value;

    const details = document.getElementById("wasteDetails").value.trim();

    const stockItems = CoffeeData.get("stock");

    const item = stockItems.find(function (stock) {
        return String(stock.id) === String(selectedId);
    });


    if (!item) {

        setMessage(
            "wasteMessage",
            "Please select a valid product.",
            "error"
        );

        return false;
    }


    if (!Number.isFinite(quantity) || quantity <= 0) {

        setMessage(
            "wasteMessage",
            "Enter a valid damaged quantity.",
            "error"
        );

        return false;
    }


    if (quantity > Number(item.quantity)) {

        setMessage(
            "wasteMessage",
            "Damaged quantity cannot exceed available stock.",
            "error"
        );

        return false;
    }


    if (!reason) {

        setMessage(
            "wasteMessage",
            "Please select a damage reason.",
            "error"
        );

        return false;
    }


    const currentUser = getCurrentUser();

    const reports = CoffeeData.get("wasteReports");

    const oldQuantity = item.quantity;


    const report = {

        id: CoffeeData.nextId("wasteReports"),

        itemName: item.name,

        quantity: quantity,

        unit: item.unit,

        reason: reason,

        details: details,

        reportedBy: currentUser.name,

        createdAt: new Date().toISOString()

    };


    // Reduce stock.
    item.quantity = Number(item.quantity) - quantity;


    // Save stock first.
    if (!CoffeeData.set("stock", stockItems)) {

        setMessage(
            "wasteMessage",
            "Unable to update stock. Report was not saved.",
            "error"
        );

        return false;
    }


    // Save waste report.
    reports.push(report);

    if (!CoffeeData.set("wasteReports", reports)) {

        // Restore previous stock if report saving fails.
        item.quantity = oldQuantity;
        CoffeeData.set("stock", stockItems);

        setMessage(
            "wasteMessage",
            "Unable to save report. Stock quantity was restored.",
            "error"
        );

        return false;
    }


    document.getElementById("wasteForm").reset();

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

    const allReports = CoffeeData.get("wasteReports").slice().reverse();

    const searchElement = document.getElementById("wasteSearch");
    const filterElement = document.getElementById("wasteReasonFilter");

    const searchText = searchElement
        ? searchElement.value.trim().toLowerCase()
        : "";

    const reasonFilter = filterElement
        ? filterElement.value
        : "All";


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


/* ==================== 13. RESET FORMS ==================== */

function resetQueueForm() {

    const form = document.getElementById("queueForm");

    if (form) {
        form.reset();
    }

    clearMessage("queueMessage");

}


function resetStockForm() {

    const form = document.getElementById("stockForm");

    if (form) {
        form.reset();
    }

    syncStockUnit();

    clearMessage("stockMessage");

}


function resetWasteForm() {

    const form = document.getElementById("wasteForm");

    if (form) {
        form.reset();
    }

    syncWasteUnit();

    clearMessage("wasteMessage");

}


/* ==================== 14. STORAGE EVENT ==================== */

/*
   Update dashboard when another browser tab changes
   order or stock information.
*/

window.addEventListener("storage", function (event) {

    if (event.key === "coffee_corner_orders") {
        renderPreparationQueue();
    }

    if (event.key === "coffee_corner_stock") {
        loadStockOptions();
        renderStock();
    }

    if (event.key === "coffee_corner_wasteReports") {
        renderWasteReports();
    }

});