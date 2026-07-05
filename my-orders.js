// ===========================================
// MR LUXE BOX & BAGS
// MY ORDERS SYSTEM V4
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

        const ordersRef = collection(db, "orders");

        const q = query(
            ordersRef,
            where("phone", "==", phone)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {

            ordersList.innerHTML = `
                <div class="empty-box">
                    <h2>No Orders Found</h2>
                    <p>Please check your mobile number.</p>
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

            const invoiceJSON = JSON.stringify(invoiceData)
                .replace(/'/g, "\\'");

            let status = order.orderStatus || "Pending";

            let statusColor = "#f39c12";

            if (status === "Processing") {
                statusColor = "#3498db";
            }

            if (status === "Completed") {
                statusColor = "#27ae60";
            }

            html += `

            <div class="order-card">

                <div class="order-header">

                    <h2>📦 Order #${docSnap.id}</h2>

                    <span
                        class="status-badge"
                        style="background:${statusColor};">

                        ${status}

                    </span>

                </div>

                <p><strong>Customer:</strong> ${order.customerName || "-"}</p>

                <p><strong>Mobile:</strong> ${order.phone || "-"}</p>

                <p><strong>Address:</strong> ${order.address || "-"}</p>

                <p><strong>Payment:</strong> ${order.paymentMethod || "-"}</p>

                <p><strong>Total Products:</strong> ${(order.products || []).length}</p>

                <p><strong>Total Quantity:</strong> ${order.totalQuantity || 0}</p>

                <p><strong>Grand Total:</strong> ₹${order.finalGrandTotal || 0}</p>

                <hr>

                <h3>🛍 Products</h3>

                ${(order.products || []).map(item => `

                    <div class="product-item">

                        <p><strong>${item.name}</strong></p>

                        <p>Price : ₹${item.price}</p>

                        <p>Qty : ${item.quantity}</p>

                        <p>Subtotal : ₹${item.subtotal}</p>

                    </div>

                `).join("")}

                <hr>

                <p><strong>Order Note:</strong> ${order.orderNote || "No Note"}</p>

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
                <h2>❌ Something went wrong</h2>
                <p>${error.message}</p>
            </div>
        `;

    }

};

// ===========================================
// DOWNLOAD INVOICE
// ===========================================

window.downloadMyInvoice = function(order){

    try{

        localStorage.setItem(
            "lastOrder",
            JSON.stringify(order)
        );

        if(typeof downloadInvoice === "function"){

            downloadInvoice(order);

        }else{

            alert("invoice.js not loaded");

        }

    }catch(error){

        console.error(error);

        alert("Invoice Download Failed");

    }

};

// ===========================================
// AUTO LOAD
// ===========================================

document.addEventListener("DOMContentLoaded",()=>{

    const phoneInput=document.getElementById("phone");

    if(phoneInput){

        phoneInput.addEventListener("keypress",(e)=>{

            if(e.key==="Enter"){

                loadOrders();

            }

        });

    }

});
