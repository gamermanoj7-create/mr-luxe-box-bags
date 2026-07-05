// ===========================================
// MR LUXE BOX & BAGS
// SCRIPT V5 - PART 1
// ===========================================
import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { db } from "./firebase.js";



// ===========================================
// GLOBAL VARIABLES
// ===========================================

const ordersRef = collection(db, "orders");

let cart = JSON.parse(
    localStorage.getItem("cart")
) || [];
// ===========================================
// DESIGN UPLOAD (CLOUDINARY)
// ===========================================

let designURL = "";
let uploadCompleted = false;

const designInput = document.getElementById("designFile");

const progressBar =
document.getElementById("uploadProgress");
if (designInput) {

designInput.addEventListener("change", function (e) {

const file = e.target.files[0];

if (!file) return;

uploadCompleted = false;

if (progressBar) {

progressBar.style.width = "0%";

progressBar.innerHTML = "0%";

}

const formData = new FormData();

formData.append("file", file);

formData.append("upload_preset", "mr_luxe_upload");

const xhr = new XMLHttpRequest();

xhr.open(
"POST",
"https://api.cloudinary.com/v1_1/nx1dc1j1/image/upload"
);
xhr.upload.onprogress = function (event) {

    if (event.lengthComputable) {

        const percent = Math.round(
            (event.loaded / event.total) * 100
        );

        if (progressBar) {

            progressBar.style.width = percent + "%";

            progressBar.innerHTML = percent + "%";

        }

    }

};

xhr.onload = function () {

    if (xhr.status === 200) {

        const data = JSON.parse(xhr.responseText);

        designURL = data.secure_url;

        uploadCompleted = true;

        if (progressBar) {

            progressBar.style.width = "100%";

            progressBar.innerHTML = "100%";

        }

        alert("Design Uploaded Successfully");

    } else {

        alert("Upload Failed");

    }

};
xhr.onerror = function () {

    alert("Upload Failed. Please try again.");

    uploadCompleted = false;

};

xhr.send(formData);

});

}

// ===========================================
// SAVE CART
// ===========================================

function saveCart() {

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

}

// ===========================================
// UPDATE CART COUNT
// ===========================================

function updateCartCount() {

    const badge =
        document.getElementById("cartCount");

    if (!badge) return;

    let total = 0;

    cart.forEach(item => {

        total += Number(item.quantity || 0);

    });

    badge.textContent = total;

}

// ===========================================
// GRAND TOTAL
// ===========================================

function getGrandTotal() {

    return cart.reduce((sum, item) => {

        return sum + Number(item.subtotal || 0);

    }, 0);

}

// ===========================================
// INITIAL LOAD
// ===========================================

updateCartCount();
// ===========================================
// CART FUNCTIONS
// ===========================================

window.addToCart = function(name, price, quantity = 100) {

    quantity = Number(quantity);

    const index = cart.findIndex(item => item.name === name);

    if (index >= 0) {

        cart[index].quantity += quantity;
        cart[index].subtotal =
            cart[index].quantity * cart[index].price;

    } else {

        cart.push({
            name: name,
            price: Number(price),
            quantity: quantity,
            subtotal: Number(price) * quantity
        });

    }

    saveCart();
    updateCartCount();
window.location.href = "cart.html";
};

// ===========================================
// CHANGE QUANTITY
// ===========================================

window.changeQty = function (index, change) {

    cart[index].quantity += change;

    if (cart[index].quantity <= 0) {

        cart.splice(index, 1);

    } else {

        cart[index].subtotal =
            cart[index].quantity *
            cart[index].price;

    }

    saveCart();

    loadCart();

};

// ===========================================
// REMOVE ITEM
// ===========================================

window.removeCartItem = function (index) {

    cart.splice(index, 1);

    saveCart();

    loadCart();

};

// ===========================================
// CLEAR CART
// ===========================================

window.clearCart = function () {

    if (!confirm("Clear Cart?")) return;

    cart = [];

    saveCart();

    loadCart();

};

// ===========================================
// LOAD CART
// ===========================================

