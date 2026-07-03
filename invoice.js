// ==========================================
// MR LUXE BOX & BAGS
// PROFESSIONAL INVOICE
// PART 1
// ==========================================

function downloadInvoice() {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const order = JSON.parse(localStorage.getItem("lastOrder"));

    if (!order) {
        alert("No invoice found!");
        return;
    }

    // Company Header
    doc.setDrawColor(212,175,55);
    doc.setLineWidth(0.8);

    doc.line(15,15,195,15);

    doc.setFont("helvetica","bold");
    doc.setFontSize(22);
    doc.text("MR LUXE BOX & BAGS",20,28);

    doc.setFont("helvetica","normal");
    doc.setFontSize(10);

    doc.text("Premium Jewellery Packaging",20,36);
    doc.text("Kalyani, Nadia",20,42);
    doc.text("West Bengal - 741249",20,48);
    doc.text("India",20,54);

    doc.text("Phone : +91 7029714746",20,60);
    doc.text("GST : Not Registered",20,66);

    doc.setFont("helvetica","bold");
    doc.setFontSize(18);

    doc.text("TAX INVOICE",145,28);

    doc.setFont("helvetica","normal");
    doc.setFontSize(10);

    doc.text(
        "Invoice No : " +
        (order.invoiceNumber || "INV-000001"),
        130,
        38
    );

    doc.text(
        "Order ID : " +
        (order.orderId || "-"),
        130,
        45
    );

    doc.text(
        "Invoice Date : " +
        new Date().toLocaleDateString("en-IN"),
        130,
        52
    );

    doc.line(15,72,195,72);
        // ==========================================
    // CUSTOMER DETAILS
    // ==========================================

    doc.setFillColor(245,245,245);
    doc.roundedRect(15,78,180,42,3,3,"F");

    doc.setFont("helvetica","bold");
    doc.setFontSize(13);
    doc.text("Customer Details",20,88);

    doc.setFont("helvetica","normal");
    doc.setFontSize(10);

    doc.text(
        "Name : " + (order.customerName || "-"),
        20,
        96
    );

    doc.text(
        "Phone : " + (order.phone || "-"),
        20,
        103
    );

    doc.text(
        "Address : " + (order.address || "-"),
        20,
        110
    );

    doc.text(
        "Payment : " + (order.paymentMethod || "-"),
        20,
        117
    );

    // ==========================================
    // PRODUCT TABLE
    // ==========================================

    let y = 132;

    doc.setFillColor(212,175,55);

    doc.rect(15,y,180,10,"F");

    doc.setTextColor(255,255,255);

    doc.setFont("helvetica","bold");

    doc.text("Product",18,y+7);
    doc.text("Qty",115,y+7);
    doc.text("Price",140,y+7);
    doc.text("Total",170,y+7);

    doc.setTextColor(0,0,0);

    y += 16;

    doc.setFont("helvetica","normal");

    (order.products || []).forEach((item)=>{

        const subtotal =
        item.subtotal ??
        ((item.price || 0) * (item.quantity || 0));

        doc.text(
            String(item.name || "-"),
            18,
            y
        );

        doc.text(
            String(item.quantity || 0),
            118,
            y
        );

        doc.text(
            "₹" + (item.price || 0),
            138,
            y
        );

        doc.text(
            "₹" + subtotal,
            168,
            y
        );

        y += 10;

    });

    y += 5;

    doc.line(15,y,195,y);

    y += 10;

    doc.setFont("helvetica","bold");

    doc.text(
        "Grand Total : ₹" + (order.finalGrandTotal || 0),
        120,
        y
    );
        // ==========================================
    // PAYMENT DETAILS
    // ==========================================

    y += 15;

    doc.setFillColor(248,248,248);
    doc.roundedRect(15,y,180,45,3,3,"F");

    doc.setFont("helvetica","bold");
    doc.setFontSize(12);

    doc.text("Payment Information",20,y+10);

    doc.setFont("helvetica","normal");
    doc.setFontSize(10);

    doc.text("UPI ID : 7029714746-2@ybl",20,y+20);

    doc.text("GST : Not Registered",20,y+28);

    doc.text("Phone : +91 7029714746",20,y+36);

    y += 55;

    // ==========================================
    // THANK YOU
    // ==========================================

    doc.setDrawColor(212,175,55);
    doc.line(15,y,195,y);

    y += 10;

    doc.setFont("helvetica","bold");
    doc.setFontSize(14);

    doc.text("Thank You For Your Order!",20,y);

    y += 8;

    doc.setFont("helvetica","normal");
    doc.setFontSize(10);

    doc.text(
        "MR Luxe Box & Bags",
        20,
        y
    );

    y += 6;

    doc.text(
        "Premium Jewellery Packaging",
        20,
        y
    );

    y += 6;

    doc.text(
        "Kalyani, Nadia, West Bengal - 741249",
        20,
        y
    );

    y += 6;

    doc.text(
        "India",
        20,
        y
    );

    y += 15;

    doc.setFont("helvetica","bold");

    doc.text(
        "Authorized Signature",
        145,
        y
    );

    // ==========================================
    // SAVE PDF
    // ==========================================

    const fileName =
        (order.invoiceNumber || order.orderId || "Invoice") + ".pdf";

    doc.save(fileName);

}

window.downloadInvoice = downloadInvoice;