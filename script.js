import { db, storage } from "./firebase.js";

import {
    collection,
    addDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

// =============================
// MR LUXE BOX & BAGS
// PART 1
// CART
// =============================

let cart = JSON.parse(localStorage.getItem("cart")) || [];

// =============================
// SAVE CART
// =============================

function saveCart(){

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

}

// =============================
// ADD TO CART
// =============================

function addToCart(name, price, quantity){

    quantity = parseInt(quantity);

    if(isNaN(quantity) || quantity < 100){

        alert("Minimum Order Quantity is 100.");

        return;

    }

    const subtotal = price * quantity;

    cart.push({

        name,
        price,
        quantity,
        subtotal

    });

    saveCart();

    window.location.href = "cart.html";

}

// =============================
// GLOBAL
// =============================

window.addToCart = addToCart;
// =============================
// PART 2
// LOAD CART
// =============================

function loadCart(){

    const cartItems = document.getElementById("cartItems");
    const total = document.getElementById("total");

    if(!cartItems || !total){
        return;
    }

    cartItems.innerHTML = "";

    let grandTotal = 0;

    if(cart.length === 0){

        cartItems.innerHTML = `
        <h3>Your Cart Is Empty</h3>
        `;

        total.textContent = "₹0";

        return;

    }

    cart.forEach((item,index)=>{

        grandTotal += item.subtotal;

        cartItems.innerHTML += `

        <div class="cart-item">

            <h2>${item.name}</h2>

            <p><strong>Price:</strong> ₹${item.price}</p>

            <p><strong>Quantity:</strong> ${item.quantity} Pieces</p>

            <p><strong>Subtotal:</strong> ₹${item.subtotal}</p>

            <button onclick="removeItem(${index})">
                Remove
            </button>

        </div>

        `;

    });

    total.textContent = "₹" + grandTotal;

}

// =============================
// REMOVE ITEM
// =============================

function removeItem(index){

    cart.splice(index,1);

    saveCart();

    loadCart();

}

// =============================
// CLEAR CART
// =============================

function clearCart(){

    if(!confirm("Clear all products from cart?")){
        return;
    }

    cart = [];

    localStorage.removeItem("cart");

    loadCart();

}

// =============================
// GLOBAL
// =============================

window.removeItem = removeItem;
window.clearCart = clearCart;

// Auto Load Cart
loadCart();
// =============================
// PART 3
// FILE UPLOAD
// =============================

import {
    ref,
    uploadBytesResumable,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

// Upload File
async function uploadDesignFile(){

    const fileInput = document.getElementById("designFile");

    if(!fileInput || fileInput.files.length === 0){
        return "";
    }

    const file = fileInput.files[0];

    // Max 20MB
    if(file.size > 20 * 1024 * 1024){

        alert("Maximum File Size is 20MB");

        return "";

    }

    const allowed = [

        "image/jpeg",
        "image/png",
        "application/pdf"

    ];

    // AI / CDR support by extension
    const extension = file.name.split(".").pop().toLowerCase();

    if(
        !allowed.includes(file.type) &&
        extension !== "ai" &&
        extension !== "cdr"
    ){

        alert("Only JPG, PNG, PDF, AI and CDR files are allowed.");

        return "";

    }

    // Image Preview
    const preview = document.getElementById("previewBox");

    if(preview){

        preview.innerHTML = "";

        if(file.type.startsWith("image/")){

            const img = document.createElement("img");

            img.src = URL.createObjectURL(file);

            img.style.maxWidth = "200px";
            img.style.borderRadius = "10px";

            preview.appendChild(img);

        }else{

            preview.innerHTML =
            "<p>📄 " + file.name + "</p>";

        }

    }

    const storageRef = ref(

        storage,

        "custom-designs/" +
        Date.now() +
        "_" +
        file.name

    );

    const uploadTask =
    uploadBytesResumable(storageRef,file);

    return new Promise((resolve,reject)=>{

        uploadTask.on(

            "state_changed",

            (snapshot)=>{

                const progress =

                (snapshot.bytesTransferred /
                snapshot.totalBytes) * 100;

                const progressBar =
                document.getElementById("uploadProgress");

                if(progressBar){

                    progressBar.style.width =
                    progress + "%";

                }

            },

            (error)=>{

                reject(error);

            },

            async()=>{

                const url =
                await getDownloadURL(
                    uploadTask.snapshot.ref
                );

                resolve(url);

            }

        );

    });

}
// =============================
// PART 4
// PLACE ORDER
// =============================

async function placeOrder(){

    const name =
    document.getElementById("name")?.value.trim();

    const phone =
    document.getElementById("phone")?.value.trim();

    const address =
    document.getElementById("address")?.value.trim();

    const payment =
    document.getElementById("payment")?.value;

    if(!name || !phone || !address || !payment){

        alert("Please fill all details.");

        return;

    }

    if(cart.length===0){

        alert("Your cart is empty.");

        return;

    }

    // Upload Design File
    const designURL =
    await uploadDesignFile();

    let totalAmount=0;
    let totalQuantity=0;

    cart.forEach(item=>{

        totalAmount+=item.subtotal;

        totalQuantity+=item.quantity;

    });

    const order={

        customerName:name,

        phone:phone,

        address:address,

        payment:payment,

        products:cart,

        totalQuantity:totalQuantity,

        totalAmount:totalAmount,

        designURL:designURL,

        orderStatus:"Pending",

        createdAt:new Date().toISOString()

    };

    try{

        const docRef=await addDoc(

            collection(db,"orders"),

            order

        );

        order.orderId=docRef.id;

        localStorage.setItem(

            "lastOrder",

            JSON.stringify(order)

        );

        cart=[];

        localStorage.removeItem("cart");

        window.location.href="success.html";

    }

    catch(error){

        alert(

            "Order Save Failed\n\n"+

            error.message

        );

    }

}

// =============================
// GLOBAL
// =============================

window.placeOrder=placeOrder;
// =============================
// PART 5
// CHECKOUT SUMMARY
// SUCCESS PAGE
// =============================

// Checkout Summary
function loadCheckoutSummary(){

    const totalItems =
    document.getElementById("totalItems");

    const totalPrice =
    document.getElementById("totalPrice");

    if(!totalItems || !totalPrice){
        return;
    }

    let pieces = 0;
    let amount = 0;

    cart.forEach(item=>{

        pieces += item.quantity;

        amount += item.subtotal;

    });

    totalItems.textContent =
    pieces + " Pieces";

    totalPrice.textContent =
    "₹" + amount;

}

// Success Page

function loadSuccessPage(){

    const order = JSON.parse(

        localStorage.getItem("lastOrder")

    );

    if(!order) return;

    const set=(id,value)=>{

        const el=document.getElementById(id);

        if(el) el.textContent=value;

    };

    set("orderId",order.orderId || "-");

    set("customerName",order.customerName);

    set("customerPhone",order.phone);

    set("customerAddress",order.address);

    set("paymentMethod",order.payment);

    set("totalProducts",order.products.length);

    set("totalQuantity",order.totalQuantity);

    set("grandTotal","₹"+order.totalAmount);

    // Uploaded Design

    const preview =

    document.getElementById("designPreview");

    if(preview && order.designURL){

        preview.innerHTML = `

        <a href="${order.designURL}"

        target="_blank">

        View / Download Design

        </a>

        `;

    }

}

// Auto Run

loadCart();

loadCheckoutSummary();

loadSuccessPage();