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
<h3>Loading Orders...</h3>
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

<h2>

📦 Order ID

</h2>

<p>

${doc.id}

</p>

<p>

<b>Customer :</b>

${order.customerName || "-"}

</p>

<p>

<b>Mobile :</b>

${order.phone || "-"}

</p>

<p>

<b>Delivery Address :</b>

${order.address || "-"}

</p>

<p>

<b>Payment Method :</b>

${order.paymentMethod || "-"}

</p>

<p>

<b>Total Products :</b>

${order.products ? order.products.length : 0}

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

🛍 Products

</h3>
${(order.products || []).map(product => `

<div class="product-item">

<p>

<b>📦 Product :</b>

${product.name}

</p>

<p>

<b>💰 Price :</b>

₹${product.price}

</p>

<p>

<b>🔢 Quantity :</b>

${product.quantity}

</p>

<p>

<b>🧾 Subtotal :</b>

₹${product.subtotal}

</p>

</div>

`).join("")}

<p>

<b>📝 Additional Note :</b>

${order.orderNote || "No Note"}

</p>

<p>

<b>📅 Order Date :</b>

${order.orderDate
? new Date(order.orderDate.seconds * 1000).toLocaleString()
: "N/A"}

</p>

</div>

`;

});

ordersList.innerHTML = html;

}

catch(error){

console.error(error);

ordersList.innerHTML = `
<h3>Something went wrong.</h3>
`;

}

};