
/* =========================================================
   COFFEE CORNER
   CASHIER DASHBOARD JAVASCRIPT
   Technology: JavaScript + LocalStorage
   Programming Style: Procedural JavaScript
   ========================================================= */


/* =========================================================
   1. INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    if (typeof requireRole === "function") {
        if (!requireRole("Cashier")) {
            return;
        }
    }

    const reconDate = document.getElementById("reconDate");

    if (reconDate && !reconDate.value) {
        reconDate.value = getCurrentDate();
    }

    
    renderPayments();
    updateSystemCash();
    renderReconciliations();
    updateCashierStatistics();

});


/* =========================================================
   2. COMMON DATA HELPERS
   ========================================================= */

function getCashierCollection(key) {

    const records = CoffeeData.get(key);

    return Array.isArray(records) ? records : [];

}


function getOrderByToken(token) {

    const orders = getCashierCollection("orders");

    const searchToken = String(token || "").trim().toLowerCase();

    return orders.find(function (order) {

        return String(order.token || "").trim().toLowerCase() === searchToken;

    }) || null;

}


function getOrderSubtotal(order) {

    if (!order || !Array.isArray(order.items) || order.items.length === 0) {
        return null;
    }

    let subtotal = 0;

    for (let i = 0; i < order.items.length; i++) {

        const item = order.items[i];

        const quantity = Number(item.quantity || 1);

        const unitPrice = Number(
            item.price ??
            item.unitPrice ??
            item.finalPrice ??
            item.customizedPrice
        );

        if (
            !Number.isFinite(quantity) ||
            quantity <= 0 ||
            !Number.isFinite(unitPrice) ||
            unitPrice < 0
        ) {
            return null;
        }

        subtotal += quantity * unitPrice;

    }

    return Math.round(subtotal * 100) / 100;

}


function getDateOnly(dateValue) {

    if (!dateValue) {
        return "";
    }

    return String(dateValue).substring(0, 10);

}


function getMoneyInPaisa(amount) {

    return Math.round(Number(amount) * 100);

}


function refreshCashierDashboard() {

    renderPayments();
    renderReconciliations();
    updateSystemCash();
    updateCashierStatistics();

}


/* =========================================================
   3. BILL CALCULATION
   ========================================================= */

function calculateBill(forceUpdate = false) {

    if (forceUpdate !== true) {
        return null;
    }
    const subtotalInput = document.getElementById("subtotal");
    const discountInput = document.getElementById("discount");
    const taxInput = document.getElementById("tax");
    const receivedInput = document.getElementById("received");

    if (!subtotalInput || !discountInput || !taxInput || !receivedInput) {
        return null;
    }

    const subtotal = Number(subtotalInput.value) || 0;
    const discount = Number(discountInput.value) || 0;
    const tax = Number(taxInput.value) || 0;
    const received = Number(receivedInput.value) || 0;

    const total = subtotal - discount + tax;
    const change = Math.max(0, received - total);

    const billSubtotal = document.getElementById("billSubtotal");
    const billDiscount = document.getElementById("billDiscount");
    const billTax = document.getElementById("billTax");
    const billTotal = document.getElementById("billTotal");
    const billChange = document.getElementById("billChange");

    if (billSubtotal) {
        billSubtotal.textContent = formatMoney(subtotal);
    }

    if (billDiscount) {
        billDiscount.textContent = formatMoney(discount);
    }

    if (billTax) {
        billTax.textContent = formatMoney(tax);
    }

    if (billTotal) {
        billTotal.textContent = formatMoney(total);
    }

    if (billChange) {
        billChange.textContent = formatMoney(change);
    }

    return {
        subtotal: subtotal,
        discount: discount,
        tax: tax,
        total: total,
        received: received,
        change: change
    };

}


/* =========================================================
   4. GENERATE CUSTOMER BILL
   ========================================================= */

