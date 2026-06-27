// CART
let cart = JSON.parse(localStorage.getItem("cart")) || [];

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
function placeOrder(){

let name=document.getElementById("name").value;
let phone=document.getElementById("phone").value;
let address=document.getElementById("address").value;
let payment=document.getElementById("payment").value;

if(name==""||phone==""||address==""){

alert("Fill all details");

return;

}

let message="🛍️ New Order%0A%0A";

message+="👤 Name : "+name+"%0A";

message+="📞 Phone : "+phone+"%0A";

message+="📍 Address : "+address+"%0A";

message+="💳 Payment : "+payment+"%0A%0A";

let total=0;

cart.forEach(function(item){

message+="• "+item.name+" - ₹"+item.price+"%0A";

total+=item.price;

});

message+="%0A💰 Total : ₹"+total;

localStorage.removeItem("cart");

window.open(
"https://wa.me/917029714746?text="+message,
"_blank"
);

setTimeout(function(){

window.location="success.html";

},1000);

}

loadCart();