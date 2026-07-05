// ===========================================
// MR LUXE BOX & BAGS
// MY ORDERS SYSTEM V3
// PART 1
// ===========================================

import { db } from "./firebase.js";

import {
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ===========================================
// LOAD ORDERS
// ===========================================

window.loadOrders = async function () {

    const phone =
        document.getElementById("phone").value.trim();

    const ordersList =
        document.getElementById("ordersList");

    if (!phone) {

        ordersList.innerHTML = `
            <div class="empty-box">
                <h3>Enter Mobile Number</h3>
            </div>
        `;

        return;

    }

    ordersList.innerHTML = `
        <div class="loading-box">
            <h3>Loading Orders...</h3>
        </div>
    `;

    try {

        const q = query(
            collection(db, "orders"),
            where("phone", "==", phone)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {

            ordersList.innerHTML = `
                <div class="empty-box">
                    <h3>No Orders Found</h3>
                </div>
            `;

            return;

        }

        let html = "";

        snapshot.forEach((docSnap) => {

            const order = docSnap.data();

            const invoiceData = {
                ...order,
                orderId: docSnap.id
            };

            const invoiceJSON =
                JSON.stringify(invoiceData)
                .replace(/'/g, "\\'");

            let status =
                order.orderStatus || "Pending";

            let statusColor = "#f39c12";

            if (status === "Processing")
                statusColor = "#3498db";

            if (status === "Completed")
                statusColor = "#27ae60";
                            html += `

            <div class="order-card">

                <div class="order-header">

                    <h2>📦 Order #${docSnap.id}</h2>

                    <span class="status-badge"
                    style="background:${statusColor}">
                        ${status}
                    </span>

                </div>

                <p><b>Customer:</b> ${order.customerName || "-"}</p>

                <p><b>Mobile:</b> ${order.phone || "-"}</p>

                <p><b>Address:</b> ${order.address || "-"}</p>

                <p><b>Payment:</b> ${order.paymentMethod || "-"}</p>

                <p><b>Total Products:</b> ${(order.products || []).length}</p>

                <p><b>Total Quantity:</b> ${order.totalQuantity || 0}</p>

                <p><b>Grand Total:</b>
                ₹${order.finalGrandTotal || 0}</p>

                <hr>

                <h3>Products</h3>

                ${(order.products || []).map(item => `

                <div class="product-item">

                    <p><b>${item.name}</b></p>

                    <p>Price : ₹${item.price}</p>

                    <p>Qty : ${item.quantity}</p>

                    <p>Subtotal : ₹${item.subtotal}</p>

                </div>

                `).join("")}

                <hr>

                <p><b>Order Note:</b>
                ${order.orderNote || "No Note"}</p>

                <div class="order-actions">

                    <button
                    class="hero-btn"
                    onclick='downloadMyInvoice(${invoiceJSON})'>

                        📄 Download Invoice

                    </button>

                </div>

            </div>

            `;
        });

        ordersList.innerHTML = html;

    } catch (error) {

        console.error(error);

        ordersList.innerHTML = `
            <div class="empty-box">
                <h3>Something went wrong</h3>
                <p>${error.message}</p>
            </div>
        `;

    }

};

// ===========================================
// DOWNLOAD INVOICE
// ===========================================

window.downloadMyInvoice = function(order) {

    try {

        localStorage.setItem(
            "lastOrder",
            JSON.stringify(order)
        );

        if (typeof downloadInvoice === "function") {

            downloadInvoice(order);

        } else {

            alert("invoice.js is not loaded.");

        }

    } catch (error) {

        console.error(error);

        alert("Invoice Download Failed");

    }

};