function generateCustomerBill() {

    clearMessage("billingMessage");

    const tokenInput = document.getElementById("orderToken");
    const customerInput = document.getElementById("customerName");
    const subtotalInput = document.getElementById("subtotal");

    if (!tokenInput || !customerInput || !subtotalInput) {
        return false;
    }

    const orderToken = tokenInput.value.trim();
    const customerName = customerInput.value.trim();

    if (!orderToken || !customerName) {

        setMessage(
            "billingMessage",
            "Please enter the order token and customer name.",
            "error"
        );

        return false;
    }

    const order = getOrderByToken(orderToken);

    if (!order) {

        setMessage(
            "billingMessage",
            "Order not found. Please check the order token.",
            "error"
        );

        return false;
    }

    if (order.paymentStatus === "Paid") {

        setMessage(
            "billingMessage",
            "This order has already been paid.",
            "error"
        );

        return false;
    }

    if (
        order.customerName &&
        String(order.customerName).trim().toLowerCase() !== customerName.toLowerCase()
    ) {

        setMessage(
            "billingMessage",
            "Customer name does not match the order.",
            "error"
        );

        return false;
    }

    /*
       Calculate subtotal from the actual order items.
       Do not accept an arbitrary subtotal from the cashier.
    */

    const actualSubtotal = getOrderSubtotal(order);

    if (actualSubtotal === null || actualSubtotal <= 0) {

        setMessage(
            "billingMessage",
            "Order item prices are missing or invalid. Please check the order data.",
            "error"
        );

        return false;
    }

    subtotalInput.value = actualSubtotal.toFixed(2);

    const bill = calculateBill(true);

    if (!bill) {
        return false;
    }

    if (
        !Number.isFinite(bill.discount) ||
        !Number.isFinite(bill.tax) ||
        !Number.isFinite(bill.received) ||
        bill.discount < 0 ||
        bill.tax < 0 ||
        bill.received < 0
    ) {

        setMessage(
            "billingMessage",
            "Please enter valid billing amounts.",
            "error"
        );

        return false;
    }

    if (bill.discount > bill.subtotal) {

        setMessage(
            "billingMessage",
            "Discount cannot be greater than subtotal.",
            "error"
        );

        return false;
    }

    if (bill.total <= 0) {

        setMessage(
            "billingMessage",
            "Total payable amount must be greater than zero.",
            "error"
        );

        return false;
    }

    if (bill.received < bill.total) {

        setMessage(
            "billingMessage",
            "Received amount is insufficient.",
            "error"
        );

        return false;
    }

    const currentBill = {

        orderId: order.id,
        orderToken: order.token,
        customerId: order.customerId || "",
        customerName: order.customerName || customerName,

        subtotal: bill.subtotal,
        discount: bill.discount,
        tax: bill.tax,
        total: bill.total,

        received: bill.received,
        change: bill.change,

        createdAt: getCurrentDateTime()

    };

    try {

        localStorage.setItem(
            "coffee_current_bill",
            JSON.stringify(currentBill)
        );

    } catch (error) {

        console.error("Bill storage error:", error);

        setMessage(
            "billingMessage",
            "Unable to save bill information.",
            "error"
        );

        return false;
    }

    const paymentOrder = document.getElementById("paymentOrder");
    const amountInput = document.getElementById("amount");

    if (paymentOrder) {
        paymentOrder.value = order.token;
    }

    if (amountInput) {
        amountInput.value = bill.total.toFixed(2);
    }

    setMessage(
        "billingMessage",
        "Bill generated successfully. Please record the customer payment.",
        "success"
    );

    return false;

}


/* =========================================================
   5. RESET BILLING FORM
   ========================================================= */

function resetBillingForm() {

    const form = document.getElementById("billingForm");

    if (form) {
        form.reset();
    }

    localStorage.removeItem("coffee_current_bill");

    clearMessage("billingMessage");

    document.getElementById("billSubtotal").textContent = formatMoney(0);
document.getElementById("billDiscount").textContent = formatMoney(0);
document.getElementById("billTax").textContent = formatMoney(0);
document.getElementById("billTotal").textContent = formatMoney(0);
document.getElementById("billChange").textContent = formatMoney(0);

    return false;

}


