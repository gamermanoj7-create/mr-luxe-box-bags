// ===========================================
// MR LUXE BOX & BAGS — CLOUD FUNCTIONS
// ===========================================
//
// getOrdersByPhone
// -----------------
// Replaces the direct client-side query
//   query(collection(db,"orders"), where("phone","==",phone))
// that used to live in my-orders.js.
//
// WHY THIS NEEDS TO BE A FUNCTION AND NOT A FIRESTORE RULE:
// A Firestore rule can only check the shape of a single document
// being read — it can't verify "the query was actually filtered by
// phone" at the collection level. Any client can call
// getDocs(collection(db,"orders")) with no filter at all, and rules
// have no way to distinguish that from a legitimate filtered query.
// So "list" on /orders is locked to admin-only in firestore.rules,
// and this function — running with the Admin SDK, which bypasses
// rules entirely — does the filtered lookup on the server instead,
// where the phone filter can't be dropped or tampered with.
//
// Deploy with: firebase deploy --only functions
// ===========================================

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({
    maxInstances: 10,
    region: "asia-south1"
});

// Basic in-memory rate limit: caps how many lookups a single caller
// (identified by App Check token if present, otherwise by a
// coarse IP bucket) can do per minute. This resets on cold start,
// so for real abuse protection also turn on App Check enforcement
// for this function in the Firebase console.
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_CALLS = 10;
const callLog = new Map(); // key -> array of timestamps

function isRateLimited(key) {
    const now = Date.now();
    const calls = (callLog.get(key) || []).filter(
        (t) => now - t < RATE_LIMIT_WINDOW_MS
    );
    calls.push(now);
    callLog.set(key, calls);
    return calls.length > RATE_LIMIT_MAX_CALLS;
}

/** Keeps only the fields my-orders.js actually renders — avoids
 *  leaking anything extra that might get added to an order doc later
 *  (e.g. internal notes) to an unauthenticated caller. */
function toPublicOrder(id, data) {
    return {
        orderId: id,
        customerName: data.customerName || "",
        phone: data.phone || "",
        address: data.address || "",
        paymentMethod: data.paymentMethod || "",
        printingType: data.printingType || "",
        products: Array.isArray(data.products) ? data.products : [],
        totalQuantity: Number(data.totalQuantity) || 0,
        totalProducts: Number(data.totalProducts) || 0,
        productTotal: Number(data.productTotal) || 0,
        printingCharge: Number(data.printingCharge) || 0,
        designCharge: Number(data.designCharge) || 0,
        deliveryCharge: Number(data.deliveryCharge) || 0,
        finalGrandTotal: Number(data.finalGrandTotal) || 0,
        orderNote: data.orderNote || "",
        orderStatus: data.orderStatus || "Pending",
        invoiceNumber: data.invoiceNumber || ""
    };
}

exports.getOrdersByPhone = onCall(async (request) => {

    const rateLimitKey =
        request.app?.token?.sub ||
        request.rawRequest?.ip ||
        "unknown";

    if (isRateLimited(rateLimitKey)) {
        throw new HttpsError(
            "resource-exhausted",
            "Too many lookups. Please wait a minute and try again."
        );
    }

    const phone = String(request.data?.phone || "").trim();

    if (!/^[0-9+\-\s]{7,15}$/.test(phone)) {
        throw new HttpsError(
            "invalid-argument",
            "Please provide a valid mobile number."
        );
    }

    const snapshot = await db
        .collection("orders")
        .where("phone", "==", phone)
        .limit(50)
        .get();

    const orders = snapshot.docs.map((docSnap) =>
        toPublicOrder(docSnap.id, docSnap.data())
    );

    return { orders };

});
