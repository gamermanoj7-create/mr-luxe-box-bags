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

if(document.getElementById("grandTotalPrice")){

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