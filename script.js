import { app } from "./firebase.js";

import {
  getFirestore,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const db = getFirestore(app);

//CART
let cart = 
JSON.parse(localStorage.getItem("cart")) || [];

// ADD TO CART
function addToCart(name, price) {

    cart.push({
        name: name,
        price: price
    });

    localStorage.setItem("cart", JSON.stringify(cart));

    alert(name + " Added to Cart");
}

// SHOW CART
function loadCart() {

    let cartItems = document.getElementById("cartItems");
    let total = document.getElementById("total");

    if (!cartItems) return;

    cartItems.innerHTML = "";

    let grandTotal = 0;

    cart.forEach(function(item, index) {

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

// REMOVE
function removeItem(index){

cart.splice(index,1);

localStorage.setItem("cart",JSON.stringify(cart));

loadCart();

}

// CLEAR
function clearCart(){

localStorage.removeItem("cart");

cart=[];

loadCart();

}

// PLACE ORDER
async function placeOrder() {

let name=document.getElementById("name").value;
let phone=document.getElementById("phone").value;
let address=document.getElementById("address").value;
let payment=document.getElementById("payment").value;

if(name==""||phone==""||address==""){

alert("Fill all details");

return;

}

let total = 0;

cart.forEach(function(item){
    total += item.price;
});

try {

    await addDoc(collection(db, "orders"), {
        name: name,
        phone: phone,
        address: address,
        payment: payment,
        items: cart,
        total: total,
        date: new Date()
    });

    localStorage.removeItem("cart");
    cart = [];

    alert("Order Placed Successfully!");

    window.location = "success.html";

} catch (err) {

    alert("Error: " + err.message);

}