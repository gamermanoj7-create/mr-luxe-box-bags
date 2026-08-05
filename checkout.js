// ===========================================
// MR LUXE BOX & BAGS
// CHECKOUT LOGIC
//
// This file was missing from the project — checkout.html already
// called placeOrder() and relied on a live order summary, but no
// script defined either. This wires both up using the existing
// window.Cart module (script.js) and writes the order to the same
// "orders" Firestore collection that admin.js and my-orders.js
// already read from, using the same field names.
//
// -------------------------------------------------------------
// BUG FIX (this revision): Checkout showed the correct Grand
// Total, but My Orders / Invoice / Admin all showed a different
// (lower) total, and Printing Charge was never saved.
//
// Root cause: recalcSummary() (the function that updates what you
// SEE on the checkout page) calculated printingCharge from the
// printing-type dropdown. placeOrder() (the function that
// actually WRITES the order to Firestore) never calculated
// printingCharge at all — it just used
//     productTotal + designCharge + deliveryCharge
// with no printing charge added in, and never saved a
// printingCharge field. Since my-orders.js, invoice.js and
// admin.js all simply display order.finalGrandTotal exactly as
// it was saved (they don't recompute it), every downstream page
// showed the wrong, lower total.
//
// Fix: printing-charge calculation is now a single shared
// function (getPrintingCharge) used by BOTH recalcSummary() and
// placeOrder(), so the on-screen total and the saved total can
// never drift apart again. placeOrder() now also saves every
// component of the total (productTotal, printingCharge,
// designCharge, deliveryCharge, finalGrandTotal, totalProducts,
// totalQuantity, printingType) to Firestore and to localStorage,
// so Success Page / My Orders / Invoice / Admin Panel can all
// render the exact same numbers Checkout showed.
// No HTML/UI/DOM structure was touched — only this file.
// -------------------------------------------------------------
// ===========================================

import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ---------------------------------------------------------------
// OPTIONAL: custom-design file upload (Cloudinary, unsigned preset)
// admin.js already expects order.designURL to be a Cloudinary-style
// URL (it does url.replace("/upload/","/upload/fl_attachment/") to
// force a download). Fill these in to enable real cloud upload —
// until then, the file picker still works and shows a local
// preview, it just won't attach a design link to the order.
// ---------------------------------------------------------------
const CLOUDINARY_CLOUD_NAME = "nx1dc1j1";
const CLOUDINARY_UPLOAD_PRESET = "mr_luxe_upload";

let uploadedDesignURL = "";

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function fmt(value) {
    if (window.formatCurrency) return window.formatCurrency(value);
    return "₹" + Number(value || 0).toLocaleString("en-IN");
}

// ===========================================
// PRINTING CHARGE (single source of truth)
// -------------------------------------------
// CHANGE: this used to live only inline inside recalcSummary().
// It's now a standalone function so placeOrder() can call the
// exact same logic when it saves the order — that's what keeps
// the displayed total and the saved total in sync.
// ===========================================
function getPrintingCharge(printingType, totalItems) {
    switch (printingType) {
        case "Screen Printing":
            return totalItems * 5;
        case "Digital Printing":
            return totalItems * 15;
        case "Foil Printing":
            return totalItems * 10;
        case "UV Printing":
            return totalItems * 20;
        default:
            return 0;
    }
}

// ===========================================
// ORDER SUMMARY (live, driven by window.Cart)
// ===========================================

function recalcSummary() {
    if (!window.Cart) return;

    const items = window.Cart.getDetailedItems();
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const productTotal = window.Cart.getSubtotal();

    const designSelect = document.getElementById("designCharge");
    const deliverySelect = document.getElementById("deliveryArea");

    const designCharge = designSelect ? Number(designSelect.value) || 0 : 0;
    const deliveryCharge = deliverySelect ? Number(deliverySelect.value) || 0 : 0;
    const printingType = document.getElementById("printingType")?.value || "Plain";

    // CHANGE: now calls the shared getPrintingCharge() instead of
    // having its own inline copy of the switch statement.
    const printingCharge = getPrintingCharge(printingType, totalItems);

    const grandTotal = productTotal + designCharge + deliveryCharge + printingCharge;

    setText("totalItems", totalItems);
    setText("productTotal", fmt(productTotal));
    setText("printingCharge", fmt(printingCharge));
    setText("designPrice", fmt(designCharge));
    setText("deliveryPrice", fmt(deliveryCharge));
    setText("grandTotalPrice", fmt(grandTotal));
}