/* =========================================================
   6. SAVE CUSTOMER PAYMENT
   ========================================================= */

function saveCustomerPayment() {

    clearMessage("paymentMessage");

    const orderInput = document.getElementById("paymentOrder");
    const methodInput = document.getElementById("method");
    const amountInput = document.getElementById("amount");
    const referenceInput = document.getElementById("reference");

    if (!orderInput || !methodInput || !amountInput || !referenceInput) {
        return false;
    }

    const orderToken = orderInput.value.trim();
    const method = methodInput.value;
    const amount = Number(amountInput.value);
    const reference = referenceInput.value.trim();

    const allowedMethods = [
        "Cash",
        "Card",
        "bKash",
        "Nagad",
        "Rocket"
    ];

    if (
        !orderToken ||
        !allowedMethods.includes(method) ||
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        setMessage(
            "paymentMessage",
            "Please provide valid payment information.",
            "error"
        );

        return false;
    }

    const orders = getCashierCollection("orders");

    const orderIndex = orders.findIndex(function (item) {

        return String(item.token || "").trim().toLowerCase() ===
            orderToken.toLowerCase();

    });

    if (orderIndex === -1) {

        setMessage(
            "paymentMessage",
            "Order not found. Please check the order token.",
            "error"
        );

        return false;
    }

    const order = orders[orderIndex];

    if (order.paymentStatus === "Paid") {

        setMessage(
            "paymentMessage",
            "Payment for this order has already been recorded.",
            "error"
        );

        return false;
    }

    /*
       A bill must be generated before payment.
    */

    const currentBillText = localStorage.getItem("coffee_current_bill");

    if (!currentBillText) {

        setMessage(
            "paymentMessage",
            "Please generate the bill before recording payment.",
            "error"
        );

        return false;
    }

    let currentBill;

    try {

        currentBill = JSON.parse(currentBillText);

    } catch (error) {

        setMessage(
            "paymentMessage",
            "Invalid bill information. Please generate the bill again.",
            "error"
        );

        return false;
    }

    if (
        String(currentBill.orderToken || "").toLowerCase() !== orderToken.toLowerCase() ||
        String(currentBill.orderId) !== String(order.id)
    ) {

        setMessage(
            "paymentMessage",
            "Generated bill does not match this order.",
            "error"
        );

        return false;
    }

    /*
       Verify that the saved bill still matches the real order.
    */

    const actualSubtotal = getOrderSubtotal(order);

    if (
        actualSubtotal === null ||
        getMoneyInPaisa(actualSubtotal) !== getMoneyInPaisa(currentBill.subtotal)
    ) {

        setMessage(
            "paymentMessage",
            "Order amount has changed. Please generate the bill again.",
            "error"
        );

        return false;
    }

    const total = Number(currentBill.total);

    if (!Number.isFinite(total) || total <= 0) {

        setMessage(
            "paymentMessage",
            "Invalid bill amount. Please generate the bill again.",
            "error"
        );

        return false;
    }

    const amountInPaisa = getMoneyInPaisa(amount);
    const totalInPaisa = getMoneyInPaisa(total);

    if (amountInPaisa < totalInPaisa) {

        setMessage(
            "paymentMessage",
            "Payment amount is insufficient. Required: " + formatMoney(total),
            "error"
        );

        return false;
    }

    const isDigitalPayment = [
        "Card",
        "bKash",
        "Nagad",
        "Rocket"
    ].includes(method);

    if (isDigitalPayment && amountInPaisa !== totalInPaisa) {

        setMessage(
            "paymentMessage",
            "For digital payments and cards, enter the exact payable amount.",
            "error"
        );

        return false;
    }

    if (method !== "Cash" && amountInPaisa > totalInPaisa) {

        setMessage(
            "paymentMessage",
            "Extra payment and change are supported for Cash only.",
            "error"
        );

        return false;
    }

    if (
        ["bKash", "Nagad", "Rocket", "Card"].includes(method) &&
        !reference
    ) {

        setMessage(
            "paymentMessage",
            "Please enter the transaction reference for this payment method.",
            "error"
        );

        return false;
    }

    const payments = getCashierCollection("payments");
    const currentUser = getCurrentUser();
    const paymentDate = getCurrentDateTime();

    /*
       Prevent duplicate successful payments for the same order.
    */

    const duplicatePayment = payments.some(function (payment) {

        return (
            String(payment.orderId) === String(order.id) &&
            payment.status === "Paid"
        );

    });

    if (duplicatePayment) {

        setMessage(
            "paymentMessage",
            "A successful payment record already exists for this order.",
            "error"
        );

        return false;
    }

    const payment = {

        id: CoffeeData.nextId("payments"),

        orderId: order.id,
        orderToken: order.token,

        customerId: order.customerId || "",
        customerName: order.customerName || "",

        method: method,

        amount: total,
        receivedAmount: amount,
        change: Math.max(0, amount - total),

        reference: reference,

        status: "Paid",
        paymentDate: paymentDate,

        cashierId: currentUser ? currentUser.id : "",
        cashierName: currentUser ? currentUser.name : "Cashier"

    };

    const updatedPayments = payments.concat(payment);

    const updatedOrders = orders.slice();

    updatedOrders[orderIndex] = {

        ...order,

        paymentStatus: "Paid",
        paymentMethod: method,
        paidAmount: total,
        paidAt: paymentDate

    };

    /*
       Save payment first.
       If order update fails, restore previous payment collection.
    */

    if (!CoffeeData.set("payments", updatedPayments)) {

        setMessage(
            "paymentMessage",
            "Unable to save payment record. Please try again.",
            "error"
        );

        return false;
    }

    if (!CoffeeData.set("orders", updatedOrders)) {

        const rollbackSuccess = CoffeeData.set("payments", payments);

        if (!rollbackSuccess) {
            console.error("Payment rollback failed. Please check LocalStorage data.");
        }

        setMessage(
            "paymentMessage",
            "Unable to update order payment status. Please try again.",
            "error"
        );

        return false;
    }

    localStorage.removeItem("coffee_current_bill");

    const paymentForm = document.getElementById("paymentForm");

    if (paymentForm) {
        paymentForm.reset();
    }

    refreshCashierDashboard();

    setMessage(
        "paymentMessage",
        "Payment recorded successfully. Order payment status updated to Paid.",
        "success"
    );

    return false;

}


