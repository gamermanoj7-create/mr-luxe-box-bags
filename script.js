// ===========================================
// MR LUXE BOX & BAGS
// PRODUCTION SCRIPT.JS
// PART 1
// FIREBASE + CART + ADD TO CART
// ===========================================

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
// CART STORAGE
// ===========================================

let cart = JSON.parse(
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
        alert("Please enter quantity.");
        return;
    }

    if(qty < 100){
        alert("Minimum Order is 100 Pieces.");
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
// GLOBAL
// ===========================================

window.addToCart = addToCart;
// ===========================================
// PART 2
// CART PAGE
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
        <div class="empty-cart">
            <h2>Your Cart Is Empty</h2>
            <p>Add products to continue.</p>
        </div>
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

    if(cart.length === 0){

        alert("Your Cart Is Empty");

        return;

    }

    window.location.href =
    "checkout.html";

}

// ===========================================
// GLOBAL
// ===========================================

window.removeItem = removeItem;
window.clearCart = clearCart;
window.checkout = checkout;
// ===========================================
// PART 3
// CHECKOUT SUMMARY
// ===========================================

function calculateOrder(){

    let totalQuantity = 0;
    let grandTotal = 0;

    cart.forEach(item=>{

        totalQuantity +=
        Number(item.quantity);

        grandTotal +=
        Number(item.subtotal);

    });

    return{

        totalQuantity,

        grandTotal

    };

}

// ===========================================
// LOAD CHECKOUT SUMMARY
// ===========================================

function loadCheckoutSummary(){

    const totals =
    calculateOrder();

    const totalItems =
    document.getElementById("totalItems");

    const productTotal =
    document.getElementById("productTotal");

    if(totalItems){

        totalItems.textContent =
        totals.totalQuantity + " Pieces";

    }

    if(productTotal){

        productTotal.textContent =
        "₹" + totals.grandTotal;

    }

}

// ===========================================
// CUSTOMER DETAILS
// ===========================================

function getCustomerData(){

    return{

        name:
        document.getElementById("name")?.value.trim(),

        phone:
        document.getElementById("phone")?.value.trim(),

        address:
        document.getElementById("address")?.value.trim(),

        state:
        document.getElementById("state")?.value.trim(),

        pincode:
        document.getElementById("pincode")?.value.trim(),

        payment:
        document.getElementById("payment")?.value,

        note:
        document.getElementById("orderNote")?.value.trim()

    };

}

// ===========================================
// VALIDATE CUSTOMER
// ===========================================

function validateCustomer(customer){

    if(
        !customer.name ||
        !customer.phone ||
        !customer.address ||
        !customer.payment
    ){

        alert("Please fill all required details.");

        return false;

    }

    if(cart.length===0){

        alert("Your Cart Is Empty.");

        return false;

    }

    return true;

}
// ===========================================
// PART 4
// LIVE PRICE CALCULATION
// ===========================================

// Printing Price Per Piece

const PRINTING_PRICE = {

    "Plain": 0,

    "Screen Printing": 2,

    "Digital Printing": 5,

    "Foil Printing": 8,

    "UV Printing": 12

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
    (PRINTING_PRICE[printingType] || 0)
    * totalQuantity;

    return{

        printingType,

        printingCharge,

        designCharge,

        deliveryCharge

    };

}

// ===========================================
// UPDATE GRAND TOTAL
// ===========================================

function updateGrandTotal(){

    const totals =
    calculateOrder();

    const extras =
    calculateExtras(
        totals.totalQuantity
    );

    const finalGrandTotal =
        totals.grandTotal +
        extras.printingCharge +
        extras.designCharge +
        extras.deliveryCharge;

    document.getElementById("productTotal").textContent =
    "₹" + totals.grandTotal;

    document.getElementById("printingCharge").textContent =
    "₹" + extras.printingCharge;

    document.getElementById("designPrice").textContent =
    "₹" + extras.designCharge;

    document.getElementById("deliveryPrice").textContent =
    "₹" + extras.deliveryCharge;

    document.getElementById("grandTotalPrice").textContent =
    "₹" + finalGrandTotal;

}

// ===========================================
// LIVE EVENTS
// ===========================================

document
.getElementById("printingType")
?.addEventListener(
"change",
updateGrandTotal
);

document
.getElementById("designCharge")
?.addEventListener(
"change",
updateGrandTotal
);

document
.getElementById("deliveryArea")
?.addEventListener(
"change",
updateGrandTotal
);

// ===========================================
// AUTO LOAD
// ===========================================

if(
document.getElementById("grandTotalPrice")
){

    loadCheckoutSummary();

    updateGrandTotal();

}
// ===========================================
// PART 5
// CLOUDINARY UPLOAD
// ===========================================

let uploadedDesignURL = "";

// Elements

const designFile =
document.getElementById("designFile");

const previewBox =
document.getElementById("previewBox");

const uploadProgress =
document.getElementById("uploadProgress");

// ===========================================
// DESIGN UPLOAD
// ===========================================

