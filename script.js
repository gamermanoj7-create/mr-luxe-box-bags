import { app } from "./firebase.js";

import {
  getFirestore,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const db = getFirestore(app);

// ======================
// CART
// ======================

let cart = JSON.parse(localStorage.getItem("cart")) || [];

// ======================
// ADD TO CART
// ======================

function addToCart(name, price) {

    cart.push({
        name: name,
        price: price
    });

    localStorage.setItem("cart", JSON.stringify(cart));

    alert(name + " Added to Cart");
}

// ======================
// SHOW CART
// ======================

function loadCart() {

    const cartItems = document.getElementById("cartItems");
    const total = document.getElementById("total");

    if (!cartItems || !total) return;

    cartItems.innerHTML = "";

    let grandTotal = 0;

    cart.forEach((item, index) => {

        grandTotal += item.price;

        cartItems.innerHTML += `
        <div class="cart-item">
            <h3>${item.name}</h3>
            <p>₹${item.price}</p>
            <button onclick="removeItem(${index})">
                Remove
            </button>
        </div>
        `;
    });

    total.innerHTML = "₹" + grandTotal;
}
// ======================
// REMOVE ITEM
// ======================

function removeItem(index) {

    cart.splice(index, 1);

    localStorage.setItem("cart", JSON.stringify(cart));

    loadCart();
}

// ======================
// CLEAR CART
// ======================

function clearCart() {

    localStorage.removeItem("cart");

    cart = [];

    loadCart();
}
// ======================
// PLACE ORDER
// ======================

async function placeOrder() {

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();
    const payment = document.getElementById("payment").value;

    if (!name || !phone || !address) {
        alert("Please fill all details.");
        return;
    }

    if (cart.length === 0) {
        alert("Your cart is empty.");
        return;
    }

    let total = 0;

    cart.forEach(item => {
        total += item.price;
    });

    try {

        await addDoc(collection(db, "orders"), {
            customerName: name,
            phone: phone,
            address: address,
            payment: payment,
            products: cart,
            total: total,
            createdAt: new Date()
        });

        localStorage.removeItem("cart");
        cart = [];

        alert("Order Placed Successfully!");

        window.location.href = "success.html";

    } catch (error) {

        alert("Order Failed: " + error.message);

    }

}

// ======================
// GLOBAL FUNCTIONS
// ======================

window.addToCart = addToCart;
window.removeItem = removeItem;
window.clearCart = clearCart;
window.placeOrder = placeOrder;

loadCart();