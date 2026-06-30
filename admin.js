import { app, auth } from "./firebase.js";

import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const db = getFirestore(app);

// ======================
// ADMIN SECURITY
// ======================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    if (user.email !== "gamermanoj7@gmail.com") {

        alert("Access Denied");

        signOut(auth);

        window.location.href = "index.html";

        return;

    }

    console.log("Welcome Admin:", user.email);

    loadOrders();

});
// ======================
// LOAD ORDERS
// ======================

async function loadOrders() {

const ordersDiv = document.getElementById("ordersContainer");

    ordersDiv.innerHTML = "Loading Orders...";

    const snapshot = await getDocs(collection(db, "orders"));

    ordersDiv.innerHTML = "";

    if (snapshot.empty) {

        ordersDiv.innerHTML = "<h2>No Orders Found</h2>";

        return;

    }

    snapshot.forEach((orderDoc) => {

        const order = orderDoc.data();

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

        ordersDiv.innerHTML += `

        <div class="order-card">

        <h2>${order.customerName}</h2>

        <p><b>Phone:</b> ${order.phone}</p>

        <p><b>Address:</b> ${order.address}</p>

        <p><b>Payment:</b> ${order.payment}</p>

        <p><b>Total Quantity:</b> ${order.totalQuantity}</p>

        <p><b>Total Amount:</b> ₹${order.totalAmount}</p>

        ${productsHTML}

        <button onclick="deleteOrder('${orderDoc.id}')">

        Delete Order

        </button>

        </div>

        <br>

        `;

    });

}
// ======================
// DELETE ORDER
// ======================

async function deleteOrder(id) {

    const ok = confirm("Delete this order?");

    if (!ok) return;

    try {

        await deleteDoc(doc(db, "orders", id));

        alert("Order Deleted Successfully");

        loadOrders();

    } catch (error) {

        alert(error.message);

    }

}

// ======================
// SEARCH ORDER
// ======================

function searchOrders() {

    const value = document
        .getElementById("search")
        .value
        .toLowerCase();

    const cards = document.querySelectorAll(".order-card");

    cards.forEach((card) => {

        if (card.innerText.toLowerCase().includes(value)) {

            card.style.display = "block";

        } else {

            card.style.display = "none";

        }

    });

}

// ======================
// LOGOUT
// ======================

const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", async () => {

    try {

        await signOut(auth);

        alert("Logged Out Successfully");

        window.location.href = "login.html";

    } catch (error) {

        alert(error.message);

    }

});

// ======================
// GLOBAL FUNCTIONS
// ======================

window.deleteOrder = deleteOrder;
window.searchOrders = searchOrders;