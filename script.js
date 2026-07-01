// ======================================
// MR LUXE BOX & BAGS
// PRODUCTION SCRIPT.JS
// PART 1
// ======================================

import { db, storage } from "./firebase.js";

import {
    collection,
    addDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
    ref,
    uploadBytesResumable,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

// ======================================
// CART
// ======================================

let cart = JSON.parse(localStorage.getItem("cart")) || [];

// ======================================
// SAVE CART
// ======================================

function saveCart() {

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

}

// ======================================
// ADD TO CART
// ======================================

function addToCart(name, price, quantity) {

    quantity = parseInt(quantity);

    if (isNaN(quantity)) {

        alert("Please enter quantity.");

        return;

    }

    if (quantity < 100) {

        alert("Minimum order is 100 Pieces.");

        return;

    }

    if (quantity % 100 !== 0) {

        alert("Quantity must be 100, 200, 300...");

        return;

    }

    price = Number(price);

    const subtotal = price * quantity;

    const product = {

        name: name,

        price: price,

        quantity: quantity,

        subtotal: subtotal

    };

    cart.push(product);

    saveCart();

    window.location.href = "cart.html";

}

// ======================================
// GLOBAL
// ======================================

window.addToCart = addToCart;
// ======================================
// PART 2
// CART PAGE
// ======================================

function loadCart() {

    const cartItems =
    document.getElementById("cartItems");

    const total =
    document.getElementById("total");

    if (!cartItems || !total) return;

    cartItems.innerHTML = "";

    let grandTotal = 0;

    if (cart.length === 0) {

        cartItems.innerHTML = `
        <h2>Your Cart Is Empty</h2>
        `;

        total.textContent = "₹0";

        return;

    }

    cart.forEach((item, index) => {

        grandTotal += item.subtotal;

        cartItems.innerHTML += `

        <div class="cart-item">

            <h2>${item.name}</h2>

            <p><b>Price:</b> ₹${item.price}</p>

            <p><b>Quantity:</b> ${item.quantity} Pieces</p>

            <p><b>Subtotal:</b> ₹${item.subtotal}</p>

            <button
            onclick="removeItem(${index})">

            Remove

            </button>

        </div>

        `;

    });

    total.textContent = "₹" + grandTotal;

}

// ======================================
// REMOVE ITEM
// ======================================

function removeItem(index) {

    cart.splice(index, 1);

    saveCart();

    loadCart();

}

// ======================================
// CLEAR CART
// ======================================

function clearCart() {

    if (!confirm("Clear all cart items?")) {

        return;

    }

    cart = [];

    localStorage.removeItem("cart");

    loadCart();

}

// ======================================
// CHECKOUT
// ======================================

function checkout() {

    if (cart.length === 0) {

        alert("Your cart is empty.");

        return;

    }

    window.location.href = "checkout.html";

}

// ======================================
// GLOBAL
// ======================================

window.removeItem = removeItem;

window.clearCart = clearCart;

window.checkout = checkout;

// Auto Load

loadCart();
// ======================================
// PART 3
// CHECKOUT PAGE
// ======================================

// Checkout Summary

function loadCheckoutSummary() {

    const totalItems =
    document.getElementById("totalItems");

    const totalPrice =
    document.getElementById("totalPrice");

    if (!totalItems || !totalPrice) {

        return;

    }

    let totalQuantity = 0;

    let grandTotal = 0;

    cart.forEach(item => {

        totalQuantity += item.quantity;

        grandTotal += item.subtotal;

    });

    totalItems.textContent =
    totalQuantity + " Pieces";

    totalPrice.textContent =
    "₹" + grandTotal;

}

loadCheckoutSummary();

// ======================================
// CUSTOMER DETAILS
// ======================================

function getCustomerData() {

    return {

        name:
        document.getElementById("name")?.value.trim(),

        phone:
        document.getElementById("phone")?.value.trim(),

        address:
        document.getElementById("address")?.value.trim(),

        payment:
        document.getElementById("payment")?.value

    };

}

// ======================================
// VALIDATION
// ======================================

function validateCustomer(data) {

    if (
        !data.name ||
        !data.phone ||
        !data.address ||
        !data.payment
    ) {

        alert("Please fill all details.");

        return false;

    }

    if (cart.length === 0) {

        alert("Cart is Empty.");

        return false;

    }

    return true;

}

// ======================================
// TOTAL
// ======================================

function calculateOrder() {

    let totalQuantity = 0;

    let totalAmount = 0;

    cart.forEach(item => {

        totalQuantity += item.quantity;

        totalAmount += item.subtotal;

    });

    return {

        totalQuantity,

        totalAmount

    };

}
// ======================================
// PART 4
// FIREBASE STORAGE + FIRESTORE
// ======================================

// Upload Customer Design

async function uploadDesign() {

    const fileInput =
    document.getElementById("designFile");

    if (!fileInput || fileInput.files.length === 0) {

        return "";

    }

    const file = fileInput.files[0];

    const storageRef = ref(

        storage,

        "customer-designs/" +

        Date.now() +

        "-" +

        file.name

    );

    const uploadTask =
    uploadBytesResumable(
        storageRef,
        file
    );

    return new Promise((resolve, reject) => {

        uploadTask.on(

            "state_changed",

            (snapshot) => {

                const progress =

                (snapshot.bytesTransferred /

                snapshot.totalBytes) * 100;

                const progressBar =
                document.getElementById("uploadProgress");

                if (progressBar) {

                    progressBar.style.width =
                    progress + "%";

                }

            },

            (error) => {

                reject(error);

            },

            async () => {

                const url =
                await getDownloadURL(
                    uploadTask.snapshot.ref
                );

                resolve(url);

            }

        );

    });

}

// ======================================
// PLACE ORDER
// ======================================

async function placeOrder() {

    const customer =
    getCustomerData();

    if (!validateCustomer(customer)) {

        return;

    }

    const totals =
    calculateOrder();

    const designURL =
    await uploadDesign();

    const order = {

        customerName:
        customer.name,

        phone:
        customer.phone,

        address:
        customer.address,

        payment:
        customer.payment,

        products:
        cart,

        totalQuantity:
        totals.totalQuantity,

        totalAmount:
        totals.totalAmount,

        designURL:
        designURL,

        status:
        "Pending",

        createdAt:
        new Date().toISOString()

    };

    try {

        const docRef =
        await addDoc(

            collection(db, "orders"),

            order

        );

        order.orderId =
        docRef.id;

        localStorage.setItem(

            "lastOrder",

            JSON.stringify(order)

        );

        cart = [];

        localStorage.removeItem("cart");

        window.location.href =
        "success.html";

    }

    catch (error) {

        alert(
            "Order Save Failed\n\n" +
            error.message
        );

    }

}

// ======================================
// GLOBAL
// ======================================

window.placeOrder = placeOrder;
// ======================================
// PART 5
// SUCCESS PAGE
// ======================================

function loadSuccessPage() {

    const order = JSON.parse(
        localStorage.getItem("lastOrder")
    );

    if (!order) return;

    function set(id, value) {

        const el = document.getElementById(id);

        if (el) {

            el.textContent = value;

        }

    }

    set("orderId", order.orderId);

    set("customerName", order.customerName);

    set("customerPhone", order.phone);

    set("customerAddress", order.address);

    set("paymentMethod", order.payment);

    set("totalProducts", order.products.length);

    set("totalQuantity", order.totalQuantity);

    set("grandTotal", "₹" + order.totalAmount);

    // ==========================
    // DESIGN PREVIEW
    // ==========================

    const preview =
    document.getElementById("designPreview");

    if (preview) {

        if (order.designURL) {

            preview.innerHTML = `

            <a
            href="${order.designURL}"
            target="_blank"
            class="hero-btn">

            View / Download Design

            </a>

            `;

        } else {

            preview.innerHTML =

            "<p>No Design Uploaded</p>";

        }

    }

}

// ======================================
// AUTO LOAD
// ======================================

loadCart();

loadCheckoutSummary();

loadSuccessPage();

// ======================================
// GLOBAL
// ======================================

window.addToCart = addToCart;

window.removeItem = removeItem;

window.clearCart = clearCart;

window.checkout = checkout;

window.placeOrder = placeOrder;