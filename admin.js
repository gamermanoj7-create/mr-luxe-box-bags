// ===========================================
// MR LUXE BOX & BAGS
// ADMIN PANEL V2
// PART 1
// FIREBASE + LOGIN
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

    initializeAdmin();

});

// ===========================================
// BUTTONS
// ===========================================

const refreshBtn =
document.getElementById("refreshBtn");

if (refreshBtn) {

    refreshBtn.onclick = () => {

        initializeAdmin();

    };

}

const logoutBtn =
document.getElementById("logoutBtn");

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

    const container =
    document.getElementById("ordersContainer");

    if (!container) return;

    container.innerHTML =
    "<h2>Loading Orders...</h2>";

    const snapshot =
    await getDocs(ordersRef);

    container.innerHTML = "";
        snapshot.forEach((docSnap) => {

        const order = docSnap.data();

        const invoiceData = {
            ...order,
            orderId: docSnap.id
        };

        let productsHTML = "";

        (order.products || []).forEach((item) => {

            productsHTML += `

            <div class="product-box">

                <p><b>Product:</b> ${item.name}</p>

                <p><b>Price:</b> ₹${item.price}</p>

                <p><b>Qty:</b> ${item.quantity}</p>

                <p><b>Subtotal:</b> ₹${item.subtotal}</p>

            </div>

            <hr>

            `;

        });

        container.innerHTML += `

        <div class="order-card">

            <h2>${order.customerName}</h2>

            <p><b>Order ID :</b> ${docSnap.id}</p>

            <p><b>Phone :</b> ${order.phone}</p>

            <p><b>Address :</b> ${order.address}</p>

            <p><b>Payment :</b> ${order.paymentMethod}</p>

            <p><b>Status :</b> ${order.orderStatus || "Pending"}</p>

            <p><b>Total Products :</b> ${(order.products || []).length}</p>

            <p><b>Total Quantity :</b> ${order.totalQuantity || 0}</p>

            <p><b>Grand Total :</b> ₹${order.finalGrandTotal || 0}</p>

            ${productsHTML}

            <div class="order-actions">
                            <button
                onclick="viewDesign('${order.designURL || ""}')">
                👁 View Design
                </button>

                <button
                onclick="downloadDesign('${order.designURL || ""}')">
                ⬇ Download Design
                </button>

                <button
                onclick="updateOrderStatus('${docSnap.id}','Processing')">
                🟡 Processing
                </button>

                <button
                onclick="updateOrderStatus('${docSnap.id}','Completed')">
                🟢 Completed
                </button>

                <button
                onclick='downloadAdminInvoice(${JSON.stringify(invoiceData).replace(/'/g, "\\'")})'>
                📄 Download Invoice
                </button>

                <button
                onclick="deleteOrder('${docSnap.id}')">
                🗑 Delete
                </button>

            </div>

        </div>

        `;

    });

}

// ===========================
// DOWNLOAD INVOICE
// ===========================

window.downloadAdminInvoice = function(order){

    localStorage.setItem(
        "lastOrder",
        JSON.stringify(order)
    );

    downloadInvoice(order);

};
// ===========================================
// VIEW DESIGN
// ===========================================

window.viewDesign = function(url){

    if(!url){

        alert("No Design Uploaded");

        return;

    }

    window.open(url,"_blank");

};

// ===========================================
// DOWNLOAD DESIGN
// ===========================================

window.downloadDesign = function(url){

    if(!url){

        alert("No Design Uploaded");

        return;

    }

    const a = document.createElement("a");

    a.href = url;

    a.download = "Customer-Design";

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

};

// ===========================================
// UPDATE STATUS
// ===========================================

window.updateOrderStatus = async function(id,status){

    try{

        await updateDoc(
            doc(db,"orders",id),
            {
                orderStatus: status
            }
        );

        alert("Status Updated");

        initializeAdmin();

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

};

// ===========================================
// DELETE ORDER
// ===========================================

window.deleteOrder = async function(id){

    if(!confirm("Delete this order?")){

        return;

    }

    try{

        await deleteDoc(
            doc(db,"orders",id)
        );

        alert("Order Deleted");

        initializeAdmin();

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

};
// ===========================================
// DASHBOARD
// ===========================================

async function updateDashboard(){

    const snapshot = await getDocs(ordersRef);

    let totalOrders = 0;
    let pendingOrders = 0;
    let processingOrders = 0;
    let completedOrders = 0;
    let totalRevenue = 0;

    snapshot.forEach((docSnap)=>{

        const order = docSnap.data();

        totalOrders++;

        totalRevenue += Number(
            order.finalGrandTotal || 0
        );

        switch(order.orderStatus){

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

    document.getElementById("totalOrders").textContent =
    totalOrders;

    document.getElementById("pendingOrders").textContent =
    pendingOrders;

    document.getElementById("processingOrders").textContent =
    processingOrders;

    document.getElementById("completedOrders").textContent =
    completedOrders;

    document.getElementById("totalRevenue").textContent =
    "₹" + totalRevenue;

}

// ===========================================
// SEARCH
// ===========================================

window.searchOrders = function(){

    const value =
    document.getElementById("searchOrder")
    .value
    .toLowerCase();

    document
    .querySelectorAll(".order-card")
    .forEach(card=>{

        card.style.display =
        card.innerText
        .toLowerCase()
        .includes(value)
        ? "block"
        : "none";

    });

};

// ===========================================
// FILTER
// ===========================================

window.filterOrders = function(status){

    document
    .querySelectorAll(".order-card")
    .forEach(card=>{

        card.style.display =

        status === "all" ||

        card.innerText.includes(status)

        ? "block"

        : "none";

    });

};

// ===========================================
// INITIALIZE
// ===========================================

async function initializeAdmin(){

    await loadOrders();

    await updateDashboard();

}

// ===========================================
// REFRESH
// ===========================================

window.refreshOrders = function(){

    initializeAdmin();

};

// ===========================================
// AUTO START
// ===========================================

initializeAdmin();

setInterval(
    initializeAdmin,
    30000
);