// ===========================================
// MR LUXE BOX & BAGS
// ADMIN PANEL
// PART 1
// ===========================================

import { auth, db } from "./firebase.js";

import {
    collection,
    getDocs,
    deleteDoc,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// ===========================================
// SETTINGS
// ===========================================

const ADMIN_EMAIL = "gamermanoj7@gmail.com";

const ordersRef = collection(db, "orders");

// ===========================================
// SECURITY
// ===========================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    if (user.email !== ADMIN_EMAIL) {

        alert("Access Denied");

        signOut(auth);

        window.location.href = "index.html";

        return;

    }

    console.log("Admin Login Success");

    initializeAdmin();

});

// ===========================================
// LOGOUT
// ===========================================

const logoutBtn =
document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        await signOut(auth);

        window.location.href = "login.html";

    });

}

// ===========================================
// REFRESH
// ===========================================

const refreshBtn =
document.getElementById("refreshBtn");

if (refreshBtn) {

    refreshBtn.addEventListener("click", () => {

        initializeAdmin();

    });

}
// ===========================================
// PART 2
// LOAD ORDERS
// ===========================================

async function loadOrders() {

    const container =
    document.getElementById("ordersContainer");

    if (!container) return;

    container.innerHTML =
    "<h3>Loading Orders...</h3>";

    try {

        const snapshot =
        await getDocs(ordersRef);

        container.innerHTML = "";

        if (snapshot.empty) {

            container.innerHTML = `
            <h2>No Orders Found</h2>
            `;

            return;

        }

        snapshot.forEach((docSnap) => {

            const order = docSnap.data();

            let productsHTML = "";

            (order.products || []).forEach(item => {

                productsHTML += `

                <div class="product-box">

                    <p><b>Product:</b>
                    ${item.name}</p>

                    <p><b>Price:</b>
                    ₹${item.price}</p>

                    <p><b>Qty:</b>
                    ${item.quantity}</p>

                    <p><b>Subtotal:</b>
                    ₹${item.subtotal}</p>

                </div>

                <hr>

                `;

            });

            container.innerHTML += `

            <div class="order-card">

                <h2>

                ${order.customerName}

                </h2>

                <p>

                <b>Phone:</b>

                ${order.phone}

                </p>

                <p>

                <b>Address:</b>

                ${order.address}

                </p>

                <p>

                <b>Payment:</b>

                ${order.paymentMethod}

                </p>

                <p>

                <b>Status:</b>

                ${order.orderStatus || "Pending"}

                </p>

                <p>

                <b>Total Qty:</b>

                ${order.totalQuantity}
</p>
<p>
<b>Product Total :</b>
₹${order.productTotal || order.grandTotal || 0}
</p>

<p>
<b>Printing Type :</b>
${order.printingType || "Plain"}
</p>

<p>
<b>Printing Charge :</b>
₹${order.printingCharge || 0}
</p>

<p>
<b>Design Charge :</b>
₹${order.designCharge || 0}
</p>

<p>
<b>Delivery Charge :</b>
₹${order.deliveryCharge || 0}
</p>

<p>
<b>Final Grand Total :</b>
₹${order.finalGrandTotal || order.grandTotal || 0}
</p>

                ${productsHTML}

                <div class="order-actions">

                    <button
                    onclick="viewDesign('${order.designURL || ""}')">

                    View Design

                    </button>

                    <button
                    onclick="downloadDesign('${order.designURL || ""}')">

                    Download

                    </button>

                    <button
                    onclick="updateOrderStatus('${docSnap.id}','Processing')">

                    Processing

                    </button>

                    <button
                    onclick="updateOrderStatus('${docSnap.id}','Completed')">

                    Completed

                    </button>

                    <button
                    onclick="deleteOrder('${docSnap.id}')">

                    Delete

                    </button>

                </div>

            </div>

            `;

        });

    }

    catch(error){

        console.error(error);

        container.innerHTML = `
        <h2>Error Loading Orders</h2>
        `;

    }

}
// ===========================================
// PART 3
// DESIGN + STATUS + DELETE
// ===========================================

// View Design

function viewDesign(url){

    if(!url){

        alert("No Design Uploaded");

        return;

    }

    window.open(url,"_blank");

}

// Download Design

function downloadDesign(url){

    if(!url){

        alert("No Design Uploaded");

        return;

    }

    const a=document.createElement("a");

    a.href=url;

    a.target="_blank";

    a.download="MR-Luxe-Customer-Design";

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

}

