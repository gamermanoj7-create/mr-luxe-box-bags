import { auth } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

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

        window.location.href = "login.html";
        return;

    }

    console.log("Admin Login:", user.email);

});
import { app } from "./firebase.js";

import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const db = getFirestore(app);

async function loadOrders() {

    const ordersDiv = document.getElementById("orders");

    ordersDiv.innerHTML = "";

    const querySnapshot = await getDocs(collection(db, "orders"));

    if (querySnapshot.empty) {

        ordersDiv.innerHTML = "<h3>No Orders Found</h3>";

        return;

    }

    querySnapshot.forEach((doc) => {

        const order = doc.data();

        let productList = "";

        order.products.forEach((item) => {

            productList += `
            <li>
            ${item.name}<br>
            Qty : ${item.quantity}<br>
            Price : ₹${item.price}<br>
            Subtotal : ₹${item.subtotal}
            </li><br>
            `;

        });

        ordersDiv.innerHTML += `

        <div class="card">

        <h2>${order.customerName}</h2>

        <p><b>Phone:</b> ${order.phone}</p>

        <p><b>Address:</b> ${order.address}</p>

        <p><b>Payment:</b> ${order.payment}</p>

        <p><b>Total Qty:</b> ${order.totalQuantity}</p>

        <p><b>Total Amount:</b> ₹${order.totalAmount}</p>

        <h3>Products</h3>

        <ul>
        ${productList}
        </ul>

        <hr>

        </div>

        `;

    });

}

loadOrders();
document.getElementById("logoutBtn").addEventListener("click", async () => {

    await signOut(auth);

    alert("Logged Out");

    window.location.href = "login.html";

});