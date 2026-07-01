// ===========================================
// FIREBASE
// ===========================================

import { db } from "./firebase.js";

import {
    collection,
    addDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ===========================================
// CLOUDINARY
// ===========================================

const CLOUD_NAME = "nx1dc1j1";
const UPLOAD_PRESET = "mr_luxe_upload";

const CLOUDINARY_URL =
`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

// ===========================================
// CART
// ===========================================

let cart =
JSON.parse(
    localStorage.getItem("cart")
) || [];

// ===========================================
// SAVE CART
// ===========================================

function saveCart(){

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

}

// ===========================================
// ADD TO CART
// ===========================================

function addToCart(
    productName,
    price,
    qty
){
    qty = Number(qty);

    if(isNaN(qty)){
        alert("Enter Quantity");
        return;
    }

    if(qty < 100){
        alert("Minimum Order 100 Pieces");
        return;
    }

    if(qty % 100 !== 0){
        alert("Quantity must be 100, 200, 300...");
        return;
    }

    const item = {

        name: productName,

        price: Number(price),

        quantity: qty,

        subtotal: Number(price) * qty

    };

cart.push(item);

saveCart();

window.location.href = "cart.html";
}

// ===========================================
// LOAD CART
// ===========================================

function loadCart(){

    const cartContainer =
    document.getElementById("cartItems");

    const total =
    document.getElementById("total");

    if(!cartContainer || !total){
        return;
    }

    cartContainer.innerHTML = "";

    let grandTotal = 0;

    if(cart.length === 0){

        cartContainer.innerHTML = `
        <h2>Your Cart Is Empty</h2>
        `;

        total.textContent = "₹0";

        return;

    }

    cart.forEach((item,index)=>{

        grandTotal += Number(item.subtotal);

        cartContainer.innerHTML += `

        <div class="cart-item">

            <h2>${item.name}</h2>

            <p><b>Price :</b> ₹${item.price}</p>

            <p><b>Quantity :</b> ${item.quantity}</p>

            <p><b>Subtotal :</b> ₹${item.subtotal}</p>

            <button
            onclick="removeItem(${index})">

            Remove

            </button>

        </div>

        `;

    });

    total.textContent =
    "₹" + grandTotal;

}

// ===========================================
// REMOVE ITEM
// ===========================================

function removeItem(index){

    cart.splice(index,1);

    saveCart();

    loadCart();

}

// ===========================================
// CLEAR CART
// ===========================================

function clearCart(){

    if(!confirm("Clear Cart?")){
        return;
    }

    cart = [];

    saveCart();

    loadCart();

}

// ===========================================
// CHECKOUT
// ===========================================

function checkout(){

    if(cart.length===0){

        alert("Your Cart Is Empty");

        return;

    }

    window.location.href =
    "checkout.html";

}

// ===========================================
// GLOBAL
// ===========================================

window.addToCart = addToCart;
window.removeItem = removeItem;
window.clearCart = clearCart;
window.checkout = checkout;

// ===========================================
// AUTO LOAD
// ===========================================

if (document.getElementById("cartItems")) {
    loadCart();
}

if (document.getElementById("totalItems")) {
    loadCheckoutSummary();

    if (typeof updateGrandTotal === "function") {
        updateGrandTotal();
    }
}

if (document.getElementById("orderId")) {
    loadSuccessPage();
}

// ===========================================
// GLOBAL FUNCTIONS
// ===========================================
// ===========================================
// PRICE SETTINGS
// ===========================================

const PRINTING_PRICE = {
    "Plain": 0,
    "Screen Printing": 2,
    "Digital Printing": 5,
    "Foil Printing": 8,
    "UV Printing": 12
};

const DELIVERY_PRICE = {
    "0": 0,
    "100": 100,
    "250": 250,
    "350": 350,
    "600": 600
};

// ===========================================
// CALCULATE EXTRA CHARGES
// ===========================================

function calculateExtras(totalQuantity){

    const printingType =
    document.getElementById("printingType")?.value || "Plain";

    const designCharge =
    Number(
        document.getElementById("designCharge")?.value || 0
    );

    const deliveryCharge =
    Number(
        document.getElementById("deliveryArea")?.value || 0
    );

    const printingCharge =
    (PRINTING_PRICE[printingType] || 0) * totalQuantity;

    return{

        printingType,

        printingCharge,

        designCharge,

        deliveryCharge

    };

}
// ===========================================
// LIVE PRICE CALCULATION
// ===========================================

function updateGrandTotal(){

    const totals =
    calculateOrder();

    const extras =
    calculateExtras(
        totals.totalQuantity
    );

    const productTotal =
    totals.grandTotal;

    const finalTotal =
    productTotal +
    extras.printingCharge +
    extras.designCharge +
    extras.deliveryCharge;

    // Product Total
    const productEl =
    document.getElementById("productTotal");

    if(productEl){

        productEl.textContent =
        "₹" + productTotal;

    }

    // Printing Charge
    const printEl =
    document.getElementById("printingCharge");

    if(printEl){

        printEl.textContent =
        "₹" + extras.printingCharge;

    }

    // Design Charge
    const designEl =
    document.getElementById("designPrice");

    if(designEl){

        designEl.textContent =
        "₹" + extras.designCharge;

    }

    // Delivery Charge
    const deliveryEl =
    document.getElementById("deliveryPrice");

    if(deliveryEl){

        deliveryEl.textContent =
        "₹" + extras.deliveryCharge;

    }

    // Grand Total
    const grandEl =
    document.getElementById("grandTotalPrice");

    if(grandEl){

        grandEl.textContent =
        "₹" + finalTotal;

    }

}
// ===========================================
// PART 3
// LIVE EVENTS
// ===========================================

const printingType =
document.getElementById("printingType");

const designCharge =
document.getElementById("designCharge");

const deliveryArea =
document.getElementById("deliveryArea");

// Printing Change

if(printingType){

    printingType.addEventListener(

        "change",

        updateGrandTotal

    );

}

// Design Change

if(designCharge){

    designCharge.addEventListener(

        "change",

        updateGrandTotal

    );

}

// Delivery Change

if(deliveryArea){

    deliveryArea.addEventListener(

        "change",

        updateGrandTotal

    );

}

// ===========================================
// AUTO LOAD
// ===========================================
if (
    document.getElementById("grandTotalPrice") &&
    typeof calculateOrder === "function"
) {
    updateGrandTotal();
}

// ===========================================
// PLACE ORDER
// ===========================================

async function placeOrder() {

    const customer = getCustomerData();

    if (!validateCustomer(customer)) {
        return;
    }

    const totals = calculateOrder();

    const extras = calculateExtras(
        totals.totalQuantity
    );

    const finalGrandTotal =
        totals.grandTotal +
        extras.printingCharge +
        extras.designCharge +
        extras.deliveryCharge;

    try {

        const docRef = await addDoc(

            collection(db, "orders"),

            {

                customerName: customer.name,

                phone: customer.phone,

                address: customer.address,

                state: customer.state,

                pincode: customer.pincode,

                paymentMethod: customer.payment,

                products: cart,

                totalQuantity: totals.totalQuantity,

                productTotal: totals.grandTotal,

                printingType: extras.printingType,

                printingCharge: extras.printingCharge,

                designCharge: extras.designCharge,

                deliveryCharge: extras.deliveryCharge,

                finalGrandTotal: finalGrandTotal,

                designURL: uploadedDesignURL,

                orderStatus: "Pending",

                orderDate: new Date()
            }

        );

        localStorage.setItem(

            "lastOrder",

            JSON.stringify({

                orderId: docRef.id,

                customerName: customer.name,

                phone: customer.phone,

                address: customer.address,

                state: customer.state,

                pincode: customer.pincode,

                paymentMethod: customer.payment,

                products: cart,

                totalQuantity: totals.totalQuantity,

                productTotal: totals.grandTotal,

                printingType: extras.printingType,

                printingCharge: extras.printingCharge,

                designCharge: extras.designCharge,

                deliveryCharge: extras.deliveryCharge,

                finalGrandTotal: finalGrandTotal,

                designURL: uploadedDesignURL

            })

        );

        // Clear Cart

        cart = [];

        localStorage.removeItem("cart");

        // Success Page

        window.location.href = "success.html";

    }

    catch(error){

        console.error(error);

        alert(

            "Order Failed\n\n" +

            error.message

        );

    }

}