// ===========================================
// MR LUXE BOX & BAGS
// MY ORDERS
// PART 1
// ===========================================

import { db } from "./firebase.js";

import {

collection,
query,
where,
getDocs

} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ===========================================
// LOAD CUSTOMER ORDERS
// ===========================================

window.loadOrders = async function () {

const phone =
document.getElementById("phone").value.trim();

const ordersList =
document.getElementById("ordersList");

if(phone === ""){

ordersList.innerHTML = `
<p>Please enter your mobile number.</p>
`;

return;

}

ordersList.innerHTML = `
<p>Loading Orders...</p>
`;

try{

const q = query(

collection(db,"orders"),

where("phone","==",phone)

);

const snapshot =
await getDocs(q);

if(snapshot.empty){

ordersList.innerHTML = `
<h3>No Orders Found</h3>
`;

return;

}

let html = "";

snapshot.forEach((doc)=>{

const order = doc.data();

// Part 2 এখান থেকে শুরু হবে

});

ordersList.innerHTML = html;

}

catch(error){

console.error(error);

ordersList.innerHTML = `
<p>Something went wrong.</p>
`;

}

};
const status =
order.orderStatus || "Pending";

let statusColor = "#f39c12";

if(status === "Processing"){

statusColor = "#3498db";

}

if(status === "Completed"){

statusColor = "#28a745";

}

html += `

<div class="order-card">

<h3>

📦 Order ID

</h3>

<p>

${doc.id}

</p>

<p>

<b>Customer :</b>

${order.customerName || "-"}

</p>

<p>

<b>Phone :</b>

${order.phone || "-"}

</p>

<p>

<b>Address :</b>

${order.address || "-"}

</p>

<p>

<b>Payment :</b>

${order.paymentMethod || "-"}

</p>

<p>

<b>Total Quantity :</b>

${order.totalQuantity || 0}

</p>

<p>

<b>Grand Total :</b>

₹${order.finalGrandTotal || 0}

</p>

<p>

<b>Status :</b>

<span
style="
background:${statusColor};
color:#fff;
padding:6px 14px;
border-radius:20px;
font-weight:bold;
">

${status}

</span>

</p>

<hr>

`;
const status =
order.orderStatus || "Pending";

let statusColor = "#f39c12";

if(status === "Processing"){

statusColor = "#3498db";

}

if(status === "Completed"){

statusColor = "#28a745";

}

html += `

<div class="order-card">

<h3>

📦 Order ID : ${doc.id}

</h3>

<p>

<b>Customer :</b>

${order.customerName || "-"}

</p>

<p>

<b>Phone :</b>

${order.phone || "-"}

</p>

<p>

<b>Address :</b>

${order.address || "-"}

</p>

<p>

<b>Payment :</b>

${order.paymentMethod || "-"}

</p>

<p>

<b>Total Products :</b>

${order.totalProducts || 0}

</p>

<p>

<b>Total Quantity :</b>

${order.totalQuantity || 0}

</p>

<p>

<b>Grand Total :</b>

₹${order.finalGrandTotal || 0}

</p>

<p>

<b>Status :</b>

<span
style="
background:${statusColor};
color:#fff;
padding:6px 14px;
border-radius:20px;
font-weight:bold;
">

${status}

</span>

</p>

<h3>

Products

</h3>

${(order.products || []).map(product => `

<div class="product-item">

<p>

<b>Product :</b>

${product.name}

</p>

<p>

<b>Price :</b>

₹${product.price}

</p>

<p>

<b>Quantity :</b>

${product.quantity}

</p>

<p>

<b>Subtotal :</b>

₹${product.subtotal}

</p>

</div>

`).join("")}

<hr>

</div>

`;