/* =========================================================
   7. RENDER PAYMENT RECORDS
   HTML TABLE: 7 COLUMNS
   ========================================================= */

function renderPayments() {

    const payments = getCashierCollection("payments");

    const tableBody = document.getElementById("paymentTableBody");

    if (!tableBody) {
        return;
    }

    const searchInput = document.getElementById("paymentSearch");
    const filterInput = document.getElementById("paymentMethodFilter");

    const searchText = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    const methodFilter = filterInput
        ? filterInput.value
        : "All";

    const filteredPayments = payments.filter(function (payment) {

        const matchesSearch =
            String(payment.orderToken || "").toLowerCase().includes(searchText) ||
            String(payment.reference || "").toLowerCase().includes(searchText) ||
            String(payment.id || "").toLowerCase().includes(searchText) ||
            String(payment.customerName || "").toLowerCase().includes(searchText);

        const matchesMethod =
            methodFilter === "All" ||
            methodFilter === "" ||
            payment.method === methodFilter;

        return matchesSearch && matchesMethod;

    });

    filteredPayments.sort(function (a, b) {

        return new Date(b.paymentDate || b.date || 0) -
            new Date(a.paymentDate || a.date || 0);

    });

    const paymentCount = document.getElementById("paymentCount");

    if (paymentCount) {

        paymentCount.textContent =
            "Showing " + filteredPayments.length + " payment record(s).";

    }

    if (filteredPayments.length === 0) {

        showEmptyTable(
            "paymentTableBody",
            7,
            "No payment records found."
        );

        return;
    }

    tableBody.innerHTML = filteredPayments.map(function (payment) {

        return `
            <tr>
                <td>${escapeHTML(payment.id || "-")}</td>
                <td>${escapeHTML(payment.orderToken || "-")}</td>
                <td>${escapeHTML(payment.method || "-")}</td>
                <td>${formatMoney(payment.amount || 0)}</td>
                <td>${escapeHTML(payment.reference || "-")}</td>
                <td>${formatDateTime(payment.paymentDate || payment.date)}</td>
                <td>${getStatusBadge(payment.status || "Paid")}</td>
            </tr>
        `;

    }).join("");

}


