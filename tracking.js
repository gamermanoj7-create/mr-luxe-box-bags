// ===========================================
// MR LUXE BOX & BAGS
// TRACK ORDER
// PART 2
// ===========================================

import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ===========================================
// TRACK ORDER
// ===========================================

async function trackOrder(){

    const orderId =
    document.getElementById("orderId")
    .value.trim();

    const result =
    document.getElementById("trackingResult");

    if(orderId===""){

        alert("Please Enter Order ID");

        return;

    }

    result.innerHTML =
    "<h3>Searching...</h3>";

    try{

        const snapshot =
        await getDocs(
            collection(db,"orders")
        );

        let found = false;

        snapshot.forEach((docSnap)=>{

            if(docSnap.id===orderId){

                const order =
                docSnap.data();

                found = true;

                result.innerHTML = `
                <div class="order-card">

                <h2>Order Found ✅</h2>

                <p><b>Order ID:</b> ${docSnap.id}</p>

                <p><b>Customer:</b> ${order.customerName}</p>

                <p><b>Phone:</b> ${order.phone}</p>

                <p><b>Status:</b> ${order.orderStatus}</p>

                <p><b>Payment:</b> ${order.paymentMethod}</p>

                <p><b>Total Products:</b>
                ${(order.products || []).length}
                </p>

                <p><b>Total Quantity:</b>
                ${order.totalQuantity}
                </p>

                <p><b>Grand Total:</b>
                ₹${order.finalGrandTotal || 0}
                </p>

                </div>
                `;
            }

        });

        if(!found){

            result.innerHTML = `
            <div class="order-card">

            <h2>❌ Order Not Found</h2>

            <p>
            Please check your Order ID.
            </p>

            </div>
            `;

        }

    }

    catch(error){

        console.error(error);

        result.innerHTML = `
        <div class="order-card">

        <h2>Error</h2>

        <p>${error.message}</p>

        </div>
        `;

    }

}

window.trackOrder = trackOrder;
result.innerHTML = `

<div class="order-card">

<h2>✅ Order Found</h2>

<p><b>Order ID:</b> ${docSnap.id}</p>

<p><b>Customer:</b> ${order.customerName}</p>

<p><b>Phone:</b> ${order.phone}</p>

<p><b>Address:</b> ${order.address}</p>

<p><b>State:</b> ${order.state}</p>

<p><b>PIN Code:</b> ${order.pincode}</p>

<p><b>Payment:</b> ${order.paymentMethod}</p>

<p><b>Additional Note:</b>
${order.orderNote || "No Note"}
</p>

<p><b>Total Products:</b>
${(order.products || []).length}
</p>

<p><b>Total Quantity:</b>
${order.totalQuantity}
</p>

<p><b>Grand Total:</b>
₹${order.finalGrandTotal || 0}
</p>

<p><b>Order Status:</b></p>

<div class="tracking-status">

<div class="${
order.orderStatus === "Pending" ||
order.orderStatus === "Processing" ||
order.orderStatus === "Completed"
? "status-active" : ""
}">
Pending
</div>

<div class="${
order.orderStatus === "Processing" ||
order.orderStatus === "Completed"
? "status-active" : ""
}">
Processing
</div>

<div class="${
order.orderStatus === "Completed"
? "status-active" : ""
}">
Completed
</div>

</div>

${
order.designURL
? `
<a href="${order.designURL}"
target="_blank"
class="hero-btn">
🎨 View Uploaded Design
</a>
`
: ""
}

</div>

`;