// ===========================================
// DESIGN FILE UPLOAD
// ===========================================

function uploadToCloudinary(file, progressBar) {
    return new Promise((resolve) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const xhr = new XMLHttpRequest();
        xhr.open(
            "POST",
            "https://api.cloudinary.com/v1_1/" + CLOUDINARY_CLOUD_NAME + "/auto/upload"
        );

        xhr.upload.onprogress = function (e) {
            if (e.lengthComputable && progressBar) {
                const pct = Math.round((e.loaded / e.total) * 100);
                progressBar.style.width = pct + "%";
                progressBar.textContent = pct + "%";
            }
        };

        xhr.onload = function () {
            try {
                const res = JSON.parse(xhr.responseText);
                uploadedDesignURL = res.secure_url || "";
                if (progressBar) {
                    progressBar.style.width = "100%";
                    progressBar.textContent = "Uploaded";
                }
            } catch (err) {
                console.error("Design upload response error", err);
            }
            resolve();
        };

        xhr.onerror = function () {
            console.error("Design upload failed");
            if (progressBar) progressBar.textContent = "Upload failed";
            resolve();
        };

        xhr.send(formData);
    });
}

function initDesignUpload() {
    const fileInput = document.getElementById("designFile");
    if (!fileInput) return;

    fileInput.addEventListener("change", function () {
        const file = fileInput.files[0];
        const previewBox = document.getElementById("previewBox");
        const progressBar = document.getElementById("uploadProgress");

        uploadedDesignURL = "";
        if (progressBar) {
            progressBar.style.width = "0%";
            progressBar.textContent = "";
        }

        if (!file) {
            if (previewBox) previewBox.innerHTML = "";
            return;
        }

        if (previewBox) {
            if (file.type && file.type.indexOf("image/") === 0) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    previewBox.innerHTML =
                        '<img src="' + e.target.result + '" alt="Design preview">' +
                        "<p>" + file.name + "</p>";
                };
                reader.readAsDataURL(file);
            } else {
                previewBox.innerHTML = "<p>📎 " + file.name + "</p>";
            }
        }

        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
            // No cloud storage configured — keep the local preview only.
            if (progressBar) {
                progressBar.style.width = "100%";
                progressBar.textContent = "Ready";
            }
            return;
        }

        uploadToCloudinary(file, progressBar);
    });
}

// ===========================================
// PLACE ORDER
// ===========================================