/* =========================================================
   8. UPDATE SYSTEM CASH
   ========================================================= */

function updateSystemCash() {

    const dateInput = document.getElementById("reconDate");

    const selectedDate = dateInput && dateInput.value
        ? dateInput.value
        : getCurrentDate();

    const payments = getCashierCollection("payments");

    /*
       System cash = successful cash sales retained by the shop.
       It does not include the extra amount returned as change.
    */

    const systemCash = payments.reduce(function (total, payment) {

        const paymentDate = getDateOnly(
            payment.paymentDate || payment.date
        );

        if (
            payment.method === "Cash" &&
            payment.status === "Paid" &&
            paymentDate === selectedDate
        ) {

            return total + Number(payment.amount || 0);

        }

        return total;

    }, 0);

    const systemCashInput = document.getElementById("systemCash");

    if (systemCashInput) {
        systemCashInput.value = systemCash.toFixed(2);
    }

    return Math.round(systemCash * 100) / 100;

}


/* =========================================================
   9. SAVE DAILY CASH RECONCILIATION
   ========================================================= */

function saveReconciliation() {

    clearMessage("reconciliationMessage");

    const dateInput = document.getElementById("reconDate");
    const actualCashInput = document.getElementById("actualCash");
    const remarksInput = document.getElementById("cashNote");

    if (!dateInput || !actualCashInput || !remarksInput) {
        return false;
    }

    const date = dateInput.value;
    const actualCash = Number(actualCashInput.value);
    const remarks = remarksInput.value.trim();

    if (!date) {

        setMessage(
            "reconciliationMessage",
            "Please select a reconciliation date.",
            "error"
        );

        return false;
    }

    if (
        !Number.isFinite(actualCash) ||
        actualCash < 0
    ) {

        setMessage(
            "reconciliationMessage",
            "Please enter a valid actual cash amount.",
            "error"
        );

        return false;
    }

    const currentUser = getCurrentUser();

    if (!currentUser) {

        setMessage(
            "reconciliationMessage",
            "Please login again.",
            "error"
        );

        return false;
    }

    const systemCash = updateSystemCash();

    const difference = Math.round(
        (actualCash - systemCash) * 100
    ) / 100;

    const reconciliations = getCashierCollection("reconciliations");

    const existingRecord = reconciliations.find(function (record) {

        return (
            record.date === date &&
            String(record.cashierId || "") === String(currentUser.id)
        );

    });

    if (existingRecord) {

        setMessage(
            "reconciliationMessage",
            "A reconciliation record already exists for this date.",
            "error"
        );

        return false;
    }

    const reconciliation = {

        id: CoffeeData.nextId("reconciliations"),

        date: date,

        systemCash: systemCash,
        actualCash: actualCash,
        difference: difference,

        remarks: remarks,

        cashierId: currentUser.id,
        cashierName: currentUser.name,

        createdAt: getCurrentDateTime()

    };

    const updatedReconciliations =
        reconciliations.concat(reconciliation);

    if (!CoffeeData.set("reconciliations", updatedReconciliations)) {

        setMessage(
            "reconciliationMessage",
            "Unable to save reconciliation. Please try again.",
            "error"
        );

        return false;
    }

    const form = document.getElementById("reconciliationForm");

    if (form) {
        form.reset();
    }

    dateInput.value = getCurrentDate();

    updateSystemCash();
    renderReconciliations();

    setMessage(
        "reconciliationMessage",
        "Daily cash reconciliation saved successfully.",
        "success"
    );

    return false;

}


