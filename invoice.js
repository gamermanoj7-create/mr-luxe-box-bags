// =====================================
// MR LUXE BOX & BAGS
// invoice.js
// PART 1
// =====================================

function downloadInvoice() {

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF();

    const order =
        JSON.parse(localStorage.getItem("lastOrder"));

    if (!order) {
        alert("No invoice found.");
        return;
    }

    // Company Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("MR LUXE BOX & BAGS", 20, 20);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Premium Jewellery Packaging", 20, 28);
    doc.text("Kalyani, West Bengal", 20, 34);
    doc.text("India", 20, 40);

    // Invoice Heading
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("INVOICE", 150, 20);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    doc.text(
        "Invoice No: " +
        (order.invoiceNumber || "INV-000001"),
        130,
        30
    );

    doc.text(
        "Order ID: " + order.orderId,
        130,
        38
    );
        // ==========================
    // Customer Details
    // ==========================

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Customer Details", 20, 55);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    doc.text("Name : " + order.customerName, 20, 65);
    doc.text("Phone : " + order.phone, 20, 73);
    doc.text("Address : " + order.address, 20, 81);

    if (order.state)
        doc.text("State : " + order.state, 20, 89);

    if (order.pincode)
        doc.text("Pincode : " + order.pincode, 20, 97);

    // ==========================
    // Order Details
    // ==========================

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Order Details", 20, 115);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    doc.text(
        "Total Products : " + order.totalProducts,
        20,
        125
    );

    doc.text(
        "Total Quantity : " + order.totalQuantity,
        20,
        133
    );

    doc.text(
        "Grand Total : ₹" + order.finalGrandTotal,
        20,
        141
    );

    doc.text(
        "Payment : " + order.paymentMethod,
        20,
        149
    );

    doc.text(
        "Status : " + order.orderStatus,
        20,
        157
    );
        // ==========================
    // Footer
    // ==========================

    doc.setDrawColor(212, 175, 55);
    doc.line(20, 175, 190, 175);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Thank You For Your Order!", 20, 185);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text(
        "MR LUXE BOX & BAGS",
        20,
        195
    );

    doc.text(
        "Premium Jewellery Packaging",
        20,
        202
    );

    doc.text(
        "Website: https://gamermanoj7-create.github.io",
        20,
        209
    );

    doc.text(
        "Generated Automatically",
        20,
        216
    );

    // ==========================
    // Download PDF
    // ==========================

    const fileName =
        (order.invoiceNumber || order.orderId) + ".pdf";

    doc.save(fileName);
}
window.downloadInvoice = downloadInvoice;