// ===========================================
// UPDATE STATUS
// ===========================================

async function updateOrderStatus(id,status){

    try{

        await updateDoc(

            doc(db,"orders",id),

            {

                orderStatus:status

            }

        );

        alert("Status Updated");

        initializeAdmin();

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

}

// ===========================================
// DELETE ORDER
// ===========================================

async function deleteOrder(id){

    const ok=confirm(

    "Delete this order?"

    );

    if(!ok) return;

    try{

        await deleteDoc(

            doc(db,"orders",id)

        );

        alert(

        "Order Deleted"

        );

        initializeAdmin();

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

}

// ===========================================
// SEARCH
// ===========================================

function searchOrders(){

    const input=document
    .getElementById("searchOrder");

    if(!input) return;

    const value=
    input.value.toLowerCase();

    const cards=
    document.querySelectorAll(".order-card");

    cards.forEach(card=>{

        if(

            card.innerText
            .toLowerCase()
            .includes(value)

        ){

            card.style.display="block";

        }

        else{

            card.style.display="none";

        }

    });

}

// ===========================================
// GLOBAL
// ===========================================

window.viewDesign=viewDesign;

window.downloadDesign=downloadDesign;

window.updateOrderStatus=
updateOrderStatus;

window.deleteOrder=
deleteOrder;

window.searchOrders=
searchOrders;
// ===========================================
// PART 4
// DASHBOARD SUMMARY
// ===========================================

async function updateDashboard() {

    try {

        const snapshot =
        await getDocs(ordersRef);

        let totalOrders = 0;
        let pendingOrders = 0;
        let processingOrders = 0;
        let completedOrders = 0;
        let totalRevenue = 0;

        snapshot.forEach((docSnap) => {

            const order = docSnap.data();

            totalOrders++;
totalRevenue += Number(
    order.finalGrandTotal ||
    order.grandTotal ||
    0
);

            switch(order.orderStatus){

                case "Processing":
                    processingOrders++;
                    break;

                case "Completed":
                    completedOrders++;
                    break;

                default:
                    pendingOrders++;

            }

        });

        document.getElementById("totalOrders").textContent =
        totalOrders;

        document.getElementById("pendingOrders").textContent =
        pendingOrders;

        document.getElementById("processingOrders").textContent =
        processingOrders;

        document.getElementById("completedOrders").textContent =
        completedOrders;

        document.getElementById("totalRevenue").textContent =
        "₹" + totalRevenue;

    }

    catch(error){

        console.error(error);

    }

}

// ===========================================
// REFRESH BUTTON
// ===========================================

function refreshOrders(){

    initializeAdmin();

}

window.refreshOrders = refreshOrders;

// ===========================================
// FILTER ORDERS
// ===========================================

function filterOrders(status){

    const cards =
    document.querySelectorAll(".order-card");

    cards.forEach(card=>{

        if(
            status==="all" ||
            card.innerText
            .toLowerCase()
            .includes(status.toLowerCase())
        ){

            card.style.display="block";

        }

        else{

            card.style.display="none";

        }

    });

}

window.filterOrders = filterOrders;
// ===========================================
// PART 5
// INITIALIZE + AUTO REFRESH
// ===========================================

async function initializeAdmin(){

    await loadOrders();

    await updateDashboard();

}

// ===========================================
// EXPORT ORDERS
// ===========================================

function exportOrders(){

    alert("Export Feature Coming Soon");

}

window.exportOrders = exportOrders;

// ===========================================
// PRINT
// ===========================================

function printOrders(){

    window.print();

}

window.printOrders = printOrders;

// ===========================================
// CLOSE PREVIEW
// ===========================================

function closePreview(){

    const modal =
    document.getElementById("previewModal");

    if(modal){

        modal.style.display = "none";

    }

}

window.closePreview = closePreview;

// ===========================================
// AUTO START
// ===========================================

initializeAdmin();

// Refresh every 30 seconds

setInterval(() => {

    initializeAdmin();

},30000);

// ===========================================
// GLOBAL
// ===========================================

window.viewDesign = viewDesign;

window.downloadDesign = downloadDesign;

window.updateOrderStatus = updateOrderStatus;

window.deleteOrder = deleteOrder;

window.searchOrders = searchOrders;

window.filterOrders = filterOrders;

window.refreshOrders = refreshOrders;