/* =========================================================
   10. RENDER RECONCILIATION HISTORY
   HTML TABLE: 7 COLUMNS
   ========================================================= */

function renderReconciliations() {

    const reconciliations = getCashierCollection("reconciliations");

    const tableBody = document.getElementById("reconciliationTableBody");

    if (!tableBody) {
        return;
    }

    const sortedRecords = reconciliations.slice().sort(function (a, b) {

        return new Date(b.date || 0) - new Date(a.date || 0);

    });

    if (sortedRecords.length === 0) {

        showEmptyTable(
            "reconciliationTableBody",
            7,
            "No reconciliation records found."
        );

        return;
    }

    tableBody.innerHTML = sortedRecords.map(function (record) {

        const difference = Number(record.difference || 0);

        let differenceClass = "status-neutral";

        if (difference > 0) {
            differenceClass = "status-success";
        } else if (difference < 0) {
            differenceClass = "status-danger";
        }

        return `
            <tr>
                <td>${escapeHTML(record.id || "-")}</td>
                <td>${formatDate(record.date)}</td>
                <td>${formatMoney(record.systemCash || 0)}</td>
                <td>${formatMoney(record.actualCash || 0)}</td>

                <td>
                    <span class="status-badge ${differenceClass}">
                        ${formatMoney(difference)}
                    </span>
                </td>

                <td>${escapeHTML(record.remarks || "-")}</td>
                <td>${escapeHTML(record.cashierName || "Cashier")}</td>
            </tr>
        `;

    }).join("");

}


/* =========================================================
   11. UPDATE CASHIER STATISTICS
   ========================================================= */

function updateCashierStatistics() {

    const payments = getCashierCollection("payments");

    const today = getCurrentDate();

    const todayPayments = payments.filter(function (payment) {

        const paymentDate = getDateOnly(
            payment.paymentDate || payment.date
        );

        return (
            paymentDate === today &&
            payment.status === "Paid"
        );

    });

    const todayCashPayments = todayPayments.filter(function (payment) {

        return payment.method === "Cash";

    });

    const todayBillCount = todayPayments.length;

    const todayBillSales = todayPayments.reduce(function (total, payment) {

        return total + Number(payment.amount || 0);

    }, 0);

    const todayCashReceived = todayCashPayments.reduce(function (total, payment) {

        return total + Number(
            payment.receivedAmount !== undefined
                ? payment.receivedAmount
                : payment.amount || 0
        );

    }, 0);

    const todayChange = todayCashPayments.reduce(function (total, payment) {

        return total + Number(payment.change || 0);

    }, 0);

    const countElement = document.getElementById("todayBillCount");
    const salesElement = document.getElementById("todayBillSales");
    const cashElement = document.getElementById("todayCashReceived");
    const changeElement = document.getElementById("todayChange");

    if (countElement) {
        countElement.textContent = todayBillCount;
    }

    if (salesElement) {
        salesElement.textContent = formatMoney(todayBillSales);
    }

    if (cashElement) {
        cashElement.textContent = formatMoney(todayCashReceived);
    }

    if (changeElement) {
        changeElement.textContent = formatMoney(todayChange);
    }

}


/* =========================================================
   12. CROSS-DASHBOARD SYNCHRONIZATION
   ========================================================= */

window.addEventListener("storage", function (event) {

    const relevantKeys = [
        "coffee_corner_orders",
        "coffee_corner_payments",
        "coffee_corner_reconciliations"
    ];

    if (
        event.key === null ||
        relevantKeys.includes(event.key)
    ) {

        refreshCashierDashboard();

    }

});


/* =========================================================
   13. REFRESH WHEN CASHIER RETURNS TO TAB
   ========================================================= */

window.addEventListener("focus", function () {

    refreshCashierDashboard();

});


/* =========================================================
   14. END OF CASHIER JAVASCRIPT
   ========================================================= */
