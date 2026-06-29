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

function addToCart(name, price, quantity) {

    quantity = Number(quantity);
if (quantity < 100) {
        alert("Minimum Order Quantity is 100 Pieces.");
        return;
    }

    price = Number(price);

    let subtotal = price * quantity;

    cart.push({

        name: name,

        price: price,

        quantity: quantity,

        subtotal: subtotal

    });

    localStorage.setItem("cart", JSON.stringify(cart));

    alert(quantity + " Piece " + name + " Added To Cart");

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

        grandTotal += item.subtotal;

        cartItems.innerHTML += `

        <div class="cart-item">

            <h3>${item.name}</h3>

            <p>Price : ₹${item.price}</p>

            <p>Quantity : ${item.quantity} Piece</p>

            <p>Subtotal : ₹${item.subtotal}</p>

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

    cart = [];

    localStorage.removeItem("cart");

    loadCart();

    alert("Cart Cleared");

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

    let totalAmount = 0;
    let totalQuantity = 0;

    cart.forEach(item => {

        totalAmount += item.subtotal;

        totalQuantity += item.quantity;

    });

    try {

        const docRef = await addDoc(collection(db, "orders"), {

            customerName: name,
            phone: phone,
            address: address,
            payment: payment,

            products: cart,

            totalQuantity: totalQuantity,

            totalAmount: totalAmount,

            createdAt: new Date()

        });

        alert("Order Saved!\nID: " + docRef.id);

        localStorage.removeItem("cart");

        cart = [];

        window.location.href = "success.html";

    } catch (error) {

        console.error(error);

        alert("Order Failed : " + error.message);

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