if(designFile){

designFile.addEventListener(

"change",

async function(){

const file =
this.files[0];

if(!file){

return;

}

// ===========================================
// IMAGE PREVIEW
// ===========================================

if(file.type.startsWith("image/")){

const reader =
new FileReader();

reader.onload = function(e){

previewBox.innerHTML = `

<img
src="${e.target.result}"
style="
width:220px;
border-radius:12px;
border:2px solid gold;
margin-top:15px;
object-fit:cover;
">

`;

};

reader.readAsDataURL(file);

}else{

previewBox.innerHTML = `

<p>

📄 ${file.name}

</p>

`;

}

// ===========================================
// CLOUDINARY UPLOAD
// ===========================================

const formData =
new FormData();

formData.append(
"file",
file
);

formData.append(
"upload_preset",
UPLOAD_PRESET
);

try{

const response =
await fetch(

CLOUDINARY_URL,

{

method:"POST",

body:formData

}

);

const data =
await response.json();

if(data.secure_url){

uploadedDesignURL =
data.secure_url;

if(uploadProgress){

uploadProgress.style.width =
"100%";

}

}else{

alert("Upload Failed");

console.log(data);

}

}

catch(error){

console.error(error);

alert("Cloudinary Upload Error");

}

}

);

}
// ===========================================
// PART 6
// PLACE ORDER
// ===========================================

async function placeOrder(){

    const customer =
    getCustomerData();

    if(!validateCustomer(customer)){
        return;
    }

    const totals =
    calculateOrder();

    const extras =
    calculateExtras(
        totals.totalQuantity
    );

    const finalGrandTotal =
        totals.grandTotal +
        extras.printingCharge +
        extras.designCharge +
        extras.deliveryCharge;

    try{

        const docRef =
        await addDoc(

            collection(db,"orders"),

            {

                customerName:
                customer.name,

                phone:
                customer.phone,

                address:
                customer.address,

                state:
                customer.state,

                pincode:
                customer.pincode,

                paymentMethod:
                customer.payment,

                orderNote:
                customer.note,

                products:
                cart,

                totalQuantity:
                totals.totalQuantity,

                productTotal:
                totals.grandTotal,

                printingType:
                extras.printingType,

                printingCharge:
                extras.printingCharge,

                designCharge:
                extras.designCharge,

                deliveryCharge:
                extras.deliveryCharge,

                finalGrandTotal:
                finalGrandTotal,

                designURL:
                uploadedDesignURL,

                orderStatus:
                "Pending",

                orderDate:
                new Date()

            }

        );

        localStorage.setItem(

            "lastOrder",

            JSON.stringify({

                orderId:
                docRef.id,

                customerName:
                customer.name,

                phone:
                customer.phone,

                address:
                customer.address,

                state:
                customer.state,

                pincode:
                customer.pincode,

                paymentMethod:
                customer.payment,

                orderNote:
                customer.note,

                products:
                cart,

                totalQuantity:
                totals.totalQuantity,

                productTotal:
                totals.grandTotal,

                printingType:
                extras.printingType,

                printingCharge:
                extras.printingCharge,

                designCharge:
                extras.designCharge,

                deliveryCharge:
                extras.deliveryCharge,

                finalGrandTotal:
                finalGrandTotal,

                designURL:
                uploadedDesignURL

            })

        );

        cart = [];

        localStorage.removeItem("cart");

        window.location.href =
        "success.html";

    }

    catch(error){

        console.error(error);

        alert(
            "Order Failed\n\n" +
            error.message
        );

    }

}
// ===========================================
// PART 7
// SUCCESS PAGE
// ===========================================

function loadSuccessPage(){

    const order =
    JSON.parse(
        localStorage.getItem("lastOrder")
    );

    if(!order){
        return;
    }

    const set = (id,value)=>{

        const el =
        document.getElementById(id);

        if(el){
            el.textContent = value;
        }

    };

    // Customer Details

    set(
        "orderId",
        order.orderId
    );

    set(
        "customerName",
        order.customerName
    );

    set(
        "customerPhone",
        order.phone
    );

    set(
        "customerAddress",
        order.address
    );

    set(
        "paymentMethod",
        order.paymentMethod
    );

    set(
        "totalProducts",
        order.products.length
    );

    set(
        "totalQuantity",
        order.totalQuantity
    );

    // Price Details

    set(
        "productTotal",
        "₹" + order.productTotal
    );

    set(
        "printingType",
        order.printingType
    );

    set(
        "printingCharge",
        "₹" + order.printingCharge
    );

    set(
        "designCharge",
        "₹" + order.designCharge
    );

    set(
        "deliveryCharge",
        "₹" + order.deliveryCharge
    );

    set(
        "finalGrandTotal",
        "₹" + order.finalGrandTotal
    );

    // Design Preview

    const preview =
    document.getElementById(
        "designPreview"
    );

    if(preview){

        if(order.designURL){

            preview.innerHTML = `

            <a
            href="${order.designURL}"
            target="_blank"
            class="hero-btn">

            View Uploaded Design

            </a>

            `;

        }else{

            preview.innerHTML =
            "<p>No Design Uploaded</p>";

        }

    }

}
// ===========================================
// PART 8
// AUTO LOAD
// ===========================================

// Cart Page

if(document.getElementById("cartItems")){

    loadCart();

}

// Checkout Page

if(document.getElementById("totalItems")){

    loadCheckoutSummary();

    updateGrandTotal();

}
window.placeOrder = placeOrder;
window.addToCart = addToCart;
window.checkout = checkout;
window.removeItem = removeItem;
window.clearCart = clearCart;