window.loadCart = function () {

    const cartItems =
        document.getElementById("cartItems");

    const grandTotal =
        document.getElementById("grandTotal");

    if (!cartItems) return;

    if (cart.length === 0) {

        cartItems.innerHTML =
            "<h2>Your Cart is Empty</h2>";

        if (grandTotal) {

            grandTotal.textContent = "₹0";

        }

        updateCartCount();

        return;

    }

    let html = "";

    cart.forEach((item, index) => {

        html += `
        <div class="cart-card">
            <div class="cart-info">

                <h3>${item.name}</h3>

                <p>Price : ₹${item.price}</p>

                <p>
                    Qty :
                   <button class="minus-btn" onclick="changeQty(${index},-1)">-</button>

${item.quantity}

<button class="plus-btn" onclick="changeQty(${index},1)">+</button>
                </p>

                <p>Total : ₹${item.subtotal}</p>

                <button
                onclick="removeCartItem(${index})">

                Remove

                </button>

            </div>

        </div>
        `;

    });

    cartItems.innerHTML = html;

    if (grandTotal) {

        grandTotal.textContent =
            "₹" + getGrandTotal();

    }

    updateCartCount();

};

loadCart();
// ===========================================
// CHECKOUT SUMMARY
// ===========================================

window.updateOrderSummary = function () {

    const totalItems = document.getElementById("totalItems");
    const productTotal = document.getElementById("productTotal");
    const designPrice = document.getElementById("designPrice");
    const deliveryPrice = document.getElementById("deliveryPrice");
    const grandTotalPrice = document.getElementById("grandTotalPrice");

    if (!totalItems) return;

    const items = cart.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
    );

    const productsTotal = getGrandTotal();

    const designCharge =
        Number(document.getElementById("designCharge")?.value || 0);

    const deliveryCharge =
        Number(document.getElementById("deliveryArea")?.value || 0);

    const grand =
        productsTotal +
        designCharge +
        deliveryCharge;

    totalItems.textContent = items;
    productTotal.textContent = "₹" + productsTotal;
    designPrice.textContent = "₹" + designCharge;
    deliveryPrice.textContent = "₹" + deliveryCharge;
    grandTotalPrice.textContent = "₹" + grand;

};

// ===========================================
// AUTO UPDATE SUMMARY
// ===========================================

document.getElementById("designCharge")
    ?.addEventListener("change", updateOrderSummary);

document.getElementById("deliveryArea")
    ?.addEventListener("change", updateOrderSummary);

updateOrderSummary();

// ===========================================
// PLACE ORDER (START)
// ===========================================

window.placeOrder = async function () {
const fileInput = document.getElementById("designFile");

if (
    fileInput &&
    fileInput.files.length > 0 &&
    !uploadCompleted
) {

    alert("Please wait. Design upload is not completed.");

    return;

}
    const customerName =
        document.getElementById("name").value.trim();

    const phone =
        document.getElementById("phone").value.trim();

    const address =
        document.getElementById("address").value.trim();

    const state =
        document.getElementById("state").value.trim();

    const pincode =
        document.getElementById("pincode").value.trim();

    const paymentMethod =
        document.getElementById("payment").value;

    const printingType =
        document.getElementById("printingType").value;

    const designCharge =
        Number(document.getElementById("designCharge").value);

    const deliveryCharge =
        Number(document.getElementById("deliveryArea").value);

    const orderNote =
        document.getElementById("orderNote").value.trim();

    if (!customerName || !phone || !address) {

        alert("Please fill all required fields.");

        return;

    }

    if (cart.length === 0) {

        alert("Your cart is empty.");

        return;

    }

    const totalQuantity =
        cart.reduce(
            (sum, item) => sum + item.quantity,
            0
        );

    const productTotal = getGrandTotal();

    const finalGrandTotal =
        productTotal +
        designCharge +
        deliveryCharge;
            try {

        const docRef = await addDoc(ordersRef, {

            customerName,
            phone,
            address,
            state,
            pincode,

            paymentMethod,
            printingType,

            designCharge,
            deliveryCharge,

            orderNote,
designURL,
            products: cart,

            totalProducts: cart.length,
            totalQuantity,

            productTotal,
            finalGrandTotal,

            orderStatus: "Pending",

            orderDate: serverTimestamp()

        });

        const orderData = {

            orderId: docRef.id,
            invoiceNumber:
                "INV-" +
                new Date().toISOString().slice(0,10).replace(/-/g,"") +
                "-" +
                Math.floor(Math.random() * 9000 + 1000),

            customerName,
            phone,
            address,
            state,
            pincode,

            paymentMethod,
            printingType,

            designCharge,
            deliveryCharge,

            orderNote,
designURL,
            products: cart,

            totalProducts: cart.length,
            totalQuantity,

            productTotal,
            finalGrandTotal,

            orderStatus: "Pending"

        };

        localStorage.setItem(
            "lastOrder",
            JSON.stringify(orderData)
        );

        cart = [];
        saveCart();

        window.location.href = "success.html";

    } catch (error) {

        console.error(error);

        alert(
            "Order could not be placed.\n\n" +
            error.message
        );

    }

};