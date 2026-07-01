// ===========================================
// MR LUXE BOX & BAGS
// PRODUCTION SCRIPT.JS
// PART 1
// ===========================================

// Firebase
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
// LOCAL STORAGE CART
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

    qty = parseInt(qty);

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

    location.href = "cart.html";

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
        <h2>Your Cart Is Empty</h2>
        `;

        total.innerHTML = "₹0";

        return;

    }

    cart.forEach((item,index)=>{

        grandTotal += item.subtotal;

        cartContainer.innerHTML += `

        <div class="cart-item">

            <h2>${item.name}</h2>

            <p>Price : ₹${item.price}</p>

            <p>Quantity : ${item.quantity}</p>

            <p>Subtotal : ₹${item.subtotal}</p>

            <button
            onclick="removeItem(${index})">

            Remove

            </button>

        </div>

        `;

    });

    total.innerHTML = "₹" + grandTotal;

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

    location.href = "checkout.html";

}

// ===========================================
// GLOBAL
// ===========================================

window.removeItem = removeItem;

window.clearCart = clearCart;

window.checkout = checkout;

// ===========================================
// PART 3
// CHECKOUT SUMMARY + VALIDATION
// ===========================================

// Cloudinary Upload URL
let uploadedDesignURL = "";

// Checkout Summary
function loadCheckoutSummary(){
    const totalItems =
    document.getElementById("totalItems");

    const totalPrice =
    document.getElementById("totalPrice");

    if(!totalItems || !totalPrice){

        return;

    }

    let totalQty = 0;

    let grandTotal = 0;

    cart.forEach(item=>{

        totalQty += Number(item.quantity);

        grandTotal += Number(item.subtotal);

    });

    totalItems.innerHTML =
    totalQty + " Pieces";

    totalPrice.innerHTML =
    "₹" + grandTotal;

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
        document.getElementById("payment")?.value

    };

}

// ===========================================
// VALIDATION
// ===========================================

function validateCustomer(data){

    if(
        !data.name ||
        !data.phone ||
        !data.address ||
        !data.payment
    ){

        alert("Please fill all details.");

        return false;

    }

    if(cart.length===0){

        alert("Cart is Empty.");

        return false;

    }

    return true;

}

// ===========================================
// TOTAL CALCULATION
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
// PART 4
// CLOUDINARY UPLOAD + PREVIEW
// ===========================================

const designFile =
document.getElementById("designFile");

const previewBox =
document.getElementById("previewBox");

const progressBar =
document.getElementById("uploadProgress");

// Auto Preview

if(designFile){

designFile.addEventListener(

"change",

async function(){

const file =
this.files[0];

if(!file) return;

// Image Preview

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

// Upload

const formData =
new FormData();

formData.append("file",file);

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

if(progressBar){

progressBar.style.width="100%";

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
// PART 5
// PLACE ORDER + SUCCESS
// ===========================================

async function placeOrder(){

    const customer =
    getCustomerData();

    if(!validateCustomer(customer)){

        return;

    }

    const totals =
    calculateOrder();

    try{

        const docRef = await addDoc(

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

                products:cart,

                totalQuantity:
                totals.totalQuantity,

                grandTotal:
                totals.grandTotal,

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

                paymentMethod:
                customer.payment,

                products:
                cart,

                totalQuantity:
                totals.totalQuantity,

                grandTotal:
                totals.grandTotal,

                designURL:
                uploadedDesignURL

            })

        );

        localStorage.removeItem("cart");

        window.location.href = "success.html";

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
// SUCCESS PAGE
// ===========================================

function loadSuccessPage(){

    const order = JSON.parse(
        localStorage.getItem("lastOrder")
    );

    if(!order) return;

    const set=(id,value)=>{

        const el =
        document.getElementById(id);

        if(el){

            el.textContent=value;

        }

    };

    set("orderId",order.orderId);

    set("customerName",order.customerName);

    set("customerPhone",order.phone);

    set("customerAddress",order.address);

    set("paymentMethod",order.paymentMethod);

    set("totalProducts",
        order.products.length);

    set("totalQuantity",
        order.totalQuantity);

    set("grandTotal",
        "₹"+order.grandTotal);

    const preview =
    document.getElementById(
        "designPreview"
    );

    if(preview){

        if(order.designURL){

            preview.innerHTML=`

            <a
            href="${order.designURL}"
            target="_blank"
            class="hero-btn">

            View Uploaded Design

            </a>

            `;

        }else{

            preview.innerHTML=
            "<p>No Design Uploaded</p>";

        }

    }

}

// ===========================================
// AUTO LOAD
// ===========================================
if (document.getElementById("totalItems")) {
    loadCheckoutSummary();
}

if (document.getElementById("orderId")) {
    loadSuccessPage();
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
}

if (document.getElementById("orderId")) {
    loadSuccessPage();
}
window.placeOrder = placeOrder;