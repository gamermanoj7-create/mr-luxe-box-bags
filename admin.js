// ===========================================
// MR LUXE BOX & BAGS
// ADMIN PANEL V3 (security fixes)
// ===========================================
//
// CHANGES vs V2:
// 1. XSS FIX: every piece of order data that came from a customer
//    (name, address, phone, order note, product names, etc.) was
//    being inserted into innerHTML completely unescaped. A customer
//    could put <img src=x onerror=...> in their name/note at
//    checkout and it would execute in the ADMIN's logged-in
//    session here — the most dangerous possible place for it to
//    run. Fixed with a local escapeHtml() applied to every
//    interpolated field.
// 2. Buttons no longer serialize the full order object into an
//    inline onclick='...' attribute (that was a second injection
//    vector and broke on some characters). Orders are now kept in
//    an in-memory Map keyed by doc ID, and buttons use
//    data-action/data-id with a single delegated click listener.
// 3. initializeAdmin() was being called twice on page load — once
//    unconditionally at the bottom of the file, once again inside
//    onAuthStateChanged — so it briefly queried Firestore before
//    the admin check had even run. Now it's only ever called from
//    inside the auth callback.
// ===========================================

import { auth, db } from "./firebase.js";

import {
    collection,
    getDocs,
    deleteDoc,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// ===========================================
// SETTINGS
// ===========================================

const ADMIN_EMAIL = "gamermanoj7@gmail.com";

const ordersRef = collection(db, "orders");

// In-memory cache of the last-loaded orders, keyed by Firestore doc ID.
// Replaces stuffing the whole order object into an onclick attribute.
const ordersCache = new Map();

// ===========================================
// ESCAPE HELPER (this file loads standalone — script.js's
// escapeHtml() is not guaranteed to be on the page, so we keep a
// local copy rather than depend on load order)
// ===========================================

function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/** Safe numeric formatting — coerces to a number so a tampered
 *  non-numeric value can never inject markup through a "number" field. */
function safeNum(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

// ===========================================
// AUTH CHECK
// ===========================================

onAuthStateChanged(auth, (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    if (user.email !== ADMIN_EMAIL) {
        alert("Access Denied");
        signOut(auth);
        window.location.href = "index.html";
        return;
    }

    console.log("Admin Login Success");

    // Only place initializeAdmin() is called on load — see header note.
    initializeAdmin();

});

// ===========================================
// BUTTONS
// ===========================================

const refreshBtn = document.getElementById("refreshBtn");

if (refreshBtn) {
    refreshBtn.onclick = () => {
        initializeAdmin();
    };
}

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.onclick = async () => {
        await signOut(auth);
        window.location.href = "login.html";
    };
}

// ===========================================
// LOAD ORDERS
// ===========================================

async function loadOrders() {

    const container = document.getElementById("ordersContainer");
    if (!container) return;

    container.innerHTML = "<h2>Loading Orders...</h2>";

    const snapshot = await getDocs(ordersRef);

    ordersCache.clear();

    let html = "";

    snapshot.forEach((docSnap) => {

        const order = docSnap.data();
        const id = docSnap.id;

        // Cache the raw (unescaped) order so buttons can look it up by ID
        // instead of round-tripping it through an HTML attribute.
        ordersCache.set(id, { ...order, orderId: id });

        let productsHTML = "";

        (order.products || []).forEach((item) => {
            productsHTML += `
            <div class="product-box">
                <p><b>Product:</b> ${escapeHtml(item.name)}</p>
                <p><b>Price:</b> ₹${safeNum(item.price)}</p>
                <p><b>Qty:</b> ${safeNum(item.quantity)}</p>
                <p><b>Subtotal:</b> ₹${safeNum(item.subtotal)}</p>
            </div>
            <hr>
            `;
        });

        html += `
        <div class="order-card">
            <h2>${escapeHtml(order.customerName)}</h2>
            <p><b>Order ID :</b> ${escapeHtml(id)}</p>
            <p><b>Phone :</b> ${escapeHtml(order.phone)}</p>
            <p><b>Address :</b> ${escapeHtml(order.address)}</p>
            <p><b>Payment :</b> ${escapeHtml(order.paymentMethod)}</p>
            <p><b>Additional Note :</b> ${escapeHtml(order.orderNote || "No Note")}</p>
            <p><b>Status :</b> ${escapeHtml(order.orderStatus || "Pending")}</p>
            <p><b>Total Products :</b> ${safeNum((order.products || []).length)}</p>
            <p><b>Total Quantity :</b> ${safeNum(order.totalQuantity)}</p>
            <p><b>Grand Total :</b> ₹${safeNum(order.finalGrandTotal)}</p>

            ${productsHTML}

            <div class="order-actions">
                <button data-action="view-design" data-id="${escapeHtml(id)}">
                    👁 View Design
                </button>
                <button data-action="download-design" data-id="${escapeHtml(id)}">
                    ⬇ Download Design
                </button>
                <button data-action="set-processing" data-id="${escapeHtml(id)}">
                    🟡 Processing
                </button>
                <button data-action="set-completed" data-id="${escapeHtml(id)}">
                    🟢 Completed
                </button>
                <button data-action="download-invoice" data-id="${escapeHtml(id)}">
                    📄 Download Invoice
                </button>
                <button data-action="delete-order" data-id="${escapeHtml(id)}">
                    🗑 Delete
                </button>
            </div>
        </div>
        `;

    });

    container.innerHTML = html || "<h2>No Orders Found</h2>";

}

// ===========================================
// DELEGATED ACTION HANDLER
// (single listener attached once, survives innerHTML rebuilds)
// ===========================================

function setupOrdersActionDelegation() {

    const container = document.getElementById("ordersContainer");
    if (!container || container.dataset.delegationAttached) return;

    container.addEventListener("click", (e) => {

        const btn = e.target.closest("button[data-action]");
        if (!btn) return;

        const id = btn.getAttribute("data-id");
        const action = btn.getAttribute("data-action");
        const order = ordersCache.get(id);

        switch (action) {
            case "view-design":
                viewDesign(order ? order.designURL : "");
                break;
            case "download-design":
                downloadDesign(order ? order.designURL : "");
                break;
            case "set-processing":
                updateOrderStatus(id, "Processing");
                break;
            case "set-completed":
                updateOrderStatus(id, "Completed");
                break;
            case "download-invoice":
                downloadAdminInvoice(order);
                break;
            case "delete-order":
                deleteOrder(id);
                break;
        }

    });

    container.dataset.delegationAttached = "true";

}

// ===========================
// DOWNLOAD INVOICE
// ===========================

function downloadAdminInvoice(order) {
    if (!order) {
        alert("Order data not found. Please refresh and try again.");
        return;
    }
    localStorage.setItem("lastOrder", JSON.stringify(order));
    if (typeof downloadInvoice === "function") {
        downloadInvoice(order);
    } else {
        alert("invoice.js not loaded");
    }
}

// ===========================================
// VIEW DESIGN
// ===========================================

function viewDesign(url) {
    if (!url) {
        alert("No Design Uploaded");
        return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
}

// ===========================================
// DOWNLOAD DESIGN
// ===========================================

function downloadDesign(url) {
    if (!url) {
        alert("No Design Uploaded");
        return;
    }
    const downloadUrl = url.replace("/upload/", "/upload/fl_attachment/");
    window.open(downloadUrl, "_blank", "noopener,noreferrer");
}

// ===========================================
// UPDATE STATUS
// ===========================================

async function updateOrderStatus(id, status) {
    try {
        await updateDoc(doc(db, "orders", id), { orderStatus: status });
        alert("Status Updated");
        initializeAdmin();
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

// ===========================================
// DELETE ORDER
// ===========================================

async function deleteOrder(id) {
    if (!confirm("Delete this order?")) return;

    try {
        await deleteDoc(doc(db, "orders", id));
        alert("Order Deleted");
        initializeAdmin();
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

// ===========================================
// DASHBOARD
// ===========================================

async function updateDashboard() {

    const snapshot = await getDocs(ordersRef);

    let totalOrders = 0;
    let pendingOrders = 0;
    let processingOrders = 0;
    let completedOrders = 0;
    let totalRevenue = 0;

    snapshot.forEach((docSnap) => {
        const order = docSnap.data();
        totalOrders++;
        totalRevenue += safeNum(order.finalGrandTotal);

        switch (order.orderStatus) {
            case "Processing":
                processingOrders++;
                break;
            case "Completed":
                completedOrders++;
                break;
            default:
                pendingOrders++;
        }
    });

    document.getElementById("totalOrders").textContent = totalOrders;
    document.getElementById("pendingOrders").textContent = pendingOrders;
    document.getElementById("processingOrders").textContent = processingOrders;
    document.getElementById("completedOrders").textContent = completedOrders;
    document.getElementById("totalRevenue").textContent = "₹" + totalRevenue;

}

// ===========================================
// SEARCH
// ===========================================

window.searchOrders = function () {

    const value = document.getElementById("searchOrder").value.toLowerCase();

    document.querySelectorAll(".order-card").forEach((card) => {
        card.style.display = card.innerText.toLowerCase().includes(value)
            ? "block"
            : "none";
    });

};

// ===========================================
// FILTER
// ===========================================

window.filterOrders = function (status) {

    document.querySelectorAll(".order-card").forEach((card) => {
        card.style.display =
            status === "all" || card.innerText.includes(status)
                ? "block"
                : "none";
    });

};

// ===========================================
// INITIALIZE
// ===========================================

async function initializeAdmin() {
    await loadOrders();
    setupOrdersActionDelegation();
    await updateDashboard();
}

// ===========================================
// REFRESH
// ===========================================

window.refreshOrders = function () {
    initializeAdmin();
};

// ===========================================
// AUTO REFRESH
// (no unconditional initializeAdmin() call here anymore — the only
// entry point is onAuthStateChanged above)
// ===========================================

setInterval(() => {
    if (auth.currentUser && auth.currentUser.email === ADMIN_EMAIL) {
        initializeAdmin();
    }
}, 30000);
