// ===========================================
// MR LUXE BOX & BAGS
// MY ORDERS SYSTEM V5 (security fixes)
// ===========================================
//
// CHANGES vs V4:
// 1. XSS FIX: order.customerName, order.address, order.orderNote,
//    item.name, etc. were interpolated straight into innerHTML.
//    Any customer could put a script payload in their own name or
//    order note at checkout, and it would run in the browser of
//    ANY other customer who looked up orders by phone number here.
//    Fixed with a local escapeHtml() applied to every field pulled
//    from Firestore before it's rendered.
// 2. The "Download Invoice" button used to serialize the entire
//    order object into an inline onclick='...' attribute. That's
//    a second injection vector and breaks on some characters.
//    Orders are now kept in an in-memory Map keyed by doc ID, and
//    the button uses data-action/data-id with one delegated click
//    listener instead.
//
// UPDATE: the phone lookup itself no longer queries Firestore
// directly from the browser. firestore.rules now locks
// collection-level "list" on /orders to the admin account only,
// because a client-side where("phone","==",phone) filter can
// always be dropped by a tampered request — rules can't verify a
// query was actually filtered. The lookup now goes through the
// getOrdersByPhone Cloud Function (functions/index.js), which runs
// with the Admin SDK and does the filtering server-side, where it
// can't be bypassed. See firestore.rules and functions/index.js.
// ===========================================

import { functions } from "./firebase.js";

import {
    httpsCallable
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-functions.js";

const getOrdersByPhone = httpsCallable(functions, "getOrdersByPhone");

// In-memory cache of the last search results, keyed by Firestore doc ID.
const ordersCache = new Map();

// ===========================================
// ESCAPE HELPER (local copy — script.js is not loaded on this page)
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
// SEARCH ORDERS
// ===========================================

window.loadOrders = async function () {

    const phoneInput = document.getElementById("phone");
    const ordersList = document.getElementById("ordersList");

    const phone = phoneInput.value.trim();

    if (phone === "") {
        ordersList.innerHTML = `
            <div class="empty-box">
                <h3>⚠ Please enter your mobile number.</h3>
            </div>
        `;
        return;
    }

    ordersList.innerHTML = `
        <div class="loading-box">
            <h3>⏳ Searching Orders...</h3>
        </div>
    `;

    try {

        const result = await getOrdersByPhone({ phone });
        const orders = (result.data && result.data.orders) || [];

        ordersCache.clear();

        if (orders.length === 0) {
            ordersList.innerHTML = `
                <div class="empty-box">
                    <h2>No Orders Found</h2>
                    <p>Please check your mobile number.</p>
                </div>
            `;
            return;
        }

        let html = "";

        orders.forEach((order) => {

            const id = order.orderId;

            // Cache the raw order so the invoice button can look it up by
            // ID instead of round-tripping it through an HTML attribute.
            ordersCache.set(id, order);

            let status = order.orderStatus || "Pending";
            let statusColor = "#f39c12";
            if (status === "Processing") statusColor = "#3498db";
            if (status === "Completed") statusColor = "#27ae60";

            const productsHTML = (order.products || [])
                .map((item) => `
                    <div class="product-item">
                        <p><strong>${escapeHtml(item.name)}</strong></p>
                        <p>Price : ₹${safeNum(item.price)}</p>
                        <p>Qty : ${safeNum(item.quantity)}</p>
                        <p>Subtotal : ₹${safeNum(item.subtotal)}</p>
                    </div>
                `)
                .join("");

            html += `
            <div class="order-card">
                <div class="order-header">
                    <h2>📦 Order #${escapeHtml(id.substring(0, 8))}</h2>
                    <span class="status-badge" style="background:${escapeHtml(statusColor)};">
                        ${escapeHtml(status)}
                    </span>
                </div>

                <p><strong>Customer:</strong> ${escapeHtml(order.customerName || "-")}</p>
                <p><strong>Mobile:</strong> ${escapeHtml(order.phone || "-")}</p>
                <p><strong>Address:</strong> ${escapeHtml(order.address || "-")}</p>
                <p><strong>Payment:</strong> ${escapeHtml(order.paymentMethod || "-")}</p>
                <p><strong>Total Products:</strong> ${safeNum((order.products || []).length)}</p>
                <p><strong>Total Quantity:</strong> ${safeNum(order.totalQuantity)}</p>
                <p><strong>Grand Total:</strong> ₹${safeNum(order.finalGrandTotal)}</p>

                <hr>
                <h3>🛍 Products</h3>
                ${productsHTML}
                <hr>

                <p><strong>Order Note:</strong> ${escapeHtml(order.orderNote || "No Note")}</p>

                <div class="order-actions">
                    <button class="hero-btn" data-action="download-invoice" data-id="${escapeHtml(id)}">
                        📄 Download Invoice
                    </button>
                </div>
            </div>
            `;

        });

        ordersList.innerHTML = html;
        setupOrdersActionDelegation();

    } catch (error) {

        console.error(error);

        ordersList.innerHTML = `
            <div class="empty-box">
                <h2>❌ Something went wrong</h2>
                <p>${escapeHtml(error.message)}</p>
            </div>
        `;

    }

};

// ===========================================
// DELEGATED ACTION HANDLER
// (single listener attached once, survives innerHTML rebuilds)
// ===========================================

function setupOrdersActionDelegation() {

    const ordersList = document.getElementById("ordersList");
    if (!ordersList || ordersList.dataset.delegationAttached) return;

    ordersList.addEventListener("click", (e) => {

        const btn = e.target.closest('button[data-action="download-invoice"]');
        if (!btn) return;

        const id = btn.getAttribute("data-id");
        const order = ordersCache.get(id);
        downloadMyInvoice(order);

    });

    ordersList.dataset.delegationAttached = "true";

}

// ===========================================
// DOWNLOAD INVOICE
// ===========================================

function downloadMyInvoice(order) {

    if (!order) {
        alert("Order data not found. Please search again.");
        return;
    }

    try {
        localStorage.setItem("lastOrder", JSON.stringify(order));

        if (typeof downloadInvoice === "function") {
            downloadInvoice(order);
        } else {
            alert("invoice.js not loaded");
        }
    } catch (error) {
        console.error(error);
        alert("Invoice Download Failed");
    }

}

// ===========================================
// AUTO LOAD
// ===========================================

document.addEventListener("DOMContentLoaded", () => {

    const phoneInput = document.getElementById("phone");

    if (phoneInput) {
        phoneInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                loadOrders();
            }
        });
    }

});