window.placeOrder = async function () {
    const btn = document.querySelector(".place-order-btn");

    try {
        if (!window.Cart || window.Cart.getCount() === 0) {
            alert("Your cart is empty. Add some products before checking out.");
            return;
        }

        const name = (document.getElementById("name") || {}).value?.trim() || "";
        const phone = (document.getElementById("phone") || {}).value?.trim() || "";
        const address = (document.getElementById("address") || {}).value?.trim() || "";
        const state = (document.getElementById("state") || {}).value?.trim() || "";
        const pincode = (document.getElementById("pincode") || {}).value?.trim() || "";
        const printingType = (document.getElementById("printingType") || {}).value || "Plain";
        const payment = (document.getElementById("payment") || {}).value || "";
        const designChargeVal = Number((document.getElementById("designCharge") || {}).value) || 0;
        const deliveryChargeVal = Number((document.getElementById("deliveryArea") || {}).value) || 0;
        const orderNote = (document.getElementById("orderNote") || {}).value?.trim() || "";
        const acceptTerms = (document.getElementById("acceptTerms") || {}).checked;

        if (!name || !phone || !address) {
            alert("Please fill in your name, mobile number and address.");
            return;
        }
        if (!/^[0-9+\-\s]{7,15}$/.test(phone)) {
            alert("Please enter a valid mobile number.");
            return;
        }
        if (!payment) {
            alert("Please choose a payment method.");
            return;
        }
        if (!acceptTerms) {
            alert("Please accept the Terms & Conditions to continue.");
            return;
        }

        const items = window.Cart.getDetailedItems();
        const products = items.map(function (item) {
            return {
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                subtotal: item.price * item.quantity
            };
        });

        const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
        // CHANGE: totalProducts = number of distinct product lines
        // (as opposed to totalQuantity, which is total item count).
        // Required so My Orders / Admin can show "Total Products"
        // from saved data instead of recomputing it themselves.
        const totalProducts = products.length;
        const productTotal = window.Cart.getSubtotal();

        // CHANGE (the core fix): printing charge is now calculated
        // here too, using the exact same shared function the live
        // checkout summary uses — so this can never fall out of
        // sync with what the customer saw on screen again.
        const printingCharge = getPrintingCharge(printingType, totalQuantity);

        // CHANGE: printingCharge is now included in the saved
        // grand total. Previously this line omitted it entirely:
        //   const finalGrandTotal = productTotal + designChargeVal + deliveryChargeVal;
        const finalGrandTotal = productTotal + printingCharge + designChargeVal + deliveryChargeVal;

        let fullAddress = address;
        if (state) fullAddress += ", " + state;
        if (pincode) fullAddress += " - " + pincode;

        if (btn) {
            btn.disabled = true;
            btn.textContent = "Placing Order...";
        }

        const orderData = {
            customerName: name,
            phone: phone,
            address: fullAddress,
            paymentMethod: payment,
            printingType: printingType,
            products: products,
            totalQuantity: totalQuantity,
            totalProducts: totalProducts, // CHANGE: now saved (was missing)
            productTotal: productTotal,
            printingCharge: printingCharge, // CHANGE: now saved (was missing entirely — the main bug)
            designCharge: designChargeVal,
            deliveryCharge: deliveryChargeVal,
            finalGrandTotal: finalGrandTotal, // CHANGE: now correctly includes printingCharge
            orderNote: orderNote,
            designURL: uploadedDesignURL,
            orderStatus: "Pending",
            invoiceNumber: "INV-" + Date.now(),
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, "orders"), orderData);

        const orderId = docRef.id.substring(0, 8).toUpperCase();

        localStorage.setItem("lastOrderId", orderId);

        // CHANGE: "successOrder" (used by success.html's own summary)
        // now carries the full breakdown too, not just the final
        // total, so the success page can show Printing Charge etc.
        // and matches Checkout / My Orders / Invoice / Admin exactly.
        const fullOrderForStorage = {
            orderId: orderId,
            customerName: name,
            phone: phone,
            address: fullAddress,
            paymentMethod: payment,
            printingType: printingType,
            products: products,
            totalQuantity: totalQuantity,
            totalProducts: totalProducts,
            productTotal: productTotal,
            printingCharge: printingCharge,
            designCharge: designChargeVal,
            deliveryCharge: deliveryChargeVal,
            finalGrandTotal: finalGrandTotal,
            total: finalGrandTotal, // kept for any existing code reading "total"
            orderNote: orderNote,
            designURL: uploadedDesignURL,
            invoiceNumber: orderData.invoiceNumber,
            status: "Pending",
            date: new Date().toLocaleString()
        };

        localStorage.setItem("successOrder", JSON.stringify(fullOrderForStorage));

        // CHANGE: also saved under "lastOrder" — this is the exact
        // key invoice.js falls back to (localStorage.getItem("lastOrder"))
        // when downloadInvoice() is called with no argument, e.g. from
        // a "Download Invoice" button on the success page. Without this,
        // that flow would either error out or fall back to stale data,
        // which was another way a mismatched total could reach the
        // printed invoice.
        localStorage.setItem("lastOrder", JSON.stringify(fullOrderForStorage));

        window.Cart.clear();

        window.location.href = "success.html";
    } catch (error) {
        console.error(error);
        alert("Something went wrong while placing your order: " + error.message);
        if (btn) {
            btn.disabled = false;
            btn.textContent = "🛒 Place Order";
        }
    }
};

// ===========================================
// INIT
// ===========================================

document.addEventListener("DOMContentLoaded", function () {
    recalcSummary();
    initDesignUpload();

    const designSelect = document.getElementById("designCharge");
    if (designSelect) designSelect.addEventListener("change", recalcSummary);

    const deliverySelect = document.getElementById("deliveryArea");
    if (deliverySelect) deliverySelect.addEventListener("change", recalcSummary);

    document.addEventListener("cart:updated", recalcSummary);

    // CHANGE (bug fix, not a feature change): this listener used to
    // sit outside DOMContentLoaded at the bottom of the file, which
    // means it ran before #printingType existed in the DOM in most
    // load orders, so getElementById returned null and the listener
    // was silently never attached — changing the printing type would
    // update nothing until another field (design/delivery) was also
    // changed. Moved inside DOMContentLoaded so it reliably attaches.
    const printingSelect = document.getElementById("printingType");
    if (printingSelect) printingSelect.addEventListener("change", recalcSummary);
});
