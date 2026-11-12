
/* =========================================================
   COFFEE CORNER - COFFEE SHOP MANAGEMENT SYSTEM
   Central Data Management File
   Technology: JavaScript + LocalStorage
   ========================================================= */


/* ==================== 1. STORAGE KEYS ==================== */

var CoffeeData = (function () {

    const STORAGE_PREFIX = "coffee_corner_";

    const COLLECTIONS = [
        "users",
        "menu",
        "stock",
        "staff",
        "orders",
        "favorites",
        "payments",
        "reviews",
        "reconciliations",
        "wasteReports"
    ];


    /* ==================== 2. DEFAULT DATA ==================== */

    const DEFAULT_DATA = {

        /* USER ACCOUNTS */
        users: [

            {
                id: 1,
                name: "Administrator",
                username: "admin",
                email: "admin@coffeecorner.com",
                phone: "",
                address: "",
                password: "admin123",
                role: "Administrator",
                status: "Active"
            },

            {
                id: 2,
                name: "Customer",
                username: "customer",
                email: "customer@coffeecorner.com",
                phone: "",
                address: "",
                password: "customer123",
                role: "Customer",
                status: "Active"
            },

            {
                id: 3,
                name: "Aziziur",
                username: "cashier",
                email: "cashier@coffeecorner.com",
                phone: "",
                address: "",
                password: "cashier123",
                role: "Cashier",
                status: "Active"
            },

            {
                id: 4,
                name: "Diub",
                username: "barista",
                email: "barista@coffeecorner.com",
                phone: "",
                address: "",
                password: "barista123",
                role: "Staff",
                status: "Active"
            }

        ],


        /* MENU ITEMS */
        menu: [

            {
                id: 1,
                name: "Espresso",
                category: "Hot Coffee",
                price: 120,
                availability: "Available",
                description: "Strong and rich espresso coffee."
            },

            {
                id: 2,
                name: "Cappuccino",
                category: "Hot Coffee",
                price: 180,
                availability: "Available",
                description: "Espresso with steamed milk and milk foam."
            },

            {
                id: 3,
                name: "Latte",
                category: "Hot Coffee",
                price: 200,
                availability: "Available",
                description: "Smooth espresso with steamed milk."
            },

            {
                id: 4,
                name: "Americano",
                category: "Hot Coffee",
                price: 140,
                availability: "Available",
                description: "Espresso diluted with hot water."
            },

            {
                id: 5,
                name: "Mocha",
                category: "Hot Coffee",
                price: 220,
                availability: "Available",
                description: "Coffee blended with chocolate and milk."
            },

            {
                id: 6,
                name: "Iced Coffee",
                category: "Cold Coffee",
                price: 190,
                availability: "Available",
                description: "Chilled coffee served with ice."
            },

            {
                id: 7,
                name: "Chocolate Muffin",
                category: "Snacks",
                price: 100,
                availability: "Available",
                description: "Fresh chocolate muffin."
            }

        ],


        /* STOCK INFORMATION */
        stock: [

            {
                id: 1,
                name: "Coffee Beans",
                category: "Coffee Ingredient",
                quantity: 25,
                unit: "kg",
                minimum: 5
            },

            {
                id: 2,
                name: "Fresh Milk",
                category: "Dairy",
                quantity: 30,
                unit: "litre",
                minimum: 10
            },

            {
                id: 3,
                name: "Sugar",
                category: "Ingredient",
                quantity: 20,
                unit: "kg",
                minimum: 5
            },

            {
                id: 4,
                name: "Chocolate Powder",
                category: "Ingredient",
                quantity: 8,
                unit: "kg",
                minimum: 3
            },

            {
                id: 5,
                name: "Paper Cups",
                category: "Packaging",
                quantity: 500,
                unit: "pcs",
                minimum: 100
            },

            {
                id: 6,
                name: "Ice",
                category: "Ingredient",
                quantity: 15,
                unit: "kg",
                minimum: 5
            }

        ],


        /* STAFF INFORMATION */
        staff: [

            {
                id: 1,
                name: "Aziziur",
                email: "cashier@coffeecorner.com",
                role: "Cashier",
                password: "cashier123",
                status: "Active"
            },

            {
                id: 2,
                name: "Diub",
                email: "barista@coffeecorner.com",
                role: "Staff",
                password: "barista123",
                status: "Active"
            }

        ],


        /* CUSTOMER ORDERS */
        orders: [],


        /* CUSTOMER FAVORITES */
        favorites: [],


        /* PAYMENT RECORDS */
        payments: [],


        /* CUSTOMER REVIEWS */
        reviews: [],


        /* DAILY CASH RECONCILIATION */
        reconciliations: [],


        /* DAMAGED / EXPIRED PRODUCT REPORTS */
        wasteReports: []

    };


    /* ==================== 3. STORAGE HELPERS ==================== */

    function storageKey(key) {
        return STORAGE_PREFIX + key;
    }


    function isValidCollection(key) {
        return COLLECTIONS.indexOf(key) !== -1;
    }


    function get(key) {

        if (!isValidCollection(key)) {
            console.error("Invalid CoffeeData collection:", key);
            return [];
        }

        try {

            const storedData = localStorage.getItem(storageKey(key));

            if (storedData === null) {
                return [];
            }

            const parsedData = JSON.parse(storedData);

            if (!Array.isArray(parsedData)) {
                console.error("Invalid stored data:", key);
                return [];
            }

            return parsedData;

        } catch (error) {

            console.error("Error reading data:", key, error);

            return [];

        }

    }


    function set(key, value) {

        if (!isValidCollection(key)) {
            console.error("Invalid CoffeeData collection:", key);
            return false;
        }

        if (!Array.isArray(value)) {
            console.error("Data must be an array:", key);
            return false;
        }

        try {

            localStorage.setItem(
                storageKey(key),
                JSON.stringify(value)
            );

            return true;

        } catch (error) {

            console.error("Error saving data:", key, error);

            return false;

        }

    }


    /* ==================== 4. ID GENERATOR ==================== */

    function nextId(key) {

        if (!isValidCollection(key)) {
            console.error("Invalid collection for ID:", key);
            return 1;
        }

        const records = get(key);

        let maximumId = 0;

        records.forEach(function (record) {

            const currentId = Number(record.id);

            if (
                Number.isInteger(currentId) &&
                currentId > maximumId
            ) {
                maximumId = currentId;
            }

        });

        return maximumId + 1;

    }


    /* ==================== 5. ORDER TOKEN GENERATOR ==================== */

    function token() {

        const orders = get("orders");

        let newToken;

        do {

            newToken = "CC" +
                Date.now().toString().slice(-6) +
                Math.floor(100 + Math.random() * 900);

        } while (
            orders.some(function (order) {
                return String(order.token) === newToken;
            })
        );

        return newToken;

    }


    /* ==================== 6. INITIALIZE DATABASE ==================== */

    function initialize() {

        COLLECTIONS.forEach(function (key) {

            const currentData = localStorage.getItem(storageKey(key));

            if (currentData === null) {

                localStorage.setItem(
                    storageKey(key),
                    JSON.stringify(DEFAULT_DATA[key])
                );

            }

        });

        console.log("Coffee Corner data initialized successfully.");

    }


    /* ==================== 7. RESET DEMO DATA ==================== */

    function resetDemoData() {

        COLLECTIONS.forEach(function (key) {

            localStorage.setItem(
                storageKey(key),
                JSON.stringify(DEFAULT_DATA[key])
            );

        });

        localStorage.removeItem("coffee_current_user");
        localStorage.removeItem("coffee_current_bill");

        console.log("Coffee Corner demo data reset successfully.");

    }


    /* ==================== 8. PUBLIC FUNCTIONS ==================== */

    return {

        get: get,

        set: set,

        nextId: nextId,

        token: token,

        initialize: initialize,

        resetDemoData: resetDemoData,

        collections: COLLECTIONS.slice()

    };

})();


/* ==================== 9. START APPLICATION ==================== */

CoffeeData.initialize();
