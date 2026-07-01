import { app, auth, db } from "./firebase.js";

import {
    collection,
    getDocs,
    deleteDoc,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// =============================
// MR LUXE BOX & BAGS
// ADMIN PANEL
// PART 1
// =============================

// Admin Email
const ADMIN_EMAIL = "gamermanoj7@gmail.com";

// Firestore Orders Collection
const ordersCollection = collection(db, "orders");

// =============================
// ADMIN SECURITY
// =============================

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

    console.log("Welcome Admin:", user.email);

    loadOrders();

});

// =============================
// LOGOUT
// =============================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        try {

            await signOut(auth);

            window.location.href = "login.html";

        } catch (error) {

            alert(error.message);

        }

    });

}
// =============================
// PART 2
// LOAD ORDERS
// =============================

async function loadOrders() {

    const ordersContainer =
    document.getElementById("ordersContainer");

    if (!ordersContainer) return;

    ordersContainer.innerHTML = "<h3>Loading Orders...</h3>";

    try {

        const snapshot =
        await getDocs(ordersCollection);

        ordersContainer.innerHTML = "";

        if (snapshot.empty) {

            ordersContainer.innerHTML =
            "<h3>No Orders Found</h3>";

            return;

        }

        snapshot.forEach((docSnap) => {

            const order = docSnap.data();

            let productsHTML = "";

            order.products.forEach((item) => {

                productsHTML += `

                <div class="product-box">

                    <p><b>Product:</b> ${item.name}</p>

                    <p><b>Price:</b> ₹${item.price}</p>

                    <p><b>Quantity:</b> ${item.quantity}</p>

                    <p><b>Subtotal:</b> ₹${item.subtotal}</p>

                    <hr>

                </div>

                `;

            });

            ordersContainer.innerHTML += `

            <div class="order-card">

                <h2>${order.customerName}</h2>

                <p><b>Phone:</b> ${order.phone}</p>

                <p><b>Address:</b> ${order.address}</p>

                <p><b>Payment:</b> ${order.payment}</p>

                <p><b>Status:</b> ${order.orderStatus || "Pending"}</p>

                <p><b>Total Quantity:</b> ${order.totalQuantity}</p>

                <p><b>Grand Total:</b> ₹${order.totalAmount}</p>

                ${productsHTML}

                <div class="order-actions">

                    <button onclick="viewDesign('${order.designURL || ""}')">
                        View Design
                    </button>

                    <button onclick="downloadDesign('${order.designURL || ""}')">
                        Download
                    </button>

                    <button onclick="deleteOrder('${docSnap.id}')">
                        Delete
                    </button>

                </div>

            </div>

            `;

        });

    } catch (error) {

        ordersContainer.innerHTML =
        "<h3>Error Loading Orders</h3>";

        console.error(error);

    }

}
// =============================
// PART 3
// DESIGN PREVIEW & DOWNLOAD
// =============================

// View Design

function viewDesign(url){

    if(!url){

        alert("No Design Uploaded");

        return;

    }

    window.open(url,"_blank");

}

// Download Design

function downloadDesign(url){

    if(!url){

        alert("No Design Uploaded");

        return;

    }

    const a=document.createElement("a");

    a.href=url;

    a.target="_blank";

    a.download="MR-Luxe-Customer-Design";

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

}

// =============================
// ORDER STATUS
// =============================

async function updateOrderStatus(id,status){

    try{

        await updateDoc(

            doc(db,"orders",id),

            {

                orderStatus:status

            }

        );

        alert("Order Status Updated");

        loadOrders();

    }

    catch(error){

        alert(error.message);

    }

}

// =============================
// GLOBAL
// =============================

window.viewDesign=viewDesign;

window.downloadDesign=downloadDesign;

window.updateOrderStatus=updateOrderStatus;
// =============================
// PART 4
// SEARCH + FILTER + DELETE
// =============================

// Search Orders
function searchOrders() {

    const input = document
        .getElementById("searchOrder");

    if (!input) return;

    const value = input.value.toLowerCase();

    const cards =
        document.querySelectorAll(".order-card");

    cards.forEach((card) => {

        if (card.innerText.toLowerCase().includes(value)) {

            card.style.display = "block";

        } else {

            card.style.display = "none";

        }

    });

}

// Filter Orders
function filterOrders(status) {

    const cards =
        document.querySelectorAll(".order-card");

    cards.forEach((card) => {

        const text = card.innerText.toLowerCase();

        if (
            status === "all" ||
            text.includes(status.toLowerCase())
        ) {

            card.style.display = "block";

        } else {

            card.style.display = "none";

        }

    });

}

// Delete Order
async function deleteOrder(id) {

    const ok = confirm(
        "Are you sure you want to delete this order?"
    );

    if (!ok) return;

    try {

        await deleteDoc(
            doc(db, "orders", id)
        );

        alert("Order Deleted Successfully");

        loadOrders();

    } catch (error) {

        alert(error.message);

    }

}

// Refresh Orders
function refreshOrders() {

    loadOrders();

}

// =============================
// GLOBAL
// =============================

window.searchOrders = searchOrders;

window.filterOrders = filterOrders;

window.deleteOrder = deleteOrder;

window.refreshOrders = refreshOrders;
// =============================
// PART 5
// DASHBOARD SUMMARY
// =============================

async function updateDashboard() {

    try {

        const snapshot = await getDocs(ordersCollection);

        let totalOrders = 0;
        let pendingOrders = 0;
        let totalRevenue = 0;
        let totalProducts = 0;

        snapshot.forEach((docSnap) => {

            const order = docSnap.data();

            totalOrders++;

            totalRevenue += Number(order.totalAmount || 0);

            totalProducts += Number(order.totalQuantity || 0);

            if (
                !order.orderStatus ||
                order.orderStatus === "Pending"
            ) {

                pendingOrders++;

            }

        });

        const setValue = (id, value) => {

            const el = document.getElementById(id);

            if (el) {

                el.textContent = value;

            }

        };

        setValue("totalOrders", totalOrders);

        setValue("pendingOrders", pendingOrders);

        setValue("totalRevenue", "₹" + totalRevenue);

        setValue("totalProducts", totalProducts);

    } catch (error) {

        console.error(error);

    }

}

// =============================
// AUTO REFRESH
// =============================

async function initializeAdmin() {

    await loadOrders();

    await updateDashboard();

}

initializeAdmin();

// Refresh every 30 seconds

setInterval(() => {

    initializeAdmin();

}, 30000);