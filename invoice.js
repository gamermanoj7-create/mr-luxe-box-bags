// =======================================
// MR LUXE BOX & BAGS
// PROFESSIONAL INVOICE V4
// PART 1
// =======================================

async function downloadInvoice(orderData = null) {

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    const order = orderData || JSON.parse(localStorage.getItem("lastOrder"));

    if (!order) {
        alert("No Invoice Found!");
        return;
    }

    // ==========================
    // LOAD LOGO
    // ==========================

    const logo = new Image();
    logo.src = "IMAGES/logo.png";

    try {

        await new Promise((resolve, reject) => {

            logo.onload = resolve;
            logo.onerror = reject;

        });

        doc.addImage(
            logo,
            "PNG",
            15,
            10,
            28,
            28
        );

    } catch (e) {

        console.log("Logo Not Found");

    }

    // ==========================
    // COMPANY HEADER
    // ==========================

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);

    doc.text("MR LUXE BOX & BAGS", 50, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text("Premium Jewellery Packaging", 50, 24);
    doc.text("Kalyani, Nadia, West Bengal - 741249", 50, 30);
    doc.text("India", 50, 36);

    doc.text("Phone : +91 7029714746", 145, 24);
    doc.text("GST : Not Registered", 145, 30);

    doc.setDrawColor(212,175,55);
    doc.setLineWidth(0.5);
    doc.line(15,45,195,45);

    // ==========================
    // INVOICE DETAILS
    // ==========================

    doc.setFont("helvetica","bold");
    doc.setFontSize(16);

    doc.text("TAX INVOICE",15,55);

    doc.setFont("helvetica","normal");
    doc.setFontSize(10);

    doc.text(
        "Invoice No : " +
        (order.invoiceNumber || "-"),
        15,
        63
    );

    doc.text(
        "Order ID : " +
        (order.orderId || "-"),
        15,
        69
    );

    doc.text(
        "Date : " +
        new Date().toLocaleDateString("en-IN"),
        15,
        75
    );

    // ==========================
    // CUSTOMER DETAILS
    // ==========================

    doc.setFont("helvetica","bold");
    doc.setFontSize(12);

    doc.text("Customer Details",15,88);

    doc.setFont("helvetica","normal");
    doc.setFontSize(10);

    doc.text(
        "Name : " + (order.customerName || "-"),
        15,
        96
    );

    doc.text(
        "Phone : " + (order.phone || "-"),
        15,
        102
    );

    doc.text(
        "Address : " + (order.address || "-"),
        15,
        108
    );

    let startY = 120;
    // ==========================
// PROFESSIONAL PRODUCT TABLE
// ==========================

const tableData = [];

(order.products || []).forEach((item) => {

    tableData.push([
        item.name || "-",
        item.quantity || 0,
        "₹ " + (item.price || 0),
        "₹ " + (item.subtotal || 0)
    ]);

});

doc.autoTable({

    startY: startY,

    head: [[
        "Product",
        "Qty",
        "Unit Price",
        "Total"
    ]],

    body: tableData,

    theme: "grid",

    styles: {

        fontSize: 10,
        cellPadding: 4,
        lineColor: [220,220,220],
        lineWidth: 0.2

    },

    headStyles: {

        fillColor: [0,0,0],
        textColor: [212,175,55],
        fontStyle: "bold",
        halign: "center"

    },

    alternateRowStyles: {

        fillColor: [248,248,248]

    }

});

let y = doc.lastAutoTable.finalY + 12;

// ==========================
// GRAND TOTAL BOX
// ==========================

doc.setFillColor(212,175,55);

doc.roundedRect(
    120,
    y,
    75,
    15,
    2,
    2,
    "F"
);

doc.setFont("helvetica","bold");
doc.setFontSize(12);

doc.text(
    "Grand Total",
    126,
    y + 9
);

doc.text(
    "₹ " + (order.finalGrandTotal || 0),
    162,
    y + 9
);

y += 25;
// ==========================
// PAYMENT DETAILS
// ==========================

doc.setFont("helvetica", "bold");
doc.setFontSize(12);

doc.text("Payment Details", 15, y);

doc.setFont("helvetica", "normal");
doc.setFontSize(10);

y += 8;

doc.text(
    "Payment Method : " +
    (order.paymentMethod || "-"),
    15,
    y
);

y += 6;

doc.text(
    "UPI ID : 7029714746-2@ybl",
    15,
    y
);

y += 6;

doc.text(
    "GST Status : Not Registered",
    15,
    y
);

// ==========================
// UPI QR PLACEHOLDER
// ==========================

doc.setDrawColor(150);

doc.rect(
    150,
    y - 18,
    35,
    35
);

doc.setFontSize(9);

doc.text(
    "UPI QR",
    160,
    y
);

// ==========================
// THANK YOU
// ==========================

y += 32;

doc.setDrawColor(212,175,55);

doc.line(
    15,
    y,
    195,
    y
);

y += 10;

doc.setFont("helvetica","bold");
doc.setFontSize(12);

doc.text(
    "Thank You For Your Business!",
    15,
    y
);

y += 8;

doc.setFont("helvetica","normal");
doc.setFontSize(10);

doc.text(
    "MR Luxe Box & Bags",
    15,
    y
);

y += 6;

doc.text(
    "Premium Jewellery Packaging Manufacturer",
    15,
    y
);

y += 6;

doc.text(
    "Kalyani, Nadia, West Bengal - 741249",
    15,
    y
);

doc.setFont("helvetica","bold");

doc.text(
    "Authorized Signature",
    145,
    y
);

y += 12;

// ==========================
// SAVE PDF
// ==========================

doc.save(
    (order.invoiceNumber || "Invoice") + ".pdf"
);

}

window.downloadInvoice = downloadInvoice;