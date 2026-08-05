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
const CLOUDINARY_CLOUD_NAME = "";
const CLOUDINARY_UPLOAD_PRESET = "";

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
    // No per-type printing price list exists in the product data, so
    // this stays 0 unless/until real printing prices are supplied.
    const printingType = document.getElementById("printingType")?.value || "Plain";

let printingCharge = 0;

switch (printingType) {

    case "Screen Printing":
        printingCharge = totalItems * 5;
        break;

    case "Digital Printing":
        printingCharge = totalItems * 15;
        break;

    case "Foil Printing":
        printingCharge = totalItems * 10;
        break;

    case "UV Printing":
        printingCharge = totalItems * 20;
        break;

    default:
        printingCharge = 0;
}

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
        const productTotal = window.Cart.getSubtotal();
        const finalGrandTotal = productTotal + designChargeVal + deliveryChargeVal;

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
            productTotal: productTotal,
            designCharge: designChargeVal,
            deliveryCharge: deliveryChargeVal,
            finalGrandTotal: finalGrandTotal,
            orderNote: orderNote,
            designURL: uploadedDesignURL,
            orderStatus: "Pending",
            invoiceNumber: "INV-" + Date.now(),
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, "orders"), orderData);

      const orderId = docRef.id.substring(0, 8).toUpperCase();

localStorage.setItem("lastOrderId", orderId);

localStorage.setItem("successOrder", JSON.stringify({
    orderId: orderId,
    customerName: name,
    phone: phone,
    total: finalGrandTotal,
    payment: payment,
    status: "Pending",
    date: new Date().toLocaleString()
}));

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
});
const printingSelect = document.getElementById("printingType");
if (printingSelect) printingSelect.addEventListener("change", recalcSummary);