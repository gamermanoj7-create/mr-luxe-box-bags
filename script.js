import { app } from "./firebase.js";

import {
  getFirestore,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const db = getFirestore(app);// ==========================
// MR Luxe Box & Bags
// Part 1
// Cart + Add To Cart
// ==========================

// Load Cart
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// ==========================
// Add To Cart
// ==========================

function addToCart(name, price, quantity) {

    quantity = parseInt(quantity) || 100;

    if (quantity < 100) {
        alert("Minimum Order Quantity is 100 Pieces.");
        return;
    }

    if (quantity % 100 !== 0) {
        alert("Quantity must be 100, 200, 300, 400...");
        return;
    }

    price = Number(price);

    let subtotal = price * quantity;

    let product = {
        name: name,
        price: price,
        quantity: quantity,
        subtotal: subtotal
    };

    cart.push(product);

    localStorage.setItem("cart", JSON.stringify(cart));

    alert(quantity + " Pieces Added Successfully!");

}

// ==========================
// Global Function
// ==========================

window.addToCart = addToCart;
// ==========================
// PART 2
// Load Cart
// ==========================

function loadCart() {

    let cartItems = document.getElementById("cartItems");
    let total = document.getElementById("total");

    if (!cartItems || !total) return;

    cartItems.innerHTML = "";

    let grandTotal = 0;

    if (cart.length === 0) {

        cartItems.innerHTML = "<h3>Your Cart Is Empty</h3>";

        total.innerHTML = "₹0";

        return;

    }

    cart.forEach((item,index)=>{

        grandTotal += item.subtotal;

        cartItems.innerHTML += `

        <div class="cart-item">

            <h2>${item.name}</h2>

            <p>Price : ₹${item.price}</p>

            <p>Quantity : ${item.quantity} Pieces</p>

            <p>Subtotal : ₹${item.subtotal}</p>

            <button onclick="removeItem(${index})">
            Remove
            </button>

        </div>

        `;

    });

    total.innerHTML = "₹" + grandTotal;

}

// ==========================
// Remove Item
// ==========================

function removeItem(index){

    cart.splice(index,1);

    localStorage.setItem("cart",JSON.stringify(cart));

    loadCart();

}

// ==========================
// Clear Cart
// ==========================

function clearCart(){

    cart=[];

    localStorage.removeItem("cart");

    loadCart();

}

// ==========================
// Global
// ==========================

window.removeItem=removeItem;

window.clearCart=clearCart;

loadCart();
// ==========================
// PART 3
// Checkout
// ==========================

function placeOrder() {

    const name = document.getElementById("name")?.value.trim();
    const phone = document.getElementById("phone")?.value.trim();
    const address = document.getElementById("address")?.value.trim();
    const payment = document.getElementById("payment")?.value;

    if (!name || !phone || !address) {
        alert("Please fill all details.");
        return;
    }

    if (cart.length === 0) {
        alert("Your cart is empty.");
        return;
    }

    let totalAmount = 0;
    let totalQuantity = 0;

    cart.forEach(item => {
        totalAmount += item.subtotal;
        totalQuantity += item.quantity;
    });

    const order = {
        customerName: name,
        phone: phone,
        address: address,
        payment: payment,
        products: cart,
        totalQuantity: totalQuantity,
        totalAmount: totalAmount,
        createdAt: new Date().toISOString()
    };

    // Local Storage-এ Order Save
    localStorage.setItem("lastOrder", JSON.stringify(order));

    // Cart Clear
    cart = [];
    localStorage.removeItem("cart");

    alert("Order Placed Successfully!");

    window.location.href = "success.html";
}

// Global
window.placeOrder = placeOrder;
